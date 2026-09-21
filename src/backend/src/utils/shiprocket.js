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

const SR_BASE_LIVE    = "https://apiv2.shiprocket.in/v1/external";
const SR_BASE_SANDBOX = "https://api-sandbox.shiprocket.in/v1/external";

// Resolves the correct base URL based on SHIPROCKET_TEST_MODE env flag
const getSrBase = () =>
    process.env.SHIPROCKET_TEST_MODE === "true" ? SR_BASE_SANDBOX : SR_BASE_LIVE;

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
            weight: weight / 1000, // Shiprocket expects kg
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

    // Build order items array
    const orderItems = order.items.map((item) => ({
        name: item.name,
        sku: `${item.product}-${item.colorIndex}`,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: process.env.SHIPROCKET_HSN || "",
    }));

    // Use easebuzzOrderId / razorpayOrderId / _id as our base reference
    const rawRef =
        order.easebuzzOrderId ||
        order.razorpayOrderId ||
        order._id.toString();

    // In test mode, prefix order_id with TEST- to distinguish in Shiprocket dashboard
    const orderRef = isTestMode ? `TEST-${rawRef}` : rawRef;

    const payload = {
        order_id: orderRef,
        order_date: new Date(order.createdAt || Date.now())
            .toISOString()
            .replace("T", " ")
            .slice(0, 19),
        pickup_location: pickupLocation,

        // Billing = shipping
        billing_customer_name: order.shippingAddress.fullName,
        billing_last_name: "",
        billing_address: order.shippingAddress.streetAddress,
        billing_address_2: order.shippingAddress.landmark || "",
        billing_city: order.shippingAddress.city,
        billing_pincode: order.shippingAddress.pincode,
        billing_state: order.shippingAddress.state,
        billing_country: "India",
        billing_email: order.shippingAddress.email || "",
        billing_phone: order.shippingAddress.phone,

        shipping_is_billing: true,

        order_items: orderItems,

        payment_method:
            order.paymentStatus === "paid" ? "Prepaid" : "COD",
        sub_total: order.finalAmount,
        length: Number(process.env.SHIPROCKET_PKG_LENGTH) || 10,
        breadth: Number(process.env.SHIPROCKET_PKG_BREADTH) || 10,
        height: Number(process.env.SHIPROCKET_PKG_HEIGHT) || 10,
        weight:
            (Number(process.env.SHIPROCKET_PKG_WEIGHT_G) || 500) / 1000, // kg
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
 * @returns {Object} AWB assignment response data
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

    if (!res.data?.response?.data?.awb_code) {
        console.error("Shiprocket AWB generation unexpected response:", res.data);
        throw new Error(
            `Shiprocket AWB generation failed: ${JSON.stringify(res.data)}`
        );
    }

    return res.data.response.data;
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
// ── 9. Auto-Fulfill Order ───────────────────────────────────────────────────

/**
 * Automatically pushes a confirmed/paid order to Shiprocket, generates AWB, and schedules pickup.
 * Safe to call asynchronously — handles errors gracefully without throwing.
 *
 * @param {Object} order - Mongoose Order document
 */
export const autoFulfillOrder = async (order) => {
    if (process.env.SHIPROCKET_ENABLED !== "true") {
        console.log("🚧 [DEV] SHIPROCKET_ENABLED is not 'true'. Skipping automatic Shiprocket dispatch.");
        return;
    }

    if (order.shippingDetails?.shiprocketOrderId) {
        console.log(`ℹ️ [AUTO-FULFILLMENT] Order ${order._id} already dispatched with Shiprocket order ID ${order.shippingDetails.shiprocketOrderId}.`);
        return;
    }

    const isTestMode = process.env.SHIPROCKET_TEST_MODE === "true";
    console.log(`🚀 [AUTO-FULFILLMENT] Initiating automatic Shiprocket dispatch for order ${order._id} (Test Mode: ${isTestMode})...`);

    try {
        const srResponse = await createShiprocketOrder(order);
        const srOrderId = srResponse.order_id || srResponse.sr_order_id;
        const srShipmentId = srResponse.shipment_id;

        if (srOrderId) order.shippingDetails.shiprocketOrderId = String(srOrderId);
        if (srShipmentId) order.shippingDetails.shiprocketShipmentId = String(srShipmentId);
        if (!order.shippingDetails.shippedAt) order.shippingDetails.shippedAt = new Date();

        console.log(`✅ [AUTO-FULFILLMENT] Shiprocket order created! sr_order_id=${srOrderId}, shipment_id=${srShipmentId}`);

        if (isTestMode) {
            console.log(
                `🧪 [SHIPROCKET_TEST_MODE=true] Order created with TEST- prefix at test warehouse. ` +
                `AWB generation skipped to prevent live courier bookings.`
            );
            order.statusHistory.push({
                status: "shipped",
                timestamp: new Date(),
                note: `[Auto-Fulfill / Test Mode] Shiprocket order ${srOrderId} created.`,
            });
            order.orderStatus = "shipped";
            await order.save();
        } else if (srShipmentId) {
            // LIVE MODE: Generate AWB & Request Pickup
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
                order.orderStatus = "shipped";
                order.statusHistory.push({
                    status: "shipped",
                    timestamp: new Date(),
                    note: `[Auto-Fulfill] AWB ${awb} assigned via ${courierNameSr}. Pickup requested.`,
                });
                await order.save();
                console.log(`✅ [AUTO-FULFILLMENT] AWB assigned: ${awb} via ${courierNameSr}`);

                // Schedule pickup
                try {
                    await requestPickup(srShipmentId);
                    console.log(`✅ [AUTO-FULFILLMENT] Courier pickup scheduled for shipment ${srShipmentId}`);
                } catch (pickupErr) {
                    console.warn(`⚠️ [AUTO-FULFILLMENT] Pickup request pending:`, pickupErr?.response?.data || pickupErr.message);
                }
            } catch (awbErr) {
                console.error(`🚨 [AUTO-FULFILLMENT] AWB generation failed:`, awbErr?.response?.data || awbErr.message);
            }
        }
    } catch (srErr) {
        console.error("❌ [AUTO-FULFILLMENT] Error creating Shiprocket order:", srErr?.response?.data || srErr.message);
    }
};

