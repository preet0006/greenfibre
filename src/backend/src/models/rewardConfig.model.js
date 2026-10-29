/**
 * rewardConfig.model.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton config document for the B2C Reward Points system.
 * Only one document exists (keyed by "_key": "singleton").
 * Admin edits via PUT /api/admin/rewards/config.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const rewardConfigSchema = new mongoose.Schema(
    {
        // Singleton key — only one document allowed
        _key: {
            type: String,
            default: "singleton",
            unique: true,
        },

        // % of paid item value credited as reward points after each order
        earn_percent: {
            type: Number,
            default: 2.5,
            min: 0,
            max: 100,
        },

        // % baked into discountedPrice (read-only display; not applied here)
        direct_percent: {
            type: Number,
            default: 15.0,
            min: 0,
            max: 100,
        },

        // % for the first-order coupon (display only; actual value is in Coupon doc)
        coupon_percent: {
            type: Number,
            default: 2.5,
            min: 0,
            max: 100,
        },

        // ₹ value of 1 reward point (e.g., 1 = ₹1 per point)
        point_value: {
            type: Number,
            default: 1,
            min: 0.01,
        },

        // Max % of cart value that can be redeemed in a single order
        max_redeem_percent: {
            type: Number,
            default: 2.5,
            min: 0,
            max: 100,
        },

        // Minimum cart value (MRP) before rewards redemption is allowed
        min_order_value: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Days until earned points expire. 0 = never expire.
        expiry_days: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Global kill switch — false = no earning or redeeming
        is_active: {
            type: Boolean,
            default: true,
        },

        // Admin who last updated this config (audit)
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const RewardConfig = mongoose.model("RewardConfig", rewardConfigSchema);
