import crypto from "crypto";
import mongoose from "mongoose";
import { getRazorpayInstance, getRazorpayKeySecret, getRazorpayKeyId } from "../config/razorpay.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { applyCouponUsage } from "./coupon.controller.js";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { cleanupTempInvoice } from "../utils/invoiceHelpers.js";

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
    await order.save();

    // Deduct stock
    for (const item of order.items || []) {
        try {
            const product = await Product.findById(item.product);
            if (product && product.colors && product.colors[item.colorIndex]) {
                product.colors[item.colorIndex].stock = Math.max(
                    0,
                    product.colors[item.colorIndex].stock - item.quantity
                );
                await product.save();
            }
        } catch (itemErr) {
            console.error("Error updating stock for item:", itemErr);
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
        } catch (err) {
            console.error("Invoice generation error for Razorpay order:", err);
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

        // Validate amount >= 100 paise
        const numericAmount = Math.round(Number(amount));
        if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
            return res.status(400).json({
                success: false,
                message: "Amount must be at least 100 paise (₹1).",
            });
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: numericAmount,
            currency: String(currency).toUpperCase(),
            receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            notes: {
                ...notes,
                ...(orderId ? { greenfibreOrderId: String(orderId) } : {}),
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        let targetOrderId = orderId || null;

        if (mongoose.connection.readyState === 1) {
            if (orderId) {
                try {
                    await Order.findByIdAndUpdate(orderId, {
                        razorpayOrderId: razorpayOrder.id,
                        paymentMethod: "Razorpay",
                    });
                } catch (e) {
                    console.error("Non-fatal Order update error:", e);
                }
            } else if (req.user && shippingAddress) {
                try {
                    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
                    if (cart && cart.items && cart.items.length > 0) {
                        const orderItems = cart.items.map((i) => ({
                            product: i.product?._id || i.product,
                            name: i.product?.name || "GreenFibre Item",
                            image: i.product?.images?.[0] || "",
                            colorIndex: i.colorIndex || 0,
                            colorName: i.colorName || "",
                            colorHex: i.colorHex || "",
                            quantity: i.quantity,
                            price: i.price,
                        }));

                        const finalAmount = numericAmount / 100;
                        const totalAmount = cart.totalAmount || finalAmount;
                        const discountAmount = Math.max(0, totalAmount - finalAmount);

                        const newOrder = await Order.create({
                            user: req.user._id,
                            items: orderItems,
                            shippingAddress,
                            totalAmount,
                            discountAmount,
                            finalAmount,
                            couponCode: couponCode ? String(couponCode).toUpperCase() : undefined,
                            razorpayOrderId: razorpayOrder.id,
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
                } catch (createErr) {
                    console.error("Non-fatal error creating Order record from cart:", createErr);
                }
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
