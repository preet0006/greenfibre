/**
 * shiprocket.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket API client for Green Fibre.
 *
 * Safety & Reliability Rules:
 *  - Shiprocket has NO SANDBOX environment — all calls with valid credentials
 *    affect real-time data.
 *  - 9-day auth token caching (official token validity is 240h / 10 days).
 *  - Automatic retry with exponential backoff on HTTP 429 (rate-limit) and 5xx server errors.
 *  - Automatic token invalidation & re-auth on HTTP 401.
 *  - SHIPROCKET_TEST_MODE conventions: prefixes order_id with "TEST-" and uses
 *    pickup_location = process.env.SHIPROCKET_TEST_PICKUP_LOCATION || "TEST-WAREHOUSE".
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from "axios";
import { Order } from "../models/order.model.js";

const SR_BASE_LIVE = "https://apiv2.shiprocket.in/v1/external";

// Shiprocket operates exclusively on apiv2.shiprocket.in (no separate sandbox endpoint exists)
const getSrBase = () => SR_BASE_LIVE;

// ── Token cache ────────────────────────────────────────────────────────────
// Token is valid for 10 days (240 hours). We cache for 9 days to maintain safety margin.
const TOKEN_CACHE_MS = 9 * 24 * 60 * 60 * 1000;
let _srToken = null;
let _srTokenExpiry = null;

/** Invalidate cached token on 401 auth failure */
export const invalidateShiprocketToken = () => {
    _srToken = null;
    _srTokenExpiry = null;
};

/**
 * Authenticate with Shiprocket and return a cached bearer token.
 */
