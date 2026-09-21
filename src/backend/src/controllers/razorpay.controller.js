import crypto from "crypto";
import mongoose from "mongoose";
import { getRazorpayInstance, getRazorpayKeySecret, getRazorpayKeyId } from "../config/razorpay.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Coupon } from "../models/coupon.model.js";
import { applyCouponUsage } from "./coupon.controller.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { cleanupTempInvoice } from "../utils/invoiceHelpers.js";
import { autoFulfillOrder } from "../utils/shiprocket.js";

/**
 * Helper to process post-payment order fulfillment
 */
async function fulfillOrder(order, paymentId, signature, paymentResponse) {
    if (order.paymentStatus === "paid") {
        return;
    }

    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.paymentMethod = "Razorpay";
    order.razorpayPaymentId = paymentId;
    order.razorpaySignature = signature;
    order.transactionId = paymentId;
    order.paymentResponse = paymentResponse;
    order.statusHistory.push({
        status: "processing",
        timestamp: new Date(),
        note: `Payment verified successfully via Razorpay (Payment ID: ${paymentId})`,
    });

    // Atomic stock deduction
    for (const item of order.items || []) {
        try {
            const updated = await Product.findOneAndUpdate(
                { _id: item.product, [`colors.${item.colorIndex}.stock`]: { $gte: item.quantity } },
                { $inc: { [`colors.${item.colorIndex}.stock`]: -item.quantity } },
                { new: true }
            );
            if (!updated) {
                await Product.findByIdAndUpdate(item.product, {
                    $set: { [`colors.${item.colorIndex}.stock`]: 0 },
                });
                order.hasStockConflict = true;
                if (!order.stockConflictNotes) order.stockConflictNotes = [];
                const conflictNote = `⚠️ STOCK CONFLICT: Item "${item.name || item.product}" (Color Index: ${item.colorIndex}) ran out of stock before payment confirmation. Flagged for ops review.`;
                order.stockConflictNotes.push(conflictNote);
                order.statusHistory.push({
                    status: order.orderStatus,
                    timestamp: new Date(),
                    note: conflictNote,
                });
                console.warn(`⚠️ Stock conflict on product ${item.product} (color ${item.colorIndex}) for Razorpay order ${order._id}`);
            }
        } catch (itemErr) {
            console.error("Atomic stock decrement error for Razorpay item:", itemErr);
        }
    }

    // Record coupon usage
    if (order.couponCode) {
        try {
            await applyCouponUsage(order.couponCode, order.user?._id || order.user);
        } catch (couponErr) {
            console.error("Error applying coupon usage:", couponErr);
        }
    }

    // Persist complete order state (status, conflict flags, notes, history)
    await order.save();

    // Clear cart for the user
    if (order.user) {
        try {
            await Cart.findOneAndUpdate(
                { user: order.user?._id || order.user },
                { items: [], totalAmount: 0 }
            );
        } catch (cartErr) {
            console.error("Error clearing user cart:", cartErr);
        }
    }

    // Asynchronously generate invoice & send email
    setImmediate(async () => {
        try {
            const invoiceResult = await generateInvoicePdf(order);
            if (invoiceResult?.minioUrl) {
                order.invoiceUrl = invoiceResult.minioUrl;
                await order.save();
            }
            if (invoiceResult?.localPath) {
                cleanupTempInvoice(invoiceResult.localPath);
            }

            // 🚚 Automatically dispatch order via Shiprocket
            await autoFulfillOrder(order);
        } catch (err) {
            console.error("Invoice/fulfillment error for Razorpay order:", err);
        }
    });
}

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

                // Upfront stock check
                if (color.stock < cartItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Only ${color.stock} units available for ${product.name} in ${color.name}`,
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
            if (couponCode) {
                const coupon = await Coupon.findOne({
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

            const finalAmount = Math.max(1, calculatedTotal - discountAmount);
            finalChargeAmountInPaise = Math.max(100, Math.round(finalAmount * 100));

            const newOrder = await Order.create({
                user: req.user._id,
                items: orderItems,
                shippingAddress,
                totalAmount: calculatedTotal,
                discountAmount,
                finalAmount,
                couponCode: couponCode ? String(couponCode).toUpperCase() : undefined,
                paymentMethod: "Razorpay",
                paymentStatus: "pending",
                orderStatus: "pending",
                statusHistory: [
                    {
                        status: "pending",
                        timestamp: new Date(),
                        note: "Order created, awaiting Razorpay payment",
                    },
                ],
            });
            targetOrderId = newOrder._id;
        }
        else if (shippingAddress && !req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please login to place an order.",
            });
        }
        // Path C: Standalone test-payment tool (/api/test-payment)
        else {
            if (process.env.NODE_ENV === "production" && !req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized. Please login to initiate a test transaction.",
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

        return res.status(200).json({
            success: true,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt,
            orderId: targetOrderId,
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

        // Missing fields: return 400
        if (!order_id || !payment_id || !signature) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
            });
        }

        const key_secret = getRazorpayKeySecret();
        if (!key_secret) {
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

        // Signature mismatch: return 400, do NOT mark as paid
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature. Verification failed.",
            });
        }

        // If order exists in MongoDB and DB is connected, mark as paid and fulfill
        let linkedOrder = null;
        if (mongoose.connection.readyState === 1 && (order_id || greenfibreOrderId)) {
            try {
                linkedOrder = await Order.findOne({
                    $or: [
                        { razorpayOrderId: order_id },
                        ...(greenfibreOrderId ? [{ _id: greenfibreOrderId }] : []),
                    ],
                }).populate("user", "full_name email");

                if (linkedOrder) {
                    await fulfillOrder(linkedOrder, payment_id, signature, req.body);
                }
            } catch (findErr) {
                console.error("Non-fatal error finding linked order in MongoDB:", findErr);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order_id,
            payment_id,
            orderId: linkedOrder?._id || null,
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
