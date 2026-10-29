/**
 * shiprocket.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket API client for Green Fibre.
 *
 * Environment configuration (set in .env):
 *  SHIPROCKET_BASE_URL           → Base external URL (e.g. https://api-sandbox.shiprocket.in/v1/external
 *                                   or https://apiv2.shiprocket.in/v1/external)
 *  SHIPROCKET_ORDER_ID_PREFIX    → Prefix for Shiprocket orders (e.g. "TEST-")
 *  SHIPROCKET_PICKUP_LOCATION    → Configured warehouse pickup location nickname
 *  SHIPROCKET_ENABLED=true       → Gate for autoFulfillOrder() — won't fire unless true
 *
 * Safety & Reliability:
 *  - 9-day auth token caching (official token validity is 240h / 10 days).
 *  - Automatic retry with exponential backoff on HTTP 429 (rate-limit) and 5xx server errors.
 *  - Automatic token invalidation & re-auth on HTTP 401.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from "axios";
import { Order } from "../models/order.model.js";

// ── API Base URLs ────────────────────────────────────────────────────────────
const SR_LIVE_BASE = "https://apiv2.shiprocket.in/v1/external";
const SR_SBX_BASE = "https://api-sandbox.shiprocket.in/v1/external";
const SR_SBX_SVC_BASE = "https://serviceability-sandbox.shiprocket.in/v1/external";

/**
 * Returns the configured Shiprocket API base URL.
 * Requires SHIPROCKET_BASE_URL to be set explicitly outside NODE_ENV=production.
 */
export const getShiprocketBaseUrl = () => {
    const raw = process.env.SHIPROCKET_BASE_URL;
    if (raw && typeof raw === "string" && raw.trim()) {
        return raw.trim().replace(/\/+$/, "");
    }
    if (process.env.NODE_ENV === "production") {
        return SR_LIVE_BASE;
    }
    throw new Error(
        "SHIPROCKET_BASE_URL must be set explicitly outside NODE_ENV=production. (e.g. https://api-sandbox.shiprocket.in/v1/external)"
    );
};

export const getSrBase = () => getShiprocketBaseUrl();

/**
 * Returns the serviceability base URL.
 * Sandbox uses a dedicated serviceability subdomain.
 */
export const getSrServiceabilityBase = () => {
    const base = getSrBase();
    return base.includes("sandbox") ? SR_SBX_SVC_BASE : SR_LIVE_BASE;
};

// ── Token cache ────────────────────────────────────────────────────────────
// Token is valid for 10 days (240 hours). We cache for 9 days as a safety margin.
const TOKEN_CACHE_MS = 9 * 24 * 60 * 60 * 1000;
let _srToken = null;
let _srTokenExpiry = null;

/** Invalidate cached token (called on 401 auth failure) */
export const invalidateShiprocketToken = () => {
    _srToken = null;
    _srTokenExpiry = null;
};

/**
 * Authenticate with Shiprocket and return a cached bearer token.
 * Reads SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD with no silent fallbacks.
 */
