import crypto from "crypto";
import mongoose from "mongoose";
import { getRazorpayInstance, getRazorpayKeySecret, getRazorpayKeyId } from "../config/razorpay.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Coupon } from "../models/coupon.model.js";
import { User } from "../models/user.model.js";
import { applyCouponUsage } from "./coupon.controller.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { cleanupTempInvoice } from "../utils/invoiceHelpers.js";
import { autoFulfillOrder } from "../utils/shiprocket.js";
import {
    isRewardsEnabled,
    getRewardConfig,
    reserveRedeemPoints,
    creditEarnedPoints,
    restoreRedeemedPoints,
} from "../services/rewards.service.js";
import { getChannelStock, deductOrderStock, restoreOrderStock } from "../utils/channelStock.js";
import { getNextOrderNumber } from "../utils/orderNumber.js";

/**
 * Shared idempotent order fulfillment function for Razorpay payments.
 * Ensures:
 * 1. Pre-claim validation: paid amount and currency (INR) match order finalAmount in paise.
 * 2. Atomic claim: exactly one caller claims the order via findOneAndUpdate with paymentStatus: { $ne: "paid" }.
 * 3. Resumable per-step idempotent side effects:
 *    - Stock: deducted once using atomic stockDeducted flag and conditional decrement (stock >= qty); no negative stock.
 *    - Coupon: applied once using atomic couponApplied flag.
 *    - Cart: cleared safely.
 *    - Rewards: credited idempotently via earn:${order._id} ledger key.
 *    - Invoice: generated if missing.
 *    - Shiprocket: auto-dispatched if missing and no stock conflict.
 * 4. Concurrent / duplicate callers return success with identical state without re-running completed side effects.
 *
 * @param {Object|string} orderOrId - Order Mongoose doc or order _id
 * @param {string} paymentId - Razorpay payment ID (e.g. pay_xxx)
 * @param {string} signature - Razorpay HMAC signature
 * @param {Object} paymentResponse - Full payment response body
 * @param {Object} [options] - Optional overrides: { paymentDetails: { amount, currency } }
 */
