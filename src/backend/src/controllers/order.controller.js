import { getRazorpayInstance, getRazorpayKeyId, getRazorpayKeySecret } from "../config/razorpay.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { Coupon } from "../models/coupon.model.js";
import crypto from "crypto";
import fs from "fs";
import axios from "axios";
import { generateInvoicePdf } from "../utils/generateInvoicePdf.js";
import { sendMail } from "../utils/sendMail.js";
import { baseEmailTemplate } from "../utils/emailTemplate.js";
import { cleanupTempInvoice } from "../utils/invoiceHelpers.js";
import { applyCouponUsage } from "./coupon.controller.js";
import {
    createShiprocketOrder,
    generateAWB,
    requestPickup,
    cancelShiprocketOrder,
    autoFulfillOrder,
} from "../utils/shiprocket.js";

// Easebuzz configuration — read lazily so a server restart always picks up
// the current .env values without any code changes needed.
const getEasebuzzKey = () => process.env.EASEBUZZ_KEY;
const getEasebuzzSalt = () => process.env.EASEBUZZ_SALT;
const getEasebuzzEnv = () => process.env.EASEBUZZ_ENV || "test";
const getEasebuzzUrl = () =>
    getEasebuzzEnv() === "prod"
        ? "https://pay.easebuzz.in"
        : "https://testpay.easebuzz.in";


// Helper: Generate Easebuzz payment initiation hash
// Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
const generateEasebuzzHash = (data) => {
    const hashString = [
        getEasebuzzKey(),
        data.txnid,
        data.amount,
        data.productinfo,
        data.firstname,
        data.email,
        data.udf1 || "",
        data.udf2 || "",
        data.udf3 || "",
        data.udf4 || "",
        data.udf5 || "",
        data.udf6 || "",
        data.udf7 || "",
        data.udf8 || "",
        data.udf9 || "",
        data.udf10 || "",
        getEasebuzzSalt(),
    ].join("|");
    return crypto.createHash("sha512").update(hashString).digest("hex");
};



