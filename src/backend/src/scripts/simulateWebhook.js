import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import axios from "axios";
import { connectDB } from "../db/connectDB.js";
import { Order } from "../models/order.model.js";

async function simulate() {
    await connectDB();

    const statusArg = process.argv[2] || "DELIVERED";
    console.log(`\n🚚 Simulating Shiprocket Webhook Event: "${statusArg}"...`);

    // Find the latest order in the database
    const order = await Order.findOne().sort({ createdAt: -1 });
    if (!order) {
        console.error("❌ No orders found in database to simulate status for.");
        process.exit(1);
    }

    console.log(`📦 Found latest Order: ${order._id} (Current Status: "${order.orderStatus}")`);

    const payload = {
        order_id: order.easebuzzOrderId || order.razorpayOrderId || order._id.toString(),
        ...(order.shippingDetails?.shiprocketOrderId ? { sr_order_id: order.shippingDetails.shiprocketOrderId } : {}),
        ...(order.shippingDetails?.shiprocketShipmentId ? { shipment_id: order.shippingDetails.shiprocketShipmentId } : {}),
        current_status: statusArg.toUpperCase(),
        courier_name: order.shippingDetails?.courierName || "Delhivery Surface",
        ...(order.shippingDetails?.trackingNumber ? { awb: order.shippingDetails.trackingNumber } : {}),
        scans: [
            {
                date: new Date().toISOString(),
                activity: `Shipment status updated to ${statusArg}`,
                location: "Delhi Hub",
                "sr-status-label": statusArg.toUpperCase(),
            },
        ],
    };

    const webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET;

    try {
        const port = process.env.PORT || 5500;
        const res = await axios.post(
            `http://localhost:${port}/api/shipping/delivery-update`,
            payload,
            {
                headers: {
                    "x-api-key": webhookSecret,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Webhook processed successfully by backend:", res.data);

        // Fetch updated order from DB
        const updatedOrder = await Order.findById(order._id);
        console.log(`🎉 Updated Order Status in DB: "${updatedOrder.orderStatus}"`);
        console.log(`📜 Status History Notes:`, updatedOrder.statusHistory.slice(-2));
    } catch (err) {
        console.error("❌ Simulation failed:", err.response?.data || err.message);
    }

    process.exit(0);
}

simulate();
