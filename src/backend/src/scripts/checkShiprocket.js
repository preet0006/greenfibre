import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import axios from "axios";
import { getShiprocketToken } from "../utils/shiprocket.js";

async function main() {
    console.log("==================================================");
    console.log("🔍 Checking Shiprocket Live API Environment (Diagnostic Mode)...");
    console.log("==================================================");

    let token;
    try {
        token = await getShiprocketToken(true);
        console.log("✅ Authenticated successfully.");
        console.log(`🔑 Token: ${token.slice(0, 25)}...`);
    } catch (err) {
        console.error("❌ Authentication failed:", err.response?.data || err.message);
        return;
    }

    const srBase = "https://apiv2.shiprocket.in/v1/external";
    const client = axios.create({
        baseURL: srBase,
        timeout: 15000,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    // 1. Check Pickup Addresses
    console.log("\n📍 Checking Registered Pickup Locations:");
    try {
        const pickupRes = await client.get("/settings/company/pickup");
        const addresses = pickupRes.data?.data?.shipping_address || [];
        if (addresses.length === 0) {
            console.log("   ℹ️ No pickup addresses registered yet.");
        } else {
            addresses.forEach((addr, idx) => {
                console.log(`   ${idx + 1}. [${addr.pickup_location || addr.pickup_code}] ${addr.name}, ${addr.city} (${addr.pin_code})`);
            });
        }
    } catch (err) {
        console.warn("   ⚠️ Could not fetch pickup locations:", err.response?.data?.message || err.message);
    }

    // 2. Test Courier Serviceability
    console.log("\n🚚 Testing Courier Serviceability (Delhi to Mumbai, 500g):");
    try {
        const srvRes = await client.get("/courier/serviceability/", {
            params: {
                pickup_postcode: "110001",
                delivery_postcode: "400001",
                weight: 0.5,
                cod: 0,
            },
        });
        const couriers = srvRes.data?.data?.available_courier_companies || [];
        console.log(`   ✅ Serviceability check passed! Found ${couriers.length} available courier partners.`);
    } catch (err) {
        console.warn("   ⚠️ Serviceability check error:", err.response?.data?.message || err.message);
    }

    // 3. Fetch Orders in Sandbox
    console.log("\n📦 Fetching Orders in Shiprocket Sandbox:");
    try {
        const ordersRes = await client.get("/orders");
        const orders = ordersRes.data?.data || [];
        if (orders.length === 0) {
            console.log("   ℹ️ No orders in sandbox yet.");
        } else {
            console.log(`   Found ${orders.length} order(s):`);
            orders.forEach((o, idx) => {
                console.log(`   ${idx + 1}. Order ID: ${o.id} | Ref: ${o.channel_order_id} | Status: ${o.status} | Total: ₹${o.total}`);
            });
        }
    } catch (err) {
        console.warn("   ⚠️ Could not fetch orders:", err.response?.data?.message || err.message);
    }

    console.log("\n==================================================");
    console.log("✅ Diagnostics finished!");
    console.log("==================================================");
}

main();