export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, couponCode } = req.body;

        // Validate shipping address
        if (
            !shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.phone
        ) {
            return res.status(400).json({
                message: "Complete shipping address required",
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate(
            "items.product"
        );

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Cart is empty",
            });
        }

        // Validate stock and prepare order items
        const orderItems = [];
        let totalAmount = 0;

        for (const cartItem of cart.items) {
            const product = cartItem.product;

            if (!product || !product.isActive) {
                return res.status(400).json({
                    message: `Product ${product?.name || "unknown"} is not available`,
                });
            }

            const color = product.colors[cartItem.colorIndex];

            if (!color) {
                return res.status(400).json({
                    message: `Selected color is not available for ${product.name}`,
                });
            }

            // Check stock
            if (color.stock < cartItem.quantity) {
                return res.status(400).json({
                    message: `Only ${color.stock} units available for ${product.name} in ${color.name}`,
                });
            }

            // Get first image
            const firstImage = color.images?.[0];
            const imageUrl =
                typeof firstImage === "string"
                    ? firstImage
                    : firstImage?.original || firstImage?.card || "";
            const itemPrice = typeof product.discountedPrice === "number"
                ? product.discountedPrice
                : (typeof product.originalPrice === "number" ? product.originalPrice : null);

            if (itemPrice === null || isNaN(itemPrice)) {
                return res.status(400).json({
                    message: `Invalid price configuration for product ${product.name}`,
                });
            }

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

            totalAmount += itemPrice * cartItem.quantity;
        }

        // Apply coupon if provided
        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
            });

            if (!coupon) {
                return res.status(400).json({
                    message: "Invalid coupon code",
                });
            }

            // Align with coupon.model.js field names
            const now = new Date();
            if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
                return res.status(400).json({
                    message: "Coupon has expired",
                });
            }

            if (
                coupon.usageLimit &&
                coupon.usageLimit !== 0 &&
                coupon.usedCount >= coupon.usageLimit
            ) {
                return res.status(400).json({
                    message: "Coupon usage limit reached",
                });
            }

            if (coupon.perUserLimit) {
                const userUsage = (coupon.usedBy || []).find(
                    (u) => u.user?.toString() === userId.toString()
                );
                if (userUsage && userUsage.count >= coupon.perUserLimit) {
                    return res.status(400).json({
                        message:
                            "You have already used this coupon maximum times",
                    });
                }
            }

            if (
                coupon.minOrderAmount &&
                totalAmount < coupon.minOrderAmount
            ) {
                return res.status(400).json({
                    message: `Minimum order value of ₹${coupon.minOrderAmount} required for this coupon`,
                });
            }

            // Calculate discount
            if (coupon.discountType === "percentage") {
                discountAmount = Math.round(
                    (totalAmount * coupon.discountValue) / 100
                );

                if (
                    coupon.maxDiscountAmount &&
                    discountAmount > coupon.maxDiscountAmount
                ) {
                    discountAmount = coupon.maxDiscountAmount;
                }
            } else if (coupon.discountType === "fixed") {
                discountAmount = Math.min(coupon.discountValue, totalAmount);
            }

            appliedCoupon = coupon;
        }

        const finalAmount = totalAmount - discountAmount;

        // Generate unique Easebuzz order ID
        const easebuzzOrderId = `ORD${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // Create order
        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress,
            totalAmount,
            discountAmount,
            finalAmount,
            couponCode: couponCode ? couponCode.toUpperCase() : undefined,
            easebuzzOrderId,
            paymentStatus: "pending",
            orderStatus: "pending",
            statusHistory: [
                {
                    status: "pending",
                    timestamp: new Date(),
                    note: "Order created, awaiting payment",
                },
            ],
        });

        const requestedGateway = String(req.body.paymentMethod || "Razorpay").toLowerCase();

        if (requestedGateway !== "easebuzz") {
            try {
                const razorpay = getRazorpayInstance();
                const amountInPaise = Math.max(100, Math.round(finalAmount * 100));
                const receipt = `rcpt_${order._id.toString().slice(-8)}_${Date.now().toString().slice(-4)}`;

                const razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt,
                    notes: {
                        orderId: order._id.toString(),
                        userId: userId.toString(),
                        customerName: shippingAddress.fullName || "",
                        phone: shippingAddress.phone || "",
                    },
                });

                order.razorpayOrderId = razorpayOrder.id;
                order.paymentMethod = "Razorpay";
                await order.save();

                return res.status(201).json({
                    success: true,
                    message: "Order created successfully",
                    order: {
                        _id: order._id,
                        totalAmount: order.totalAmount,
                        discountAmount: order.discountAmount,
                        finalAmount: order.finalAmount,
                        couponCode: order.couponCode,
                        shippingAddress: order.shippingAddress,
                        items: order.items,
                        paymentMethod: "Razorpay",
                        razorpayOrderId: razorpayOrder.id,
                        orderStatus: order.orderStatus,
                        paymentStatus: order.paymentStatus,
                    },
                    paymentMethod: "Razorpay",
                    razorpayOrderId: razorpayOrder.id,
                    order_id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    receipt: razorpayOrder.receipt,
                    key_id: getRazorpayKeyId(),
                });
            } catch (rzpErr) {
                console.error("Razorpay order creation error in createOrder:", rzpErr);
                await Order.findByIdAndDelete(order._id);
                return res.status(500).json({
                    success: false,
                    message: rzpErr?.error?.description || rzpErr?.message || "Failed to create payment order with Razorpay.",
                    error: rzpErr?.error || rzpErr?.message,
                });
            }
        }

        // ── Initiate Easebuzz payment (server-side fallback) ───────────────────
        // Step 1: build payment params + hash on the backend
        const user = await User.findById(userId);


        const backendUrl =
            process.env.BACKEND_URL || "http://localhost:5500";

        const cleanFirstName =
            (shippingAddress.fullName || "Customer")
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .trim() || "Customer";

        const cleanPhone =
            (shippingAddress.phone || "")
                .replace(/\D/g, "")
                .slice(-10) || "9999999999";

        const cleanEmail =
            (user?.email || "customer@greenfibre.com").trim();

        // Easebuzz requires productinfo to be letters/alphanumeric without underscores, hashes, or symbols
        const cleanProductInfo = "GreenFibre";

        const paymentParams = {
            key: getEasebuzzKey(),
            txnid: easebuzzOrderId,
            amount: finalAmount.toFixed(2),
            productinfo: cleanProductInfo,
            firstname: cleanFirstName,
            phone: cleanPhone,
            email: cleanEmail,
            surl: `${backendUrl}/api/order/verify`,
            furl: `${backendUrl}/api/order/verify`,
            udf1: order._id.toString(),
            udf2: userId.toString(),
            udf3: "", udf4: "", udf5: "",
            udf6: "", udf7: "", udf8: "", udf9: "", udf10: "",
        };

        paymentParams.hash = generateEasebuzzHash(paymentParams);

        // Step 2: call Easebuzz initiateLink API — returns access_key
        const initiateUrl = `${getEasebuzzUrl()}/payment/initiateLink`;
        console.log("Calling Easebuzz initiateLink:", initiateUrl);

        let accessKey;
        try {
            const ebRes = await axios.post(
                initiateUrl,
                new URLSearchParams(paymentParams).toString(),
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                    timeout: 10000,
                }
            );

            console.log("Easebuzz initiateLink response:", ebRes.data);

            if (!ebRes.data || ebRes.data.status !== 1) {
                console.error(
                    "Easebuzz initiateLink failed:",
                    ebRes.data
                );
                // Delete the pending order so the user can retry
                await Order.findByIdAndDelete(order._id);
                return res.status(502).json({
                    message:
                        ebRes.data?.error_desc ||
                        "Payment gateway error. Please try again.",
                    easebuzzError: ebRes.data,
                });
            }

            accessKey = ebRes.data.data; // the short token
        } catch (ebError) {
            console.error(
                "Easebuzz initiateLink request error:",
                ebError?.response?.data || ebError.message
            );
            await Order.findByIdAndDelete(order._id);
            return res.status(502).json({
                message:
                    "Could not connect to payment gateway. Please try again.",
            });
        }

        // Step 3: return access_key to frontend — it just redirects to this URL
        const paymentUrl = `${getEasebuzzUrl()}/pay/${accessKey}`;
        console.log("Payment URL:", paymentUrl);

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: {
                _id: order._id,
                easebuzzOrderId: order.easebuzzOrderId,
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                finalAmount: order.finalAmount,
                couponCode: order.couponCode,
            },
            paymentUrl, // Frontend redirects to this URL directly (GET)
        });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({
            message: "Error creating order",
        });
    }
};

// ─────────────────────────────────────────────────────────────
// VERIFY PAYMENT — GATEWAY CALLBACK  (POST /api/order/verify)
// Called by Easebuzz as surl / furl. Always browser-redirects.
// ─────────────────────────────────────────────────────────────
export const verifyPaymentGateway = async (req, res) => {
    const frontendBase =
        process.env.FRONTEND_URL ||
        process.env.CLIENT_ORIGIN ||
        "http://localhost:3000";
    const frontendSuccess = (orderId) =>
        `${frontendBase}/orders/success?order=${orderId}`;
    const frontendFailed = (orderId, reason) => {
        const base = `${frontendBase}/orders/failed`;
        const params = new URLSearchParams();
        if (orderId) params.set("order", orderId);
        if (reason) params.set("reason", reason);
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    };

    try {
        const { txnid, status, hash, ...paymentResponse } = req.body;

        if (!txnid || !hash) {
            return res.redirect(frontendFailed(null, "missing_params"));
        }

        // Verify Easebuzz response hash
        // Format: SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|KEY
        const reverseHashString = [
            getEasebuzzSalt(),
            status,
            paymentResponse.udf10 || "",
            paymentResponse.udf9 || "",
            paymentResponse.udf8 || "",
            paymentResponse.udf7 || "",
            paymentResponse.udf6 || "",
            paymentResponse.udf5 || "",
            paymentResponse.udf4 || "",
            paymentResponse.udf3 || "",
            paymentResponse.udf2 || "",
            paymentResponse.udf1 || "",
            paymentResponse.email || "",
            paymentResponse.firstname || "",
            paymentResponse.productinfo || "",
            paymentResponse.amount || "",
            txnid,
            getEasebuzzKey(),
        ].join("|");

        const reverseHash = crypto
            .createHash("sha512")
            .update(reverseHashString)
            .digest("hex");

        if (hash !== reverseHash) {
            console.error("Gateway: hash mismatch", { txnid });
            return res.redirect(
                frontendFailed(paymentResponse.udf1 || null, "hash_mismatch")
            );
        }

        const order = await Order.findOne({
            easebuzzOrderId: txnid,
        }).populate("user", "full_name email");

        if (!order) {
            console.error("Gateway: order not found", { txnid });
            return res.redirect(frontendFailed(null, "order_not_found"));
        }

        if (status === "success") {
            // Idempotent: already paid — just redirect
            if (order.paymentStatus === "paid") {
                return res.redirect(frontendSuccess(order._id));
            }

            // Amount integrity check
            const paidAmount = Number(paymentResponse.amount);
            if (
                Number.isFinite(paidAmount) &&
                Math.abs(paidAmount - Number(order.finalAmount)) > 0.05
            ) {
                console.error("Gateway: amount mismatch", {
                    paidAmount,
                    expected: order.finalAmount,
                    txnid,
                });
                return res.redirect(
                    frontendFailed(order._id, "amount_mismatch")
                );
            }

            // Atomic claim to prevent double-processing on replayed callbacks
            const claimed = await Order.findOneAndUpdate(
                { _id: order._id, paymentStatus: { $ne: "paid" } },
                {
                    $set: {
                        paymentStatus: "paid",
                        transactionId: paymentResponse.easepayid,
                        paymentResponse,
                        orderStatus: "processing",
                    },
                    $push: {
                        statusHistory: {
                            status: "processing",
                            timestamp: new Date(),
                            note: "Payment successful, order processing",
                        },
                    },
                },
                { new: true }
            );

            if (!claimed) {
                // Already processed by a concurrent callback
                return res.redirect(frontendSuccess(order._id));
            }

            order.paymentStatus = "paid";
            order.transactionId = paymentResponse.easepayid;
            order.paymentResponse = paymentResponse;
            order.orderStatus = "processing";

            // Atomic stock deduction
            for (const item of order.items) {
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
                        console.warn(`⚠️ Stock conflict on product ${item.product} (color ${item.colorIndex}) for order ${order._id}`);
                    }
                } catch (stockErr) {
                    console.error("Atomic stock decrement error:", stockErr);
                }
            }

            // Track coupon usage
            if (order.couponCode) {
                await applyCouponUsage(
                    order.couponCode,
                    order.user._id || order.user
                );
            }

            // Persist order updates (paid status, stock conflict flags, history) immediately
            await order.save();

            // Clear user's cart
            await Cart.findOneAndUpdate(
                { user: order.user._id || order.user },
                { items: [], totalAmount: 0 }
            );

            // Generate invoice & send email asynchronously
            setImmediate(async () => {
                try {
                    console.log("🧾 Generating invoice for order:", order._id);
                    const invoiceResult = await generateInvoicePdf(order);

                    if (invoiceResult.minioUrl) {
                        order.invoiceUrl = invoiceResult.minioUrl;
                        await order.save();
                        console.log(
                            "✅ Invoice URL saved:",
                            invoiceResult.minioUrl
                        );
                    }

                    await sendOrderConfirmationEmail(
                        order,
                        invoiceResult.localPath
                    );
                    cleanupTempInvoice(invoiceResult.localPath);

                    // 🚚 Automatically dispatch order via Shiprocket
                    await autoFulfillOrder(order);
                } catch (err) {
                    console.error("❌ Invoice/fulfillment error:", err);
                }
            });

            // Redirect browser to success page — order ID is all frontend needs
            return res.redirect(frontendSuccess(order._id));
        } else {
            // Payment failed / cancelled
            if (order.paymentStatus !== "paid") {
                order.paymentStatus = "failed";
                order.orderStatus = "failed";
                order.paymentResponse = paymentResponse;
                order.statusHistory.push({
                    status: "failed",
                    timestamp: new Date(),
                    note: `Payment ${status}`,
                });
                await order.save();
            }
            return res.redirect(frontendFailed(order._id, status));
        }
    } catch (error) {
        console.error("verifyPaymentGateway error:", error);
        return res.redirect(
            `${process.env.FRONTEND_URL ||
            process.env.CLIENT_ORIGIN ||
            "http://localhost:3000"
            }/orders/failed?reason=server_error`
        );
    }
};

// ─────────────────────────────────────────────────────────────
// VERIFY PAYMENT — AJAX  (POST /api/order/payment/verify)
// Called by the frontend AJAX client. Always returns JSON.
// ─────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
            txnid,
            status,
            hash,
            ...paymentResponse
        } = req.body;

        // Support Razorpay verification
        if (razorpay_order_id || razorpay_payment_id || razorpay_signature) {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    message: "Missing Razorpay verification parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
                });
            }

            const key_secret = getRazorpayKeySecret();
            if (!key_secret) {
                return res.status(500).json({
                    success: false,
                    message: "Server error: Razorpay key secret is not configured.",
                });
            }

            const expectedSignature = crypto
                .createHmac("sha256", key_secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            let isValid = false;
            try {
                isValid =
                    razorpay_signature.length === expectedSignature.length &&
                    crypto.timingSafeEqual(
                        Buffer.from(razorpay_signature, "utf-8"),
                        Buffer.from(expectedSignature, "utf-8")
                    );
            } catch {
                isValid = false;
            }

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Razorpay payment signature.",
                });
            }

            const targetOrder = await Order.findOne({
                $or: [
                    { razorpayOrderId: razorpay_order_id },
                    ...(orderId ? [{ _id: orderId }] : []),
                ],
            }).populate("user", "full_name email");

            if (!targetOrder) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found for Razorpay payment.",
                });
            }

            if (targetOrder.paymentStatus !== "paid") {
                targetOrder.paymentStatus = "paid";
                targetOrder.orderStatus = "processing";
                targetOrder.paymentMethod = "Razorpay";
                targetOrder.razorpayPaymentId = razorpay_payment_id;
                targetOrder.razorpaySignature = razorpay_signature;
                targetOrder.transactionId = razorpay_payment_id;
                targetOrder.paymentResponse = req.body;
                targetOrder.statusHistory.push({
                    status: "processing",
                    timestamp: new Date(),
                    note: `Payment verified successfully via Razorpay (Payment ID: ${razorpay_payment_id})`,
                });
                await targetOrder.save();

                // Atomic stock deduction
                for (const item of targetOrder.items || []) {
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
                            targetOrder.hasStockConflict = true;
                            if (!targetOrder.stockConflictNotes) targetOrder.stockConflictNotes = [];
                            const conflictNote = `⚠️ STOCK CONFLICT: Item "${item.name || item.product}" (Color Index: ${item.colorIndex}) ran out of stock before payment confirmation. Flagged for ops review.`;
                            targetOrder.stockConflictNotes.push(conflictNote);
                            targetOrder.statusHistory.push({
                                status: targetOrder.orderStatus,
                                timestamp: new Date(),
                                note: conflictNote,
                            });
                            await targetOrder.save();
                            console.warn(`⚠️ Stock conflict on product ${item.product} (color ${item.colorIndex}) for order ${targetOrder._id}`);
                        }
                    } catch (itemErr) {
                        console.error("Error updating stock:", itemErr);
                    }
                }

                // Apply coupon
                if (targetOrder.couponCode) {
                    try {
                        await applyCouponUsage(targetOrder.couponCode, targetOrder.user?._id || targetOrder.user);
                    } catch (couponErr) {
                        console.error("Error applying coupon usage:", couponErr);
                    }
                }

                // Clear cart
                if (targetOrder.user) {
                    try {
                        await Cart.findOneAndUpdate(
                            { user: targetOrder.user?._id || targetOrder.user },
                            { items: [], totalAmount: 0 }
                        );
                    } catch (cartErr) {
                        console.error("Error clearing cart:", cartErr);
                    }
                }

                // Generate invoice asynchronously
                setImmediate(async () => {
                    try {
                        const invoiceResult = await generateInvoicePdf(targetOrder);
                        if (invoiceResult?.minioUrl) {
                            targetOrder.invoiceUrl = invoiceResult.minioUrl;
                            await targetOrder.save();
                        }
                        if (invoiceResult?.localPath) {
                            cleanupTempInvoice(invoiceResult.localPath);
                        }

                        // 🚚 Automatically dispatch order via Shiprocket
                        await autoFulfillOrder(targetOrder);
                    } catch (err) {
                        console.error("Invoice/fulfillment error for order:", err);
                    }
                });
            }

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id,
                orderId: targetOrder._id,
                order: targetOrder,
            });
        }

        if (!txnid || !hash) {
            return res
                .status(400)
                .json({ success: false, message: "Missing payment params" });
        }

        const reverseHashString = [
            getEasebuzzSalt(),
            status,
            paymentResponse.udf10 || "",
            paymentResponse.udf9 || "",
            paymentResponse.udf8 || "",
            paymentResponse.udf7 || "",
            paymentResponse.udf6 || "",
            paymentResponse.udf5 || "",
            paymentResponse.udf4 || "",
            paymentResponse.udf3 || "",
            paymentResponse.udf2 || "",
            paymentResponse.udf1 || "",
            paymentResponse.email || "",
            paymentResponse.firstname || "",
            paymentResponse.productinfo || "",
            paymentResponse.amount || "",
            txnid,
            getEasebuzzKey(),
        ].join("|");

        const reverseHash = crypto
            .createHash("sha512")
            .update(reverseHashString)
            .digest("hex");

        if (hash !== reverseHash) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid payment response" });
        }

        const order = await Order.findOne({
            easebuzzOrderId: txnid,
        }).populate("user", "full_name email");

        if (!order) {
            return res
                .status(404)
                .json({ success: false, message: "Order not found" });
        }

        if (status === "success") {
            if (order.paymentStatus === "paid") {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified",
                    orderId: order._id,
                });
            }

            const paidAmount = Number(paymentResponse.amount);
            if (
                Number.isFinite(paidAmount) &&
                Math.abs(paidAmount - Number(order.finalAmount)) > 0.05
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Payment amount mismatch",
                });
            }

            const claimed = await Order.findOneAndUpdate(
                { _id: order._id, paymentStatus: { $ne: "paid" } },
                {
                    $set: {
                        paymentStatus: "paid",
                        transactionId: paymentResponse.easepayid,
                        paymentResponse,
                        orderStatus: "processing",
                    },
                    $push: {
                        statusHistory: {
                            status: "processing",
                            timestamp: new Date(),
                            note: "Payment successful (AJAX verify)",
                        },
                    },
                },
                { new: true }
            );

            if (!claimed) {
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified",
                    orderId: order._id,
                });
            }

            order.paymentStatus = "paid";
            order.transactionId = paymentResponse.easepayid;
            order.paymentResponse = paymentResponse;
            order.orderStatus = "processing";

            // Atomic stock deduction
            for (const item of order.items) {
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
                        console.warn(`⚠️ Stock conflict on product ${item.product} (color ${item.colorIndex}) for order ${order._id}`);
                    }
                } catch (stockErr) {
                    console.error("Atomic stock decrement error:", stockErr);
                }
            }

            if (order.couponCode) {
                await applyCouponUsage(
                    order.couponCode,
                    order.user._id || order.user
                );
            }

            // Persist order updates (paid status, stock conflict flags, history) immediately
            await order.save();

            await Cart.findOneAndUpdate(
                { user: order.user._id || order.user },
                { items: [], totalAmount: 0 }
            );

            setImmediate(async () => {
                try {
                    const invoiceResult = await generateInvoicePdf(order);
                    if (invoiceResult.minioUrl) {
                        order.invoiceUrl = invoiceResult.minioUrl;
                        await order.save();
                    }
                    await sendOrderConfirmationEmail(
                        order,
                        invoiceResult.localPath
                    );
                    cleanupTempInvoice(invoiceResult.localPath);

                    // 🚚 Automatically dispatch order via Shiprocket
                    await autoFulfillOrder(order);
                } catch (err) {
                    console.error("❌ Invoice/fulfillment error (AJAX):", err);
                }
            });

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                orderId: order._id,
            });
        } else {
            if (order.paymentStatus === "paid") {
                return res.status(200).json({
                    success: true,
                    message: "Order already paid",
                    orderId: order._id,
                });
            }

            order.paymentStatus = "failed";
            order.orderStatus = "failed";
            order.paymentResponse = paymentResponse;
            order.statusHistory.push({
                status: "failed",
                timestamp: new Date(),
                note: "Payment failed (AJAX)",
            });
            await order.save();

            return res.status(400).json({
                success: false,
                message: "Payment failed",
                orderId: order._id,
            });
        }
    } catch (error) {
        console.error("verifyPayment (AJAX) error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Error verifying payment" });
    }
};


async function sendOrderConfirmationEmail(order, invoiceAttachment = null) {
    try {
        const userEmail = order.user.email;
        const userName = order.user.full_name || "Customer";

        const emailBody = `
            <p style="margin-bottom:20px;">Dear ${userName},</p>
            <p style="margin-bottom:20px;">
                Thank you for your order! Your payment has been received successfully 
                and your order is now being processed.
            </p>

            <div style="
                margin:25px 0;
                padding:20px;
                background:#f0fdf4;
                border-radius:12px;
                border-left:4px solid #16a34a;
            ">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:13px;">Order Number:</td>
                        <td style="padding:8px 0; text-align:right; font-weight:600; color:#15803d;">
                            ${order.easebuzzOrderId}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:13px;">Order Date:</td>
                        <td style="padding:8px 0; text-align:right; font-weight:600; color:#374151;">
                            ${new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:13px;">Total Items:</td>
                        <td style="padding:8px 0; text-align:right; font-weight:600; color:#374151;">
                            ${order.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:13px;">Order Total:</td>
                        <td style="padding:8px 0; text-align:right; font-weight:700; color:#15803d; font-size:18px;">
                            ₹${order.finalAmount.toLocaleString("en-IN")}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#6b7280; font-size:13px;">Payment Status:</td>
                        <td style="padding:8px 0; text-align:right;">
                            <span style="
                                background:#dcfce7;
                                color:#15803d;
                                padding:4px 12px;
                                border-radius:20px;
                                font-size:12px;
                                font-weight:600;
                            ">✓ PAID</span>
                        </td>
                    </tr>
                </table>
            </div>

            <h3 style="
                margin:30px 0 15px;
                font-size:18px;
                color:#15803d;
                font-family:'Cormorant Garamond', Georgia, serif;
            ">
                Order Items
            </h3>

            ${order.items
                .map(
                    (item) => `
                <div style="
                    margin:12px 0;
                    padding:12px;
                    background:#fafdfb;
                    border-radius:8px;
                    border:1px solid #d1fae5;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div style="flex:1;">
                            <div style="font-weight:600; color:#374151; margin-bottom:4px;">
                                ${item.name}
                            </div>
                            <div style="font-size:13px; color:#6b7280;">
                                ${item.colorName ? `Color: <strong>${item.colorName}</strong> • ` : ""}Qty: ${item.quantity} × ₹${item.price.toLocaleString("en-IN")}
                            </div>
                        </div>
                        <div style="font-weight:600; color:#15803d; white-space:nowrap; margin-left:15px;">
                            ₹${(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                    </div>
                </div>
            `
                )
                .join("")}

            <h3 style="
                margin:30px 0 15px;
                font-size:18px;
                color:#15803d;
                font-family:'Cormorant Garamond', Georgia, serif;
            ">
                Shipping Address
            </h3>

            <div style="
                padding:15px;
                background:#f0fdf4;
                border-radius:8px;
                border:1px solid #d1fae5;
                font-size:14px;
                color:#374151;
                line-height:1.6;
            ">
                <strong style="color:#15803d;">${order.shippingAddress.fullName}</strong><br/>
                ${order.shippingAddress.streetAddress}<br/>
                ${order.shippingAddress.landmark ? `${order.shippingAddress.landmark}<br/>` : ""}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
                <strong>Phone:</strong> ${order.shippingAddress.phone}
            </div>

            <div style="
                margin:30px 0;
                padding:20px;
                background:linear-gradient(135deg, #dcfce7, #d1fae5);
                border-radius:12px;
                border:2px solid #16a34a;
                text-align:center;
            ">
                <div style="font-size:15px; color:#15803d; margin-bottom:12px; font-weight:700;">
                    📦 What's Next?
                </div>
                <ul style="
                    list-style:none;
                    padding:0;
                    margin:10px 0 0;
                    text-align:left;
                    display:inline-block;
                    max-width:400px;
                ">
                    <li style="padding:6px 0; color:#374151; font-size:14px;">
                        ✓ Your order is being processed
                    </li>
                    <li style="padding:6px 0; color:#374151; font-size:14px;">
                        ✓ You'll receive tracking details once shipped
                    </li>
                    <li style="padding:6px 0; color:#374151; font-size:14px;">
                        ✓ Estimated delivery: 5-7 business days
                    </li>
                </ul>
            </div>

            <p style="margin-top:25px; font-size:14px; color:#6b7280;">
                📎 Your invoice is attached to this email for your records.
            </p>

            <p style="margin-top:20px; font-size:14px; color:#374151;">
                If you have any questions about your order, feel free to reply to this email.
            </p>
        `;

        const emailHtml = baseEmailTemplate({
            title: "Order Confirmed! 🎉",
            subtitle: "Thank you for choosing Green Fibre",
            body: emailBody,
            footerNote: `
                <div style="
                    margin-top:25px;
                    padding-top:20px;
                    border-top:1px solid #d1fae5;
                    font-size:13px;
                    color:#6b7280;
                ">
                    Need help? Contact us at 
                    <a href="mailto:${process.env.COMPANY_EMAIL || "support@greenfibre.com"}" 
                       style="color:#16a34a; text-decoration:none; font-weight:600;">
                        ${process.env.COMPANY_EMAIL || "support@greenfibre.com"}
                    </a>
                </div>
            `,
        });

        // Prepare attachments
        const attachments = [];
        if (invoiceAttachment && fs.existsSync(invoiceAttachment)) {
            attachments.push({
                filename: `Invoice-${order.easebuzzOrderId}.pdf`,
                path: invoiceAttachment,
            });
        }

        // Send email
        await sendMail(
            userEmail,
            `Order Confirmation - ${order.easebuzzOrderId} | Green Fibre`,
            emailHtml,
            attachments
        );

        console.log("✅ Order confirmation email sent to:", userEmail);
        return true;
    } catch (error) {
        console.error("❌ Error sending order confirmation email:", error);
        throw error;
    }
}


// =============================
// GET MY ORDERS
// =============================
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const filter = { user: userId };
        if (status) filter.orderStatus = status;

        const skip = (Number(page) - 1) * Number(limit);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Order.countDocuments(filter);

        // Transform images
        const ordersWithImages = orders.map((order) => ({
            ...order,
            items: order.items.map((item) => ({
                ...item,
                image: item.image || null,
            })),
        }));

        return res.status(200).json({
            success: true,
            orders: ordersWithImages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error("Get my orders error:", error);
        return res.status(500).json({
            message: "Error fetching orders",
        });
    }
};


export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const filter = {};
        if (status && status !== "All") filter.orderStatus = status;

        if (search && search.trim()) {
            const q = search.trim();
            const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

            // Look up matching users first to search by customer name/email
            const matchingUsers = await User.find({
                $or: [{ full_name: searchRegex }, { email: searchRegex }],
            }).select("_id");
            const userIds = matchingUsers.map((u) => u._id);

            filter.$or = [
                { easebuzzOrderId: searchRegex },
                { razorpayOrderId: searchRegex },
                { "shippingAddress.fullName": searchRegex },
                { "shippingAddress.phone": searchRegex },
                { "shippingAddress.email": searchRegex },
                { "shippingDetails.trackingNumber": searchRegex },
                { "shippingDetails.shiprocketOrderId": searchRegex },
                { user: { $in: userIds } },
                ...(q.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: q }] : []),
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .populate("user", "full_name email profile_image")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Transform images
        const ordersWithImages = orders.map((order) => ({
            ...order,
            user: order.user
                ? {
                    ...order.user,
                    profile_image: order.user.profile_image || null,
                }
                : null,
            items: (order.items || []).map((item) => ({
                ...item,
                image: item.image || null,
            })),
        }));

        return res.status(200).json({
            success: true,
            orders: ordersWithImages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)) || 1,
            },
        });
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({
            message: "Error fetching orders",
        });
    }
};


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note, trackingNumber, courierName } = req.body;

        const validStatuses = [
            "placed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "failed",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        if (!order.shippingDetails) {
            order.shippingDetails = {};
        }

        // Update status
        order.orderStatus = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            note: note || `Order status updated to ${status}`,
        });

        // Handle specific status updates
        if (status === "shipped") {
            // ── Step 1: If admin manually provided tracking info, save it now ──
            if (trackingNumber && courierName) {
                order.shippingDetails.trackingNumber = trackingNumber;
                order.shippingDetails.courierName = courierName;
                order.shippingDetails.shippedAt = new Date();
            } else if (process.env.SHIPROCKET_ENABLED === "true") {
                const isTestMode = process.env.SHIPROCKET_TEST_MODE === "true";

                try {
                    let srOrderId = order.shippingDetails?.shiprocketOrderId;
                    let srShipmentId = order.shippingDetails?.shiprocketShipmentId;

                    // If Shiprocket order was not reserved in Stage 1, create it now
                    if (!srOrderId || !srShipmentId) {
                        console.log(`🚚 Creating missing Shiprocket order for order ${order._id} (Test Mode: ${isTestMode})...`);
                        const srResponse = await createShiprocketOrder(order);
                        srOrderId = srResponse.order_id || srResponse.sr_order_id;
                        srShipmentId = srResponse.shipment_id;

                        if (srOrderId) order.shippingDetails.shiprocketOrderId = String(srOrderId);
                        if (srShipmentId) order.shippingDetails.shiprocketShipmentId = String(srShipmentId);
                    }

                    // If AWB is not yet assigned, generate AWB and request pickup (Stage 2)
                    if (srShipmentId && !order.shippingDetails.trackingNumber) {
                        if (isTestMode) {
                            console.log(`🧪 [SHIPROCKET_TEST_MODE=true] Shiprocket order ${srOrderId} checked. AWB & Pickup skipped.`);
                            order.statusHistory.push({
                                status: "shipped",
                                timestamp: new Date(),
                                note: `[Test Mode] Shiprocket order ${srOrderId} created/checked. AWB & Pickup skipped.`,
                            });
                        } else {
                            try {
                                const awbData = await generateAWB(srShipmentId);
                                const awb = awbData.awb_code;
                                const courierNameSr = awbData.courier_name || awbData.assigned_courier || "";

                                if (awb) {
                                    order.shippingDetails.trackingNumber = awb;
                                    order.shippingDetails.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
                                }
                                if (courierNameSr && !order.shippingDetails.courierName) {
                                    order.shippingDetails.courierName = courierNameSr;
                                }
                                console.log(`✅ AWB assigned: ${awb} via ${courierNameSr}`);

                                // Request courier pickup
                                try {
                                    await requestPickup(srShipmentId);
                                    console.log(`✅ Pickup requested for shipment ${srShipmentId}`);
                                } catch (pickupErr) {
                                    const pickupErrMsg = pickupErr?.response?.data?.message || pickupErr.message;
                                    console.warn(`⚠️ Shiprocket pickup request pending:`, pickupErrMsg);
                                    order.statusHistory.push({
                                        status: "shipped",
                                        timestamp: new Date(),
                                        note: `Shiprocket pickup request pending: ${pickupErrMsg}`,
                                    });
                                }
                            } catch (awbErr) {
                                const awbErrMsg = awbErr?.response?.data?.message || awbErr.message;
                                console.error(`🚨 Shiprocket AWB generation failed for order ${order._id}:`, awbErrMsg);
                                order.statusHistory.push({
                                    status: "shipped",
                                    timestamp: new Date(),
                                    note: `Shiprocket AWB generation failed: ${awbErrMsg}`,
                                });
                            }
                        }
                    }

                    if (!order.shippingDetails.shippedAt) {
                        order.shippingDetails.shippedAt = new Date();
                    }
                } catch (srError) {
                    console.error("Shiprocket shipment processing error:", srError?.response?.data || srError.message);
                    order.statusHistory.push({
                        status: "shipped",
                        timestamp: new Date(),
                        note: `Shiprocket processing error: ${srError?.response?.data?.message || srError.message}`,
                    });
                }
            } else {
                console.log("🚧 [DEV] SHIPROCKET_ENABLED=false — Order marked as shipped locally.");
                if (!order.shippingDetails.shippedAt) {
                    order.shippingDetails.shippedAt = new Date();
                }
            }
        }

        if (status === "delivered") {
            order.shippingDetails.deliveredAt = new Date();
        }

        if (status === "cancelled") {
            order.cancelledAt = new Date();
            order.cancellationReason = note;

            // Atomic restore stock
            for (const item of order.items || []) {
                try {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { [`colors.${item.colorIndex}.stock`]: item.quantity },
                    });
                } catch (restoreErr) {
                    console.error("Error restoring stock on cancellation:", restoreErr);
                }
            }

            // Decrement coupon usage count if it was a paid order
            if (order.couponCode && order.paymentStatus === "paid") {
                await Coupon.findOneAndUpdate(
                    { code: order.couponCode },
                    { $inc: { usedCount: -1 } }
                );
            }

            // Best-effort: cancel the Shiprocket order if one was created
            if (process.env.SHIPROCKET_ENABLED === "true" && order.shippingDetails?.shiprocketOrderId) {
                try {
                    await cancelShiprocketOrder([order.shippingDetails.shiprocketOrderId]);
                    console.log(`✅ Shiprocket order ${order.shippingDetails.shiprocketOrderId} cancelled.`);
                } catch (srCancelErr) {
                    console.error(
                        "Shiprocket order cancellation error (non-fatal):",
                        srCancelErr?.response?.data || srCancelErr.message
                    );
                }
            }
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({
            message: "Error updating order status",
        });
    }
};

// =============================
// GET SINGLE ORDER
// =============================
export const getSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === "admin";

        const order = await Order.findById(orderId)
            .populate("user", "full_name email profile_image")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // Check authorization
        if (!isAdmin && order.user._id.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Not authorized to view this order",
            });
        }

        // Transform images
        const orderWithImages = {
            ...order,
            user: order.user
                ? {
                    ...order.user,
                    profile_image: order.user.profile_image || null,
                }
                : null,
            items: order.items.map((item) => ({
                ...item,
                image: item.image || null,
            })),
        };

        return res.status(200).json({
            success: true,
            order: orderWithImages,
        });
    } catch (error) {
        console.error("Get single order error:", error);
        return res.status(500).json({
            message: "Error fetching order",
        });
    }
};

// =============================
// ADMIN: RELEASE SHIPMENT (STAGE 2)
// POST /api/order/admin/:orderId/release-shipment
// =============================
export const releaseShipment = async (req, res) => {
    let order = null;
    try {
        const { orderId } = req.params;
        order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (!order.shippingDetails) {
            order.shippingDetails = {};
        }

        // Already released / AWB assigned
        if (order.shippingDetails.trackingNumber) {
            return res.status(400).json({
                success: false,
                message: `Shipment is already released (AWB: ${order.shippingDetails.trackingNumber})`,
                order,
            });
        }

        if (process.env.SHIPROCKET_ENABLED !== "true") {
            order.orderStatus = "shipped";
            order.shippingDetails.shippedAt = new Date();
            order.statusHistory.push({
                status: "shipped",
                timestamp: new Date(),
                note: "Shipment released locally (SHIPROCKET_ENABLED=false)",
            });
            await order.save();
            return res.status(200).json({
                success: true,
                message: "Shipment released locally (Shiprocket disabled)",
                order,
            });
        }

        let srOrderId = order.shippingDetails.shiprocketOrderId;
        let srShipmentId = order.shippingDetails.shiprocketShipmentId;

        // Stage 1 Fallback: Create Shiprocket order if not already reserved
        if (!srOrderId || !srShipmentId) {
            console.log(`🚚 [STAGE 2 RELEASE] Creating missing Shiprocket order for ${order._id}...`);
            const srResponse = await createShiprocketOrder(order);
            srOrderId = srResponse.order_id || srResponse.sr_order_id;
            srShipmentId = srResponse.shipment_id;

            if (srOrderId) order.shippingDetails.shiprocketOrderId = String(srOrderId);
            if (srShipmentId) order.shippingDetails.shiprocketShipmentId = String(srShipmentId);
        }

        if (!srShipmentId) {
            return res.status(500).json({
                success: false,
                message: "Failed to obtain Shiprocket shipment ID for courier release.",
                order,
            });
        }

        console.log(`📦 [STAGE 2 RELEASE] Assigning AWB for shipment ${srShipmentId}...`);
        try {
            const awbData = await generateAWB(srShipmentId);
            const awb = awbData.awb_code;
            const courierNameSr = awbData.courier_name || awbData.assigned_courier || "";

            if (awb) {
                order.shippingDetails.trackingNumber = awb;
                order.shippingDetails.trackingUrl = `https://shiprocket.co/tracking/${awb}`;
            }
            if (courierNameSr) {
                order.shippingDetails.courierName = courierNameSr;
            }

            order.shippingDetails.shippedAt = new Date();
            order.orderStatus = "shipped";
            order.statusHistory.push({
                status: "shipped",
                timestamp: new Date(),
                note: `[Stage 2: Manual Release] AWB ${awb || "assigned"} via ${courierNameSr || "Shiprocket"}. Pickup requested.`,
            });

            // Schedule pickup
            try {
                await requestPickup(srShipmentId);
                console.log(`✅ [STAGE 2 RELEASE] Pickup scheduled for shipment ${srShipmentId}`);
            } catch (pickupErr) {
                const pickupErrMsg = pickupErr?.response?.data?.message || pickupErr.message;
                console.warn(`⚠️ [STAGE 2 RELEASE] Pickup request pending:`, pickupErrMsg);
                order.statusHistory.push({
                    status: "shipped",
                    timestamp: new Date(),
                    note: `Shiprocket pickup request pending: ${pickupErrMsg}`,
                });
            }

            await order.save();

            return res.status(200).json({
                success: true,
                message: `Shipment released successfully! AWB: ${awb || "Generated"}`,
                order,
            });
        } catch (awbErr) {
            const awbErrMsg = awbErr?.response?.data?.message || awbErr.message;
            console.error(`🚨 [STAGE 2 RELEASE] AWB generation failed for order ${order._id}:`, awbErrMsg);

            order.statusHistory.push({
                status: order.orderStatus || "processing",
                timestamp: new Date(),
                note: `Shipment release failed: ${awbErrMsg}`,
            });
            await order.save();

            return res.status(500).json({
                success: false,
                message: `AWB generation failed: ${awbErrMsg}`,
                error: awbErrMsg,
                order,
            });
        }
    } catch (error) {
        console.error("Release shipment error:", error);
        return res.status(500).json({
            success: false,
            message: "Error releasing shipment",
            error: error.message,
            order: order || undefined,
        });
    }
};