export async function fulfillOrder(orderOrId, paymentId, signature, paymentResponse, options = {}) {
    let activeOrder = null;

    if (orderOrId && typeof orderOrId === "object" && orderOrId._id) {
        activeOrder = orderOrId;
    } else if (orderOrId) {
        activeOrder = await Order.findOne({
            $or: [
                ...(mongoose.isValidObjectId(orderOrId) ? [{ _id: orderOrId }] : []),
                { razorpayOrderId: orderOrId },
            ],
        }).populate("user", "full_name email");
    }

    if (!activeOrder) {
        const err = new Error(`Order not found for fulfillment: ${orderOrId}`);
        err.code = "ORDER_NOT_FOUND";
        throw err;
    }

    // ── 1. AMOUNT, CURRENCY, STATUS & ORDER_ID VALIDATION (Items 2 & 3) ──
    let paidAmountPaise;
    let paidCurrency;
    let paidStatus;
    let paidOrderId;

    if (options?.paymentDetails?.amount != null && options?.paymentDetails?.currency != null) {
        paidAmountPaise = Number(options.paymentDetails.amount);
        paidCurrency = String(options.paymentDetails.currency).toUpperCase();
        paidStatus = options.paymentDetails.status;
        paidOrderId = options.paymentDetails.order_id;
    } else if (paymentId) {
        const razorpay = getRazorpayInstance();
        let fetchedPayment = await razorpay.payments.fetch(paymentId);

        // If status is "authorized", re-fetch up to 3 times with ~1.5s delay
        if (fetchedPayment?.status === "authorized") {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            for (let attempt = 1; attempt <= 3; attempt++) {
                await sleep(1500);
                try {
                    const reFetched = await razorpay.payments.fetch(paymentId);
                    if (reFetched?.status === "captured") {
                        fetchedPayment = reFetched;
                        break;
                    }
                    fetchedPayment = reFetched;
                } catch (retryErr) {
                    console.warn(`Retry ${attempt} fetching payment ${paymentId} failed:`, retryErr.message);
                }
            }
        }

        paidAmountPaise = Number(fetchedPayment.amount);
        paidCurrency = String(fetchedPayment.currency || "INR").toUpperCase();
        paidStatus = fetchedPayment.status;
        paidOrderId = fetchedPayment.order_id;
    } else {
        const err = new Error("Payment validation failed: missing payment identifier or details.");
        err.code = "PAYMENT_DETAILS_MISSING";
        throw err;
    }

    // If still "authorized" after retries: distinct pending response (HTTP 202)
    // Do NOT mark paid, do NOT push a failure note. Order stays pending.
    if (paidStatus === "authorized") {
        const err = new Error("Payment received, confirmation in progress");
        err.code = "PAYMENT_PENDING_CONFIRMATION";
        err.statusCode = 202;
        throw err;
    }

    const expectedAmountPaise = Math.max(100, Math.round(Number(activeOrder.finalAmount) * 100));

    // Validation rules (Hard failures -> 400)
    const validationErrors = [];
    if (paidCurrency !== "INR") {
        validationErrors.push(`currency mismatch (expected INR, received ${paidCurrency})`);
    }
    if (paidAmountPaise !== expectedAmountPaise) {
        validationErrors.push(`amount mismatch (expected ${expectedAmountPaise} paise, received ${paidAmountPaise} paise)`);
    }
    if (paidStatus !== "captured") {
        validationErrors.push(`payment status is '${paidStatus}', expected 'captured'`);
    }
    // Fail closed: order_id check (Item 3)
    if (!paidOrderId || !activeOrder.razorpayOrderId) {
        validationErrors.push(`order ID missing from payment (${paidOrderId || 'missing'}) or database order (${activeOrder.razorpayOrderId || 'missing'})`);
    } else if (paidOrderId !== activeOrder.razorpayOrderId) {
        validationErrors.push(`order ID mismatch: payment belongs to ${paidOrderId}, but order is linked to ${activeOrder.razorpayOrderId}`);
    }

    if (validationErrors.length > 0) {
        const failureReason = validationErrors.join("; ");
        const failureNote = `⚠️ Payment validation failed: ${failureReason} (Payment ID: ${paymentId})`;
        console.error(`🚨 [PAYMENT VALIDATION ERROR] Order ${activeOrder._id}: ${failureNote}`);

        // Dedupe push to statusHistory (Item 4) WITHOUT changing paymentStatus
        try {
            await Order.findOneAndUpdate(
                {
                    _id: activeOrder._id,
                    "statusHistory.note": { $ne: failureNote },
                },
                {
                    $push: {
                        statusHistory: {
                            status: activeOrder.orderStatus || "pending",
                            timestamp: new Date(),
                            note: failureNote,
                        },
                    },
                }
            );
        } catch (histErr) {
            console.error("Failed to push validation failure note to statusHistory:", histErr);
        }

        const err = new Error(failureNote);
        err.code = "PAYMENT_VALIDATION_FAILED";
        err.statusCode = 400;
        err.expectedAmount = expectedAmountPaise;
        err.paidAmount = paidAmountPaise;
        err.currency = paidCurrency;
        err.paymentStatus = paidStatus;
        throw err;
    }

    // ── 2. ATOMIC CLAIM (A2) ─────────────────────────────────────────
    const claimUpdate = {
        $set: {
            paymentStatus: "paid",
            orderStatus: "processing",
            paymentMethod: "Razorpay",
            razorpayPaymentId: paymentId,
            razorpaySignature: signature || activeOrder.razorpaySignature,
            transactionId: paymentId,
            paymentResponse: paymentResponse || activeOrder.paymentResponse,
        },
        $push: {
            statusHistory: {
                status: "processing",
                timestamp: new Date(),
                note: `Payment verified successfully via Razorpay (Payment ID: ${paymentId})`,
            },
        },
    };

    const claimedOrder = await Order.findOneAndUpdate(
        {
            _id: activeOrder._id,
            paymentStatus: { $ne: "paid" },
        },
        claimUpdate,
        { new: true }
    ).populate("user", "full_name email");

    if (claimedOrder) {
        activeOrder = claimedOrder;
    } else {
        // Lost atomic claim or already paid — refresh document from DB
        activeOrder = await Order.findById(activeOrder._id).populate("user", "full_name email");

        // ── DUPLICATE PAYMENT CHECK (Item 4 & 5) ──
        if (
            paymentId &&
            activeOrder.razorpayPaymentId &&
            paymentId !== activeOrder.razorpayPaymentId
        ) {
            const dupWarning = `⚠️ Possible duplicate payment: received payment ID ${paymentId}, but order was already paid with ${activeOrder.razorpayPaymentId}. Stored payment ID preserved; manual review required.`;
            console.error(`🚨 [DUPLICATE PAYMENT WARNING] Order ${activeOrder._id}: ${dupWarning}`);

            try {
                await Order.findOneAndUpdate(
                    {
                        _id: activeOrder._id,
                        "statusHistory.note": { $ne: dupWarning },
                    },
                    {
                        $push: {
                            statusHistory: {
                                status: activeOrder.orderStatus || "processing",
                                timestamp: new Date(),
                                note: dupWarning,
                            },
                        },
                    }
                );
            } catch (dupErr) {
                console.error("Error logging duplicate payment warning to statusHistory:", dupErr);
            }
            // Do NOT refund, and do NOT overwrite activeOrder.razorpayPaymentId
        }
    }

    // ── 3. RESUMABLE SIDE-EFFECTS (A3) ───────────────────────────────

    // 3A. Atomic Stock Deduction (guarded by stockDeducted flag + stock >= qty)
    const stockClaim = await Order.findOneAndUpdate(
        {
            _id: activeOrder._id,
            stockDeducted: { $ne: true },
        },
        {
            $set: { stockDeducted: true },
        },
        { new: true }
    );

    if (stockClaim) {
        const deductResult = await deductOrderStock(activeOrder);

        if (!deductResult.success) {
            const conflictNote = `⚠️ STOCK CONFLICT: Item "${deductResult.conflictItem?.name || deductResult.conflictItem?.product}" ran out of stock before payment confirmation. Flagged for ops review.`;
            const conflictNotes = [conflictNote];
            console.warn(`⚠️ Stock conflict for Razorpay order ${activeOrder._id}: ${deductResult.reason}`);

            activeOrder.hasStockConflict = true;
            if (!activeOrder.stockConflictNotes) activeOrder.stockConflictNotes = [];
            activeOrder.stockConflictNotes.push(...conflictNotes);

            const historyEntries = conflictNotes.map((note) => ({
                status: activeOrder.orderStatus || "processing",
                timestamp: new Date(),
                note,
            }));

            await Order.findByIdAndUpdate(activeOrder._id, {
                $set: { hasStockConflict: true },
                $push: {
                    stockConflictNotes: { $each: conflictNotes },
                    statusHistory: { $each: historyEntries },
                },
            });
        }
    }

    // 3B. Coupon Usage (applied once guarded by couponApplied flag)
    if (activeOrder.couponCode) {
        const couponClaim = await Order.findOneAndUpdate(
            {
                _id: activeOrder._id,
                couponApplied: { $ne: true },
            },
            {
                $set: { couponApplied: true },
            },
            { new: true }
        );

        if (couponClaim) {
            try {
                await applyCouponUsage(activeOrder.couponCode, activeOrder.user?._id || activeOrder.user);
            } catch (couponErr) {
                console.error("Error applying coupon usage:", couponErr);
            }
        }
    }

    // 3C. Cart Selective Item Removal (Item 2 — only on claim-winner path)
    if (claimedOrder && activeOrder.user) {
        try {
            const userId = activeOrder.user?._id || activeOrder.user;
            const userCart = await Cart.findOne({ user: userId });
            if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
                // Build a set of ordered item identifiers: `${productId}_${colorIndex}`
                const orderedItemKeys = new Set(
                    (activeOrder.items || []).map(
                        (oi) => `${String(oi.product?._id || oi.product)}_${oi.colorIndex}`
                    )
                );

                // Retain only items that were NOT part of this completed order
                const remainingItems = userCart.items.filter(
                    (ci) => !orderedItemKeys.has(`${String(ci.product?._id || ci.product)}_${ci.colorIndex}`)
                );

                const newTotalAmount = remainingItems.reduce(
                    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
                    0
                );

                userCart.items = remainingItems;
                userCart.totalAmount = Math.max(0, newTotalAmount);
                await userCart.save();
            }
        } catch (cartErr) {
            console.error("Error updating user cart:", cartErr);
        }
    }

    // 3D. Reward Points Credit (idempotent via earn:${order._id} ledger key)
    let pointsEarned = activeOrder.rewardPointsEarned || 0;
    let newRewardBalance = null;
    if (isRewardsEnabled() && activeOrder.user) {
        try {
            const populatedUser = await User.findById(activeOrder.user?._id || activeOrder.user)
                .select("reward_balance has_completed_first_order accountType");
            if (populatedUser) {
                const earnResult = await creditEarnedPoints(activeOrder, populatedUser);
                if (earnResult) {
                    pointsEarned = earnResult.pointsEarned;
                    newRewardBalance = earnResult.newBalance;
                }
            }
        } catch (rewardErr) {
            console.error("Reward credit error for Razorpay order (non-fatal):", rewardErr);
        }
    }

    // 3E. Invoice & Shiprocket Auto-dispatch (atomic leases & resumable)
    const orderIdToFulfill = activeOrder._id;
    setImmediate(async () => {
        try {
            const LEASE_MS = 5 * 60 * 1000; // 5 minute lease
            const now = new Date();
            const leaseExpired = new Date(Date.now() - LEASE_MS);

            // ── Invoice Claim (Item 1) ──
            // Must match when invoiceClaimedAt is null OR missing OR older than 5 minutes,
            // AND invoiceUrl is still empty / null / missing.
            const invoiceClaim = await Order.findOneAndUpdate(
                {
                    _id: orderIdToFulfill,
                    $and: [
                        {
                            $or: [
                                { invoiceUrl: null },
                                { invoiceUrl: { $exists: false } },
                                { invoiceUrl: "" },
                            ],
                        },
                        {
                            $or: [
                                { invoiceClaimedAt: null },
                                { invoiceClaimedAt: { $exists: false } },
                                { invoiceClaimedAt: { $lt: leaseExpired } },
                            ],
                        },
                    ],
                },
                {
                    $set: { invoiceClaimedAt: now },
                },
                { new: true }
            );

            if (invoiceClaim) {
                try {
                    const invoiceResult = await generateInvoicePdf(invoiceClaim);
                    if (invoiceResult?.minioUrl) {
                        await Order.findByIdAndUpdate(orderIdToFulfill, {
                            $set: { invoiceUrl: invoiceResult.minioUrl },
                        });
                    }
                    if (invoiceResult?.localPath) {
                        cleanupTempInvoice(invoiceResult.localPath);
                    }
                } catch (invoiceErr) {
                    console.error(`Invoice generation error for order ${orderIdToFulfill}:`, invoiceErr);
                    // On failure, invoiceUrl remains unset. The lease expires after 5m for retries.
                }
            }

            // ── Shiprocket Dispatch Claim (Item 1) ──
            // Must match when dispatchClaimedAt is null OR missing OR older than 5 minutes,
            // AND shippingDetails.shiprocketOrderId is still empty / null / missing,
            // AND hasStockConflict is not true.
            const shiprocketClaim = await Order.findOneAndUpdate(
                {
                    _id: orderIdToFulfill,
                    hasStockConflict: { $ne: true },
                    $and: [
                        {
                            $or: [
                                { "shippingDetails.shiprocketOrderId": null },
                                { "shippingDetails.shiprocketOrderId": { $exists: false } },
                                { "shippingDetails.shiprocketOrderId": "" },
                            ],
                        },
                        {
                            $or: [
                                { dispatchClaimedAt: null },
                                { dispatchClaimedAt: { $exists: false } },
                                { dispatchClaimedAt: { $lt: leaseExpired } },
                            ],
                        },
                    ],
                },
                {
                    $set: { dispatchClaimedAt: now },
                },
                { new: true }
            );

            if (shiprocketClaim) {
                console.log(`🚀 [SHIPROCKET AUTO-DISPATCH] Acquired dispatch claim for order ${orderIdToFulfill}. Calling autoFulfillOrder...`);
                try {
                    await autoFulfillOrder(shiprocketClaim);
                } catch (shiprocketErr) {
                    console.error(`Shiprocket dispatch error for order ${orderIdToFulfill}:`, shiprocketErr);
                    // On failure, shiprocketOrderId remains unset. The lease expires after 5m for retries.
                }
            } else {
                console.log(`ℹ️ [SHIPROCKET AUTO-DISPATCH] Order ${orderIdToFulfill} could not acquire dispatch claim (already claimed, has order ID, or stock conflict).`);
            }
        } catch (err) {
            console.error("Fulfillment background worker error:", err);
        }
    });

    return {
        order: activeOrder,
        orderId: activeOrder._id,
        pointsEarned,
        newRewardBalance,
        wasAlreadyPaid: !claimedOrder,
    };
}

