/**
 * releaseAbandonedRedemptions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cron job that finds orders that:
 *   - Have status: "pending" (payment never completed)
 *   - Have rewardPointsRedeemed > 0 (points were locked at creation)
 *   - Were created more than 30 minutes ago
 *
 * For each, it restores the locked reward points (REVERSE_REDEEM).
 *
 * Run via: node src/scripts/releaseAbandonedRedemptions.js
 * Cron schedule: Every 30 minutes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { Order } from "../models/order.model.js";
import { restoreRedeemedPoints } from "../services/rewards.service.js";

const ABANDON_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function releaseAbandoned() {
    await connectDB();
    console.log("\n⏰ Checking for abandoned redemptions...\n");

    const cutoff = new Date(Date.now() - ABANDON_TIMEOUT_MS);

    const abandonedOrders = await Order.find({
        orderStatus: "pending",
        paymentStatus: "pending",
        rewardPointsRedeemed: { $gt: 0 },
        createdAt: { $lt: cutoff },
    }).select("_id user rewardPointsRedeemed createdAt");

    console.log(`   Found ${abandonedOrders.length} abandoned orders with locked reward points.`);

    let released = 0;
    for (const order of abandonedOrders) {
        try {
            const result = await restoreRedeemedPoints(order, order.user);
            if (result) {
                released++;
                console.log(
                    `   ✅ Released ${result.pointsRestored} pts for order ${order._id} → user balance: ${result.newBalance}`
                );
                // Mark order as timed out so this cron doesn't pick it up again
                await Order.findByIdAndUpdate(order._id, {
                    $set: {
                        orderStatus: "failed",
                        paymentStatus: "failed",
                    },
                    $push: {
                        statusHistory: {
                            status: "failed",
                            timestamp: new Date(),
                            note: "Order timed out — reward points restored by cron.",
                        },
                    },
                });
            }
        } catch (err) {
            console.error(`   ❌ Error releasing order ${order._id}:`, err.message);
        }
    }

    console.log(`\n📊 Released reward points for ${released} / ${abandonedOrders.length} orders.`);
    console.log("✅ Done.\n");

    await mongoose.connection.close();
    process.exit(0);
}

releaseAbandoned().catch((err) => {
    console.error("❌ Release abandoned redemptions failed:", err);
    process.exit(1);
});
