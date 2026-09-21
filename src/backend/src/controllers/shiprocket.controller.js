/**
 * shiprocket.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  1. POST /api/shipping/delivery-update — Shiprocket → Green Fibre webhook updates
 *     (URL has NO 'shiprocket' keyword per Shiprocket endpoint requirements)
 *  2. GET  /api/shipping/serviceability  — Admin proxy for courier serviceability
 *  3. GET  /api/shipping/track/:awb      — Admin proxy for live tracking by AWB
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Order } from "../models/order.model.js";
import {
    checkServiceability,
    trackByAWB,
} from "../utils/shiprocket.js";

// ── Shiprocket status → Green Fibre status mapping ────────────────────────
const SR_STATUS_MAP = {
    // 1. Placed / Booked
    "new": "placed",
    "booked": "placed",
    "order confirmed": "placed",

    // 2. Pickup / Processing
    "pickup scheduled": "processing",
    "pickup generated": "processing",
    "pickup queued": "processing",
    "pickup error": "processing",
    "pickup rescheduled": "processing",
    "out for pickup": "processing",
    "manifest generated": "processing",
    "processing": "processing",

    // 3. Shipped / In Transit / Out for Delivery
    "picked up": "shipped",
    "in transit": "shipped",
    "shipped": "shipped",
    "reached at destination hub": "shipped",
    "reached at origin hub": "shipped",
    "out for delivery": "shipped",
    "misrouted": "shipped",
    "delayed": "shipped",

    // 4. NDR (Non-delivery / Attempted delivery)
    "delivery failed": "shipped",
    "undelivered": "shipped",
    "rto ndr": "shipped",
    "ndr": "shipped",

    // 5. Delivered
    "delivered": "delivered",
    "complete": "delivered",
    "completed": "delivered",

    // 6. Returns / RTO
    "return initiated": "cancelled",
    "return pickup scheduled": "cancelled",
    "return picked up": "cancelled",
    "return in transit": "cancelled",
    "returned to origin": "cancelled",
    "rto initiated": "cancelled",
    "rto in transit": "cancelled",
    "rto delivered": "cancelled",
    "rto acknowledged": "cancelled",

    // 7. Cancellation / Loss
    "cancelled": "cancelled",
    "canceled": "cancelled",
    "lost": "cancelled",
    "damaged": "cancelled",
    "destroyed": "cancelled",
};

// ── Status hierarchy to prevent out-of-order webhook events from regressing order state ──
const STATUS_RANK = {
    pending: 0,
    placed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 5,
    failed: 5,
};

/**
 * Normalize a Shiprocket status string to a Green Fibre orderStatus value.
 * Supports spaces, underscores, and hyphens (e.g. IN_TRANSIT, IN-TRANSIT, IN TRANSIT).
 * Returns null if the status is unknown / unmapped.
 */
function mapSrStatus(srStatus) {
    if (!srStatus) return null;
    const clean = srStatus.toLowerCase().trim().replace(/[_\-]+/g, " ");
    return SR_STATUS_MAP[clean] || SR_STATUS_MAP[srStatus.toLowerCase().trim()] || null;
}

// ── POST /api/shipping/delivery-update ────────────────────────────────────────
/**
 * Receive Shiprocket webhook events and update the corresponding order.
 *
 * Shiprocket payload example:
 * {
 *   "awb": "...",
 *   "courier_name": "...",
 *   "current_status": "IN TRANSIT",
 *   "shipment_status": "IN TRANSIT",
 *   "order_id": "TEST-12345",
 *   "sr_order_id": 12345,
 *   "scans": [ { "date": "...", "activity": "...", "location": "...", "sr-status-label": "..." } ]
 * }
 */
