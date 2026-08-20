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

// Easebuzz configuration
const EASEBUZZ_KEY = process.env.EASEBUZZ_KEY;
const EASEBUZZ_SALT = process.env.EASEBUZZ_SALT;
const EASEBUZZ_ENV = process.env.EASEBUZZ_ENV || "test"; // 'test' or 'prod'
const EASEBUZZ_URL =
    EASEBUZZ_ENV === "prod"
        ? "https://pay.easebuzz.in"
        : "https://testpay.easebuzz.in";

// NimbusPost configuration
const NIMBUSPOST_EMAIL = process.env.NIMBUSPOST_EMAIL;
const NIMBUSPOST_PASSWORD = process.env.NIMBUSPOST_PASSWORD;
const NIMBUSPOST_URL = "https://api.nimbuspost.com/v1";

// Helper: Generate Easebuzz hash
const generateEasebuzzHash = (data) => {
    const hashString = `${EASEBUZZ_KEY}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|||||||||||${EASEBUZZ_SALT}`;
    return crypto.createHash("sha512").update(hashString).digest("hex");
};

// Helper: Get NimbusPost token
let nimbuspostToken = null;
let tokenExpiry = null;

const getNimbusPostToken = async () => {
    // Return cached token if still valid
    if (nimbuspostToken && tokenExpiry && Date.now() < tokenExpiry) {
        return nimbuspostToken;
    }

    try {
        const response = await axios.post(`${NIMBUSPOST_URL}/users/login`, {
            email: NIMBUSPOST_EMAIL,
            password: NIMBUSPOST_PASSWORD,
        });

        nimbuspostToken = response.data.data;
        // Token typically valid for 24 hours, cache for 23 hours
        tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

        return nimbuspostToken;
    } catch (error) {
        console.error("NimbusPost login error:", error);
        throw new Error("Failed to authenticate with NimbusPost");
    }
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

            orderItems.push({
                product: product._id,
                name: product.name,
                image: imageUrl,
                colorIndex: cartItem.colorIndex,
                colorName: color.name,
                colorHex: color.hex,
                quantity: cartItem.quantity,
                price: cartItem.price,
            });

            totalAmount += cartItem.price * cartItem.quantity;
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

        // Prepare Easebuzz payment data
        const user = await User.findById(userId);

        const paymentData = {
            key: EASEBUZZ_KEY,
            txnid: easebuzzOrderId,
            amount: finalAmount.toFixed(2),
            productinfo: `Order #${easebuzzOrderId}`,
            firstname: shippingAddress.fullName,
            phone: shippingAddress.phone,
            email: user.email,
            // Point Easebuzz return URLs to the backend verify endpoint so
            // the gateway posts results server-side. FRONTEND redirect will
            // be handled after verification (backend may redirect browser).
            surl: `${process.env.BACKEND_URL || "http://localhost:5500"}/api/order/verify`,
            furl: `${process.env.BACKEND_URL || "http://localhost:5500"}/api/order/verify`,
            udf1: order._id.toString(),
            udf2: userId.toString(),
        };

        paymentData.hash = generateEasebuzzHash(paymentData);

        // Return order and payment data
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
            paymentData, // Frontend will use this to initiate Easebuzz payment
            easebuzzUrl: `${EASEBUZZ_URL}/pay/${EASEBUZZ_KEY}`,
        });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({
            message: "Error creating order",
        });
    }
};

