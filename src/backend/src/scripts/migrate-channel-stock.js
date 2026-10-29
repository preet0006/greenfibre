/**
 * scripts/migrate-channel-stock.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent migration script to initialize product channel stock pools.
 *
 * Migration Rule (Manual Allocation Model):
 *   - MongoDB is the ONLY source of truth.
 *   - No percentage rules, no automatic splitting, zero PostgreSQL/Neon reads.
 *   - For products missing b2bStock/b2cStock:
 *       b2cStock = current physical stock
 *       b2bStock = 0
 *     so the live website behaves exactly as before.
 *   - For variant colors:
 *       color.b2cStock = color.stock
 *       color.b2bStock = 0
 *   - Idempotent: Never overwrites values that are already set.
 *   - Supports --dry-run, batches of 500, and audit log entries.
 *
 * Usage:
 *   node src/scripts/migrate-channel-stock.js --dry-run
 *   node src/scripts/migrate-channel-stock.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Product } from "../models/product.model.js";
import { StockAuditLog } from "../models/stockAudit.model.js";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export async function runMigration({ isDryRun: customDryRun, closeConnectionOnComplete = true } = {}) {
    const isDryRun = customDryRun !== undefined ? customDryRun : process.argv.includes("--dry-run");

    logger.info("===============================================================");
    logger.info(`🌿 GREEN FIBRE × CHANNEL STOCK MIGRATION ${isDryRun ? "[DRY RUN]" : "[LIVE EXECUTION]"}`);
    logger.info("   Strategy: Manual Allocation (b2cStock = physical stock, b2bStock = 0)");
    logger.info("===============================================================");

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || "greenfibre",
        });
        logger.info(`📦 Connected to MongoDB: ${mongoose.connection.name}`);
    }

    // Find all products where b2bStock or b2cStock have not been set
    const candidates = await Product.find({
        $or: [
            { b2bStock: { $exists: false } },
            { b2cStock: { $exists: false } },
            { b2bStock: null },
            { b2cStock: null },
        ],
    }).lean();

    logger.info(`📊 Found ${candidates.length} product(s) needing channel stock initialization.`);

    if (candidates.length === 0) {
        logger.info("✅ All products already have channel stock initialized. Nothing to migrate.");
        if (closeConnectionOnComplete) {
            await mongoose.disconnect();
        }
        return { total: 0, updated: 0, skipped: 0 };
    }

    let updatedCount = 0;
    const batchSize = 500;
    let currentBatch = [];
    let auditEntries = [];

    for (const product of candidates) {
        const physicalStock = Math.max(0, Number(product.stockQuantity ?? 0));
        const sku = String(product.sku || "").trim().toUpperCase();

        // Variant-level allocation: 100% b2cStock, 0 b2bStock
        let hasVariants = Array.isArray(product.colors) && product.colors.length > 0;
        let updatedColors = [];

        if (hasVariants) {
            const varSum = product.colors.reduce((s, c) => s + (c.stock || 0), 0);
            if (varSum === 0 && physicalStock > 0 && product.colors.length === 1) {
                updatedColors = [{
                    ...product.colors[0],
                    stock: physicalStock,
                    b2cStock: physicalStock,
                    b2bStock: 0,
                }];
            } else {
                updatedColors = product.colors.map((c) => {
                    const varPhysical = Math.max(0, Number(c.stock ?? 0));
                    return {
                        ...c,
                        b2cStock: varPhysical,
                        b2bStock: 0,
                    };
                });
            }
        }

        // Top-level allocation: b2cStock = physical stock, b2bStock = 0
        const finalB2C = hasVariants
            ? updatedColors.reduce((sum, c) => sum + c.b2cStock, 0)
            : physicalStock;
        const finalB2B = 0;
        const finalPhysical = hasVariants
            ? (updatedColors.reduce((sum, c) => sum + (c.stock || 0), 0) || physicalStock)
            : physicalStock;

        logger.info(
            `  • [${sku || "NO-SKU"}] "${product.name}": Physical=${finalPhysical} → B2C=${finalB2C}, B2B=${finalB2B} (Manual Default: 100% B2C)`
        );

        if (!isDryRun) {
            const setPayload = {
                b2bStock: finalB2B,
                b2cStock: finalB2C,
                stockQuantity: finalPhysical,
            };
            if (hasVariants) {
                setPayload.colors = updatedColors;
            }

            currentBatch.push({
                updateOne: {
                    filter: {
                        _id: product._id,
                        $or: [
                            { b2bStock: { $exists: false } },
                            { b2cStock: { $exists: false } },
                            { b2bStock: null },
                            { b2cStock: null },
                        ],
                    },
                    update: {
                        $set: setPayload,
                    },
                },
            });

            auditEntries.push({
                productId: product._id,
                sku: product.sku || "",
                productName: product.name,
                action: "STOCK_ALLOCATION_MIGRATION",
                mode: "migrate",
                oldB2BStock: 0,
                oldB2CStock: 0,
                newB2BStock: finalB2B,
                newB2CStock: finalB2C,
                physicalStock: finalPhysical,
                performedBy: { userId: "system", email: "migration-script", role: "admin" },
                reason: "Initial backfill: set b2cStock = physical stock, b2bStock = 0 (manual allocation model)",
            });

            if (currentBatch.length >= batchSize) {
                const res = await Product.bulkWrite(currentBatch, { ordered: false });
                updatedCount += res.modifiedCount;
                if (auditEntries.length > 0) {
                    await StockAuditLog.insertMany(auditEntries);
                }
                currentBatch = [];
                auditEntries = [];
            }
        } else {
            updatedCount++;
        }
    }

    if (!isDryRun && currentBatch.length > 0) {
        const res = await Product.bulkWrite(currentBatch, { ordered: false });
        updatedCount += res.modifiedCount;
        if (auditEntries.length > 0) {
            await StockAuditLog.insertMany(auditEntries);
        }
    }

    logger.info("---------------------------------------------------------------");
    logger.info(`🎉 Migration Summary:`);
    logger.info(`   Mode        : ${isDryRun ? "DRY RUN (no database writes)" : "REAL EXECUTION"}`);
    logger.info(`   Total Found : ${candidates.length}`);
    logger.info(`   Updated     : ${updatedCount}`);
    logger.info("===============================================================");

    if (closeConnectionOnComplete) {
        await mongoose.disconnect();
    }

    return { total: candidates.length, updated: updatedCount };
}

// Direct execution guard
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    runMigration().catch((err) => {
        logger.error(`Migration fatal error: ${err.message}`, { stack: err.stack });
        process.exit(1);
    });
}
