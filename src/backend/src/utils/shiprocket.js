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
import { resolveShiprocketEnvironment } from "./shiprocketPayloadService.js";

// ── API Base URLs ────────────────────────────────────────────────────────────
const SR_LIVE_BASE = "https://apiv2.shiprocket.in/v1/external";
const SR_SBX_BASE = "https://api-sandbox.shiprocket.in/v1/external";

/**
 * Returns the configured Shiprocket API base URL via authoritative environment resolver.
 */
export const getShiprocketBaseUrl = () => {
    return resolveShiprocketEnvironment().baseUrl;
};

export const getSrBase = () => getShiprocketBaseUrl();

/**
 * Returns whether Shiprocket is currently running in sandbox mode.
 */
export const isShiprocketSandbox = () => {
    return resolveShiprocketEnvironment().isSandbox;
};

/**
 * Returns the effective Shiprocket pickup location nickname based on active environment.
 * In sandbox mode, uses SHIPROCKET_TEST_PICKUP_LOCATION explicitly.
 * In production mode, uses SHIPROCKET_LIVE_PICKUP_LOCATION (or SHIPROCKET_PICKUP_LOCATION).
 */
export const getShiprocketPickupLocation = () => {
    return resolveShiprocketEnvironment().pickupLocation;
};

/**
 * Returns the serviceability base URL.
 * As documented in sandbox documentation (https://sandbox.shiprocket.in/apis/),
 * sandbox console requests route to api-sandbox.shiprocket.in for core endpoints including courier serviceability.
 */
export const getSrServiceabilityBase = () => {
    return getSrBase();
};

// ── Token cache ────────────────────────────────────────────────────────────
// Token is valid for 10 days (240 hours). We cache for 9 days as a safety margin.
const TOKEN_CACHE_MS = 9 * 24 * 60 * 60 * 1000;
const _srTokenCache = new Map(); // key: `${env}:${host}:${email}` -> { token, expiry }

export const getCacheKey = () => {
    const env = resolveShiprocketEnvironment();
    return `${env.environment}:${env.hostName}:${env.email}`;
};

/** Invalidate cached token for the current environment (called on 401/498 auth failure) */
export const invalidateShiprocketToken = (envKey) => {
    const key = envKey || getCacheKey();
    _srTokenCache.delete(key);
    console.log(`🧹 [SHIPROCKET AUTH] Invalidated cached token for environment: ${key}`);
};

/**
 * Authenticate with Shiprocket and return a cached bearer token.
 * Keyed by environment (sandbox vs live) to avoid cross-environment token poisoning.
 */
