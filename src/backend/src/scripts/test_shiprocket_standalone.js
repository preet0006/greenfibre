/**
 * test_shiprocket_standalone.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone verification script for Shiprocket API integration.
 * Tests Login, Pickup Location verification, and Create-Order directly.
 *
 * Usage:
 *   node src/scripts/test_shiprocket_standalone.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
    console.log("===============================================================");
    console.log("🚀 GREENFIBRE × SHIPROCKET DIRECT DIAGNOSTIC TEST");
    console.log("===============================================================");

    const baseUrl = (process.env.SHIPROCKET_BASE_URL || "https://api-sandbox.shiprocket.in/v1/external").trim().replace(/\/+$/, "");
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || "Primary").trim();

    console.log(`🌐 Base URL:         ${baseUrl}`);
    console.log(`👤 Configured User:  ${email || "(not set)"}`);
    console.log(`📍 Pickup Location:  "${pickupLocation}"`);
    console.log("---------------------------------------------------------------");

    if (!email || !password) {
        console.error("❌ Fatal: SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is missing in .env.");
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: AUTHENTICATION
    // ─────────────────────────────────────────────────────────────
    console.log("\n[STEP 1] Testing Shiprocket Authentication...");
    console.log(`POST ${baseUrl}/auth/login`);

    const isSandbox = baseUrl.includes("sandbox");
    const reqHeaders = {
        "Content-Type": "application/json",
        ...(isSandbox ? {
            "Referer": "https://sandbox.shiprocket.in/",
            "Origin": "https://sandbox.shiprocket.in",
        } : {}),
    };

    let token = null;
    try {
        const loginRes = await axios.post(
            `${baseUrl}/auth/login`,
            { email, password },
            {
                headers: reqHeaders,
                timeout: 15000,
            }
        );

        console.log(`✅ Login HTTP Status: ${loginRes.status}`);
        token = loginRes.data?.token;

        if (!token) {
            console.error("❌ Login succeeded but no token returned in response body:", loginRes.data);
            process.exit(1);
        }
        console.log(`🔑 Bearer Token received: ${token.slice(0, 15)}... (valid)`);
    } catch (err) {
        const status = err.response?.status || "NO_RESPONSE";
        const data = err.response?.data || err.message;
        console.error(`❌ [STEP 1 FAILED] Shiprocket Login Failed [HTTP ${status}]:`, data);

        if (status === 498) {
            console.error("👉 Reason: WAF / Gateway blocked request (Access Denied). Common on api-sandbox.shiprocket.in.");
        } else if (status === 401 || status === 404) {
            console.error("👉 Reason: Invalid email or password. Note: Shiprocket requires API user credentials from Settings > API, not dashboard password.");
        }
        process.exit(1);
    }

    const client = axios.create({
        baseURL: baseUrl,
        timeout: 20000,
        headers: {
            Authorization: `Bearer ${token}`,
            ...reqHeaders,
        },
    });

    // ─────────────────────────────────────────────────────────────
    // STEP 2: CHECK PICKUP LOCATIONS
    // ─────────────────────────────────────────────────────────────
    console.log("\n[STEP 2] Verifying Registered Pickup Locations...");
    try {
        const pickupRes = await client.get("/settings/company/pickup");
        const addresses = pickupRes.data?.data?.shipping_address || [];

        console.log(`✅ Fetched ${addresses.length} registered pickup location(s):`);
        let locationFound = false;
        addresses.forEach((addr, idx) => {
            const locName = addr.pickup_location || addr.pickup_code;
            const isMatch = locName?.toLowerCase() === pickupLocation.toLowerCase();
            if (isMatch) locationFound = true;
            console.log(`   ${idx + 1}. "${locName}" — ${addr.city}, ${addr.pin_code} ${isMatch ? "👈 (MATCHES .ENV)" : ""}`);
        });

        if (!locationFound) {
            console.warn(`\n⚠️ WARNING: Pickup location "${pickupLocation}" was NOT found in your Shiprocket account!`);
            console.warn(`👉 Update SHIPROCKET_PICKUP_LOCATION in .env to match one of the exact names above, otherwise order creation will fail with 422.`);
        }
    } catch (err) {
        console.warn("⚠️ Could not fetch pickup locations:", err.response?.data || err.message);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: DIRECT CREATE-ORDER (/orders/create/adhoc)
    // ─────────────────────────────────────────────────────────────
    console.log("\n[STEP 3] Testing Create Order (/orders/create/adhoc)...");

    const sampleOrderId = `TEST-DIAG-${Date.now()}`;
    const samplePayload = {
        order_id: sampleOrderId,
        order_date: new Date().toISOString().replace("T", " ").slice(0, 19),
        pickup_location: pickupLocation,

        billing_customer_name: "Test",
        billing_last_name: "Customer",
        billing_address: "123 Eco Avenue, Phase 1",
        billing_address_2: "Near Green Park",
        billing_city: "Delhi",
        billing_pincode: "110001",
        billing_state: "Delhi",
        billing_country: "India",
        billing_email: "test.customer@greenfibre.org",
        billing_phone: "9876543210",

        shipping_is_billing: true,

        order_items: [
            {
                name: "Green Fibre Bamboo Fiber Mug",
                sku: "GF-MUG-001",
                units: 1,
                selling_price: 299,
                discount: 0,
                tax: 0,
                hsn: "",
            },
        ],

        payment_method: "Prepaid",
        sub_total: 299,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5, // kg
    };

    console.log("📦 Sample Payload being sent:\n", JSON.stringify(samplePayload, null, 2));

    try {
        const orderRes = await client.post("/orders/create/adhoc", samplePayload);
        console.log(`\n✅ [STEP 3 SUCCESS] Shiprocket Order Created! Status: ${orderRes.status}`);
        console.log("📡 Response Body:\n", JSON.stringify(orderRes.data, null, 2));
        console.log(`\n🎉 Success! Check your Shiprocket dashboard (Orders > Processing) for Order #${sampleOrderId}.`);
    } catch (err) {
        const status = err.response?.status || "NO_RESPONSE";
        const errorData = err.response?.data || err.message;
        console.error(`\n❌ [STEP 3 FAILED] Order Creation Failed [HTTP ${status}]:\n`, JSON.stringify(errorData, null, 2));
    }

    console.log("\n===============================================================");
}

run().catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
});
