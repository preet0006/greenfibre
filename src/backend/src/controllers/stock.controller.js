import mongoose from "mongoose";
import { z } from "zod";
import { Product } from "../models/product.model.js";
import { StockAuditLog } from "../models/stockAudit.model.js";
import { invalidateProductCache } from "../utils/channelStock.js";
import logger from "../utils/logger.js";

// ============================================================================
// VALIDATION SCHEMAS (ZOD)
// ============================================================================
const stockItemSchema = z
    .object({
        productId: z.string().trim().optional(),
        sku: z.string().trim().optional(),
        colorIndex: z.number().int({ message: "colorIndex must be an integer" }).min(0).optional(),
        color: z.string().trim().optional(),
        colorName: z.string().trim().optional(),
        totalStock: z.number().int({ message: "totalStock must be an integer" }).optional(),
        physicalStock: z.number().int({ message: "physicalStock must be an integer" }).optional(),
        b2bStock: z.number().int({ message: "b2bStock must be an integer" }).optional(),
        b2cStock: z.number().int({ message: "b2cStock must be an integer" }).optional(),
        mode: z.enum(["set", "adjust"]).optional(),
    })
    .refine((data) => Boolean(data.productId || data.sku), {
        message: "Each item must have either a 'productId' or a 'sku'",
    })
    .refine(
        (data) =>
            data.totalStock !== undefined ||
            data.physicalStock !== undefined ||
            data.b2bStock !== undefined ||
            data.b2cStock !== undefined,
        {
            message:
                "Each item must specify at least one of 'totalStock' (or 'physicalStock'), 'b2bStock', or 'b2cStock'",
        }
    );

const batchStockUpdateSchema = z.object({
    mode: z.enum(["set", "adjust"]).default("set"),
    items: z
        .array(stockItemSchema)
        .min(1, "At least one item is required")
        .max(500, "Maximum 500 items per request"),
});

// ============================================================================
// PROPORTIONAL DISTRIBUTION HELPERS
// ============================================================================

/**
 * Proportional allocation helper: distributes an integer quota across buckets
 * proportionally to their capacities, using the largest remainder method so the
 * sum of allocated values matches the target quota exactly.
 */
function distributeQuotaProportionally(capacities, totalQuota) {
    const totalCapacity = capacities.reduce((sum, c) => sum + c, 0);
    if (totalCapacity === 0 || totalQuota === 0) {
        return capacities.map(() => 0);
    }

    const quota = Math.min(totalQuota, totalCapacity);
    const shares = capacities.map((cap, idx) => {
        const exact = (cap / totalCapacity) * quota;
        const floor = Math.floor(exact);
        return {
            idx,
            floor,
            remainder: exact - floor,
            capacity: cap,
        };
    });

    let allocated = shares.reduce((sum, s) => sum + s.floor, 0);
    let shortfall = quota - allocated;

    // Distribute shortfall to buckets with highest remainders that haven't reached capacity
    shares.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < shares.length && shortfall > 0; i++) {
        if (shares[i].floor < shares[i].capacity) {
            shares[i].floor += 1;
            shortfall -= 1;
        }
    }

    // Sort back to original order
    shares.sort((a, b) => a.idx - b.idx);
    return shares.map((s) => s.floor);
}

/**
 * Distributes physical stock and channel stocks across color variants.
 * Guarantees:
 *   - sum(variant.stock) === newPhysical
 *   - sum(variant.b2cStock) === newB2C
 *   - sum(variant.b2bStock) === newB2B
 *   - variant.b2cStock + variant.b2bStock <= variant.stock for each variant
 */