export const verifyPayment = async (req, res) => {
    // Support both API (AJAX) clients and gateway/browser POST redirects.
    const frontendBase = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000";
    const frontendSuccess = (orderId) => `${frontendBase}/orders/success?order=${orderId}`;
    const frontendFailed = (orderId, reason) =>
        `${frontendBase}/orders/failed${orderId ? `?order=${orderId}` : ""}${reason ? `${orderId ? "&" : "?"}reason=${reason}` : ""}`;

    const wantsHtml = (req.headers.accept || "").includes("text/html");

    try {
        const { txnid, status, hash, ...paymentResponse } = req.body;

        // Verify Easebuzz hash
        const reverseHashString = `${EASEBUZZ_SALT}|${status}|||||||||||${paymentResponse.udf2}|${paymentResponse.udf1}|${paymentResponse.email}|${paymentResponse.firstname}|${paymentResponse.productinfo}|${paymentResponse.amount}|${txnid}|${EASEBUZZ_KEY}`;
        const reverseHash = crypto
            .createHash("sha512")
            .update(reverseHashString)
            .digest("hex");

        if (hash !== reverseHash) {
            console.error("Hash mismatch - potential tampering");
            if (wantsHtml) return res.redirect(frontendFailed(paymentResponse.udf1, "hash_mismatch"));
            return res.status(400).json({ success: false, message: "Invalid payment response" });
        }

        // Find order
        const order = await Order.findOne({ easebuzzOrderId: txnid }).populate(
            "user",
            "full_name email"
        );

        if (!order) {
            if (wantsHtml) return res.redirect(frontendFailed(null, "order_not_found"));
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Idempotent: never re-apply stock/coupon on replayed success callbacks
        if (status === "success") {
            if (order.paymentStatus === "paid") {
                if (wantsHtml) return res.redirect(frontendSuccess(order._id));
                return res.status(200).json({ success: true, message: "Payment already verified", orderId: order._id });
            }

            const paidAmount = Number(paymentResponse.amount);
            if (
                Number.isFinite(paidAmount) &&
                Math.abs(paidAmount - Number(order.finalAmount)) > 0.05
            ) {
                console.error("Payment amount mismatch", {
                    paidAmount,
                    expected: order.finalAmount,
                    txnid,
                });
                return res.status(400).json({
                    success: false,
                    message: "Payment amount mismatch",
                });
            }

            // Atomic claim so concurrent verifies cannot double-apply stock/coupon
            const claimed = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    paymentStatus: { $ne: "paid" },
                },
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
                if (wantsHtml) return res.redirect(frontendSuccess(order._id));
                return res.status(200).json({ success: true, message: "Payment already verified", orderId: order._id });
            }

            order.paymentStatus = "paid";
            order.transactionId = paymentResponse.easepayid;
            order.paymentResponse = paymentResponse;
            order.orderStatus = "processing";

            // Reduce stock
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product && product.colors[item.colorIndex]) {
                    product.colors[item.colorIndex].stock -= item.quantity;
                    await product.save();
                }
            }

            // Track coupon usage (usedCount + usedBy)
            if (order.couponCode) {
                await applyCouponUsage(
                    order.couponCode,
                    order.user._id || order.user
                );
            }

            // Clear user's cart
            await Cart.findOneAndUpdate(
                { user: order.user._id || order.user },
                { items: [], totalAmount: 0 }
            );

            // ══════════════════════════════════════════════════════
            // GENERATE INVOICE & SEND EMAIL (Async - don't block)
            // ══════════════════════════════════════════════════════
            setImmediate(async () => {
                try {
                    console.log("🧾 Generating invoice for order:", order._id);

                    // Generate invoice - returns { localPath, minioUrl }
                    const invoiceResult = await generateInvoicePdf(order);

                    // Save MinIO URL to database
                    if (invoiceResult.minioUrl) {
                        order.invoiceUrl = invoiceResult.minioUrl;
                        await order.save();
                        console.log(
                            "✅ Invoice URL saved:",
                            invoiceResult.minioUrl
                        );
                    }

                    // Send order confirmation email with local file attachment
                    await sendOrderConfirmationEmail(
                        order,
                        invoiceResult.localPath
                    );

                    // Clean up local file after email is sent
                    cleanupTempInvoice(invoiceResult.localPath);
                } catch (error) {
                    console.error("❌ Error in invoice/email process:", error);
                    // Don't fail the payment - invoice can be regenerated later
                }
            });

            // Respond immediately (don't wait for invoice/email)
            if (wantsHtml) return res.redirect(frontendSuccess(order._id));
            return res.status(200).json({ success: true, message: "Payment verified successfully", orderId: order._id });
        } else {
            // Payment failed
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
                note: "Payment failed",
            });
            await order.save();

            if (wantsHtml) return res.redirect(frontendFailed(order._id));
            return res.status(400).json({ success: false, message: "Payment failed", orderId: order._id });
        }
    } catch (error) {
        console.error("Verify payment error:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying payment",
        });
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