export const getShiprocketToken = async (forceRefresh = false) => {
    const cacheKey = getCacheKey();
    const cached = _srTokenCache.get(cacheKey);

    if (!forceRefresh && cached?.token && cached?.expiry && Date.now() < cached.expiry) {
        console.log(`🔑 [SHIPROCKET AUTH] Using cached token for ${cacheKey} (TTL remaining).`);
        return cached.token;
    }

    const env = resolveShiprocketEnvironment();
    const srBase = env.baseUrl;
    const isSandbox = env.isSandbox;
    const email = env.email;
    const password = isSandbox
        ? (process.env.SHIPROCKET_SANDBOX_PASSWORD || (process.env.SHIPROCKET_USE_SANDBOX === "false" ? "" : process.env.SHIPROCKET_PASSWORD))
        : (process.env.SHIPROCKET_LIVE_PASSWORD || process.env.SHIPROCKET_PASSWORD);

    if (!email || !password) {
        const err = new Error(
            `Shiprocket credentials missing for ${isSandbox ? "sandbox" : "production"}: set email and password in environment.`
        );
        console.error("❌ [SHIPROCKET AUTH] Login halted:", err.message);
        throw err;
    }

    console.log(`🔐 [SHIPROCKET AUTH] Attempting login to: ${srBase}/auth/login (User: ${email ? email.slice(0, 3) + '***@' + email.split('@')[1] : ''}, Env: ${env.environment})`);
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

        const token = res.data.token;
        _srTokenCache.set(cacheKey, {
            token,
            expiry: Date.now() + TOKEN_CACHE_MS,
        });

        console.log(`✅ [SHIPROCKET AUTH] Authenticated successfully [HTTP ${res.status}] for ${cacheKey}.`);
        return token;
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
            const targetBase = config.baseURL || (config.url?.startsWith('/courier/serviceability') ? getSrServiceabilityBase() : getSrBase());
            const client = axios.create({
                baseURL: targetBase,
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
            const errMsg = String(error?.response?.data?.message || error.message || '').toLowerCase();
            const isAuthError = status === 401 || status === 498 || (status === 403 && (errMsg.includes('token') || errMsg.includes('expired') || errMsg.includes('unauthorized')));

            // Expired/invalid token → re-authenticate and retry (bounded to maxRetries)
            if (isAuthError && attempts <= maxRetries) {
                console.warn(`⚠️ Shiprocket auth rejected [HTTP ${status}] — refreshing token and retrying (${attempts}/${maxRetries})...`);
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
    weight,
    cod = 0
) => {
    const numWeight = Number(weight);
    if (!numWeight || numWeight <= 0) {
        throw new Error("Shiprocket serviceability requires a confirmed positive weight in grams. Fallback defaults (500g / 0.5kg) are prohibited.");
    }
    const res = await makeSrRequest({
        baseURL: getSrServiceabilityBase(),
        method: "GET",
        url: "/courier/serviceability/",
        params: {
            pickup_postcode: pickupPostcode,
            delivery_postcode: deliveryPostcode,
            weight: numWeight / 1000, // Shiprocket expects kg
            cod,
        },
    });
    return res.data;
};

/**
 * Look up an existing order by its channel order ID or order number in Shiprocket.
 * Used for idempotency reconciliation to prevent duplicate orders across network timeouts or process crashes.
 *
 * @param {string} orderNumber - Channel order number (e.g. GF-2026-000054)
 * @returns {Object|null} Matching Shiprocket order record if found, or null
 */
export const findUpstreamOrder = async (orderNumber) => {
    if (!orderNumber) return null;
    const cleanNumber = String(orderNumber).trim();
    const res = await makeSrRequest({
        method: "GET",
        url: "/orders",
        params: {
            search: cleanNumber,
            per_page: 5,
        },
    });
    const orders = res.data?.data || [];
    const cleanTarget = cleanNumber.toLowerCase();
    const matched = orders.find((o) => {
        const coid = String(o.channel_order_id || "").trim().toLowerCase();
        const oid = String(o.order_id || "").trim().toLowerCase();
        const id = String(o.id || "").trim().toLowerCase();
        return coid === cleanTarget || oid === cleanTarget || id === cleanTarget;
    });
    return matched || null;
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
    const pickupLocation = (
        customOptions.pickupLocation ||
        customOptions.warehouse?.pickupLocation ||
        getShiprocketPickupLocation()
    ).trim();

    const shippingAddr = order.shippingAddress || {};
    const b2bDetails = customOptions.b2bDetails || {};
    const isB2B = (customOptions.orderType || "").toUpperCase() === "B2B" || Boolean(b2bDetails.companyName || shippingAddr.companyName);

    // Customer name: split into first & last name (max 50 chars each)
    const rawFullName = (b2bDetails.contactPerson || shippingAddr.fullName || "Customer").trim();
    const nameParts = rawFullName.split(/\s+/);
    const firstName = (nameParts[0] || "Customer").slice(0, 50);
    const lastName = (nameParts.slice(1).join(" ") || "").slice(0, 50);

    // Sanitize phone (must be 10 digits)
    const cleanPhone = (b2bDetails.phone || shippingAddr.phone || "")
        .replace(/\D/g, "")
        .slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
        throw new Error("Shiprocket order creation failed: Valid 10-digit customer phone number is required.");
    }

    // Sanitize pincode (must be 6 digits)
    const cleanPincode = (b2bDetails.pincode || shippingAddr.pincode || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 6);
    if (!cleanPincode || cleanPincode.length !== 6) {
        throw new Error("Shiprocket order creation failed: Valid 6-digit delivery pincode is required.");
    }

    const cleanAddress = (b2bDetails.address || shippingAddr.streetAddress || "").trim();
    if (!cleanAddress) {
        throw new Error("Shiprocket order creation failed: Customer street address is required.");
    }

    const cleanCity = (b2bDetails.city || shippingAddr.city || "").trim();
    const cleanState = (b2bDetails.state || shippingAddr.state || "").trim();
    if (!cleanCity || !cleanState) {
        throw new Error("Shiprocket order creation failed: Delivery city and state are required.");
    }

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

    // Package weight & dimensions - require confirmed weight
    const pkg = customOptions.package || customOptions.pkg || order.shippingDetails?.package || {};
    const rawWeight = Number(pkg.weight);
    if (!rawWeight || rawWeight <= 0) {
        throw new Error("Shiprocket order creation failed: Confirmed package weight (> 0g) is required.");
    }
    const weightKg = rawWeight > 10 ? Number((rawWeight / 1000).toFixed(3)) : Number(rawWeight.toFixed(3));

    const lengthCm = Math.max(1, Math.round(Number(pkg.length) || 10));
    const breadthCm = Math.max(1, Math.round(Number(pkg.breadth) || 10));
    const heightCm = Math.max(1, Math.round(Number(pkg.height) || 10));

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
        billing_address: cleanAddress,
        billing_address_2: (shippingAddr.landmark || "").trim(),
        billing_city: cleanCity,
        billing_pincode: cleanPincode,
        billing_state: cleanState,
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
 * Fetch all registered warehouse pickup locations from Shiprocket (read-only).
 * GET /settings/company/pickup
 * @returns {Promise<Array>} List of registered pickup location objects
 */
export const getPickupLocations = async () => {
    const res = await makeSrRequest({
        method: "GET",
        url: "/settings/company/pickup",
    });
    return res.data?.data?.shipping_address || [];
};

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
