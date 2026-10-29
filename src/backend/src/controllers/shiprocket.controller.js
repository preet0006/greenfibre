/**
 * shiprocket.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  1. POST /api/shipping/delivery-update     — Shiprocket → Green Fibre webhook updates
 *     (URL has NO 'shiprocket' keyword per Shiprocket endpoint requirements)
 *  2. GET  /api/shipping/serviceability      — Admin proxy for courier serviceability
 *  3. GET  /api/shipping/track/:awb          — Admin proxy for live tracking by AWB
 *  4. POST /api/shipping/dispatch/:orderId   — Full dispatch: create SR order + AWB + pickup
 *  5. POST /api/shipping/awb/:orderId        — Assign AWB to an already-created SR shipment
 *  6. POST /api/shipping/pickup/:orderId     — Schedule pickup for an order with AWB
 *  7. GET  /api/shipping/shipment/:orderId   — Get Shiprocket shipment details for a DB order
 *  8. DELETE /api/shipping/cancel/:orderId   — Cancel SR order and update DB
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Order } from "../models/order.model.js";
import {
    checkServiceability,
    trackByAWB,
    createShiprocketOrder,
    generateAWB,
    requestPickup,
    cancelShiprocketOrder,
    getShipmentDetails,
    generateLabel,
    generateManifest,
    getSrBase,
} from "../utils/shiprocket.js";

import {
    canTransition,
    mapShiprocketStatus,
    getAllowedFromStatuses,
    escapeRegex,
    ORDER_STATUSES,
    TERMINAL_STATUSES,
} from "../utils/orderStatusMachine.js";

// ── POST /api/shipping/delivery-update ─────────────────────────────────────
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
 *   "current_timestamp": "09 09 2026 16:13:13",
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

        // Extract courier timestamp for deduplication
        const courierTimestamp = String(
            payload.current_timestamp ||
            payload.scans?.[payload.scans.length - 1]?.date ||
            payload.updated_at ||
            ""
        ).trim();

        // Extract latest status string (from status fields or latest scan)
        const latestScanStatus = Array.isArray(payload.scans) && payload.scans.length > 0
            ? payload.scans[payload.scans.length - 1]["sr-status-label"] || payload.scans[payload.scans.length - 1].activity
            : "";

        const srStatus = String(payload.current_status || payload.shipment_status || latestScanStatus || "").trim();

        // Validate minimal required fields
        if (!awb && !srOrderId && !payload.order_id) {
            console.warn("⚠️ Shiprocket webhook: missing awb, sr_order_id, and order_id — acknowledging without action.");
            return res.status(200).json({ received: true, processed: false, reason: "missing_identifiers" });
        }

        // ── 2. Locate order in database ───────────────────────────────────────
        let order = null;

        // Primary: match by AWB tracking number
        if (awb) {
            order = await Order.findOne({
                $or: [
                    { "shippingDetails.trackingNumber": awb },
                    { "shippingDetails.awbCode": awb },
                ],
            });
        }

        // Fallback 1: match by Shiprocket Order ID
        if (!order && srOrderId) {
            order = await Order.findOne({ "shippingDetails.shiprocketOrderId": String(srOrderId) });
        }

        // Fallback 2: match by order ID (stripping prefix if present)
        if (!order && payload.order_id) {
            const rawId = String(payload.order_id).trim();
            const prefix = (process.env.SHIPROCKET_ORDER_ID_PREFIX || "TEST-").trim();
            const escapedPrefix = escapeRegex(prefix);
            const cleanOrderId = rawId.replace(new RegExp(`^(${escapedPrefix}|TEST-)`, "i"), "");

            order = await Order.findOne({
                $or: [
                    { easebuzzOrderId: cleanOrderId },
                    { razorpayOrderId: cleanOrderId },
                    { easebuzzOrderId: rawId },
                    { razorpayOrderId: rawId },
                    ...(cleanOrderId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanOrderId }] : []),
                    ...(rawId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: rawId }] : []),
                ],
            });
        }

        if (!order) {
            console.warn(`⚠️ Shiprocket webhook: order not found for AWB="${awb}", srOrderId="${srOrderId}", order_id="${payload.order_id}"`);
            // Always return 200 so Shiprocket does not endlessly retry unknown orders
            return res.status(200).json({ received: true, processed: false, reason: "order_not_found" });
        }

        // ── 3. Payment Status Gate ────────────────────────────────────────────
        // Courier webhook events only apply to orders that are paid.
        // Otherwise return 200 { processed: false, reason: "order_not_paid" }, log it, no DB write.
        if (order.paymentStatus !== "paid") {
            console.warn(`⚠️ Shiprocket webhook: order ${order._id} has paymentStatus="${order.paymentStatus}" (not "paid"). Webhook ignored without DB write.`);
            return res.status(200).json({ received: true, processed: false, reason: "order_not_paid" });
        }

        // ── 4. Map status ─────────────────────────────────────────────────────
        const newStatus = mapShiprocketStatus(srStatus);

        // Unknown status handling: log, return 200, and save raw courier scan without altering orderStatus
        if (!newStatus) {
            console.warn(`⚠️ Shiprocket webhook: unmapped status "${srStatus}" received for AWB="${awb}". Storing raw courier status without altering orderStatus.`);
            await Order.findByIdAndUpdate(order._id, {
                $set: {
                    "shippingDetails.lastCourierStatus": srStatus,
                    "shippingDetails.lastCourierTimestamp": courierTimestamp,
                    "shippingDetails.lastCourierRaw": { status: srStatus, scans: payload.scans },
                },
            });
            return res.status(200).json({ received: true, processed: false, reason: "unmapped_status", srStatus });
        }

        // ── 5. State Machine Transition Check ─────────────────────────────────
        const transition = canTransition(order.orderStatus, newStatus);

        if (!transition.allowed) {
            console.warn(
                `⚠️ Shiprocket webhook: transition from "${order.orderStatus}" to "${newStatus}" rejected (${transition.reason}). History note skipped.`
            );
            // Save latest courier tracking metadata without altering orderStatus or pushing history note
            await Order.findByIdAndUpdate(order._id, {
                $set: {
                    "shippingDetails.lastCourierStatus": srStatus,
                    "shippingDetails.lastCourierTimestamp": courierTimestamp,
                },
            });
            return res.status(200).json({
                received: true,
                processed: false,
                reason: "invalid_or_regressive_transition",
                currentStatus: order.orderStatus,
                attemptedStatus: newStatus,
            });
        }

        // ── 6. Atomic findOneAndUpdate Update ─────────────────────────────────
        const targetOrderStatus = transition.isDuplicate ? order.orderStatus : newStatus;
        const allowedFrom = getAllowedFromStatuses(targetOrderStatus, false);

        // Filter ensures atomic write:
        //  1. Order must still be paid
        //  2. Order's current status must be in the legal "from" states
        //  3. lastCourierTimestamp / lastCourierStatus must NOT already be equal to incoming event
        const atomicFilter = {
            _id: order._id,
            paymentStatus: "paid",
            orderStatus: { $in: allowedFrom },
        };

        if (courierTimestamp) {
            atomicFilter.$nor = [
                {
                    "shippingDetails.lastCourierStatus": srStatus,
                    "shippingDetails.lastCourierTimestamp": courierTimestamp,
                },
            ];
        } else {
            atomicFilter.$nor = [
                {
                    "shippingDetails.lastCourierStatus": srStatus,
                    orderStatus: targetOrderStatus,
                },
            ];
        }

        const note = `Shiprocket webhook: ${srStatus}${payload.courier_name ? ` via ${payload.courier_name}` : ""}`;

        const updateSet = {
            orderStatus: targetOrderStatus,
            "shippingDetails.lastCourierStatus": srStatus,
            "shippingDetails.lastCourierTimestamp": courierTimestamp,
        };

        if (payload.courier_name && !order.shippingDetails?.courierName) {
            updateSet["shippingDetails.courierName"] = payload.courier_name;
        }

        if (["delivered", "rto_delivered", "return_delivered"].includes(targetOrderStatus) && !order.shippingDetails?.deliveredAt) {
            updateSet["shippingDetails.deliveredAt"] = new Date();
        }

        if (awb && !order.shippingDetails?.awbCode) {
            updateSet["shippingDetails.awbCode"] = awb;
            updateSet["shippingDetails.trackingNumber"] = awb; // backwards compat
            updateSet["shippingDetails.trackingUrl"] = `https://shiprocket.co/tracking/${awb}`;
        }

        if (srOrderId && !order.shippingDetails?.shiprocketOrderId) {
            updateSet["shippingDetails.shiprocketOrderId"] = String(srOrderId);
        }

        const updateDoc = {
            $set: updateSet,
        };

        // Append to history only on actual state transition or initial entry
        if (order.orderStatus !== targetOrderStatus || !order.statusHistory?.length) {
            updateDoc.$push = {
                statusHistory: {
                    status: targetOrderStatus,
                    timestamp: new Date(),
                    note,
                },
            };
        }

        const updatedOrder = await Order.findOneAndUpdate(atomicFilter, updateDoc, { new: true });

        if (!updatedOrder) {
            console.log(`ℹ️ Shiprocket webhook: atomic update matched 0 documents for order ${order._id} (already updated, terminal, or duplicate).`);
            return res.status(200).json({
                received: true,
                processed: false,
                reason: "duplicate_or_superseded_event",
            });
        }

        console.log(`✅ Order ${order._id} atomically updated (${order.orderStatus} → ${targetOrderStatus}) via Shiprocket webhook (${srStatus}).`);
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

// ── POST /api/shipping/dispatch/:orderId ──────────────────────────────────────
/**
 * Full shipment dispatch for a Green Fibre DB order.
 *
 * Sequence:
 *  1. Find order in DB
 *  2. Create Shiprocket order (if not already created)
 *  3. Assign AWB (auto-selects best courier)
 *  4. Request pickup
 *  5. Save shiprocketOrderId, shipmentId, awbCode, courierName to DB
 *
 * In SANDBOX mode: base URL contains 'sandbox'
 * In TEST_MODE:   prefixes order_id with configured prefix
 */