export { fulfillOrder as fulfillRazorpayOrder };

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (in paise), currency, receipt, orderId, shippingAddress, couponCode, notes }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
export const createRazorpayOrder = async (req, res) => {
    try {
        const {
            amount,
            currency = "INR",
            receipt,
            orderId,
            shippingAddress,
            couponCode,
            pointsToRedeem,
            notes = {},
        } = req.body;

        let targetOrderId = orderId || null;
        let finalChargeAmountInPaise = 0;

        // Path A: Existing Order already created in database
        if (orderId) {
            const existingOrder = await Order.findById(orderId);
            if (!existingOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Specified order not found",
                });
            }

            // IDOR Protection: verify user ownership
            if (
                !req.user ||
                (String(existingOrder.user) !== String(req.user._id) && req.user.role !== "admin")
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to access or pay for this order",
                });
            }

            if (existingOrder.paymentStatus === "paid") {
                return res.status(400).json({
                    success: false,
                    message: "This order is already paid",
                });
            }
            if (!existingOrder.orderNumber) {
                existingOrder.orderNumber = await getNextOrderNumber();
                await existingOrder.save();
            }
            // Strict server-side amount from Order document
            finalChargeAmountInPaise = Math.max(100, Math.round(existingOrder.finalAmount * 100));
        }
        // Path B: User cart checkout — build order & compute amount 100% server-side
        else if (req.user && shippingAddress) {
            const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart is empty",
                });
            }

            const orderItems = [];
            let calculatedTotal = 0;

            for (const cartItem of cart.items) {
                const product = cartItem.product;
                if (!product || !product.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: `Product ${product?.name || "item"} is currently unavailable`,
                    });
                }

                const color = product.colors?.[cartItem.colorIndex];
                if (!color) {
                    return res.status(400).json({
                        success: false,
                        message: `Selected color is not available for ${product.name}`,
                    });
                }

                // Upfront channel stock check
                const orderChannel = req.body.orderChannel === "b2b" ? "b2b" : (req.body.orderChannel === "mobile" ? "mobile" : (req.user?.accountType === "B2B" ? "b2b" : "b2c"));
                const stockPool = orderChannel === "b2b" ? "b2b" : "b2c";
                const availableChannelStock = getChannelStock(color, stockPool);

                if (availableChannelStock < cartItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Only ${availableChannelStock} units available for ${product.name} in ${color.name}`,
                    });
                }

                // Strict server-side item price
                const itemPrice = typeof product.discountedPrice === "number"
                    ? product.discountedPrice
                    : (typeof product.originalPrice === "number" ? product.originalPrice : null);

                if (itemPrice === null || isNaN(itemPrice)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid pricing configuration for product ${product.name}`,
                    });
                }

                const firstImage = color.images?.[0];
                const imageUrl = typeof firstImage === "string" ? firstImage : firstImage?.original || firstImage?.card || "";

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    image: imageUrl,
                    colorIndex: cartItem.colorIndex,
                    colorName: color.name,
                    colorHex: color.hex,
                    quantity: cartItem.quantity,
                    price: itemPrice,
                });

                calculatedTotal += itemPrice * cartItem.quantity;
            }

            // Coupon validation & discount computation server-side
            let discountAmount = 0;
            let coupon = null;
            if (couponCode) {
                coupon = await Coupon.findOne({
                    code: String(couponCode).toUpperCase(),
                    isActive: true,
                });

                if (!coupon) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid coupon code",
                    });
                }

                const now = new Date();
                if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
                    return res.status(400).json({
                        success: false,
                        message: "Coupon has expired",
                    });
                }

                if (
                    coupon.usageLimit &&
                    coupon.usageLimit !== 0 &&
                    coupon.usedCount >= coupon.usageLimit
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Coupon usage limit reached",
                    });
                }

                if (coupon.perUserLimit) {
                    const userUsage = (coupon.usedBy || []).find(
                        (u) => u.user?.toString() === req.user._id.toString()
                    );
                    if (userUsage && userUsage.count >= coupon.perUserLimit) {
                        return res.status(400).json({
                            success: false,
                            message: "You have already used this coupon maximum times",
                        });
                    }
                }

                if (coupon.minOrderAmount && calculatedTotal < coupon.minOrderAmount) {
                    return res.status(400).json({
                        success: false,
                        message: `Minimum order value of ₹${coupon.minOrderAmount} required for this coupon`,
                    });
                }

                if (coupon.discountType === "percentage") {
                    discountAmount = Math.round((calculatedTotal * coupon.discountValue) / 100);
                    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                        discountAmount = coupon.maxDiscountAmount;
                    }
                } else if (coupon.discountType === "fixed") {
                    discountAmount = Math.min(coupon.discountValue, calculatedTotal);
                }
            }

            // Server-side first-order coupon enforcement
            if (coupon?.isFirstOrderCoupon) {
                const currentUser = await User.findById(req.user._id).select("has_completed_first_order accountType");
                if (currentUser?.has_completed_first_order) {
                    return res.status(400).json({
                        success: false,
                        message: "This coupon is only valid for your first order.",
                    });
                }
                if (currentUser?.accountType === "B2B") {
                    return res.status(400).json({
                        success: false,
                        message: "This coupon is not valid for B2B accounts.",
                    });
                }
            }

            // Reward config snapshot pre-fetch
            let rewardConfigSnap = null;
            let rewardCfgForSnapshot = null;
            if (isRewardsEnabled()) {
                try {
                    rewardCfgForSnapshot = await getRewardConfig();
                    rewardConfigSnap = {
                        earn_percent: rewardCfgForSnapshot.earn_percent,
                        point_value: rewardCfgForSnapshot.point_value,
                        max_redeem_percent: rewardCfgForSnapshot.max_redeem_percent,
                        direct_percent: rewardCfgForSnapshot.direct_percent,
                        coupon_percent: rewardCfgForSnapshot.coupon_percent,
                    };
                } catch (snapErr) {
                    console.error("Could not snapshot reward config:", snapErr);
                }
            }

            let initialFinalAmount = Math.max(1, calculatedTotal - discountAmount);

            const resolvedChannel = req.body.orderChannel === "b2b" ? "b2b" : (req.body.orderChannel === "mobile" ? "mobile" : (req.user?.accountType === "B2B" ? "b2b" : "b2c"));
            const orderNumber = await getNextOrderNumber();

            const newOrder = await Order.create({
                user: req.user._id,
                orderNumber,
                items: orderItems,
                shippingAddress,
                orderChannel: resolvedChannel,
                totalAmount: calculatedTotal,
                discountAmount,
                finalAmount: initialFinalAmount,
                couponCode: couponCode ? String(couponCode).toUpperCase() : undefined,
                paymentMethod: "Razorpay",
                paymentStatus: "pending",
                orderStatus: "pending",
                rewardConfigSnapshot: rewardConfigSnap || undefined,
                statusHistory: [
                    {
                        status: "pending",
                        timestamp: new Date(),
                        note: "Order created, awaiting Razorpay payment",
                    },
                ],
            });

            // Server-side reward points redemption
            let rewardPointsRedeemed = 0;
            let rewardDiscount = 0;
            if (isRewardsEnabled() && pointsToRedeem && Number(pointsToRedeem) > 0) {
                try {
                    const redeemResult = await reserveRedeemPoints(
                        req.user._id,
                        newOrder._id,
                        Number(pointsToRedeem),
                        calculatedTotal,
                        rewardCfgForSnapshot
                    );
                    if (redeemResult) {
                        rewardPointsRedeemed = redeemResult.pointsRedeemed;
                        rewardDiscount = redeemResult.discountAmount;
                        const adjustedFinalAmount = Math.max(0, initialFinalAmount - rewardDiscount);
                        await Order.findByIdAndUpdate(newOrder._id, {
                            $set: {
                                rewardPointsRedeemed,
                                rewardDiscount,
                                finalAmount: adjustedFinalAmount,
                            },
                        });
                        newOrder.rewardPointsRedeemed = rewardPointsRedeemed;
                        newOrder.rewardDiscount = rewardDiscount;
                        newOrder.finalAmount = adjustedFinalAmount;
                    }
                } catch (redeemErr) {
                    console.error("Reward points redemption error (non-fatal):", redeemErr);
                }
            }

            targetOrderId = newOrder._id;
            finalChargeAmountInPaise = Math.max(100, Math.round(newOrder.finalAmount * 100));
        }
        else if (shippingAddress && !req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login to place an order.",
            });
        }
        // Path C: Standalone test-payment tool (/api/test-payment)
        else {
            const keyId = getRazorpayKeyId() || "";
            const isLiveKey = keyId.startsWith("rzp_live_") || process.env.NODE_ENV === "production";
            const isEnabled = process.env.ENABLE_TEST_PAYMENT_ROUTE === "true";

            if (!isEnabled || isLiveKey) {
                return res.status(403).json({
                    success: false,
                    message: "Standalone test payments are disabled or disallowed when live keys / production are active.",
                });
            }
            const numericAmount = Math.round(Number(amount));
            if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be at least 100 paise (₹1).",
                });
            }
            finalChargeAmountInPaise = numericAmount;
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: finalChargeAmountInPaise,
            currency: String(currency).toUpperCase(),
            receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            notes: {
                ...notes,
                ...(targetOrderId ? { greenfibreOrderId: String(targetOrderId) } : {}),
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        if (targetOrderId) {
            try {
                await Order.findByIdAndUpdate(targetOrderId, {
                    razorpayOrderId: razorpayOrder.id,
                    paymentMethod: "Razorpay",
                });
            } catch (e) {
                console.error("Non-fatal Order update error with razorpayOrderId:", e);
            }
        }

        let resolvedOrderNumber = null;
        if (targetOrderId) {
            try {
                const targetDoc = await Order.findById(targetOrderId).select("orderNumber").lean();
                resolvedOrderNumber = targetDoc?.orderNumber || null;
            } catch (e) {
                /* non-fatal */
            }
        }

        return res.status(200).json({
            success: true,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            orderId: targetOrderId,
            orderNumber: resolvedOrderNumber,
            key_id: getRazorpayKeyId(),
        });
    } catch (error) {
        console.error("Razorpay createOrder error:", error);

        // Check for authentication failure with Razorpay API
        if (
            error?.statusCode === 401 ||
            (error?.error?.code === "BAD_REQUEST_ERROR" &&
                error?.error?.description?.includes("Unauthorized"))
        ) {
            return res.status(401).json({
                success: false,
                message: "Razorpay authentication failed. Please verify API keys.",
                error: error?.error || error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error?.error?.description || "Failed to create Razorpay order.",
            error: error?.error || error.message,
        });
    }
};