export const handleShiprocketWebhook = async (req, res) => {
    try {
        // ── 1. Verify webhook security token (FAIL CLOSED) ─────────────────────
        const webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("🔒 Shipping webhook error: SHIPPING_WEBHOOK_SECRET is not configured in environment variables.");
            return res.status(500).json({ received: false, error: "server_misconfigured" });
        }

        const incomingKey =
            req.headers["x-api-key"] ||
            req.headers["x-shiprocket-token"] ||
            (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : null);

        if (incomingKey !== webhookSecret) {
            console.warn("🔒 Shipping webhook: unauthorized header token rejected.");
            return res.status(401).json({ received: false, error: "Unauthorized" });
        }

        const payload = req.body || {};
        console.log("📦 Shipping webhook received:", JSON.stringify(payload));

        const awb = payload.awb || payload.awb_code || "";
        const srOrderId = payload.sr_order_id || payload.shiprocket_order_id || "";

        // Extract latest status string (from status fields or latest scan)
        const latestScanStatus = Array.isArray(payload.scans) && payload.scans.length > 0
            ? payload.scans[payload.scans.length - 1]["sr-status-label"] || payload.scans[payload.scans.length - 1].activity
            : "";

        const srStatus = payload.current_status || payload.shipment_status || latestScanStatus || "";

        // Validate minimal required fields
        if (!awb && !srOrderId && !payload.order_id) {
            console.warn("⚠️ Shiprocket webhook: missing awb, sr_order_id, and order_id — acknowledging without action.");
            return res.status(200).json({ received: true, processed: false, reason: "missing_identifiers" });
        }

        // Map status
        const newStatus = mapSrStatus(srStatus);

        if (!newStatus) {
            console.warn(`⚠️ Shiprocket webhook: unmapped status "${srStatus}" received for AWB="${awb}".`);
            return res.status(200).json({ received: true, processed: false, reason: "unmapped_status", srStatus });
        }

        // ── 2. Locate order in database ───────────────────────────────────────
        let order = null;

        // Primary: match by AWB tracking number
        if (awb) {
            order = await Order.findOne({ "shippingDetails.trackingNumber": awb });
        }

        // Fallback 1: match by Shiprocket Order ID
        if (!order && srOrderId) {
            order = await Order.findOne({ "shippingDetails.shiprocketOrderId": String(srOrderId) });
        }

        // Fallback 2: match by Green Fibre order ID (stripping TEST- prefix if present)
        if (!order && payload.order_id) {
            const cleanOrderId = String(payload.order_id).replace(/^TEST-/, "");
            order = await Order.findOne({
                $or: [
                    { easebuzzOrderId: cleanOrderId },
                    { razorpayOrderId: cleanOrderId },
                    { easebuzzOrderId: payload.order_id },
                    { razorpayOrderId: payload.order_id },
                    ...(cleanOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanOrderId }] : []),
                ],
            });
        }

        if (!order) {
            console.warn(`⚠️ Shiprocket webhook: order not found for AWB="${awb}", srOrderId="${srOrderId}", order_id="${payload.order_id}"`);
            // Always return 200 so Shiprocket does not endlessly retry unknown orders
            return res.status(200).json({ received: true, processed: false, reason: "order_not_found" });
        }

        const note = `Shiprocket webhook: ${srStatus}${payload.courier_name ? ` via ${payload.courier_name}` : ""}`;

        // ── 3. Idempotency Check ──────────────────────────────────────────────
        const lastHistory = order.statusHistory?.[order.statusHistory.length - 1];
        const isDuplicate = lastHistory && lastHistory.status === newStatus && lastHistory.note === note;

        if (isDuplicate) {
            console.log(`ℹ️ Shiprocket webhook: duplicate status event for order ${order._id} — skipped.`);
            return res.status(200).json({ received: true, processed: false, reason: "duplicate_event" });
        }

        // ── 4. Out-of-Order Regression Protection ─────────────────────────────
        const currentRank = STATUS_RANK[order.orderStatus] ?? 0;
        const incomingRank = STATUS_RANK[newStatus] ?? 0;

        // If order is already in a higher status (e.g. delivered) and an out-of-order event arrives (e.g. delayed in-transit)
        // do not regress the main orderStatus unless it's an explicit cancellation / return
        const isRegression = incomingRank < currentRank && newStatus !== "cancelled";

        const targetOrderStatus = isRegression ? order.orderStatus : newStatus;

        if (isRegression) {
            console.warn(`⚠️ Shiprocket webhook: out-of-order event "${newStatus}" received for order ${order._id} (already "${order.orderStatus}"). Note appended without status regression.`);
        }

        // ── 5. Apply Updates ──────────────────────────────────────────────────
        const updateSet = {
            orderStatus: targetOrderStatus,
        };

        if (payload.courier_name && !order.shippingDetails?.courierName) {
            updateSet["shippingDetails.courierName"] = payload.courier_name;
        }

        if (newStatus === "delivered" && !order.shippingDetails?.deliveredAt) {
            updateSet["shippingDetails.deliveredAt"] = new Date();
        }

        if (awb && !order.shippingDetails?.trackingNumber) {
            updateSet["shippingDetails.trackingNumber"] = awb;
            updateSet["shippingDetails.trackingUrl"] = `https://shiprocket.co/tracking/${awb}`;
        }

        if (srOrderId && !order.shippingDetails?.shiprocketOrderId) {
            updateSet["shippingDetails.shiprocketOrderId"] = String(srOrderId);
        }

        await Order.findByIdAndUpdate(order._id, {
            $set: updateSet,
            $push: {
                statusHistory: {
                    status: newStatus,
                    timestamp: new Date(),
                    note,
                },
            },
        });

        console.log(`✅ Order ${order._id} updated (${isRegression ? `kept "${order.orderStatus}"` : `newStatus: "${newStatus}"`}) via Shiprocket webhook (${srStatus}).`);
        return res.status(200).json({
            received: true,
            processed: true,
            orderId: order._id,
            previousStatus: order.orderStatus,
            newStatus: targetOrderStatus,
        });

    } catch (error) {
        console.error("❌ Shiprocket webhook internal error:", error);
        // Always return 200 to Shiprocket so server exceptions don't trigger perpetual retries
        return res.status(200).json({ received: true, processed: false, error: "server_error" });
    }
};