export const dispatchOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            courierId = null,
            skipPickup = false,
            items = [],
            orderType = "B2C",
            package: pkg = null,
            b2bDetails = null,
        } = req.body;

        let order = null;
        try {
            order = await Order.findById(orderId).populate("user", "email");
        } catch {
            // in case orderId is not a valid Mongo ObjectId
        }
        if (!order) {
            order = await Order.findOne({
                $or: [{ easebuzzOrderId: orderId }, { razorpayOrderId: orderId }, { _id: orderId }],
            }).populate("user", "email");
        }
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Validate items and track shipped quantities per item to prevent double shipping
        if (Array.isArray(items) && items.length > 0 && Array.isArray(order.items)) {
            for (const itemReq of items) {
                const requestedQty = Number(itemReq.qty || itemReq.quantity || 0);
                if (requestedQty <= 0) continue;

                const matchIdx = order.items.findIndex((oi, idx) =>
                    String(oi._id) === String(itemReq.itemId) ||
                    String(oi.product) === String(itemReq.itemId) ||
                    String(oi.sku) === String(itemReq.itemId) ||
                    String(oi.name).toLowerCase() === String(itemReq.name || '').toLowerCase() ||
                    idx === Number(itemReq.itemId)
                );

                if (matchIdx !== -1) {
                    const oi = order.items[matchIdx];
                    const currentShipped = Number(oi.shippedQuantity || 0);
                    const remaining = Math.max(0, oi.quantity - currentShipped);
                    if (requestedQty > remaining) {
                        return res.status(400).json({
                            success: false,
                            message: `Requested quantity (${requestedQty}) for "${oi.name}" exceeds remaining unshipped quantity (${remaining}).`,
                        });
                    }
                }
            }
        }

        const isSandbox = getSrBase().includes("sandbox");
        console.log(`📦 [DISPATCH] Starting dispatch for order ${orderId} (Base URL: ${getSrBase()})`);

        // Stage 1: Create SR order if not already created
        let srOrderId = order.shippingDetails?.shiprocketOrderId;
        let srShipmentId = order.shippingDetails?.shiprocketShipmentId;

        if (!srOrderId) {
            console.log(`  🚀 [Stage 1] Creating Shiprocket order...`);
            const createRes = await createShiprocketOrder(order, {
                items,
                orderType,
                package: pkg,
                b2bDetails,
            });
            srOrderId = String(createRes.order_id || createRes.sr_order_id);
            srShipmentId = String(createRes.shipment_id);
            console.log(`  ✅ [Stage 1] SR order created: srOrderId=${srOrderId}, shipmentId=${srShipmentId}`);

            // Increment shipped quantity per item so same item is not shipped twice
            if (Array.isArray(items) && items.length > 0 && Array.isArray(order.items)) {
                items.forEach((itemReq) => {
                    const requestedQty = Number(itemReq.qty || itemReq.quantity || 0);
                    if (requestedQty <= 0) return;
                    const oi = order.items.find((it, idx) =>
                        String(it._id) === String(itemReq.itemId) ||
                        String(it.product) === String(itemReq.itemId) ||
                        String(it.sku) === String(itemReq.itemId) ||
                        String(it.name).toLowerCase() === String(itemReq.name || '').toLowerCase() ||
                        idx === Number(itemReq.itemId)
                    );
                    if (oi) {
                        oi.shippedQuantity = (Number(oi.shippedQuantity || 0)) + requestedQty;
                    }
                });
            } else if (Array.isArray(order.items)) {
                order.items.forEach((oi) => {
                    oi.shippedQuantity = oi.quantity;
                });
            }

            const allFullyShipped = order.items?.every(
                (oi) => (Number(oi.shippedQuantity || 0)) >= oi.quantity
            );

            await Order.findByIdAndUpdate(order._id, {
                $set: {
                    items: order.items,
                    "shippingDetails.shiprocketOrderId": srOrderId,
                    "shippingDetails.shiprocketShipmentId": srShipmentId,
                    "shippingDetails.orderType": orderType,
                    "shippingDetails.package": pkg,
                    orderStatus: allFullyShipped ? "processing" : "processing",
                },
                $push: {
                    statusHistory: {
                        status: "processing",
                        timestamp: new Date(),
                        note: `Shiprocket order #${srOrderId} created (${orderType}). Shipment ID: ${srShipmentId}.`,
                    },
                },
            });
        } else {
            console.log(`  ℹ️ [Stage 1] Shiprocket order already exists: srOrderId=${srOrderId}, shipmentId=${srShipmentId}`);
        }

                // ── Stage 2: Assign AWB ───────────────────────────────────────────────
        let awbCode = order.shippingDetails?.awbCode;
        let courierName = order.shippingDetails?.courierName;

        if (!awbCode) {
            console.log(`  🏷️ [Stage 2] Generating AWB for shipment ${srShipmentId}...`);
            const awbRes = await generateAWB(srShipmentId, courierId);
            awbCode = awbRes.awb_code;
            courierName = awbRes.courier_name;
            console.log(`  ✅ [Stage 2] AWB assigned: ${awbCode} (${courierName})`);

            await Order.findByIdAndUpdate(orderId, {
                $set: {
                    "shippingDetails.awbCode": awbCode,
                    "shippingDetails.trackingNumber": awbCode,
                    "shippingDetails.trackingUrl": `https://shiprocket.co/tracking/${awbCode}`,
                    "shippingDetails.courierName": courierName,
                    "shippingDetails.shippedAt": new Date(),
                    orderStatus: "shipped",
                },
                $push: {
                    statusHistory: {
                        status: "shipped",
                        timestamp: new Date(),
                        note: `AWB ${awbCode} assigned via ${courierName}.`,
                    },
                },
            });
        } else {
            console.log(`  ℹ️ [Stage 2] AWB already assigned: ${awbCode}`);
        }

        // ── Stage 3: Request pickup (unless skipped) ──────────────────────────
        let pickupResult = null;
        if (!skipPickup) {
            console.log(`  🚛 [Stage 3] Requesting pickup for shipment ${srShipmentId}...`);
            pickupResult = await requestPickup(srShipmentId);
            console.log(`  ✅ [Stage 3] Pickup requested.`);

            await Order.findByIdAndUpdate(orderId, {
                $push: {
                    statusHistory: {
                        status: "shipped",
                        timestamp: new Date(),
                        note: `Pickup scheduled with ${courierName}.`,
                    },
                },
            });
        } else {
            console.log(`  ⏭️ [Stage 3] Pickup skipped (skipPickup=true).`);
        }

        const updatedOrder = await Order.findById(orderId);

        return res.status(200).json({
            success: true,
            message: `Order dispatched successfully [${isSandbox ? "SANDBOX" : "LIVE"}]`,
            shiprocket: {
                srOrderId,
                srShipmentId,
                awbCode,
                courierName,
                trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
                pickupResult,
                environment: isSandbox ? "sandbox" : "live",
            },
            order: {
                _id: updatedOrder._id,
                orderStatus: updatedOrder.orderStatus,
                shippingDetails: updatedOrder.shippingDetails,
            },
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "Dispatch failed";
        console.error("❌ [DISPATCH] Error:", error?.response?.data || error.message);
        return res.status(status).json({ success: false, message: msg, detail: error?.response?.data });
    }
};

