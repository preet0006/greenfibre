/**
 * channelStock.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared helper for B2B / B2C channel stock resolution, validation, and projection.
 * Guarantees existing response shapes remain identical while values reflect the
 * requested channel pool.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import logger from "./logger.js";

/**
 * Returns the stock value for a given product or variant color for a specific channel.
 * Products or variants without the new fields will safely return 0.
 *
 * @param {Object} entity - Product or Color Variant object
 * @param {'b2b'|'b2c'} channel - Channel to resolve stock for
 * @returns {number} Non-negative integer stock for the channel
 */
export const getChannelStock = (entity, channel = "b2c") => {
    if (!entity || typeof entity !== "object") return 0;

    const normalizedChannel = String(channel).toLowerCase() === "b2b" ? "b2b" : "b2c";
    const fieldName = `${normalizedChannel}Stock`;

    const val = entity[fieldName];
    if (val === undefined || val === null || isNaN(val)) {
        return 0;
    }

    return Math.max(0, Math.floor(Number(val)));
};

/**
 * Resolves the total stock for a channel across all variant colors.
 * If colors are absent or empty, falls back to top-level channel stock.
 *
 * @param {Object} product - Product document or lean object
 * @param {'b2b'|'b2c'} channel - 'b2b' or 'b2c'
 * @returns {number}
 */
export const getChannelTotalStock = (product, channel = "b2c") => {
    if (!product || typeof product !== "object") return 0;

    if (Array.isArray(product.colors) && product.colors.length > 0) {
        return product.colors.reduce((sum, c) => sum + getChannelStock(c, channel), 0);
    }

    return getChannelStock(product, channel);
};

/**
 * Transforms a product object so that the existing stock field names
 * (color.stock, stockQuantity, totalStock) contain the channel-specific stock value.
 * Preserves the exact response shape for backwards-compatibility.
 *
 * @param {Object} product - Raw or lean product document
 * @param {'b2b'|'b2c'} channel - 'b2b' or 'b2c'
 * @returns {Object} transformed product
 */
export const projectChannelStock = (product, channel = "b2c") => {
    if (!product || typeof product !== "object") return product;

    const isDoc = typeof product.toObject === "function";
    const p = isDoc ? product.toObject({ virtuals: true }) : { ...product };

    const normalizedChannel = String(channel).toLowerCase() === "b2b" ? "b2b" : "b2c";

    // Transform colors array so each variant's .stock reflects channel stock
    if (Array.isArray(p.colors)) {
        p.colors = p.colors.map((c) => {
            const channelStockVal = getChannelStock(c, normalizedChannel);
            return {
                ...c,
                stock: channelStockVal,
            };
        });
        p.totalStock = p.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
    } else {
        p.totalStock = getChannelStock(p, normalizedChannel);
    }

    // Top-level stockQuantity projection
    p.stockQuantity = getChannelStock(p, normalizedChannel) || p.totalStock;

    return p;
};

/**
 * Invalidate any in-memory or downstream product caches for changed items.
 *
 * @param {string|string[]} identifiers - Product IDs or SKUs
 */
export const invalidateProductCache = (identifiers) => {
    const list = Array.isArray(identifiers) ? identifiers : [identifiers];
    logger.debug(`[CACHE INVALIDATION] Invalidating cache for products: ${list.join(", ")}`);
};

/**
 * Deduct stock atomically across the correct channel pool (b2b or b2c).
 * If any item in a multi-item order fails due to insufficient stock, all
 * previously deducted items are cleanly rolled back.
 *
 * @param {Object} order - Order document or object
 * @returns {Promise<{success: boolean, conflictItem?: Object, reason?: string}>}
 */
