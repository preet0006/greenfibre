/**
 * rewards.controller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoints:
 *   Customer (authMiddleware):
 *     GET  /api/rewards/summary
 *     POST /api/rewards/redeem-preview
 *     GET  /api/rewards/first-order-coupon
 *
 *   Admin (adminAuthMiddleware):
 *     GET  /api/admin/rewards/config
 *     PUT  /api/admin/rewards/config
 *     GET  /api/admin/rewards/ledger?userId=&page=&limit=
 *     POST /api/admin/rewards/adjust
 *     GET  /api/admin/rewards/users/negative-balance
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { User }         from "../models/user.model.js";
import { Coupon }       from "../models/coupon.model.js";
import { RewardLedger } from "../models/rewardLedger.model.js";
import { RewardConfig } from "../models/rewardConfig.model.js";
import {
    isRewardsEnabled,
    getRewardConfig,
    invalidateConfigCache,
    previewRedemption,
    adminAdjustPoints,
    getRewardSummary,
} from "../services/rewards.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Customer endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/rewards/summary
 * Returns balance, history, config meta, and first-order coupon if eligible.
 */
export const getMyRewardsSummary = async (req, res) => {
    try {
        if (!isRewardsEnabled()) {
            return res.status(200).json({ enabled: false });
        }

        const user = req.user;

        // B2B guard
        if (user.accountType === "B2B") {
            return res.status(200).json({ enabled: false, reason: "B2B accounts are not eligible for reward points." });
        }

        const summary = await getRewardSummary(user._id);

        // Include first-order coupon if user hasn't completed first order
        let firstOrderCoupon = null;
        if (!summary.hasCompletedFirstOrder) {
            const coupon = await Coupon.findOne({
                isFirstOrderCoupon: true,
                isActive: true,
                $or: [{ expiryDate: { $gt: new Date() } }, { expiryDate: null }],
            }).select("code discountValue discountType maxDiscountAmount");
            firstOrderCoupon = coupon || null;
        }

        return res.status(200).json({
            ...summary,
            enabled: true,
            firstOrderCoupon,
        });
    } catch (err) {
        console.error("getMyRewardsSummary error:", err);
        return res.status(500).json({ message: "Failed to fetch rewards summary." });
    }
};

/**
 * POST /api/rewards/redeem-preview
 * Body: { pointsToRedeem: number }
 * Returns how many points can actually be redeemed and the discount amount.
 * Read-only — does NOT deduct anything.
 */
export const redeemPreview = async (req, res) => {
    try {
        if (!isRewardsEnabled()) {
            return res.status(200).json({ enabled: false, allowed: 0, discountAmount: 0 });
        }

        const { pointsToRedeem, cartTotal } = req.body;

        if (!cartTotal || cartTotal <= 0) {
            return res.status(400).json({ message: "cartTotal is required." });
        }
        if (pointsToRedeem == null || isNaN(pointsToRedeem)) {
            return res.status(400).json({ message: "pointsToRedeem must be a number." });
        }

        const preview = await previewRedemption(req.user._id, cartTotal, Number(pointsToRedeem));
        return res.status(200).json({ enabled: true, ...preview });
    } catch (err) {
        console.error("redeemPreview error:", err);
        return res.status(500).json({ message: "Failed to compute redemption preview." });
    }
};

/**
 * GET /api/rewards/first-order-coupon
 * Returns the active first-order coupon if the user is eligible.
 */