export const getShiprocketToken = async (forceRefresh = false) => {
    if (!forceRefresh && _srToken && _srTokenExpiry && Date.now() < _srTokenExpiry) {
        return _srToken;
    }

    const srBase = getSrBase();
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "Shiprocket credentials missing: set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env"
        );
    }

    const res = await axios.post(
        `${srBase}/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    if (!res.data?.token) {
        throw new Error(
            `Shiprocket auth failed: ${JSON.stringify(res.data)}`
        );
    }

    _srToken = res.data.token;
    _srTokenExpiry = Date.now() + TOKEN_CACHE_MS;

    console.log("✅ Shiprocket token refreshed (cached for 9 days).");
    return _srToken;
};

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform an authenticated Shiprocket API request with automatic retries on:
 *  - 429 (Rate-limited)
 *  - 500, 502, 503, 504 (Server transient errors)
 *  - 401 (Expired/invalid token — refreshes token and retries once)
 */
const makeSrRequest = async (config, maxRetries = 2) => {
    let attempts = 0;
    let token = await getShiprocketToken();

    while (attempts <= maxRetries) {
        try {
            const client = axios.create({
                baseURL: getSrBase(),
                timeout: 25000,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(config.headers || {}),
                },
            });

            return await client(config);
        } catch (error) {
            attempts++;
            const status = error?.response?.status;

            // 401 Unauthorized -> force refresh token and retry immediately once
            if (status === 401 && attempts <= maxRetries) {
                console.warn("⚠️ Shiprocket returned 401 — refreshing token and retrying...");
                invalidateShiprocketToken();
                token = await getShiprocketToken(true);
                continue;
            }

            // 429 Rate Limited -> exponential backoff
            if (status === 429 && attempts <= maxRetries) {
                const retryAfter = Number(error?.response?.headers?.["retry-after"]) || attempts * 2;
                console.warn(`⏳ Shiprocket 429 Rate Limited. Waiting ${retryAfter}s before retry ${attempts}/${maxRetries}...`);
                await sleep(retryAfter * 1000);
                continue;
            }

            // 5xx Transient Server Error -> retry with short backoff
            if (status && status >= 500 && status < 600 && attempts <= maxRetries) {
                const backoffMs = attempts * 1500;
                console.warn(`⚠️ Shiprocket ${status} Server Error. Retrying in ${backoffMs}ms (${attempts}/${maxRetries})...`);
                await sleep(backoffMs);
                continue;
            }

            // If not retryable or retries exhausted, throw
            throw error;
        }
    }
};

// ── 1. Serviceability ───────────────────────────────────────────────────────

/**
 * Check courier serviceability between pickup and delivery pincodes.
 *
 * @param {string} pickupPostcode   - Warehouse pincode
 * @param {string} deliveryPostcode - Customer pincode
 * @param {number} weight           - Package weight in grams (default 500g)
 * @param {number} cod              - 1 for COD, 0 for prepaid
 * @returns {Object} Shiprocket serviceability response data
 */
export const checkServiceability = async (
    pickupPostcode,
    deliveryPostcode,
    weight = 500,
    cod = 0
) => {
    const res = await makeSrRequest({
        method: "GET",
        url: "/courier/serviceability/",
        params: {
            pickup_postcode: pickupPostcode,
            delivery_postcode: deliveryPostcode,
            weight: (Number(weight) || 500) / 1000, // Shiprocket expects kg
            cod,
        },
    });
    return res.data;
};

// ── 2. Order creation ────────────────────────────────────────────────────────

/**
 * Create a Shiprocket order for a Green Fibre order document.
 *
 * Handles TEST_MODE guardrails:
 *  - Uses process.env.SHIPROCKET_TEST_PICKUP_LOCATION || "TEST-WAREHOUSE"
 *  - Prefixes order_id with "TEST-"
 *
 * @param {Object} order - Mongoose Order document (or lean object)
 * @returns {Object} Shiprocket create-order response
 */
export const createShiprocketOrder = async (order) => {
    const isTestMode = process.env.SHIPROCKET_TEST_MODE === "true";

    const pickupLocation = isTestMode
        ? (process.env.SHIPROCKET_TEST_PICKUP_LOCATION || "TEST-WAREHOUSE")
        : (process.env.SHIPROCKET_PICKUP_LOCATION || "Primary");

    const shippingAddr = order.shippingAddress || {};

    // Customer name formatting: split into first & last name (max 50 chars each)
    const rawFullName = (shippingAddr.fullName || "Customer").trim();
    const nameParts = rawFullName.split(/\s+/);
    const firstName = (nameParts[0] || "Customer").slice(0, 50);
    const lastName = (nameParts.slice(1).join(" ") || ".").slice(0, 50);

    // Sanitize phone (must be 10 digits)
    const cleanPhone = (shippingAddr.phone || "")
        .replace(/\D/g, "")
        .slice(-10) || "9999999999";

    // Sanitize pincode (must be 6 digits)
    const cleanPincode = (shippingAddr.pincode || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 6) || "110001";

    // Email fallback
    const cleanEmail = (
        shippingAddr.email ||
        order.user?.email ||
        process.env.COMPANY_EMAIL ||
        "support@greenfibre.org"
    ).trim();

    // Sanitize line items
    const orderItems = (order.items || []).map((item, idx) => {
        const itemName = (item.name || `Green Fibre Item ${idx + 1}`).trim().slice(0, 50);
        const itemQty = Math.max(1, Math.round(Number(item.quantity) || 1));
        const itemPrice = Math.max(1, Math.round(Number(item.price) || 1));
        const itemSku = (
            item.product
                ? `${item.product}-${item.colorIndex ?? 0}`
                : `GF-SKU-${idx + 1}`
        ).slice(0, 50);

        return {
            name: itemName,
            sku: itemSku,
            units: itemQty,
            selling_price: itemPrice,
            discount: 0,
            tax: 0,
            hsn: process.env.SHIPROCKET_HSN || "",
        };
    });

    if (orderItems.length === 0) {
        orderItems.push({
            name: "Green Fibre Eco Product",
            sku: "GF-PROD-1",
            units: 1,
            selling_price: Math.max(1, Math.round(Number(order.finalAmount) || 1)),
            discount: 0,
            tax: 0,
            hsn: process.env.SHIPROCKET_HSN || "",
        });
    }

    // Use easebuzzOrderId / razorpayOrderId / _id as our base reference
    const rawRef =
        order.easebuzzOrderId ||
        order.razorpayOrderId ||
        order._id?.toString() ||
        `GF_${Date.now()}`;

    // In test mode, prefix order_id with TEST- to distinguish in Shiprocket dashboard
    const orderRef = isTestMode ? `TEST-${rawRef}` : rawRef;

    const subTotal = Math.max(
        1,
        Math.round(
            Number(order.finalAmount) ||
            orderItems.reduce((s, i) => s + i.selling_price * i.units, 0)
        )
    );

    const payload = {
        order_id: orderRef,
        order_date: new Date(order.createdAt || Date.now())
            .toISOString()
            .replace("T", " ")
            .slice(0, 19),
        pickup_location: pickupLocation,

        // Customer details
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: (shippingAddr.streetAddress || "Main Street").trim(),
        billing_address_2: (shippingAddr.landmark || "").trim(),
        billing_city: (shippingAddr.city || "Delhi").trim(),
        billing_pincode: cleanPincode,
        billing_state: (shippingAddr.state || "Delhi").trim(),
        billing_country: "India",
        billing_email: cleanEmail,
        billing_phone: cleanPhone,

        shipping_is_billing: true,

        order_items: orderItems,

        payment_method:
            order.paymentStatus === "paid" ? "Prepaid" : "COD",
        sub_total: subTotal,
        length: Math.max(5, Number(process.env.SHIPROCKET_PKG_LENGTH) || 10),
        breadth: Math.max(5, Number(process.env.SHIPROCKET_PKG_BREADTH) || 10),
        height: Math.max(5, Number(process.env.SHIPROCKET_PKG_HEIGHT) || 10),
        weight: Math.max(0.05, (Number(process.env.SHIPROCKET_PKG_WEIGHT_G) || 500) / 1000), // kg
    };

    const res = await makeSrRequest({
        method: "POST",
        url: "/orders/create/adhoc",
        data: payload,
    });

    if (!res.data?.order_id && !res.data?.shipment_id) {
        console.error("Shiprocket create order unexpected response:", res.data);
        throw new Error(
            `Shiprocket order creation failed: ${JSON.stringify(res.data)}`
        );
    }

    return res.data;
};

// ── 3. AWB generation ────────────────────────────────────────────────────────

/**
 * Assign an AWB (Air Waybill) to a Shiprocket shipment.
 * If no courierId is provided, Shiprocket auto-assigns the best courier.
 *
 * @param {number|string} shipmentId - Shiprocket shipment_id
 * @param {number|string|null} courierId - Optional specific courier ID
 * @returns {Object} AWB assignment response data containing awb_code, courier_name, etc.
 */
export const generateAWB = async (shipmentId, courierId = null) => {
    const payload = {
        shipment_id: String(shipmentId),
    };
    if (courierId) {
        payload.courier_id = String(courierId);
    }

    const res = await makeSrRequest({
        method: "POST",
        url: "/courier/assign/awb",
        data: payload,
    });

    const respData = res.data?.response?.data || res.data?.data || res.data || {};
    const awbCode = respData.awb_code || res.data?.awb_code;
    const courierName = respData.courier_name || respData.assigned_courier || res.data?.courier_name || "";

    if (!awbCode) {
        const errorMsg =
            respData.awb_assign_error ||
            res.data?.message ||
            JSON.stringify(res.data);
        console.error("Shiprocket AWB generation failed:", errorMsg);
        throw new Error(`Shiprocket AWB generation failed: ${errorMsg}`);
    }

    return {
        ...respData,
        awb_code: awbCode,
        courier_name: courierName,
    };
};

// ── 4. Pickup scheduling ─────────────────────────────────────────────────────

/**
 * Request a pickup for a Shiprocket shipment.
 *
 * @param {number|string} shipmentId - Shiprocket shipment_id
 * @returns {Object} Pickup request response
 */
export const requestPickup = async (shipmentId) => {
    const res = await makeSrRequest({
        method: "POST",
        url: "/courier/generate/pickup",
        data: {
            shipment_id: [String(shipmentId)],
        },
    });
    return res.data;
};

// ── 5. Tracking ───────────────────────────────────────────────────────────────

/**
 * Get tracking info for a shipment by AWB code.
 *
 * @param {string} awb - AWB tracking number
 * @returns {Object} Tracking response data
 */
export const trackByAWB = async (awb) => {
    const res = await makeSrRequest({
        method: "GET",
        url: `/courier/track/awb/${awb}`,
    });
    return res.data;
};

// ── 6. Order cancellation ────────────────────────────────────────────────────

/**
 * Cancel one or more Shiprocket orders.
 *
 * @param {string[]|number[]} srOrderIds - Array of Shiprocket order IDs to cancel
 * @returns {Object} Cancellation response
 */
export const cancelShiprocketOrder = async (srOrderIds) => {
    const ids = Array.isArray(srOrderIds)
        ? srOrderIds.map(String)
        : [String(srOrderIds)];

    const res = await makeSrRequest({
        method: "POST",
        url: "/orders/cancel",
        data: { ids },
    });
    return res.data;
};

// ── 7. Shipment details ──────────────────────────────────────────────────────

/**
 * Get full details for a Shiprocket shipment.
 *
 * @param {number|string} shipmentId - Shiprocket shipment_id
 * @returns {Object} Shipment detail response
 */
export const getShipmentDetails = async (shipmentId) => {
    const res = await makeSrRequest({
        method: "GET",
        url: `/shipments/${shipmentId}`,
    });
    return res.data;
};

// ── 8. Auto-Fulfill Order ───────────────────────────────────────────────────

/**
 * Automatically pushes a confirmed/paid order to Shiprocket, generates AWB, and schedules pickup.
 * Safe to call asynchronously — handles errors gracefully without throwing.
 *
 * @param {Object} order - Mongoose Order document or plain order object
 */
export const autoFulfillOrder = async (order) => {
    if (process.env.SHIPROCKET_ENABLED !== "true") {
        console.log("🚧 [DEV] SHIPROCKET_ENABLED is not 'true'. Skipping automatic Shiprocket dispatch.");
        return;
    }

    if (!order) return;

    try {
        // Fetch fresh Mongoose order instance if needed
        let dbOrder = typeof order.save === "function"
            ? order
            : await Order.findById(order._id);

        if (!dbOrder) {
            console.warn("⚠️ [AUTO-FULFILLMENT] Order not found in database for fulfillment:", order._id);
            return;
        }

        if (dbOrder.hasStockConflict) {
            console.warn(`🛑 [AUTO-FULFILLMENT] Order ${dbOrder._id} has an active stock conflict. Automatic courier dispatch halted for manual ops review.`);
            return;
        }

        if (dbOrder.shippingDetails?.shiprocketOrderId) {
            console.log(`ℹ️ [AUTO-FULFILLMENT] Order ${dbOrder._id} already dispatched with Shiprocket order ID ${dbOrder.shippingDetails.shiprocketOrderId}.`);
            return;
        }

        const srResponse = await createShiprocketOrder(dbOrder);
        const srOrderId = srResponse.order_id || srResponse.sr_order_id;
        const srShipmentId = srResponse.shipment_id;

        if (!dbOrder.shippingDetails) {
            dbOrder.shippingDetails = {};
        }

        if (srOrderId) dbOrder.shippingDetails.shiprocketOrderId = String(srOrderId);
        if (srShipmentId) dbOrder.shippingDetails.shiprocketShipmentId = String(srShipmentId);

        console.log(`✅ [STAGE 1: AUTO-CREATE] Shiprocket order reserved! sr_order_id=${srOrderId}, shipment_id=${srShipmentId}`);

        dbOrder.orderStatus = "processing";
        dbOrder.statusHistory.push({
            status: "processing",
            timestamp: new Date(),
            note: `Shiprocket order #${srOrderId} reserved. Awaiting admin release for AWB + courier pickup.`,
        });

        await dbOrder.save();
        return { success: true, srOrderId, srShipmentId };
    } catch (error) {
        const errorData = error?.response?.data || error.message;
        console.error("❌ [STAGE 1: AUTO-CREATE] Error creating Shiprocket order:", errorData);
        if (order && typeof order.save === "function") {
            try {
                order.statusHistory.push({
                    status: order.orderStatus || "processing",
                    timestamp: new Date(),
                    note: `Automatic Shiprocket order reservation failed: ${error?.response?.data?.message || error.message}`,
                });
                await order.save();
            } catch (histErr) {
                console.error("Failed to append fulfillment error note:", histErr);
            }
        }
        return { success: false, error: errorData };
    }
};
