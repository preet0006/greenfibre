/**
 * seedRewards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent upsert of:
 *   1. The default RewardConfig singleton.
 *   2. The first-order coupon (code: FIRSTORDER).
 *
 * Safe to run on every deploy — never overwrites changes made from admin UI.
 * Usage: node src/scripts/seedRewards.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { RewardConfig } from "../models/rewardConfig.model.js";
import { Coupon } from "../models/coupon.model.js";

async function seed() {
    await connectDB();
    console.log("\n🌱 Seeding Reward Points system...\n");

    // 1. Seed RewardConfig singleton (only if it doesn't exist)
    const existingConfig = await RewardConfig.findOne({ _key: "singleton" });
    if (existingConfig) {
        console.log("✅ RewardConfig already exists — skipping (admin edits preserved).");
        console.log("   Current config:", JSON.stringify({
            earn_percent:       existingConfig.earn_percent,
            direct_percent:     existingConfig.direct_percent,
            coupon_percent:     existingConfig.coupon_percent,
            point_value:        existingConfig.point_value,
            max_redeem_percent: existingConfig.max_redeem_percent,
            min_order_value:    existingConfig.min_order_value,
            is_active:          existingConfig.is_active,
        }, null, 2));
    } else {
        const cfg = await RewardConfig.create({
            _key:               "singleton",
            earn_percent:       2.5,
            direct_percent:     15.0,
            coupon_percent:     2.5,
            point_value:        1,
            max_redeem_percent: 2.5,
            min_order_value:    0,
            expiry_days:        0,
            is_active:          true,
        });
        console.log("✅ RewardConfig created with defaults:", cfg._id.toString());
    }

    // 2. Seed first-order coupon (only if no coupon with isFirstOrderCoupon: true exists)
    const existingFirstOrderCoupon = await Coupon.findOne({ isFirstOrderCoupon: true });
    if (existingFirstOrderCoupon) {
        console.log(`\n✅ First-order coupon already exists: ${existingFirstOrderCoupon.code} — skipping.`);
    } else {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 10); // 10 years from now

        const coupon = await Coupon.create({
            code:               "FIRSTORDER",
            discountType:       "percentage",
            discountValue:      2.5,
            minOrderAmount:     0,
            maxDiscountAmount:  0,     // no cap
            expiryDate,
            usageLimit:         0,     // unlimited total (per-user limit enforces 1 use)
            perUserLimit:       1,     // one use per user
            isFirstOrderCoupon: true,
            isActive:           true,
        });
        console.log(`\n✅ First-order coupon created: ${coupon.code} (${coupon.discountValue}% off, perUserLimit: 1)`);
        console.log("   📌 Share this code with customers or display it in the checkout UI.");
    }

    console.log("\n✨ Reward Points seed complete.\n");
    await mongoose.connection.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
