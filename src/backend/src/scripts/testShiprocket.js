/**
 * testShiprocket.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Green Fibre × Shiprocket Sandbox Test Script
 *
 * Runs the full Shiprocket API lifecycle against the SANDBOX environment:
 *
 *  STEP 1:  Authentication
 *  STEP 2:  Token verification
 *  STEP 3:  List registered pickup addresses
 *  STEP 4:  Courier serviceability check (Delhi → Mumbai, 500g prepaid)
 *  STEP 5:  Create a test order (mock Green Fibre order)
 *  STEP 6:  Assign AWB (auto-select best courier)
 *  STEP 7:  Request pickup
 *  STEP 8:  Generate shipping label
 *  STEP 9:  Track shipment by AWB
 *  STEP 10: List all sandbox orders
 *  STEP 11: Cancel the test order (clean up sandbox)
 *
 * Usage:
 *   npm run test:shiprocket
 *   # or directly:
 *   node src/scripts/testShiprocket.js
 *
 * Prerequisites:
 *   .env must have SHIPROCKET_USE_SANDBOX=true and valid SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import axios from "axios";

// ── Config ──────────────────────────────────────────────────────────────────
// Shiprocket Sandbox uses a DIFFERENT API domain from live:
//   Sandbox general  : https://api-sandbox.shiprocket.in/v1/external
//   Sandbox svc      : https://serviceability-sandbox.shiprocket.in/v1/external
//   Live             : https://apiv2.shiprocket.in/v1/external
const SR_LIVE_BASE = "https://apiv2.shiprocket.in/v1/external";
const SR_SBX_BASE  = "https://api-sandbox.shiprocket.in/v1/external";
const SR_SBX_SVC   = "https://serviceability-sandbox.shiprocket.in/v1/external";

const useSandbox = process.env.SHIPROCKET_USE_SANDBOX === "true";
const isTestMode = process.env.SHIPROCKET_TEST_MODE === "true";

const srBase    = useSandbox ? SR_SBX_BASE  : SR_LIVE_BASE;
const srSvcBase = useSandbox ? SR_SBX_SVC   : SR_LIVE_BASE;

// Use sandbox-specific credentials if available, otherwise fall back to main
const EMAIL    = (useSandbox && process.env.SHIPROCKET_SANDBOX_EMAIL)
    ? process.env.SHIPROCKET_SANDBOX_EMAIL
    : process.env.SHIPROCKET_EMAIL;
const PASSWORD = (useSandbox && process.env.SHIPROCKET_SANDBOX_PASSWORD)
    ? process.env.SHIPROCKET_SANDBOX_PASSWORD
    : process.env.SHIPROCKET_PASSWORD;

// ── Test order data (mock Green Fibre order) ─────────────────────────────────
const TEST_ORDER_ID = `TEST-GF-${Date.now()}`;
const TEST_ORDER = {
    order_id: TEST_ORDER_ID,
    order_date: new Date().toISOString().replace("T", " ").slice(0, 19),
    pickup_location: "Primary", // Adjust if your pickup location has a different name in sandbox

    billing_customer_name: "Rahul",
    billing_last_name: "Sharma",
    billing_address: "42 Eco Street, Green Park",
    billing_address_2: "Near City Mall",
    billing_city: "Delhi",
    billing_pincode: "110016",
    billing_state: "Delhi",
    billing_country: "India",
    billing_email: "rahul.test@greenfibre.org",
    billing_phone: "9876543210",

    shipping_is_billing: true,

    order_items: [
        {
            name: "Eco-Friendly Rice Husk Cup",
            sku: "GF-RHC-001",
            units: 2,
            selling_price: 399,
            discount: 0,
            tax: 0,
            hsn: "",
        },
    ],

    payment_method: "Prepaid",
    sub_total: 798,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const PASS = "✅";
const FAIL = "❌";
const INFO = "ℹ️ ";
const WARN = "⚠️ ";

let results = [];

function step(num, title) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`  STEP ${num}: ${title}`);
    console.log(`${"─".repeat(60)}`);
}

function log(icon, msg, data = null) {
    console.log(`  ${icon} ${msg}`);
    if (data !== null) {
        console.log("     →", typeof data === "object" ? JSON.stringify(data, null, 2).split("\n").slice(0, 30).join("\n") : data);
    }
}

function record(stepNum, title, passed, detail = "") {
    results.push({ step: stepNum, title, passed, detail });
}

function makeClient(token) {
    return axios.create({
        baseURL: srBase,
        timeout: 60000, // 60s — sandbox can be slow
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n" + "═".repeat(60));
    console.log("  🌿 GREEN FIBRE × SHIPROCKET SANDBOX TEST SUITE");
    console.log("═".repeat(60));
    console.log(`  Environment : ${useSandbox ? "🟡 SANDBOX MODE (api-sandbox.shiprocket.in)" : "🔴 LIVE PRODUCTION"}`);
    console.log(`  Test Mode   : ${isTestMode ? "YES (TEST- prefix on order IDs)" : "NO"}`);
    console.log(`  Base URL    : ${srBase}`);
    console.log(`  Email       : ${EMAIL}`);
    console.log(`  Order ID    : ${TEST_ORDER_ID}`);
    console.log("═".repeat(60));

    if (!EMAIL || !PASSWORD) {
        console.log(`\n${FAIL} Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in .env\n`);
        process.exit(1);
    }

    let token = null;
    let srOrderId = null;
    let srShipmentId = null;
    let awbCode = null;

    // ── STEP 1: Authentication ──────────────────────────────────────────────
    step(1, "Authentication — POST /auth/login");
    try {
        const res = await axios.post(
            `${srBase}/auth/login`,
            { email: EMAIL, password: PASSWORD },
            { headers: { "Content-Type": "application/json" }, timeout: 15000 }
        );
        token = res.data?.token;
        if (!token) throw new Error("No token in response: " + JSON.stringify(res.data));
        log(PASS, "Authenticated successfully!");
        log(INFO, `Token prefix: ${token.slice(0, 30)}...`);
        record(1, "Authentication", true);
    } catch (err) {
        log(FAIL, "Authentication FAILED:", err.response?.data || err.message);
        record(1, "Authentication", false, err.response?.data?.message || err.message);
        console.log("\n🛑 Cannot continue without a token. Check your credentials.\n");
        printSummary();
        process.exit(1);
    }

    const client = makeClient(token);

    // ── STEP 2: Token verification ──────────────────────────────────────────
    step(2, "Token Verification — GET /settings/company");
    try {
        const res = await client.get("/settings/company");
        const company = res.data?.data || res.data;
        log(PASS, "Token is valid. Company details fetched.");
        log(INFO, `Company: ${company?.name || company?.company_name || "(details in response)"}`);
        record(2, "Token Verification", true);
    } catch (err) {
        log(WARN, "Company endpoint error (non-fatal):", err.response?.data || err.message);
        log(INFO, "Token is likely still valid — continuing.");
        record(2, "Token Verification", false, "Non-fatal: " + (err.response?.data?.message || err.message));
    }

    // ── STEP 3: List pickup addresses ───────────────────────────────────────
    step(3, "Pickup Addresses — GET /settings/company/pickup");
    try {
        const res = await client.get("/settings/company/pickup");
        const addresses = res.data?.data?.shipping_address || [];
        if (addresses.length === 0) {
            log(WARN, "No pickup addresses registered in sandbox. Order creation may fail.");
            log(INFO, "Add a pickup address in your Shiprocket sandbox panel first.");
            record(3, "Pickup Addresses", false, "No addresses registered");
        } else {
            log(PASS, `Found ${addresses.length} pickup address(es):`);
            addresses.forEach((addr, i) => {
                log(INFO, `  ${i + 1}. [${addr.pickup_location || addr.pickup_code}] ${addr.name} — ${addr.city} (${addr.pin_code})`);
            });
            // Update test order pickup_location to use first available
            TEST_ORDER.pickup_location = addresses[0].pickup_location || addresses[0].pickup_code || "Primary";
            log(INFO, `Using pickup location: "${TEST_ORDER.pickup_location}"`);
            record(3, "Pickup Addresses", true);
        }
    } catch (err) {
        log(WARN, "Could not fetch pickup addresses (non-fatal):", err.response?.data?.message || err.message);
        record(3, "Pickup Addresses", false, "Non-fatal: " + (err.response?.data?.message || err.message));
    }

    // ── STEP 4: Courier serviceability ──────────────────────────────────────
    step(4, "Courier Serviceability — GET /courier/serviceability/");
    let preferredCourierId = null;
    let preferredCourierName = "";
    try {
        const res = await client.get("/courier/serviceability/", {
            params: {
                pickup_postcode: "110016",   // Delhi
                delivery_postcode: "400001", // Mumbai
                weight: 0.5,
                cod: 0,
            },
        });
        const couriers = res.data?.data?.available_courier_companies || [];
        if (couriers.length === 0) {
            log(WARN, "No couriers available for this route in sandbox.");
            record(4, "Courier Serviceability", false, "No couriers available");
        } else {
            log(PASS, `${couriers.length} courier(s) available for Delhi \u2192 Mumbai:`);
            couriers.slice(0, 5).forEach((c) =>
                log(INFO, `  \u2022 ${c.courier_name} (id:${c.courier_company_id}) \u2014 \u20b9${c.rate} (${c.etd})`)
            );
            // Blue Dart fails with BD-003 in sandbox — prefer Delhivery or Xpressbees
            const PREFER = ["delhivery", "xpressbees", "ekart", "ecom"];
            const preferred = couriers.find((c) =>
                PREFER.some((p) => c.courier_name?.toLowerCase().includes(p))
            ) || couriers.find((c) => !c.courier_name?.toLowerCase().includes("blue dart"));
            if (preferred) {
                preferredCourierId = preferred.courier_company_id;
                preferredCourierName = preferred.courier_name;
                log(INFO, `  Selected for AWB: ${preferredCourierName} (id: ${preferredCourierId})`);
            }
            record(4, "Courier Serviceability", true);
        }
    } catch (err) {
        log(FAIL, "Serviceability check failed:", err.response?.data || err.message);
        record(4, "Courier Serviceability", false, err.response?.data?.message || err.message);
    }

    // ── STEP 5: Create test order ────────────────────────────────────────────
    step(5, `Create Order — POST /orders/create/adhoc [order_id: ${TEST_ORDER_ID}]`);
    try {
        log(INFO, "Creating order with payload:", TEST_ORDER);
        const res = await client.post("/orders/create/adhoc", TEST_ORDER);
        srOrderId = String(res.data?.order_id || res.data?.sr_order_id || "");
        srShipmentId = String(res.data?.shipment_id || "");

        if (!srOrderId && !srShipmentId) {
            throw new Error("No order_id or shipment_id in response: " + JSON.stringify(res.data));
        }

        log(PASS, "Order created successfully!");
        log(INFO, `  SR Order ID  : ${srOrderId}`);
        log(INFO, `  Shipment ID  : ${srShipmentId}`);
        log(INFO, `  Status       : ${res.data?.status || res.data?.order_status || "—"}`);
        record(5, "Create Order", true);
    } catch (err) {
        log(FAIL, "Order creation FAILED:", err.response?.data || err.message);
        record(5, "Create Order", false, err.response?.data?.message || err.message);
        log(WARN, "Cannot generate AWB without an order. Skipping Steps 6–9.");
        await runFinalSteps(client, srOrderId, results);
        return;
    }

    // ── STEP 6: Assign AWB ───────────────────────────────────────────────────
    step(6, `Assign AWB — POST /courier/assign/awb [shipment_id: ${srShipmentId}]`);
    try {
        // Blue Dart (BD-003) fails in sandbox — pass a specific courier_id if we found one
        const awbPayload = { shipment_id: srShipmentId };
        if (preferredCourierId) {
            awbPayload.courier_id = preferredCourierId;
            log(INFO, `  Using courier: ${preferredCourierName} (id: ${preferredCourierId})`);
        }
        const res = await client.post("/courier/assign/awb", awbPayload, { timeout: 90000 });

        const respData = res.data?.response?.data || res.data?.data || res.data || {};
        awbCode = respData.awb_code || res.data?.awb_code;
        const courierName = respData.courier_name || respData.assigned_courier || "";

        if (!awbCode) {
            const errMsg = respData.awb_assign_error || res.data?.message || JSON.stringify(res.data);
            throw new Error(errMsg);
        }

        log(PASS, "AWB assigned successfully!");
        log(INFO, `  AWB Code    : ${awbCode}`);
        log(INFO, `  Courier     : ${courierName}`);
        log(INFO, `  Tracking URL: https://shiprocket.co/tracking/${awbCode}`);
        record(6, "Assign AWB", true);
    } catch (err) {
        log(FAIL, "AWB assignment FAILED:", err.response?.data || err.message);
        record(6, "Assign AWB", false, err.response?.data?.message || err.message);
        log(WARN, "Skipping pickup and tracking steps.");
    }

    // ── STEP 7: Request pickup ───────────────────────────────────────────────
    step(7, `Request Pickup — POST /courier/generate/pickup [shipment_id: ${srShipmentId}]`);
    if (!srShipmentId) {
        log(WARN, "No shipment ID — skipping pickup.");
        record(7, "Request Pickup", false, "Skipped — no shipment ID");
    } else {
        try {
            const res = await client.post("/courier/generate/pickup", {
                shipment_id: [srShipmentId],
            });
            const pickupData = res.data?.response || res.data;
            log(PASS, "Pickup requested successfully!");
            log(INFO, "Response:", pickupData);
            record(7, "Request Pickup", true);
        } catch (err) {
            log(WARN, "Pickup request failed (may be sandbox limitation):", err.response?.data?.message || err.message);
            record(7, "Request Pickup", false, err.response?.data?.message || err.message);
        }
    }

    // ── STEP 8: Generate label ───────────────────────────────────────────────
    step(8, `Generate Label — POST /courier/generate/label`);
    if (!srShipmentId) {
        log(WARN, "No shipment ID — skipping label generation.");
        record(8, "Generate Label", false, "Skipped — no shipment ID");
    } else {
        try {
            const res = await client.post("/courier/generate/label", {
                shipment_id: [srShipmentId],
            });
            const labelUrl = res.data?.label_url;
            if (labelUrl) {
                log(PASS, "Label generated successfully!");
                log(INFO, `  Label URL: ${labelUrl}`);
            } else {
                log(WARN, "Label URL not returned yet (may need courier pickup first):", res.data);
            }
            record(8, "Generate Label", !!labelUrl, labelUrl || JSON.stringify(res.data));
        } catch (err) {
            log(WARN, "Label generation failed (may require pickup first):", err.response?.data?.message || err.message);
            record(8, "Generate Label", false, err.response?.data?.message || err.message);
        }
    }

    // ── STEP 9: Track by AWB ─────────────────────────────────────────────────
    step(9, `Track Shipment — GET /courier/track/awb/${awbCode || "<not assigned>"}`);
    if (!awbCode) {
        log(WARN, "No AWB code — skipping tracking.");
        record(9, "Track by AWB", false, "Skipped — no AWB assigned");
    } else {
        try {
            const res = await client.get(`/courier/track/awb/${awbCode}`);
            const tracking = res.data?.tracking_data || res.data;
            log(PASS, "Tracking info fetched!");
            log(INFO, `  Status: ${tracking?.shipment_status || tracking?.current_status || "—"}`);
            log(INFO, `  Detail: ${tracking?.shipment_track?.[0]?.current_status || "—"}`);
            record(9, "Track by AWB", true);
        } catch (err) {
            log(WARN, "Tracking fetch failed (normal for newly created orders):", err.response?.data?.message || err.message);
            record(9, "Track by AWB", false, err.response?.data?.message || err.message);
        }
    }

    await runFinalSteps(client, srOrderId, results);
}

async function runFinalSteps(client, srOrderId, results) {
    // ── STEP 10: List all sandbox orders ─────────────────────────────────────
    step(10, "List Sandbox Orders — GET /orders");
    try {
        const res = await client.get("/orders", { params: { per_page: 10, page: 1 } });
        const orders = res.data?.data || [];
        log(PASS, `Found ${orders.length} order(s) in sandbox:`);
        orders.slice(0, 5).forEach((o, i) => {
            log(INFO, `  ${i + 1}. Order ID: ${o.id} | Ref: ${o.channel_order_id} | Status: ${o.status} | ₹${o.total}`);
        });
        record(10, "List Sandbox Orders", true);
    } catch (err) {
        log(FAIL, "Failed to list orders:", err.response?.data?.message || err.message);
        record(10, "List Sandbox Orders", false, err.response?.data?.message || err.message);
    }

    // ── STEP 11: Cancel the test order ──────────────────────────────────────
    step(11, `Cancel Test Order — POST /orders/cancel [sr_order_id: ${srOrderId}]`);
    if (!srOrderId) {
        log(WARN, "No SR order ID to cancel — skipping cleanup.");
        record(11, "Cancel Test Order", false, "Skipped — no SR order ID");
    } else {
        try {
            const res = await client.post("/orders/cancel", {
                ids: [srOrderId],
            });
            log(PASS, "Test order cancelled (sandbox cleaned up).");
            log(INFO, "Response:", res.data);
            record(11, "Cancel Test Order", true);
        } catch (err) {
            log(WARN, "Cancellation failed (order may already be in a non-cancellable state):", err.response?.data?.message || err.message);
            record(11, "Cancel Test Order", false, err.response?.data?.message || err.message);
        }
    }

    printSummary();
}

function printSummary() {
    console.log("\n" + "═".repeat(60));
    console.log("  📊 TEST RESULTS SUMMARY");
    console.log("═".repeat(60));

    let passed = 0;
    let failed = 0;
    let warned = 0;

    results.forEach((r) => {
        const icon = r.passed ? "✅" : "❌";
        const detail = r.detail ? ` (${r.detail})` : "";
        console.log(`  ${icon} Step ${r.step}: ${r.title}${detail}`);
        if (r.passed) passed++;
        else if (r.detail?.startsWith("Non-fatal")) warned++;
        else failed++;
    });

    console.log("─".repeat(60));
    console.log(`  Passed : ${passed}`);
    console.log(`  Failed : ${failed}`);
    console.log(`  Warned : ${warned}`);
    console.log("═".repeat(60));

    if (failed === 0) {
        console.log("\n  🎉 All critical steps passed! Sandbox is ready.");
        console.log("  Next step: connect backend routes to your admin panel.");
    } else {
        console.log(`\n  ⚠️  ${failed} step(s) failed. Review the output above.`);
        console.log("  Common fixes:");
        console.log("   • Add a pickup address in sandbox.shiprocket.in → Settings → Pickup Address");
        console.log("   • Check your SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env");
        console.log("   • Make sure SHIPROCKET_USE_SANDBOX=true in .env");
    }

    console.log("");
}

main().catch((err) => {
    console.error("\n❌ Unexpected error in test suite:", err.message);
    process.exit(1);
});