/**
 * STEP 3: BACKEND - Verify Payment Signature
 * Endpoint: POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const order_id = req.body.razorpay_order_id || req.body.order_id;
        const payment_id = req.body.razorpay_payment_id || req.body.payment_id;
        const signature = req.body.razorpay_signature || req.body.signature;
        const greenfibreOrderId = req.body.greenfibreOrderId || req.body.orderId;

        console.log(`💳 [PAYMENT VERIFY] Incoming payment verification for order_id: "${order_id}", payment_id: "${payment_id}"`);

        // Missing fields: return 400
        if (!order_id || !payment_id || !signature) {
            console.warn("⚠️ [PAYMENT VERIFY] Missing required fields in verification payload.");
            return res.status(400).json({
                success: false,
                message: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
            });
        }

        const key_secret = getRazorpayKeySecret();
        if (!key_secret) {
            console.error("❌ [PAYMENT VERIFY] RAZORPAY_KEY_SECRET is missing from environment.");
            return res.status(500).json({
                success: false,
                message: "Server configuration error: RAZORPAY_KEY_SECRET is missing.",
            });
        }

        // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(`${order_id}|${payment_id}`)
            .digest("hex");

        // Constant time comparison to prevent timing attacks
        let isValid = false;
        try {
            isValid =
                signature.length === expectedSignature.length &&
                crypto.timingSafeEqual(
                    Buffer.from(signature, "utf-8"),
                    Buffer.from(expectedSignature, "utf-8")
                );
        } catch {
            isValid = false;
        }

        console.log(`🔒 [PAYMENT VERIFY] Signature verification result: ${isValid ? "PASSED ✅" : "FAILED ❌"}`);

        // Signature mismatch: return 400, do NOT mark as paid
        if (!isValid) {
            console.warn(`🔒 [PAYMENT VERIFY] Signature mismatch rejected for order_id: ${order_id}`);
            if (isRewardsEnabled() && (order_id || greenfibreOrderId)) {
                try {
                    const failedOrder = await Order.findOne({
                        $or: [
                            { razorpayOrderId: order_id },
                            ...(greenfibreOrderId ? [{ _id: greenfibreOrderId }] : []),
                        ],
                    });
                    if (failedOrder && failedOrder.rewardPointsRedeemed > 0) {
                        await restoreRedeemedPoints(failedOrder, failedOrder.user?._id || failedOrder.user);
                    }
                } catch (resErr) {
                    console.error("Error restoring redeemed points on Razorpay failure:", resErr);
                }
            }
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature. Verification failed.",
            });
        }

        // If order exists in MongoDB and DB is connected, mark as paid and fulfill
        let linkedOrder = null;
        let fulfillResult = { pointsEarned: 0, newRewardBalance: null };
        if (mongoose.connection.readyState === 1 && (order_id || greenfibreOrderId)) {
            try {
                linkedOrder = await Order.findOne({
                    $or: [
                        { razorpayOrderId: order_id },
                        ...(mongoose.isValidObjectId(greenfibreOrderId) ? [{ _id: greenfibreOrderId }] : []),
                    ],
                }).populate("user", "full_name email");

                console.log(`📦 [PAYMENT VERIFY] DB Order lookup: ${linkedOrder ? `FOUND ✅ (ID: ${linkedOrder._id}, Status: ${linkedOrder.orderStatus}, PaymentStatus: ${linkedOrder.paymentStatus})` : "NOT FOUND ❌"}`);

                if (!linkedOrder) {
                    return res.status(404).json({
                        success: false,
                        message: "Order not found for Razorpay payment.",
                    });
                }

                fulfillResult = await fulfillOrder(
                    linkedOrder,
                    payment_id,
                    signature,
                    req.body
                );
            } catch (fulfillErr) {
                if (fulfillErr.code === "PAYMENT_PENDING_CONFIRMATION") {
                    return res.status(202).json({
                        success: false,
                        pending: true,
                        message: "Payment received, confirmation in progress",
                        orderId: linkedOrder?._id || null,
                    });
                }
                if (
                    fulfillErr.code === "AMOUNT_MISMATCH" ||
                    fulfillErr.code === "PAYMENT_VALIDATION_FAILED"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: fulfillErr.message || "Payment validation failed. Payment not fulfilled.",
                        error: fulfillErr.message,
                    });
                }
                throw fulfillErr;
            }
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order_id,
            payment_id,
            orderId: fulfillResult?.orderId || linkedOrder?._id || null,
            orderNumber: linkedOrder?.orderNumber || null,
            pointsEarned: fulfillResult?.pointsEarned ?? 0,
            newRewardBalance: fulfillResult?.newRewardBalance ?? null,
        });
    } catch (error) {
        console.error("Razorpay verifyPayment error:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying payment",
            error: error.message,
        });
    }
};