export const getShiprocketToken = async (forceRefresh = false) => {
    if (!forceRefresh && _srToken && _srTokenExpiry && Date.now() < _srTokenExpiry) {
        console.log("🔑 [SHIPROCKET AUTH] Using cached token (valid for remaining TTL).");
        return _srToken;
    }

    const srBase = getSrBase();
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
        const err = new Error(
            "Shiprocket credentials missing: set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment."
        );
        console.error("❌ [SHIPROCKET AUTH] Login halted:", err.message);
        throw err;
    }

    console.log(`🔐 [SHIPROCKET AUTH] Attempting login to: ${srBase}/auth/login (User: ${email})`);
    const isSandbox = srBase.includes("sandbox");
    const authHeaders = {
        "Content-Type": "application/json",
        ...(isSandbox ? {
            "Referer": "https://sandbox.shiprocket.in/",
            "Origin": "https://sandbox.shiprocket.in",
        } : {}),
    };

    try {
        const res = await axios.post(
            `${srBase}/auth/login`,
            { email, password },
            { headers: authHeaders, timeout: 15000 }
        );

        if (!res.data?.token) {
            console.error(`❌ [SHIPROCKET AUTH] Login response missing token (Status: ${res.status}):`, res.data);
            throw new Error(
                `Shiprocket auth failed: ${JSON.stringify(res.data)}`
            );
        }

        _srToken = res.data.token;
        _srTokenExpiry = Date.now() + TOKEN_CACHE_MS;

        console.log(`✅ [SHIPROCKET AUTH] Authenticated successfully [HTTP ${res.status}]. Token received: true (cached for 9 days).`);
        return _srToken;
    } catch (authErr) {
        const status = authErr?.response?.status || "NO_RESPONSE";
        const errorData = authErr?.response?.data || authErr.message;
        console.error(`❌ [SHIPROCKET AUTH] Login failed [HTTP ${status}]:`, errorData);
        throw authErr;
    }
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
    const isSandbox = getSrBase().includes("sandbox");

    while (attempts <= maxRetries) {
        try {
            const client = axios.create({
                baseURL: getSrBase(),
                timeout: 25000,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...(isSandbox ? {
                        "Referer": "https://sandbox.shiprocket.in/",
                        "Origin": "https://sandbox.shiprocket.in",
                    } : {}),
                    ...(config.headers || {}),
                },
            });

            return await client(config);
        } catch (error) {
            attempts++;
            const status = error?.response?.status;

            // 401 Unauthorized → force refresh token and retry immediately once
            if (status === 401 && attempts <= maxRetries) {
                console.warn("⚠️ Shiprocket returned 401 — refreshing token and retrying...");
                invalidateShiprocketToken();
                token = await getShiprocketToken(true);
                continue;
            }

            // 429 Rate Limited → exponential backoff
            if (status === 429 && attempts <= maxRetries) {
                const retryAfter = Number(error?.response?.headers?.["retry-after"]) || attempts * 2;
                console.warn(`⏳ Shiprocket 429 Rate Limited. Waiting ${retryAfter}s before retry ${attempts}/${maxRetries}...`);
                await sleep(retryAfter * 1000);
                continue;
            }

            // 5xx Transient Server Error → retry with short backoff
            if (status && status >= 500 && status < 600 && attempts <= maxRetries) {
                const backoffMs = attempts * 1500;
                console.warn(`⚠️ Shiprocket ${status} Server Error. Retrying in ${backoffMs}ms (${attempts}/${maxRetries})...`);
                await sleep(backoffMs);
                continue;
            }

            // Not retryable or retries exhausted
            throw error;
        }
    }
};

// ── 1. Serviceability ────────────────────────────────────────────────────────

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
 * Uses:
 *  - process.env.SHIPROCKET_PICKUP_LOCATION (default: "Primary")
 *  - process.env.SHIPROCKET_ORDER_ID_PREFIX (default: "")
 *
 * @param {Object} order - Mongoose Order document (or lean object)
 * @returns {Object} Shiprocket create-order response
 */
