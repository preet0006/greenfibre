import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../db/connectDB.js";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { Address } from "../models/address.model.js";
import { autoFulfillOrder } from "../utils/shiprocket.js";

async function placeCartOrder() {
    await connectDB();

    console.log("==================================================");
    console.log("🛒 Converting Cart into Confirmed Placed Order...");
    console.log("==================================================");

    // 1. Find cart with items
    const userEmail = process.argv[2]?.trim()?.toLowerCase();
    let targetUser;

    if (userEmail) {
        targetUser = await User.findOne({ email: userEmail });
    }

    let cart;
    if (targetUser) {
        cart = await Cart.findOne({ user: targetUser._id }).populate("items.product");
    } else {
        // Find any cart that has items
        cart = await Cart.findOne({ "items.0": { $exists: true } }).populate("items.product");
        if (cart) {
            targetUser = await User.findById(cart.user);
        }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        console.log("❌ No active cart with items found in database.");
        console.log("👉 Please make sure you are logged in and have added the product to your cart.");
        process.exit(1);
    }

    console.log(`👤 Customer: ${targetUser?.full_name || "User"} (${targetUser?.email})`);
    console.log(`📦 Cart has ${cart.items.length} item(s):`);

    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
        const prod = item.product;
        const color = prod?.colors?.[item.colorIndex] || {};
        const firstImg = color.images?.[0];
        const imgUrl = typeof firstImg === "string" ? firstImg : firstImg?.original || firstImg?.card || "";

        console.log(`   - ${prod?.name || "Product"} | ${item.colorName} | Qty: ${item.quantity} | ₹${item.price}`);

        orderItems.push({
            product: prod?._id,
            name: prod?.name || "Eco-Serve Soup Bowl 350ml",
            image: imgUrl,
            colorIndex: item.colorIndex,
            colorName: item.colorName,
            colorHex: item.colorHex || "#2d6a4f",
            quantity: item.quantity,
            price: item.price,
        });

        totalAmount += item.price * item.quantity;
    }

    // 2. Find shipping address for this user or create standard delivery address
    let savedAddress = await Address.findOne({ user: targetUser?._id, isDefault: true }) ||
                       await Address.findOne({ user: targetUser?._id });

    const shippingAddress = {
        fullName: savedAddress?.fullName || targetUser?.full_name || "Puneet Sharma",
        companyName: savedAddress?.companyName || "Green Fibre",
        streetAddress: savedAddress?.streetAddress || "Flat 101, Green Heights, MG Road",
        landmark: savedAddress?.landmark || "Near City Park",
        city: savedAddress?.city || "Abohar",
        state: savedAddress?.state || "Punjab",
        pincode: savedAddress?.pincode || "152116",
        phone: savedAddress?.phone || targetUser?.phone || "9876543210",
        email: targetUser?.email || "puneet@example.com",
    };

    // 3. Create the Order in MongoDB
    const randomTxn = `TEST_PAY_${Date.now()}`;
    const newOrder = await Order.create({
        user: targetUser._id,
        items: orderItems,
        shippingAddress: shippingAddress,
        totalAmount: totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        paymentMethod: "Test / Easebuzz",
        paymentStatus: "paid",
        orderStatus: "placed",
        easebuzzOrderId: `EB_${Date.now()}`,
        transactionId: randomTxn,
        shippingDetails: {
            courierName: "",
            trackingNumber: "",
            trackingUrl: "",
        },
        statusHistory: [
            {
                status: "placed",
                timestamp: new Date(),
                note: "Order placed successfully (Test Checkout)",
            },
        ],
    });

    // 5. Automatically fulfill via Shiprocket
    console.log("\n🚀 Triggering Automated Shiprocket Fulfillment...");
    await autoFulfillOrder(newOrder);

    // Refresh order from DB
    const refreshed = await Order.findById(newOrder._id);

    console.log("\n🎉 Order Processed & Dispatched Successfully!");
    console.log("--------------------------------------------------");
    console.log(`🆔 Order ID:              ${refreshed._id}`);
    console.log(`💵 Total Amount:           ₹${refreshed.finalAmount}`);
    console.log(`📍 Delivery Address:      ${shippingAddress.streetAddress}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`);
    console.log(`📊 Final Order Status:     "${refreshed.orderStatus}"`);
    console.log(`💳 Payment Status:        "${refreshed.paymentStatus}"`);
    if (refreshed.shippingDetails?.shiprocketOrderId) {
        console.log(`📦 Shiprocket Order ID:   ${refreshed.shippingDetails.shiprocketOrderId}`);
    }
    if (refreshed.shippingDetails?.trackingNumber) {
        console.log(`🚚 AWB Tracking Number:    ${refreshed.shippingDetails.trackingNumber}`);
        console.log(`🔗 Tracking Link:          ${refreshed.shippingDetails.trackingUrl}`);
    }
    console.log("--------------------------------------------------");
    console.log("\n👉 Next steps:");
    console.log("1. Check your Customer Account: http://localhost:3000/account/orders");
    console.log("2. Check Admin Portal:         http://localhost:3001/dashboard/orders");
    console.log("3. Simulate live courier scans: node src/backend/src/scripts/simulateWebhook.js DELIVERED");
    console.log("==================================================");

    process.exit(0);
}

placeCartOrder().catch((err) => {
    console.error("❌ Error placing cart order:", err);
    process.exit(1);
});