// =============================
// GET ALL ORDERS (Admin)
// =============================
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const filter = {};
        if (status) filter.orderStatus = status;

        const skip = (Number(page) - 1) * Number(limit);

        let orders = await Order.find(filter)
            .populate("user", "full_name email profile_image")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Search filter (after population)
        if (search) {
            const q = search.toLowerCase();
            orders = orders.filter(
                (o) =>
                    o.user?.full_name?.toLowerCase().includes(q) ||
                    o.user?.email?.toLowerCase().includes(q) ||
                    o.easebuzzOrderId?.toLowerCase().includes(q)
            );
        }

        const total = await Order.countDocuments(filter);

        // Transform images
        const ordersWithImages = orders.map((order) => ({
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
        console.error("Get all orders error:", error);
        return res.status(500).json({
            message: "Error fetching orders",
        });
    }
};

// =============================
// UPDATE ORDER STATUS (Admin)
// =============================
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

        // Update status
        order.orderStatus = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            note: note || `Order status updated to ${status}`,
        });

        // Handle specific status updates
        if (status === "shipped") {
            if (trackingNumber && courierName) {
                order.shippingDetails.trackingNumber = trackingNumber;
                order.shippingDetails.courierName = courierName;
                order.shippingDetails.shippedAt = new Date();
            }

            // Optional: Create NimbusPost shipment
            try {
                const token = await getNimbusPostToken();

                const shipmentData = {
                    order_number: order.easebuzzOrderId,
                    shipping_charges: 0,
                    discount: order.discountAmount,
                    cod_charges: 0,
                    payment_type:
                        order.paymentStatus === "paid" ? "prepaid" : "cod",
                    order_amount: order.finalAmount,
                    package_weight: 500, // grams - calculate based on products
                    package_length: 10,
                    package_breadth: 10,
                    package_height: 10,
                    consignee: {
                        name: order.shippingAddress.fullName,
                        address: order.shippingAddress.streetAddress,
                        address_2: order.shippingAddress.landmark || "",
                        city: order.shippingAddress.city,
                        state: order.shippingAddress.state,
                        pincode: order.shippingAddress.pincode,
                        phone: order.shippingAddress.phone,
                    },
                    pickup: {
                        // Your warehouse details
                        warehouse_name:
                            process.env.WAREHOUSE_NAME || "Main Warehouse",
                        name: process.env.WAREHOUSE_CONTACT_NAME,
                        address: process.env.WAREHOUSE_ADDRESS,
                        city: process.env.WAREHOUSE_CITY,
                        state: process.env.WAREHOUSE_STATE,
                        pincode: process.env.WAREHOUSE_PINCODE,
                        phone: process.env.WAREHOUSE_PHONE,
                    },
                    order_items: order.items.map((item) => ({
                        name: item.name,
                        qty: item.quantity,
                        price: item.price,
                        sku: `${item.product}-${item.colorIndex}`,
                    })),
                };

                const nimbusResponse = await axios.post(
                    `${NIMBUSPOST_URL}/shipments`,
                    shipmentData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (nimbusResponse.data.status) {
                    order.shippingDetails.nimbusOrderId =
                        nimbusResponse.data.data.order_id;
                    order.shippingDetails.trackingNumber =
                        nimbusResponse.data.data.awb_number;
                    order.shippingDetails.trackingUrl =
                        nimbusResponse.data.data.tracking_url;
                }
            } catch (nimbusError) {
                console.error(
                    "NimbusPost shipment creation error:",
                    nimbusError
                );
                // Continue even if NimbusPost fails - can be done manually
            }
        }

        if (status === "delivered") {
            order.shippingDetails.deliveredAt = new Date();
        }

        if (status === "cancelled") {
            order.cancelledAt = new Date();
            order.cancellationReason = note;

            // Restore stock
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                if (product && product.colors[item.colorIndex]) {
                    product.colors[item.colorIndex].stock += item.quantity;
                    await product.save();
                }
            }

            // Decrement coupon usage count if it was a paid order
            if (order.couponCode && order.paymentStatus === "paid") {
                await Coupon.findOneAndUpdate(
                    { code: order.couponCode },
                    { $inc: { usedCount: -1 } }
                );
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