// ── POST /api/shipping/awb/:orderId ───────────────────────────────────────────
/**
 * Assign AWB to an already-created Shiprocket shipment for a DB order.
 * Body: { courierId?: string }
 */
export const assignAWB = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { courierId = null } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const srShipmentId = order.shippingDetails?.shiprocketShipmentId;
        if (!srShipmentId) {
            return res.status(400).json({
                success: false,
                message: "Order has no Shiprocket shipment ID. Run /dispatch first to create the SR order.",
            });
        }

        if (order.shippingDetails?.awbCode) {
            return res.status(409).json({
                success: false,
                message: `AWB already assigned: ${order.shippingDetails.awbCode}`,
                awbCode: order.shippingDetails.awbCode,
            });
        }

        const awbRes = await generateAWB(srShipmentId, courierId);
        const awbCode = awbRes.awb_code;
        const courierName = awbRes.courier_name;

        await Order.findByIdAndUpdate(orderId, {
            $set: {
                "shippingDetails.awbCode": awbCode,
                "shippingDetails.trackingNumber": awbCode,
                "shippingDetails.trackingUrl": `https://shiprocket.co/tracking/${awbCode}`,
                "shippingDetails.courierName": courierName,
                "shippingDetails.shippedAt": new Date(),
                orderStatus: "shipped",
            },
            $push: {
                statusHistory: {
                    status: "shipped",
                    timestamp: new Date(),
                    note: `AWB ${awbCode} assigned via ${courierName}.`,
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "AWB assigned successfully",
            awbCode,
            courierName,
            trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "AWB assignment failed";
        return res.status(status).json({ success: false, message: msg });
    }
};

// ── POST /api/shipping/pickup/:orderId ────────────────────────────────────────
/**
 * Request a pickup for a DB order that already has an AWB assigned.
 */
export const schedulePickup = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const srShipmentId = order.shippingDetails?.shiprocketShipmentId;
        if (!srShipmentId) {
            return res.status(400).json({
                success: false,
                message: "Order has no Shiprocket shipment ID. Run /dispatch first.",
            });
        }

        if (!order.shippingDetails?.awbCode) {
            return res.status(400).json({
                success: false,
                message: "Order has no AWB code. Assign AWB before scheduling pickup.",
            });
        }

        const pickupRes = await requestPickup(srShipmentId);

        await Order.findByIdAndUpdate(orderId, {
            $push: {
                statusHistory: {
                    status: order.orderStatus,
                    timestamp: new Date(),
                    note: `Pickup scheduled with ${order.shippingDetails.courierName || "courier"}.`,
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: "Pickup scheduled successfully",
            data: pickupRes,
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "Pickup scheduling failed";
        return res.status(status).json({ success: false, message: msg });
    }
};

// ── GET /api/shipping/shipment/:orderId ───────────────────────────────────────
/**
 * Get full Shiprocket shipment details for a Green Fibre DB order.
 */
export const getShipmentForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const srShipmentId = order.shippingDetails?.shiprocketShipmentId;
        if (!srShipmentId) {
            return res.status(400).json({
                success: false,
                message: "No Shiprocket shipment ID on record for this order. Run /dispatch first.",
            });
        }

        const data = await getShipmentDetails(srShipmentId);

        return res.status(200).json({
            success: true,
            environment: getSrBase().includes("sandbox") ? "sandbox" : "live",
            shiprocketShipmentId: srShipmentId,
            data,
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "Failed to fetch shipment details";
        return res.status(status).json({ success: false, message: msg });
    }
};

// ── DELETE /api/shipping/cancel/:orderId ──────────────────────────────────────
/**
 * Cancel the Shiprocket order for a Green Fibre DB order and update DB status.
 * Body: { reason?: string }
 */
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason = "Cancelled by admin" } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const srOrderId = order.shippingDetails?.shiprocketOrderId;
        if (!srOrderId) {
            return res.status(400).json({
                success: false,
                message: "Order has no Shiprocket order ID to cancel.",
            });
        }

        const cancelRes = await cancelShiprocketOrder([srOrderId]);

        await Order.findByIdAndUpdate(orderId, {
            $set: {
                orderStatus: "cancelled",
                cancellationReason: reason,
                cancelledAt: new Date(),
            },
            $push: {
                statusHistory: {
                    status: "cancelled",
                    timestamp: new Date(),
                    note: `Shiprocket order #${srOrderId} cancelled. Reason: ${reason}`,
                },
            },
        });

        return res.status(200).json({
            success: true,
            message: `Shiprocket order #${srOrderId} cancelled`,
            shiprocketResponse: cancelRes,
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "Cancellation failed";
        return res.status(status).json({ success: false, message: msg });
    }
};

// ── POST /api/shipping/label/:orderId ─────────────────────────────────────────
/**
 * Generate a shipping label PDF for a dispatched order.
 */
export const generateShippingLabel = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const srShipmentId = order.shippingDetails?.shiprocketShipmentId;
        if (!srShipmentId) {
            return res.status(400).json({
                success: false,
                message: "No Shiprocket shipment ID. Run /dispatch first.",
            });
        }

        const labelRes = await generateLabel(srShipmentId);
        const labelUrl = labelRes?.label_url;

        if (labelUrl) {
            await Order.findByIdAndUpdate(orderId, {
                $set: { "shippingDetails.labelUrl": labelUrl },
            });
        }

        return res.status(200).json({
            success: true,
            labelUrl,
            data: labelRes,
        });

    } catch (error) {
        const status = error?.response?.status || 500;
        const msg = error?.response?.data?.message || error.message || "Label generation failed";
        return res.status(status).json({ success: false, message: msg });
    }
};