export const deductOrderStock = async (order) => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        return { success: true };
    }

    const { Product } = await import("../models/product.model.js");
    const { StockAuditLog } = await import("../models/stockAudit.model.js");

    const channel = String(order.orderChannel || "b2c").toLowerCase() === "b2b" ? "b2b" : "b2c";
    const channelField = `${channel}Stock`;
    const successfullyDeducted = [];
    const auditEntries = [];

    for (const item of order.items) {
        const qty = Number(item.quantity) || 1;
        const productId = item.product?._id || item.product;
        const colorIndex = item.colorIndex;

        let updated = null;
        const hasColor = colorIndex !== undefined && colorIndex !== null && Number(colorIndex) >= 0;

        if (hasColor) {
            updated = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    [`colors.${colorIndex}.${channelField}`]: { $gte: qty },
                },
                {
                    $inc: {
                        [`colors.${colorIndex}.${channelField}`]: -qty,
                        [`colors.${colorIndex}.stock`]: -qty,
                        [channelField]: -qty,
                        stockQuantity: -qty,
                    },
                },
                { returnDocument: "after" }
            );
        } else {
            updated = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    [channelField]: { $gte: qty },
                },
                {
                    $inc: {
                        [channelField]: -qty,
                        stockQuantity: -qty,
                    },
                },
                { returnDocument: "after" }
            );
        }

        if (!updated) {
            // Roll back all items deducted prior to this failure
            logger.warn(`[ORDER STOCK DEDUCTION] Insufficient ${channel.toUpperCase()} stock for item ${productId}. Rolling back previous deductions...`);
            for (const prev of successfullyDeducted) {
                if (prev.hasColor) {
                    await Product.findByIdAndUpdate(prev.productId, {
                        $inc: {
                            [`colors.${prev.colorIndex}.${channelField}`]: prev.qty,
                            [`colors.${prev.colorIndex}.stock`]: prev.qty,
                            [channelField]: prev.qty,
                            stockQuantity: prev.qty,
                        },
                    });
                } else {
                    await Product.findByIdAndUpdate(prev.productId, {
                        $inc: {
                            [channelField]: prev.qty,
                            stockQuantity: prev.qty,
                        },
                    });
                }
            }

            return {
                success: false,
                conflictItem: item,
                reason: `Insufficient ${channel.toUpperCase()} stock for ${item.name || productId}`,
            };
        }

        successfullyDeducted.push({
            productId,
            colorIndex,
            hasColor,
            qty,
            name: item.name || productId.toString(),
        });

        auditEntries.push({
            productId,
            productName: item.name || "",
            action: "ORDER_DEDUCTION",
            mode: "order",
            newB2BStock: updated.b2bStock,
            newB2CStock: updated.b2cStock,
            physicalStock: updated.stockQuantity,
            performedBy: {
                userId: order.user?._id?.toString() || order.user?.toString() || "system",
                role: channel === "b2b" ? "b2b" : "customer",
            },
            reason: `Order ${order._id} deducted ${qty} units from ${channel.toUpperCase()} channel`,
            metadata: { orderId: order._id, orderChannel: channel },
        });
    }

    if (auditEntries.length > 0) {
        await StockAuditLog.insertMany(auditEntries).catch((err) => {
            logger.warn(`Failed to insert order deduction audit logs: ${err.message}`);
        });
    }

    invalidateProductCache(successfullyDeducted.map((d) => d.productId));
    return { success: true, deductedItems: successfullyDeducted };
};

/**
 * Restore stock atomically to the order's channel pool and physical stock.
 * Fully idempotent: guarded by order.stockRestored so duplicate cancel or webhook
 * retries cannot restore twice.
 *
 * @param {Object} order - Order document
 * @param {string} [reason="Order Cancellation"] - Context/reason for restore
 * @returns {Promise<{restored: boolean, reason?: string}>}
 */
export const restoreOrderStock = async (order, reason = "Order Cancellation") => {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        return { restored: false, reason: "No items to restore" };
    }

    const { Order } = await import("../models/order.model.js");
    const { Product } = await import("../models/product.model.js");
    const { StockAuditLog } = await import("../models/stockAudit.model.js");

    // Idempotent guard: only restore if stock was deducted and has not been restored yet
    const claim = await Order.findOneAndUpdate(
        {
            _id: order._id,
            stockDeducted: true,
            stockRestored: { $ne: true },
        },
        {
            $set: { stockRestored: true },
        },
        { returnDocument: "after" }
    );

    if (!claim) {
        return { restored: false, reason: "Order stock was not deducted or has already been restored" };
    }

    const channel = String(order.orderChannel || "b2c").toLowerCase() === "b2b" ? "b2b" : "b2c";
    const channelField = `${channel}Stock`;
    const auditEntries = [];
    const restoredProductIds = [];

    for (const item of order.items) {
        const qty = Number(item.quantity) || 1;
        const productId = item.product?._id || item.product;
        const colorIndex = item.colorIndex;
        const hasColor = colorIndex !== undefined && colorIndex !== null && Number(colorIndex) >= 0;

        let updated = null;
        if (hasColor) {
            updated = await Product.findByIdAndUpdate(
                productId,
                {
                    $inc: {
                        [`colors.${colorIndex}.${channelField}`]: qty,
                        [`colors.${colorIndex}.stock`]: qty,
                        [channelField]: qty,
                        stockQuantity: qty,
                    },
                },
                { returnDocument: "after" }
            );
        } else {
            updated = await Product.findByIdAndUpdate(
                productId,
                {
                    $inc: {
                        [channelField]: qty,
                        stockQuantity: qty,
                    },
                },
                { returnDocument: "after" }
            );
        }

        if (updated) {
            restoredProductIds.push(productId);
            auditEntries.push({
                productId,
                productName: item.name || "",
                action: "ORDER_RESTORE",
                mode: "order",
                newB2BStock: updated.b2bStock,
                newB2CStock: updated.b2cStock,
                physicalStock: updated.stockQuantity,
                performedBy: {
                    userId: "system",
                    role: "system",
                },
                reason: `${reason}: Restored ${qty} units to ${channel.toUpperCase()} channel for order ${order._id}`,
                metadata: { orderId: order._id, orderChannel: channel },
            });
        }
    }

    if (auditEntries.length > 0) {
        await StockAuditLog.insertMany(auditEntries).catch((err) => {
            logger.warn(`Failed to insert order restore audit logs: ${err.message}`);
        });
    }

    invalidateProductCache(restoredProductIds);
    logger.info(`[ORDER STOCK RESTORE] Successfully restored stock for order ${order._id} (${channel.toUpperCase()})`);
    return { restored: true };
};