export const createShiprocketOrder = async (order, customOptions = {}) => {
    const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || "Primary").trim();

    const shippingAddr = order.shippingAddress || {};
    const b2bDetails = customOptions.b2bDetails || {};
    const isB2B = (customOptions.orderType || "").toUpperCase() === "B2B" || Boolean(b2bDetails.companyName || shippingAddr.companyName);

    // Customer name: split into first & last name (max 50 chars each)
    const rawFullName = (b2bDetails.contactPerson || shippingAddr.fullName || "Customer").trim();
    const nameParts = rawFullName.split(/\s+/);
    const firstName = (nameParts[0] || "Customer").slice(0, 50);
    const lastName = (nameParts.slice(1).join(" ") || ".").slice(0, 50);

    // Sanitize phone (must be 10 digits)
    const cleanPhone = (b2bDetails.phone || shippingAddr.phone || "")
        .replace(/\D/g, "")
        .slice(-10) || "9999999999";

    // Sanitize pincode (must be 6 digits)
    const cleanPincode = (b2bDetails.pincode || shippingAddr.pincode || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 6) || "110001";

    // Email fallback
    const cleanEmail = (
        b2bDetails.email ||
        shippingAddr.email ||
        order.user?.email ||
        process.env.COMPANY_EMAIL ||
        "support@greenfibre.org"
    ).trim();

    // Sanitize line items - allow partial item selection
    let sourceItems = order.items || [];
    if (Array.isArray(customOptions.items) && customOptions.items.length > 0) {
        sourceItems = customOptions.items.map((ci, idx) => {
            const matched = (order.items || []).find((oi, oIdx) => {
                return (
                    (ci.itemId && String(oi._id) === String(ci.itemId)) ||
                    (ci.itemId && String(oi.product) === String(ci.itemId)) ||
                    (ci.itemId && String(oi.sku) === String(ci.itemId)) ||
                    (ci.name && String(oi.name).toLowerCase() === String(ci.name).toLowerCase()) ||
                    oIdx === Number(ci.itemId)
                );
            }) || {};

            return {
                ...matched,
                name: ci.name || matched.name || `Green Fibre Item ${idx + 1}`,
                sku: ci.sku || matched.sku || matched.product || `GF-ITEM-${idx + 1}`,
                quantity: Math.max(1, Math.round(Number(ci.qty || ci.quantity || matched.quantity || 1))),
                price: Math.max(1, Math.round(Number(ci.price || matched.price || 1))),
                colorIndex: matched.colorIndex,
            };
        });
    }

    const orderItems = sourceItems.map((item, idx) => {
        const itemName = (item.name || `Green Fibre Item ${idx + 1}`).trim().slice(0, 50);
        const itemQty = Math.max(1, Math.round(Number(item.quantity) || 1));
        const itemPrice = Math.max(1, Math.round(Number(item.price) || 1));
        const itemSku = (
            item.sku
                ? String(item.sku)
                : item.product
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

    // Use human-friendly orderNumber if available, else easebuzzOrderId / razorpayOrderId / _id
    const rawRef =
        order.orderNumber ||
        order.easebuzzOrderId ||
        order.razorpayOrderId ||
        order._id?.toString() ||
        `GF_${Date.now()}`;

    const orderIdPrefix = (process.env.SHIPROCKET_ORDER_ID_PREFIX || "").trim();
    const orderRef = orderIdPrefix ? `${orderIdPrefix}${rawRef}` : rawRef;

    const subTotal = Math.max(
        1,
        Math.round(
            orderItems.reduce((s, i) => s + i.selling_price * i.units, 0)
        )
    );

    // Package weight & dimensions
    const pkg = customOptions.package || customOptions.pkg || {};
    const rawWeight = Number(pkg.weight);
    const weightKg = rawWeight > 0
        ? (rawWeight > 10 ? rawWeight / 1000 : rawWeight)
        : Math.max(0.05, (Number(process.env.SHIPROCKET_PKG_WEIGHT_G) || 500) / 1000);

    const lengthCm = Math.max(1, Math.round(Number(pkg.length) || Number(process.env.SHIPROCKET_PKG_LENGTH) || 10));
    const breadthCm = Math.max(1, Math.round(Number(pkg.breadth) || Number(process.env.SHIPROCKET_PKG_BREADTH) || 10));
    const heightCm = Math.max(1, Math.round(Number(pkg.height) || Number(process.env.SHIPROCKET_PKG_HEIGHT) || 10));

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
        billing_address: (b2bDetails.address || shippingAddr.streetAddress || "Main Street").trim(),
        billing_address_2: (shippingAddr.landmark || "").trim(),
        billing_city: (b2bDetails.city || shippingAddr.city || "Delhi").trim(),
        billing_pincode: cleanPincode,
        billing_state: (b2bDetails.state || shippingAddr.state || "Delhi").trim(),
        billing_country: "India",
        billing_email: cleanEmail,
        billing_phone: cleanPhone,

        // B2B specific company and GSTIN fields supported by Shiprocket
        ...(isB2B && (b2bDetails.companyName || shippingAddr.companyName) ? {
            billing_company_name: (b2bDetails.companyName || shippingAddr.companyName).trim(),
        } : {}),
        ...(isB2B && (b2bDetails.gstin || shippingAddr.gstin) ? {
            billing_gstin: (b2bDetails.gstin || shippingAddr.gstin).trim(),
        } : {}),

        shipping_is_billing: true,

        order_items: orderItems,

        payment_method:
            order.paymentStatus === "paid" ? "Prepaid" : (order.paymentMethod === "COD" ? "COD" : "Prepaid"),
        sub_total: subTotal,
        length: lengthCm,
        breadth: breadthCm,
        height: heightCm,
        weight: Math.max(0.01, Number(weightKg.toFixed(3))), // kg
    };

    console.log("📦 [SHIPROCKET CREATE-ORDER] Exact payload sent to /orders/create/adhoc:\n" + JSON.stringify(payload, null, 2));

    try {
        const res = await makeSrRequest({
            method: "POST",
            url: "/orders/create/adhoc",
            data: payload,
        });

        console.log(`📡 [SHIPROCKET CREATE-ORDER] Response status: ${res.status}, body:\n` + JSON.stringify(res.data, null, 2));

        if (!res.data?.order_id && !res.data?.shipment_id) {
            console.error("❌ [SHIPROCKET CREATE-ORDER] Unexpected response structure (missing order_id & shipment_id):", res.data);
            throw new Error(
                `Shiprocket order creation failed: ${JSON.stringify(res.data)}`
            );
        }

        return res.data;
    } catch (orderErr) {
        const status = orderErr?.response?.status || "NO_RESPONSE";
        const errorData = orderErr?.response?.data || orderErr.message;
        console.error(`❌ [SHIPROCKET CREATE-ORDER] Request failed [HTTP ${status}]:`, errorData);
        throw orderErr;
    }
};

// ── 3. AWB generation ────────────────────────────────────────────────────────

/**
 * Assign an AWB (Air Waybill) to a Shiprocket shipment.
 * If no courierId is provided, Shiprocket auto-assigns the best courier.
 *
 * @param {number|string} shipmentId  - Shiprocket shipment_id
 * @param {number|string|null} courierId - Optional specific courier ID
 * @returns {Object} AWB assignment response with awb_code, courier_name, etc.
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

// ── 4. Pickup scheduling ──────────────────────────────────────────────────────

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

// ── 5. Label generation ───────────────────────────────────────────────────────

/**
 * Generate a shipping label PDF URL for a Shiprocket shipment.
 *
 * @param {number|string} shipmentId - Shiprocket shipment_id
 * @returns {Object} Label generation response with label_url
 */
export const generateLabel = async (shipmentId) => {
    const res = await makeSrRequest({
        method: "POST",
        url: "/courier/generate/label",
        data: {
            shipment_id: [String(shipmentId)],
        },
    });
    return res.data;
};

// ── 6. Manifest generation ────────────────────────────────────────────────────

/**
 * Generate a manifest for one or more Shiprocket shipments.
 *
 * @param {number[]|string[]} shipmentIds - Array of Shiprocket shipment IDs
 * @returns {Object} Manifest generation response with manifest_url
 */
export const generateManifest = async (shipmentIds) => {
    const ids = Array.isArray(shipmentIds)
        ? shipmentIds.map(String)
        : [String(shipmentIds)];

    const res = await makeSrRequest({
        method: "POST",
        url: "/manifests/generate",
        data: { shipment_id: ids },
    });
    return res.data;
};

// ── 7. Tracking ───────────────────────────────────────────────────────────────

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

// ── 8. Order cancellation ─────────────────────────────────────────────────────

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

// ── 9. Shipment details ───────────────────────────────────────────────────────

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

// ── 10. Auto-Fulfill Order ────────────────────────────────────────────────────

/**
 * Automatically pushes a confirmed/paid order to Shiprocket and saves the
 * Shiprocket order ID + shipment ID to the database.
 *
 * Design: This only creates the order on Shiprocket side. AWB generation and
 * pickup scheduling are done separately via admin action (dispatch endpoint),
 * giving ops a chance to review before committing courier resources.
 *
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