// ── GET /api/shipping/serviceability ──────────────────────────────────────────
/**
 * Admin proxy to check courier serviceability.
 * Query params: pickup_pincode, delivery_pincode, weight (grams), cod (0|1)
 */
export const getServiceability = async (req, res) => {
    try {
        const {
            pickup_pincode,
            delivery_pincode,
            weight = 500,
            cod = 0,
        } = req.query;

        if (!pickup_pincode || !delivery_pincode) {
            return res.status(400).json({
                success: false,
                message: "pickup_pincode and delivery_pincode are required",
            });
        }

        const data = await checkServiceability(
            pickup_pincode,
            delivery_pincode,
            Number(weight),
            Number(cod)
        );

        return res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error?.response?.status || 502;
        const msg = error?.response?.data?.message || error.message || "Failed to check serviceability";
        console.error("Shiprocket serviceability error:", msg);
        return res.status(status).json({
            success: false,
            message: msg,
        });
    }
};

// ── GET /api/shipping/track/:awb ──────────────────────────────────────────────
/**
 * Admin proxy to look up live tracking by AWB code.
 */
export const getTrackingByAWB = async (req, res) => {
    try {
        const { awb } = req.params;

        if (!awb) {
            return res.status(400).json({ success: false, message: "AWB is required" });
        }

        const data = await trackByAWB(awb);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error?.response?.status || 502;
        const msg = error?.response?.data?.message || error.message || "Failed to fetch tracking info";
        console.error("Shiprocket tracking error:", msg);
        return res.status(status).json({
            success: false,
            message: msg,
        });
    }
};