export const getFirstOrderCoupon = async (req, res) => {
    try {
        if (!isRewardsEnabled()) {
            return res.status(200).json({ eligible: false });
        }

        const user = await User.findById(req.user._id).select("has_completed_first_order accountType");
        if (!user || user.accountType === "B2B" || user.has_completed_first_order) {
            return res.status(200).json({ eligible: false });
        }

        const coupon = await Coupon.findOne({
            isFirstOrderCoupon: true,
            isActive: true,
            $or: [{ expiryDate: { $gt: new Date() } }, { expiryDate: null }],
        }).select("code discountValue discountType maxDiscountAmount");

        return res.status(200).json({ eligible: !!coupon, coupon: coupon || null });
    } catch (err) {
        console.error("getFirstOrderCoupon error:", err);
        return res.status(500).json({ message: "Internal error." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/rewards/config
 */
export const adminGetConfig = async (req, res) => {
    try {
        const cfg = await getRewardConfig();
        return res.status(200).json({ config: cfg });
    } catch (err) {
        console.error("adminGetConfig error:", err);
        return res.status(500).json({ message: "Failed to fetch reward config." });
    }
};

/**
 * PUT /api/admin/rewards/config
 * Editable fields: earn_percent, direct_percent, coupon_percent, point_value,
 * max_redeem_percent, min_order_value, expiry_days, is_active.
 */
export const adminUpdateConfig = async (req, res) => {
    try {
        const ALLOWED = [
            "earn_percent", "direct_percent", "coupon_percent", "point_value",
            "max_redeem_percent", "min_order_value", "expiry_days", "is_active",
        ];
        const update = {};
        for (const field of ALLOWED) {
            if (req.body[field] !== undefined) update[field] = req.body[field];
        }
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "No valid fields to update." });
        }
        update.updatedBy = req.user._id;

        const cfg = await RewardConfig.findOneAndUpdate(
            { _key: "singleton" },
            { $set: update },
            { new: true, upsert: true }
        );
        invalidateConfigCache();
        return res.status(200).json({ message: "Config updated.", config: cfg });
    } catch (err) {
        console.error("adminUpdateConfig error:", err);
        return res.status(500).json({ message: "Failed to update config." });
    }
};

/**
 * GET /api/admin/rewards/ledger?userId=&page=1&limit=20
 */
export const adminGetLedger = async (req, res) => {
    try {
        const { userId, page = 1, limit = 20 } = req.query;
        if (!userId) return res.status(400).json({ message: "userId required." });

        const skip = (Number(page) - 1) * Number(limit);
        const [entries, total] = await Promise.all([
            RewardLedger.find({ user: userId })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("order", "easebuzzOrderId _id finalAmount")
                .populate("admin_actor", "full_name email"),
            RewardLedger.countDocuments({ user: userId }),
        ]);

        const user = await User.findById(userId).select("full_name email reward_balance has_completed_first_order");

        return res.status(200).json({
            user,
            entries,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        console.error("adminGetLedger error:", err);
        return res.status(500).json({ message: "Failed to fetch ledger." });
    }
};

/**
 * POST /api/admin/rewards/adjust
 * Body: { userId, points (signed integer), reason (mandatory, min 5 chars) }
 */
export const adminAdjust = async (req, res) => {
    try {
        const { userId, points, reason } = req.body;
        if (!userId) return res.status(400).json({ message: "userId required." });
        if (points === undefined || isNaN(points)) {
            return res.status(400).json({ message: "points must be a number." });
        }
        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({ message: "reason is required (min 5 characters)." });
        }

        const result = await adminAdjustPoints({
            userId,
            points:  Math.round(Number(points)),
            reason:  reason.trim(),
            adminId: req.user._id,
        });

        console.log(
            `[REWARDS ADJUST] Admin ${req.user.email} adjusted user ${userId} by ${points} pts. Reason: ${reason}. New balance: ${result.newBalance}`
        );

        return res.status(200).json({ message: "Adjustment applied.", ...result });
    } catch (err) {
        console.error("adminAdjust error:", err);
        return res.status(400).json({ message: err.message || "Failed to apply adjustment." });
    }
};

/**
 * GET /api/admin/rewards/users/negative-balance
 * Returns users with reward_balance < 0 for ops review.
 */
export const adminNegativeBalanceUsers = async (req, res) => {
    try {
        const users = await User.find({ reward_balance: { $lt: 0 }, accountType: "B2C" })
            .select("full_name email reward_balance")
            .sort({ reward_balance: 1 })
            .limit(100);
        return res.status(200).json({ count: users.length, users });
    } catch (err) {
        console.error("adminNegativeBalanceUsers error:", err);
        return res.status(500).json({ message: "Failed to fetch." });
    }
};