function distributeStocksAcrossVariants(colors, newPhysical, newB2C, newB2B, { physicalUpdated, channelsUpdated }) {
    if (!Array.isArray(colors) || colors.length === 0) return colors;

    let updated = colors.map((c) => ({ ...c }));
    const oldPhysical = colors.reduce((sum, c) => sum + (c.stock || 0), 0);

    // 1. Update variant physical stocks if totalStock was explicitly provided
    if (physicalUpdated) {
        let capacities = colors.map((c) => c.stock || 0);
        if (oldPhysical === 0) {
            capacities = colors.map(() => 1);
        }
        const newVariantPhysicals = distributeQuotaProportionally(capacities, newPhysical);
        updated = updated.map((c, idx) => ({
            ...c,
            stock: newVariantPhysicals[idx] || 0,
        }));
    }

    // 2. If channel stocks (B2C / B2B) were explicitly updated or physical was reduced, distribute channels
    if (channelsUpdated) {
        const varCapacities = updated.map((c) => c.stock || 0);

        // Distribute B2C first
        const b2cAllocations = distributeQuotaProportionally(varCapacities, newB2C);

        // Remaining capacity per variant for B2B
        const remainingForB2B = varCapacities.map((cap, idx) => cap - b2cAllocations[idx]);
        const b2bAllocations = distributeQuotaProportionally(remainingForB2B, newB2B);

        updated = updated.map((c, idx) => ({
            ...c,
            b2cStock: b2cAllocations[idx] || 0,
            b2bStock: b2bAllocations[idx] || 0,
        }));
    } else if (physicalUpdated) {
        // Channels were not updated, but physical stock changed.
        // Ensure no variant has (b2bStock + b2cStock > stock) due to physical reduction
        updated = updated.map((c) => {
            const varPhys = c.stock || 0;
            let vB2C = Math.min(varPhys, c.b2cStock || 0);
            let vB2B = Math.min(varPhys - vB2C, c.b2bStock || 0);
            return {
                ...c,
                b2cStock: vB2C,
                b2bStock: vB2B,
            };
        });
    }

    return updated;
}

