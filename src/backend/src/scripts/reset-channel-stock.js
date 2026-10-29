/**
 * scripts/reset-channel-stock.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time repair script to reset every product and color variant in MongoDB:
 *   - b2cStock = physical stock
 *   - b2bStock = 0
 *   - colors[i].b2cStock = colors[i].stock
 *   - colors[i].b2bStock = 0
 *
 * Audit log entry:
 *   - reason: "reset: removed postgres allocation"
 *
 * Flags:
 *   --dry-run   Prints a before/after comparison table without modifying DB.
 *
 * Usage:
 *   node src/scripts/reset-channel-stock.js --dry-run
 *   node src/scripts/reset-channel-stock.js
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

const isDryRun = process.argv.includes("--dry-run");

export async function runResetChannelStock({ closeConnectionOnComplete = true } = {}) {
    console.log("=========================================================================================");
    console.log(`🔄 ONE-TIME STOCK REPAIR: REMOVE POSTGRES ALLOCATION ${isDryRun ? "[DRY RUN — NO WRITES]" : "[LIVE EXECUTION]"}`);
    console.log("=========================================================================================");

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || "greenfibre",
        });
        console.log(`📦 Connected to MongoDB: ${mongoose.connection.name}`);
    }

    const products = await Product.find({}).lean();
    console.log(`📊 Total products found in database: ${products.length}\n`);

    if (products.length === 0) {
        console.log("No products found.");
        if (closeConnectionOnComplete) await mongoose.disconnect();
        return;
    }

    const tableRows = [];
    const bulkOperations = [];
    const auditEntries = [];

    for (const p of products) {
        const physicalStock = Math.max(0, Number(p.stockQuantity ?? 0));
        const oldB2B = Number(p.b2bStock ?? 0);
        const oldB2C = Number(p.b2cStock ?? 0);

        let hasVariants = Array.isArray(p.colors) && p.colors.length > 0;
        let updatedColors = [];

        if (hasVariants) {
            updatedColors = p.colors.map((c) => {
                const varPhysical = Math.max(0, Number(c.stock ?? 0));
                return {
                    ...c,
                    b2cStock: varPhysical,
                    b2bStock: 0,
                };
            });
        }

        const newPhysical = hasVariants
            ? updatedColors.reduce((sum, c) => sum + (c.stock || 0), 0)
            : physicalStock;
        const newB2C = hasVariants
            ? updatedColors.reduce((sum, c) => sum + c.b2cStock, 0)
            : physicalStock;
        const newB2B = 0;

        tableRows.push({
            SKU: p.sku || "N/A",
            Name: (p.name || "").length > 28 ? p.name.substring(0, 25) + "..." : p.name,
            "Physical": newPhysical,
            "Old B2B": oldB2B,
            "Old B2C": oldB2C,
            "New B2B": newB2B,
            "New B2C": newB2C,
            "Variants": hasVariants
                ? p.colors.map((c) => `${c.name}: ${c.stock} (Old: ${c.b2bStock || 0}/${c.b2cStock || 0} → New: 0/${c.stock || 0})`).join(" | ")
                : "None",
        });

        const setPayload = {
            b2bStock: newB2B,
            b2cStock: newB2C,
            stockQuantity: newPhysical,
        };
        if (hasVariants) {
            setPayload.colors = updatedColors;
        }

        bulkOperations.push({
            updateOne: {
                filter: { _id: p._id },
                update: { $set: setPayload },
            },
        });

        auditEntries.push({
            productId: p._id,
            sku: p.sku || "",
            productName: p.name,
            action: "STOCK_ALLOCATION_RESET",
            mode: "reset",
            oldB2BStock: oldB2B,
            oldB2CStock: oldB2C,
            newB2BStock: newB2B,
            newB2CStock: newB2C,
            physicalStock: newPhysical,
            performedBy: { userId: "system", email: "reset-channel-stock", role: "admin" },
            reason: "reset: removed postgres allocation",
        });
    }

    // Print table in console
    console.table(tableRows.map((r) => ({
        SKU: r.SKU,
        Name: r.Name,
        "Total Stock": r.Physical,
        "Old B2B": r["Old B2B"],
        "Old B2C": r["Old B2C"],
        "New B2B": r["New B2B"],
        "New B2C": r["New B2C"],
    })));

    console.log("\n--- Color Variants Breakdown ---");
    tableRows
        .filter((r) => r.Variants !== "None")
        .forEach((r) => {
            console.log(`• [${r.SKU}] ${r.Name}: ${r.Variants}`);
        });

    console.log("\n-----------------------------------------------------------------------------------------");

    if (isDryRun) {
        console.log("ℹ️  [DRY RUN COMPLETE] No changes were written to MongoDB.");
        console.log("   To apply these changes after your database backup, run without --dry-run:");
        console.log("   node src/scripts/reset-channel-stock.js");
    } else {
        console.log(`⚡ Executing updates for ${bulkOperations.length} products in batches of 500...`);
        const batchSize = 500;
        let modifiedTotal = 0;

        for (let i = 0; i < bulkOperations.length; i += batchSize) {
            const batchOps = bulkOperations.slice(i, i + batchSize);
            const batchAudits = auditEntries.slice(i, i + batchSize);

            const res = await Product.bulkWrite(batchOps, { ordered: false });
            modifiedTotal += res.modifiedCount;

            if (batchAudits.length > 0) {
                await StockAuditLog.insertMany(batchAudits);
            }
        }

        console.log(`✅ [LIVE EXECUTION COMPLETE] Successfully updated ${modifiedTotal} products.`);
        console.log(`   Audit log entries recorded with reason: "reset: removed postgres allocation"`);
    }

    console.log("=========================================================================================\n");

    if (closeConnectionOnComplete) {
        await mongoose.disconnect();
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    runResetChannelStock().catch((err) => {
        logger.error(`Reset channel stock fatal error: ${err.message}`, { stack: err.stack });
        process.exit(1);
    });
}
