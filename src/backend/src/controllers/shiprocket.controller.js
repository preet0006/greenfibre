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

import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { validateAndAuditShiprocketPayload } from "../utils/shiprocketPayloadService.js";
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
    getSrServiceabilityBase,
    getPickupLocations,
    getShiprocketPickupLocation,
    isShiprocketSandbox,
    findUpstreamOrder,
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
            weight,
            cod = 0,
        } = req.query;

        const cleanPickup = String(pickup_pincode || '').trim();
        const cleanDelivery = String(delivery_pincode || '').trim();
        const numWeight = Number(weight);

        // Fail-safe checks: Reject defaults (Surat/Delhi/0.5kg) and report BLOCKED
        if (!cleanPickup || cleanPickup.length !== 6) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_WAREHOUSE_CONFIG_MISSING",
                message: "Warehouse pickup pincode is missing or unconfigured. Serviceability lookup is BLOCKED. Fallback substitutions (Surat 394230) are prohibited.",
            });
        }

        if (!cleanDelivery || cleanDelivery.length !== 6) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_DELIVERY_PINCODE_MISSING",
                message: "Valid 6-digit delivery pincode is required. Serviceability lookup is BLOCKED. Fallback substitutions (Delhi 110001) are prohibited.",
            });
        }

        if (!numWeight || numWeight <= 0) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_MEASUREMENTS_MISSING",
                message: "Confirmed packed package weight (> 0g) is required. Serviceability lookup is BLOCKED. Fallback substitutions (500g / 0.5kg) are prohibited.",
            });
        }

        const data = await checkServiceability(
            cleanPickup,
            cleanDelivery,
            numWeight,
            Number(cod) === 1 ? 1 : 0
        );

        const svcBase = getSrServiceabilityBase();
        const isSandbox = isShiprocketSandbox();
        const provenance = {
            testingNotice: isSandbox
                ? "Test environment — rates and availability are for testing. Not verified production prices."
                : "Production environment — real live courier rates and SLAs directly from apiv2.shiprocket.in.",
            configuredService: isSandbox ? "Official Shiprocket Sandbox (api-sandbox.shiprocket.in)" : "Official Shiprocket Production (apiv2.shiprocket.in)",
            serviceClassification: isSandbox ? "Configured test environment — provider identity not verified" : "Verified Production Service",
            serviceType: isSandbox ? "Official Shiprocket Sandbox" : "Official Shiprocket Production",
            isTestEnvironment: isSandbox,
            upstreamHost: new URL(svcBase).hostname,
            upstreamEndpoint: "/courier/serviceability/",
            upstreamEnvironment: isSandbox ? "sandbox" : "production",
            timestamp: new Date().toISOString(),
            requestParams: {
                pickup_postcode: cleanPickup,
                delivery_postcode: cleanDelivery,
                weight_input: numWeight,
                weight_unit: numWeight > 10 ? "grams" : "kg",
                weight_kg: Number((numWeight > 10 ? numWeight / 1000 : numWeight).toFixed(3)),
                cod: Number(cod) === 1 ? 1 : 0,
                inputSource: req.query.input_source || (req.query.is_test === "1" ? "Test input — not confirmed parcel weight" : "Operator Specified"),
            },
            rawCouriersCount: Array.isArray(data?.data?.available_courier_companies)
                ? data.data.available_courier_companies.length
                : (Array.isArray(data) ? data.length : 0),
        };

        return res.status(200).json({
            success: true,
            data,
            provenance,
            testingNotice: provenance.testingNotice,
        });
    } catch (error) {
        const status = error?.response?.status || 502;
        const rawMsg = error?.response?.data?.message || (typeof error?.response?.data === 'string' ? error.response.data : error.message) || "Failed to check serviceability";
        const sanitizedMsg = typeof rawMsg === 'string' && rawMsg.length < 120 ? rawMsg.trim() : 'Upstream test service access denied';
        console.error("Shiprocket serviceability error:", sanitizedMsg);
        return res.status(status).json({
            success: false,
            code: "UPSTREAM_SERVICEABILITY_FAILED",
            message: sanitizedMsg,
            upstreamStatus: status,
            upstreamHost: new URL(getSrServiceabilityBase()).hostname,
            upstreamEndpoint: "/courier/serviceability/",
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
            const orConditions = [{ easebuzzOrderId: orderId }, { razorpayOrderId: orderId }, { orderNumber: orderId }];
            if (mongoose.Types.ObjectId.isValid(orderId)) {
                orConditions.push({ _id: orderId });
            }
            order = await Order.findOne({ $or: orConditions }).populate("user", "email");
        }
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // ── 1. Authoritative DB verification - unsaved or draft orders cannot be dispatched
        if (!order._id) {
            return res.status(404).json({
                success: false,
                code: "ORDER_NOT_FOUND",
                message: "Cannot dispatch unsaved or draft order. Order must exist in database.",
            });
        }

        // ── 2. Strict Payment Confirmation Gate for online orders
        const paymentMethodUpper = String(order.paymentMethod || "").toUpperCase();
        const isOnlinePayment = paymentMethodUpper !== "COD" && paymentMethodUpper !== "CASH ON DELIVERY";

        if (isOnlinePayment && order.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                code: "PAYMENT_NOT_CONFIRMED",
                message: `Dispatch rejected: Order ${order.orderNumber || orderId} payment status is '${order.paymentStatus}' (${order.paymentMethod}). Online payments must be confirmed before dispatching to Shiprocket.`,
            });
        }

        // ── 3. Package Measurements Gate - require confirmed weight (> 0)
        if (Boolean(req.body.isTestInput || req.body.isTestFixture)) {
            return res.status(400).json({
                success: false,
                code: "TEST_INPUT_NOT_DISPATCHABLE",
                message: "Dispatch rejected: Test input weight cannot satisfy real dispatch eligibility. Confirmed package measurements are required.",
            });
        }

        const finalWeight = Number(pkg?.weight || order.shippingDetails?.package?.weight || 0);
        if (finalWeight <= 0) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_MEASUREMENTS_MISSING",
                message: "Dispatch rejected: Confirmed package measurements (weight > 0g) are required for dispatch. Defaults (0.5kg) are prohibited.",
            });
        }

        // ── 4. Delivery Address Gate - valid 6-digit delivery pincode and address
        const shippingAddr = order.shippingAddress || {};
        const cleanDeliveryPincode = String(b2bDetails?.pincode || shippingAddr.pincode || "").replace(/\D/g, "").slice(0, 6);
        if (!cleanDeliveryPincode || cleanDeliveryPincode.length !== 6) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_DELIVERY_PINCODE_MISSING",
                message: "Dispatch rejected: Valid 6-digit delivery pincode is required for dispatch. Defaults (110001) are prohibited.",
            });
        }
        if (!shippingAddr.streetAddress && !b2bDetails?.address) {
            return res.status(400).json({
                success: false,
                code: "BLOCKED_ADDRESS_MISSING",
                message: "Dispatch rejected: Customer delivery street address is missing.",
            });
        }

        // ── 5. Pickup Location Mismatch Gate - prevent dispatch if local PIN != remote PIN
        try {
            const db = mongoose.connection.db;
            const pageSettings = await db.collection("pagesettings").findOne({});
            const localAddress = String(pageSettings?.address || "").trim();
            const localPinMatch = localAddress.match(/\b\d{6}\b/);
            const localPin = localPinMatch ? localPinMatch[0] : "";
            const configuredPickupNickname = getShiprocketPickupLocation();

            const remoteLocations = await getPickupLocations();
            const selectedRemoteLocation = remoteLocations.find(
                (loc) => String(loc.pickup_location || "").trim().toLowerCase() === configuredPickupNickname.toLowerCase()
            );

            if (selectedRemoteLocation && localPin && String(selectedRemoteLocation.pin_code).trim() !== localPin) {
                return res.status(400).json({
                    success: false,
                    code: "PICKUP_LOCATION_MISMATCH",
                    message: `Dispatch rejected: Local facility PIN (${localPin}) does not match remote Shiprocket pickup location "${configuredPickupNickname}" PIN (${selectedRemoteLocation.pin_code}). Dispatch is BLOCKED until a matching remote pickup location is configured.`,
                    localPincode: localPin,
                    remotePincode: String(selectedRemoteLocation.pin_code).trim(),
                    remotePickupLocation: configuredPickupNickname,
                });
            }

            const isOperational = selectedRemoteLocation &&
                (selectedRemoteLocation.status === 1 || selectedRemoteLocation.status === 2) &&
                selectedRemoteLocation.phone_verified === 1;

            if (selectedRemoteLocation && !isOperational) {
                return res.status(400).json({
                    success: false,
                    code: "PICKUP_LOCATION_INACTIVE",
                    message: `Dispatch rejected: Remote Shiprocket pickup location "${configuredPickupNickname}" (ID: ${selectedRemoteLocation.id}, PIN: ${selectedRemoteLocation.pin_code}) has status ${selectedRemoteLocation.status} and phone_verified ${selectedRemoteLocation.phone_verified}. An active, phone-verified pickup location is required before dispatch.`,
                    localPincode: localPin,
                    remotePincode: String(selectedRemoteLocation.pin_code).trim(),
                    remotePickupLocation: configuredPickupNickname,
                    remoteLocationStatus: selectedRemoteLocation.status === 0 ? "Inactive" : "Unverified",
                });
            }
        } catch (pickupCheckErr) {
            console.warn("[dispatchOrder] Remote pickup location check error:", pickupCheckErr.message);
        }

        // Concurrent / double-click dispatch protection: acquire atomic 60-second dispatch lease
        const leaseExpired = new Date(Date.now() - 60000);
        const leaseClaim = await Order.findOneAndUpdate(
            {
                _id: order._id,
                $or: [
                    { dispatchClaimedAt: null },
                    { dispatchClaimedAt: { $exists: false } },
                    { dispatchClaimedAt: { $lt: leaseExpired } },
                ],
            },
            { $set: { dispatchClaimedAt: new Date() } },
            { new: true }
        );

        if (!leaseClaim) {
            return res.status(409).json({
                success: false,
                code: "DISPATCH_IN_PROGRESS",
                message: "Dispatch operation is already in progress for this order. Please wait for completion.",
            });
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

        // Upstream idempotency pre-check: If not stored locally, check if already created upstream
        // (e.g. from a prior attempt where an upstream timeout or local crash occurred before DB write)
        if (!srOrderId) {
            const channelOrderNumber = order.orderNumber || String(order._id);
            try {
                console.log(`  🔍 [Stage 1 Preflight] Checking if order ${channelOrderNumber} already exists upstream in Shiprocket...`);
                const existingUpstream = await findUpstreamOrder(channelOrderNumber);
                if (existingUpstream) {
                    srOrderId = String(existingUpstream.id || existingUpstream.order_id);
                    srShipmentId = String(existingUpstream.shipments?.[0]?.id || existingUpstream.shipment_id || "");
                    console.log(`  🛡️ [Stage 1 Reconcile] Order already exists upstream in Shiprocket (#${srOrderId}, shipment #${srShipmentId}). Reconciling local state without duplicate creation.`);

                    await Order.findByIdAndUpdate(order._id, {
                        $set: {
                            "shippingDetails.shiprocketOrderId": srOrderId,
                            "shippingDetails.shiprocketShipmentId": srShipmentId,
                            "shippingDetails.orderType": orderType,
                            "shippingDetails.package": pkg,
                            "shippingDetails.reconciledFromUpstream": true,
                            "shippingDetails.reconciledAt": new Date(),
                            orderStatus: "processing",
                        },
                        $push: {
                            statusHistory: {
                                status: "processing",
                                timestamp: new Date(),
                                note: `Reconciled with existing Shiprocket order #${srOrderId} (Shipment #${srShipmentId}) from upstream search.`,
                            },
                        },
                    });
                }
            } catch (searchErr) {
                // If a previous attempt was initiated, do NOT proceed blind!
                if (order.dispatchAttemptedAt) {
                    console.error(`  ❌ [Stage 1 Blocked] Upstream reconciliation check failed for previously attempted order ${channelOrderNumber}:`, searchErr.message);
                    return res.status(504).json({
                        success: false,
                        code: "DISPATCH_RECONCILIATION_REQUIRED",
                        message: `Previous dispatch status is indeterminate due to provider communication error (${searchErr.message}). Automatic re-submission is BLOCKED to prevent duplicate shipments. Please retry once provider connectivity is confirmed or check the Shiprocket dashboard.`,
                    });
                }
                console.warn(`  ⚠️ [Stage 1 Preflight] Non-fatal pre-check warning:`, searchErr.message);
            }
        }

        if (!srOrderId) {
            // Persist dispatchAttemptedAt BEFORE making the remote call to track that an upstream call is in flight
            await Order.findByIdAndUpdate(order._id, {
                $set: { dispatchAttemptedAt: new Date() }
            });

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
            if (isSandbox || process.env.SHIPROCKET_TEST_MODE === "true" || process.env.NODE_ENV !== "production") {
                console.log(`  🧪 [Stage 3] Test environment: Real courier pickup booking blocked. Returning simulated test confirmation.`);
                pickupResult = {
                    pickup_status: "TEST_MODE_SIMULATED",
                    message: "Pickup booking blocked in test environment — zero real courier bookings.",
                    pickup_scheduled_date: new Date().toISOString().split("T")[0],
                };
            } else {
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
            }
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


// ── GET & POST /api/shipping/preview/:orderId ──────────────────────────────
/**
 * Generate side-effect-free Shiprocket order payload preview,
 * field validation, source mappings, and financial reconciliation.
 * GUARANTEED ZERO MUTATIONS: does NOT create orders, shipments, AWBs, or pickups.
 */
export const getShiprocketPreview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customOptions = req.body || {};

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order identifier is required for preview" });
        }

        let order = null;
        try {
            if (mongoose.connection?.readyState === 1) {
                if (mongoose.Types.ObjectId.isValid(orderId)) {
                    order = await Order.findById(orderId).populate('user', 'email').lean();
                }
                if (!order) {
                    const orConditions = [
                        { orderNumber: orderId },
                        { easebuzzOrderId: orderId },
                        { razorpayOrderId: orderId },
                    ];
                    if (mongoose.Types.ObjectId.isValid(orderId)) {
                        orConditions.push({ _id: orderId });
                    }
                    order = await Order.findOne({ $or: orConditions }).populate('user', 'email').lean();
                }
            }
        } catch (dbErr) {
            console.warn(`[getShiprocketPreview] DB lookup failed for order ${orderId}:`, dbErr.message);
        }

        const isDraftOrder = String(orderId).toLowerCase().includes('draft') || Boolean(customOptions.isDraft);

        // If not found in DB, check if complete order object was provided for a draft
        if (!order && customOptions.order && isDraftOrder) {
            order = customOptions.order;
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                code: "ORDER_NOT_FOUND",
                message: `Order "${orderId}" not found for shipping preview.`,
                orderId,
            });
        }

        // For saved DB orders: customOptions.order MUST NOT override saved paymentStatus, prices, addresses, or ownership
        if (order._id && customOptions.order) {
            delete customOptions.order.paymentStatus;
            delete customOptions.order.paymentMethod;
            delete customOptions.order.finalAmount;
            delete customOptions.order.totalAmount;
            delete customOptions.order.total;
            delete customOptions.order.shippingAddress;
            delete customOptions.order.user;
        }

        const previewData = validateAndAuditShiprocketPayload(order, customOptions);

        // Evaluate authoritative dispatch eligibility
        const paymentMethodUpper = String(order.paymentMethod || "").toUpperCase();
        const isOnlinePayment = paymentMethodUpper !== "COD" && paymentMethodUpper !== "CASH ON DELIVERY";
        const finalWeight = Number(customOptions.package?.weight || order.shippingDetails?.package?.weight || 0);

        const isPickupMismatch = Boolean(
            customOptions.pickupLocationMismatch ||
            (customOptions.warehouse?.pickupLocationMismatch) ||
            (customOptions.warehouse?.pincode && customOptions.warehouse?.remotePincode && customOptions.warehouse.pincode !== customOptions.warehouse.remotePincode)
        );

        const isPickupInactive = Boolean(
            customOptions.warehouse?.pickupLocationInactive ||
            customOptions.warehouse?.remoteLocation?.status === "Inactive / Unverified"
        );

        const blockingReasons = [];
        if (isDraftOrder || !order._id) {
            blockingReasons.push({
                code: "DRAFT_ORDER_NOT_DISPATCHABLE",
                severity: "BLOCKING",
                message: "Draft preview only — draft orders cannot be dispatched. Save the order to database first.",
            });
        }
        if (isOnlinePayment && order.paymentStatus !== "paid") {
            blockingReasons.push({
                code: "PAYMENT_NOT_CONFIRMED",
                severity: "BLOCKING",
                message: `Payment is ${order.paymentStatus} (${order.paymentMethod}). Online orders must be confirmed paid prior to dispatch.`,
            });
        }
        if (!isDraftOrder && finalWeight <= 0) {
            blockingReasons.push({
                code: "BLOCKED_MEASUREMENTS_MISSING",
                severity: "BLOCKING",
                message: "Confirmed package weight (> 0g) is required for dispatch.",
            });
        }
        if (!isDraftOrder && isPickupMismatch) {
            blockingReasons.push({
                code: "PICKUP_LOCATION_MISMATCH",
                severity: "BLOCKING",
                message: `Local facility PIN (${customOptions.warehouse?.pincode || "201306"}) does not match remote Shiprocket pickup location PIN (${customOptions.warehouse?.remotePincode || "110001"}). Dispatch is BLOCKED.`,
            });
        }
        if (!isDraftOrder && isPickupInactive) {
            blockingReasons.push({
                code: "PICKUP_LOCATION_INACTIVE",
                severity: "BLOCKING",
                message: `Remote Shiprocket pickup location "${customOptions.warehouse?.pickupLocation || "warehouse"}" is marked Inactive / Unverified in Shiprocket. Pickup location must be active before dispatch.`,
            });
        }

        const isDispatchEligible = blockingReasons.length === 0;
        const dispatchBlockCode = isDispatchEligible ? "READY" : blockingReasons[0].code;
        const dispatchBlockReason = isDispatchEligible ? null : blockingReasons[0].message;

        previewData.isDraft = isDraftOrder || !order._id;
        previewData.dispatchEligibility = {
            eligible: isDispatchEligible,
            code: dispatchBlockCode,
            reason: dispatchBlockReason,
            blockingReasons,
        };

        return res.status(200).json(previewData);
    } catch (error) {
        const refId = `PREV-${Date.now().toString(36).toUpperCase()}`;
        console.error(`[Shiprocket Preview Error] Ref: ${refId}:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate shipping preview payload.",
            referenceId: refId,
        });
    }
};

/**
 * Load authoritative warehouse configurations from MongoDB pagesettings and environment.
 * GET /api/shipping/warehouses
 * - Matches selected warehouse to configured Shiprocket pickup location
 * - Preserves existing warehouse details in the response even when blocked.
 * - Categorizes blocking reason into one of 6 specific categories:
 *   missing configuration / authentication failure / provider failure /
 *   pickup not found / pickup mismatch / pickup not eligible
 * - Never returns an empty warehouse list if facility details exist.
 * - Does NOT create or modify warehouse records automatically.
 */
export const getWarehouseConfig = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const pageSettings = db ? await db.collection("pagesettings").findOne({}) : null;
        const fullAddress = String(pageSettings?.address || "").trim();
        const pinMatch = fullAddress.match(/\b\d{6}\b/);
        const pincode = pinMatch ? pinMatch[0] : null;
        const configuredPickupNickname = getShiprocketPickupLocation();
        const companyName = String(pageSettings?.companyName || "GreenFibre").trim();

        let reasonCategory = null;
        let dispatchBlocked = false;
        let dispatchBlockReason = null;
        let verificationStatus = "locally configured — not verified against Shiprocket";

        // Category 1: missing configuration
        if (!pincode || !configuredPickupNickname) {
            reasonCategory = "missing configuration";
            dispatchBlocked = true;
            verificationStatus = "MISSING_CONFIGURATION";
            dispatchBlockReason = !pincode
                ? "Warehouse configuration required: Local facility address in database is missing a 6-digit postal code."
                : "Warehouse configuration required: Shiprocket pickup location nickname is not configured in environment.";

            const incompleteWarehouse = {
                id: "wh_authorized_primary",
                name: `${companyName} Facility`,
                pickupLocation: configuredPickupNickname || "",
                address: fullAddress,
                city: "Greater Noida",
                state: "Uttar Pradesh",
                pincode: pincode || "",
                isPrimary: true,
                isConfigured: false,
                verificationStatus,
                source: "database_and_env",
                dispatchBlocked: true,
                reasonCategory,
                dispatchBlockReason,
                remoteLocation: null,
            };

            return res.status(200).json({
                success: true,
                warehouses: [incompleteWarehouse],
                primaryWarehouse: incompleteWarehouse,
                dispatchBlocked: true,
                reasonCategory,
                dispatchBlockReason,
                pickupLocationMismatch: false,
                pickupLocationInactive: false,
                remotePickupLocations: [],
            });
        }

        // Query authoritative remote pickup locations from Shiprocket (read-only)
        let remoteLocations = [];
        let selectedRemoteLocation = null;
        let matchingRemoteLocation = null;
        let remoteQueryError = null;

        try {
            remoteLocations = await getPickupLocations();
            selectedRemoteLocation = remoteLocations.find(
                (loc) => String(loc.pickup_location || "").trim().toLowerCase() === configuredPickupNickname.toLowerCase()
            ) || null;
            matchingRemoteLocation = remoteLocations.find(
                (loc) => String(loc.pin_code || "").trim() === pincode
            ) || null;
        } catch (pickupErr) {
            remoteQueryError = pickupErr;
            console.warn("[getWarehouseConfig] Failed to fetch remote pickup locations from Shiprocket:", pickupErr.message);
        }

        if (remoteQueryError) {
            const errStr = String(remoteQueryError.message || "");
            const status = remoteQueryError.response?.status;
            // Category 2: authentication failure vs Category 3: provider failure
            if (status === 401 || status === 403 || errStr.includes("credentials missing") || errStr.includes("AUTH") || errStr.includes("Unauthorized")) {
                reasonCategory = "authentication failure";
                verificationStatus = "AUTHENTICATION_FAILURE";
                dispatchBlocked = true;
                dispatchBlockReason = `Authentication failure: Unable to authenticate with Shiprocket API (${errStr}). Check credentials.`;
            } else {
                reasonCategory = "provider failure";
                verificationStatus = "PROVIDER_FAILURE";
                dispatchBlocked = true;
                dispatchBlockReason = `Provider failure: Shiprocket pickup location service temporarily unreachable (${errStr}).`;
            }
        } else if (!selectedRemoteLocation) {
            // Category 4: pickup not found
            reasonCategory = "pickup not found";
            verificationStatus = "PICKUP_NOT_FOUND";
            dispatchBlocked = true;
            dispatchBlockReason = `Pickup location not found: Nickname "${configuredPickupNickname}" is not registered in Shiprocket pickup addresses.`;
        } else {
            const remotePincode = String(selectedRemoteLocation.pin_code || "").trim();
            if (remotePincode !== pincode) {
                // Category 5: pickup mismatch
                reasonCategory = "pickup mismatch";
                verificationStatus = "PICKUP_LOCATION_MISMATCH";
                dispatchBlocked = true;
                dispatchBlockReason = `Pickup location mismatch: Local facility PIN (${pincode}) does not match remote Shiprocket pickup location PIN (${remotePincode}). Dispatch is BLOCKED until a matching remote pickup location is configured.`;
            } else {
                // Documented Shiprocket status: 1 = Active, 2 = Primary Active, 0 = Inactive / Disabled
                const isOperational = (selectedRemoteLocation.status === 1 || selectedRemoteLocation.status === 2) &&
                    selectedRemoteLocation.phone_verified === 1;

                if (!isOperational) {
                    // Category 6: pickup not eligible
                    reasonCategory = "pickup not eligible";
                    verificationStatus = "PICKUP_NOT_ELIGIBLE";
                    dispatchBlocked = true;
                    dispatchBlockReason = `Selected pickup location "${configuredPickupNickname}" (ID: ${selectedRemoteLocation.id}, PIN: ${remotePincode}) is not eligible for dispatch. Status: ${selectedRemoteLocation.status} (${selectedRemoteLocation.status === 0 ? "Inactive" : "Pending"}), Phone Verified: ${selectedRemoteLocation.phone_verified}. An active, verified pickup location is required before dispatch.`;
                } else {
                    // Fully verified and eligible
                    reasonCategory = null;
                    verificationStatus = "verified against Shiprocket";
                    dispatchBlocked = false;
                    dispatchBlockReason = null;
                }
            }
        }

        const isMismatch = reasonCategory === "pickup mismatch";
        const isInactive = reasonCategory === "pickup not eligible";
        const remotePincode = selectedRemoteLocation ? String(selectedRemoteLocation.pin_code || "").trim() : null;

        const warehouse = {
            id: "wh_authorized_primary",
            name: `${companyName} Facility`,
            pickupLocation: configuredPickupNickname,
            address: fullAddress,
            city: "Greater Noida",
            state: "Uttar Pradesh",
            pincode: pincode,
            isPrimary: true,
            isConfigured: true,
            verificationStatus,
            source: "database_and_env",
            pickupLocationMismatch: isMismatch,
            pickupLocationInactive: isInactive,
            mismatchCode: isMismatch ? "PICKUP_LOCATION_MISMATCH" : (isInactive ? "PICKUP_NOT_ELIGIBLE" : null),
            reasonCategory,
            dispatchBlocked,
            dispatchBlockReason,
            localPincode: pincode,
            remotePincode: remotePincode,
            remoteLocation: selectedRemoteLocation ? {
                id: selectedRemoteLocation.id,
                pickup_location: selectedRemoteLocation.pickup_location,
                pin_code: selectedRemoteLocation.pin_code,
                city: selectedRemoteLocation.city,
                state: selectedRemoteLocation.state,
                address: selectedRemoteLocation.address,
                status: (selectedRemoteLocation.status === 1 || selectedRemoteLocation.status === 2) && selectedRemoteLocation.phone_verified === 1
                    ? "Active"
                    : (selectedRemoteLocation.status === 0 ? "Inactive" : "Unverified"),
            } : null,
        };

        return res.status(200).json({
            success: true,
            warehouses: [warehouse],
            primaryWarehouse: warehouse,
            pickupLocationMismatch: isMismatch,
            pickupLocationInactive: isInactive,
            mismatchCode: isMismatch ? "PICKUP_LOCATION_MISMATCH" : (isInactive ? "PICKUP_NOT_ELIGIBLE" : null),
            reasonCategory,
            dispatchBlocked,
            dispatchBlockReason,
            localPincode: pincode,
            remotePincode: remotePincode,
            matchingRemoteLocation: matchingRemoteLocation ? {
                id: matchingRemoteLocation.id,
                pickup_location: matchingRemoteLocation.pickup_location,
                pin_code: matchingRemoteLocation.pin_code,
                city: matchingRemoteLocation.city,
                state: matchingRemoteLocation.state,
            } : null,
            remotePickupLocations: remoteLocations.map((loc) => {
                const locOp = (loc.status === 1 || loc.status === 2) && loc.phone_verified === 1;
                return {
                    id: loc.id,
                    pickup_location: loc.pickup_location,
                    pin_code: loc.pin_code,
                    city: loc.city,
                    state: loc.state,
                    address: loc.address,
                    status: locOp ? "Active" : (loc.status === 0 ? "Inactive" : "Unverified"),
                };
            }),
        });
    } catch (err) {
        console.error("Failed to load warehouse configuration:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to load warehouse configuration",
            error: err.message,
        });
    }
};