// ============================================================================
// PUT /api/admin/stock/channel
// ============================================================================
export const updateChannelStock = async (req, res) => {
    try {
        // 1. Normalize payload structure
        let rawItems = [];
        let globalMode = req.body.mode || "set";

        if (Array.isArray(req.body.items)) {
            rawItems = req.body.items;
        } else if (Array.isArray(req.body)) {
            rawItems = req.body;
        } else if (
            req.body &&
            typeof req.body === "object" &&
            (req.body.productId || req.body.sku)
        ) {
            rawItems = [req.body];
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid request payload. Expected an array of items or an object with 'items'.",
            });
        }

        const parseResult = batchStockUpdateSchema.safeParse({
            mode: globalMode,
            items: rawItems,
        });

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parseResult.error.errors.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            });
        }

        const { mode, items } = parseResult.data;

        // 2. Reject duplicate target item within the single request
        // Key includes color variant targeting if present
        const seenKeys = new Set();
        for (const item of items) {
            const idPart = item.productId || item.sku.toUpperCase();
            let colorPart = "";
            if (item.colorIndex !== undefined) {
                colorPart = `:idx_${item.colorIndex}`;
            } else if (item.colorName || item.color) {
                colorPart = `:col_${(item.colorName || item.color).trim().toLowerCase()}`;
            }
            const key = `${idPart}${colorPart}`;

            if (seenKeys.has(key)) {
                const identifierType = item.sku ? "sku" : "productId";
                return res.status(400).json({
                    success: false,
                    message: `Duplicate ${identifierType} detected in request: ${item.sku || item.productId}${
                        colorPart ? ` (variant ${colorPart})` : ""
                    }`,
                });
            }
            seenKeys.add(key);
        }

        // 3. Pre-fetch all referenced products from DB
        const objectIds = items
            .map((i) => i.productId)
            .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        const skus = items
            .map((i) => i.sku)
            .filter(Boolean)
            .map((s) => s.toUpperCase());

        const queryConditions = [];
        if (objectIds.length > 0) queryConditions.push({ _id: { $in: objectIds } });
        if (skus.length > 0) queryConditions.push({ sku: { $in: skus } });

        const products =
            queryConditions.length > 0 ? await Product.find({ $or: queryConditions }) : [];

        const productById = new Map();
        const productBySku = new Map();

        for (const p of products) {
            productById.set(p._id.toString(), p);
            if (p.sku) {
                productBySku.set(p.sku.toUpperCase(), p);
            }
        }

        // 4. Process each item (partial failure supported)
        const results = [];
        const bulkOperations = [];
        const auditLogEntries = [];
        const changedIdentifiers = [];

        for (const item of items) {
            const itemMode = item.mode || mode;
            let product = null;

            if (item.productId && productById.has(item.productId)) {
                product = productById.get(item.productId);
            } else if (item.sku && productBySku.has(item.sku.toUpperCase())) {
                product = productBySku.get(item.sku.toUpperCase());
            }

            const itemIdentifier = item.sku || item.productId;

            if (!product) {
                results.push({
                    sku: item.sku || "",
                    productId: item.productId || "",
                    status: "failed",
                    reason: `Product not found for identifier: ${itemIdentifier}`,
                });
                continue;
            }

            const hasColorTarget =
                item.colorIndex !== undefined || Boolean(item.colorName || item.color);
            const hasVariants = Array.isArray(product.colors) && product.colors.length > 0;

            const inputTotalStock =
                item.totalStock !== undefined ? item.totalStock : item.physicalStock;

            // ====================================================================
            // CASE A: VARIANT-LEVEL TARGETING
            // ====================================================================
            if (hasColorTarget) {
                if (!hasVariants) {
                    results.push({
                        sku: product.sku || item.sku || "",
                        productId: product._id.toString(),
                        status: "failed",
                        reason: `Cannot target variant on product without color variants`,
                    });
                    continue;
                }

                let varIdx = -1;
                if (item.colorIndex !== undefined) {
                    if (item.colorIndex >= 0 && item.colorIndex < product.colors.length) {
                        varIdx = item.colorIndex;
                    } else {
                        results.push({
                            sku: product.sku || item.sku || "",
                            productId: product._id.toString(),
                            status: "failed",
                            reason: `Invalid colorIndex ${item.colorIndex}. Product has ${product.colors.length} variant(s).`,
                        });
                        continue;
                    }
                } else {
                    const targetName = (item.colorName || item.color).trim().toLowerCase();
                    varIdx = product.colors.findIndex(
                        (c) => (c.name || "").trim().toLowerCase() === targetName
                    );
                    if (varIdx === -1) {
                        results.push({
                            sku: product.sku || item.sku || "",
                            productId: product._id.toString(),
                            status: "failed",
                            reason: `Variant color '${item.colorName || item.color}' not found on product`,
                        });
                        continue;
                    }
                }

                const currentColors = product.colors.map((c) =>
                    c.toObject ? c.toObject() : { ...c }
                );
                const targetVar = currentColors[varIdx];
                const oldVarPhysical = Number(targetVar.stock ?? 0);
                const oldVarB2B = Number(targetVar.b2bStock ?? 0);
                const oldVarB2C = Number(targetVar.b2cStock ?? 0);

                let newVarPhysical = oldVarPhysical;
                let newVarB2B = oldVarB2B;
                let newVarB2C = oldVarB2C;

                if (itemMode === "adjust") {
                    if (inputTotalStock !== undefined) newVarPhysical = oldVarPhysical + inputTotalStock;
                    if (item.b2bStock !== undefined) newVarB2B = oldVarB2B + item.b2bStock;
                    if (item.b2cStock !== undefined) newVarB2C = oldVarB2C + item.b2cStock;
                } else {
                    // "set" mode
                    if (inputTotalStock !== undefined) newVarPhysical = inputTotalStock;
                    if (item.b2bStock !== undefined) newVarB2B = item.b2bStock;
                    if (item.b2cStock !== undefined) newVarB2C = item.b2cStock;
                }

                if (newVarPhysical < 0 || newVarB2B < 0 || newVarB2C < 0) {
                    results.push({
                        sku: product.sku || item.sku || "",
                        productId: product._id.toString(),
                        colorIndex: varIdx,
                        status: "failed",
                        reason: `Negative stock value not allowed (physical: ${newVarPhysical}, b2b: ${newVarB2B}, b2c: ${newVarB2C})`,
                    });
                    continue;
                }

                if (newVarB2B + newVarB2C > newVarPhysical) {
                    results.push({
                        sku: product.sku || item.sku || "",
                        productId: product._id.toString(),
                        colorIndex: varIdx,
                        status: "failed",
                        reason: `Sum of b2bStock (${newVarB2B}) and b2cStock (${newVarB2C}) exceeds physical stock (${newVarPhysical}) for variant '${targetVar.name}'`,
                    });
                    continue;
                }

                currentColors[varIdx] = {
                    ...targetVar,
                    stock: newVarPhysical,
                    b2bStock: newVarB2B,
                    b2cStock: newVarB2C,
                };

                const topPhysical = currentColors.reduce((sum, c) => sum + (c.stock || 0), 0);
                const topB2B = currentColors.reduce((sum, c) => sum + (c.b2bStock || 0), 0);
                const topB2C = currentColors.reduce((sum, c) => sum + (c.b2cStock || 0), 0);

                bulkOperations.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: {
                            $set: {
                                stockQuantity: topPhysical,
                                b2bStock: topB2B,
                                b2cStock: topB2C,
                                colors: currentColors,
                            },
                        },
                    },
                });

                auditLogEntries.push({
                    productId: product._id,
                    sku: product.sku || item.sku || "",
                    productName: product.name,
                    action: "CHANNEL_STOCK_UPDATE",
                    mode: itemMode,
                    oldB2BStock: oldVarB2B,
                    oldB2CStock: oldVarB2C,
                    newB2BStock: newVarB2B,
                    newB2CStock: newVarB2C,
                    physicalStock: newVarPhysical,
                    performedBy: {
                        userId: req.user?._id?.toString() || "admin",
                        email: req.user?.email || "admin@greenfibre.com",
                        role: req.user?.role || "admin",
                    },
                    reason: `Updated variant '${targetVar.name}' (colorIndex: ${varIdx}) via /api/admin/stock/channel (mode: ${itemMode})`,
                    metadata: { colorIndex: varIdx, colorName: targetVar.name },
                });

                // Update in-memory reference for subsequent items in the same batch
                product.colors = currentColors;
                product.stockQuantity = topPhysical;
                product.b2bStock = topB2B;
                product.b2cStock = topB2C;

                changedIdentifiers.push(product._id.toString());
                if (product.sku) changedIdentifiers.push(product.sku);

                results.push({
                    sku: product.sku || item.sku || "",
                    productId: product._id.toString(),
                    colorIndex: varIdx,
                    status: "updated",
                    physicalStock: newVarPhysical,
                    b2bStock: newVarB2B,
                    b2cStock: newVarB2C,
                });
                continue;
            }

            // ====================================================================
            // CASE B: PRODUCT-LEVEL TARGETING
            // ====================================================================
            const currentPhysical = Math.max(
                0,
                Number(product.stockQuantity ?? 0),
                hasVariants ? product.colors.reduce((s, c) => s + (c.stock || 0), 0) : 0
            );

            const oldB2B = Number(product.b2bStock ?? 0);
            const oldB2C = Number(product.b2cStock ?? 0);

            let newPhysical = currentPhysical;
            let newB2B = oldB2B;
            let newB2C = oldB2C;

            if (itemMode === "adjust") {
                if (inputTotalStock !== undefined) newPhysical = currentPhysical + inputTotalStock;
                if (item.b2bStock !== undefined) newB2B = oldB2B + item.b2bStock;
                if (item.b2cStock !== undefined) newB2C = oldB2C + item.b2cStock;
            } else {
                // "set" mode
                if (inputTotalStock !== undefined) newPhysical = inputTotalStock;
                if (item.b2bStock !== undefined) newB2B = item.b2bStock;
                if (item.b2cStock !== undefined) newB2C = item.b2cStock;
            }

            if (newPhysical < 0 || newB2B < 0 || newB2C < 0) {
                results.push({
                    sku: product.sku || item.sku || "",
                    productId: product._id.toString(),
                    status: "failed",
                    reason: `Negative stock value not allowed (physical: ${newPhysical}, b2b: ${newB2B}, b2c: ${newB2C})`,
                    physicalStock: currentPhysical,
                    b2bStock: oldB2B,
                    b2cStock: oldB2C,
                });
                continue;
            }

            // Invariant check: b2bStock + b2cStock must not exceed physical stock
            if (newB2B + newB2C > newPhysical) {
                results.push({
                    sku: product.sku || item.sku || "",
                    productId: product._id.toString(),
                    status: "failed",
                    reason: `Sum of b2bStock (${newB2B}) and b2cStock (${newB2C}) exceeds physical stock (${newPhysical})`,
                    physicalStock: currentPhysical,
                    b2bStock: oldB2B,
                    b2cStock: oldB2C,
                });
                continue;
            }

            // Proportional variant distribution if color variants exist
            let updatedColors = null;
            if (hasVariants) {
                updatedColors = distributeStocksAcrossVariants(
                    product.colors.map((c) => (c.toObject ? c.toObject() : { ...c })),
                    newPhysical,
                    newB2C,
                    newB2B,
                    {
                        physicalUpdated: inputTotalStock !== undefined,
                        channelsUpdated: item.b2bStock !== undefined || item.b2cStock !== undefined,
                    }
                );
            }

            const updateSet = {
                stockQuantity: newPhysical,
                b2bStock: newB2B,
                b2cStock: newB2C,
            };
            if (updatedColors) {
                updateSet.colors = updatedColors;
            }

            bulkOperations.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $set: updateSet },
                },
            });

            auditLogEntries.push({
                productId: product._id,
                sku: product.sku || item.sku || "",
                productName: product.name,
                action: "CHANNEL_STOCK_UPDATE",
                mode: itemMode,
                oldB2BStock: oldB2B,
                oldB2CStock: oldB2C,
                newB2BStock: newB2B,
                newB2CStock: newB2C,
                physicalStock: newPhysical,
                performedBy: {
                    userId: req.user?._id?.toString() || "admin",
                    email: req.user?.email || "admin@greenfibre.com",
                    role: req.user?.role || "admin",
                },
                reason: `Admin updated channel stock via /api/admin/stock/channel (mode: ${itemMode})`,
            });

            // Update in-memory reference for subsequent items in the same batch
            product.stockQuantity = newPhysical;
            product.b2bStock = newB2B;
            product.b2cStock = newB2C;
            if (updatedColors) product.colors = updatedColors;

            changedIdentifiers.push(product._id.toString());
            if (product.sku) changedIdentifiers.push(product.sku);

            results.push({
                sku: product.sku || item.sku || "",
                productId: product._id.toString(),
                status: "updated",
                physicalStock: newPhysical,
                b2bStock: newB2B,
                b2cStock: newB2C,
            });
        }

        // 5. Execute bulk writes & audit logs
        if (bulkOperations.length > 0) {
            await Product.bulkWrite(bulkOperations, { ordered: false });

            if (auditLogEntries.length > 0) {
                await StockAuditLog.insertMany(auditLogEntries).catch((err) => {
                    logger.warn(`Failed to insert stock audit logs: ${err.message}`);
                });
            }

            // Invalidate cached product info
            invalidateProductCache(changedIdentifiers);
        }

        // 6. Calculate totals and determine HTTP status
        const total = results.length;
        const updated = results.filter((r) => r.status === "updated").length;
        const failed = results.filter((r) => r.status === "failed").length;

        let statusCode = 200;
        if (failed === total) {
            statusCode = 400;
        } else if (failed > 0 && updated > 0) {
            statusCode = 207; // Multi-Status
        }

        return res.status(statusCode).json({
            success: updated > 0,
            summary: {
                total,
                updated,
                failed,
            },
            results,
        });
    } catch (error) {
        logger.error(`Error in updateChannelStock: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating channel stock",
            error: error.message,
        });
    }
};

// ============================================================================
// GET /api/admin/stock/channel
// ============================================================================
export const getChannelStockTable = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 20 } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = { isActive: { $ne: false } };

        if (search && search.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { name: { $regex: escaped, $options: "i" } },
                { sku: { $regex: escaped, $options: "i" } },
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .select("name sku stockQuantity b2bStock b2cStock warehouse colors")
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter),
        ]);

        const inventory = products.map((p) => {
            const physicalStock = Math.max(
                0,
                Number(p.stockQuantity ?? 0),
                Array.isArray(p.colors)
                    ? p.colors.reduce((s, c) => s + (c.stock || 0), 0)
                    : 0
            );

            const row = {
                id: p._id.toString(),
                sku: p.sku || "",
                name: p.name || "",
                warehouse: p.warehouse || "Central Facility",
                physicalStock,
                b2bStock: Number(p.b2bStock ?? 0),
                b2cStock: Number(p.b2cStock ?? 0),
            };

            if (Array.isArray(p.colors) && p.colors.length > 0) {
                row.colors = p.colors.map((c, idx) => ({
                    name: c.name || `Variant ${idx + 1}`,
                    colorIndex: idx,
                    physicalStock: Number(c.stock ?? 0),
                    b2bStock: Number(c.b2bStock ?? 0),
                    b2cStock: Number(c.b2cStock ?? 0),
                }));
            }

            return row;
        });

        return res.status(200).json({
            success: true,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum) || 0,
            },
            inventory,
        });
    } catch (error) {
        logger.error(`Error in getChannelStockTable: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch channel stock inventory table",
        });
    }
};
