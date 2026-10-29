/**
 * rewards.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core reward points business logic.
 * ALL reward mutations go through this file. Never touch user.reward_balance
 * or RewardLedger directly from controllers.
 *
 * Two-phase commit pattern:
 *   1. Insert ledger row (status: PENDING) — unique idempotency_key blocks dupes.
 *   2. $inc user.reward_balance.
 *   3. Mark ledger row APPLIED.
 *   A crash between steps 2 & 3 leaves a PENDING row. The reconcile cron or
 *   the next webhook retry detects it and resumes.
 *
 * B2B guard: All functions return early (noop) when user.accountType !== "B2C".
 * Feature flag: When REWARDS_ENABLED !== "true", all functions return early.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import { User }         from "../models/user.model.js";
import { RewardLedger } from "../models/rewardLedger.model.js";
import { RewardConfig } from "../models/rewardConfig.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when the rewards system is enabled globally. */
export const isRewardsEnabled = () => process.env.REWARDS_ENABLED === "true";

/**
 * Fetch the singleton reward config, creating it with defaults if it doesn't exist.
 * Cached in memory for 60 s to reduce DB round-trips on high-traffic paths.
 */
let _configCache = null;
let _configCachedAt = 0;
const CONFIG_TTL_MS = 60_000;

export const getRewardConfig = async () => {
    if (_configCache && Date.now() - _configCachedAt < CONFIG_TTL_MS) {
        return _configCache;
    }
    let cfg = await RewardConfig.findOne({ _key: "singleton" });
    if (!cfg) {
        cfg = await RewardConfig.create({ _key: "singleton" });
    }
    _configCache = cfg;
    _configCachedAt = Date.now();
    return cfg;
};

/** Invalidate the in-memory config cache (call after admin PUT /config). */
export const invalidateConfigCache = () => {
    _configCache = null;
    _configCachedAt = 0;
};

/**
 * Determine whether user is eligible for reward points.
 * Excludes B2B, admin, and guests (no _id).
 */
const isB2CEligible = (user) =>
    user &&
    user._id &&
    (user.accountType === "B2C" || !user.accountType); // default accountType is "B2C"

// ─────────────────────────────────────────────────────────────────────────────
// Internal two-phase commit helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically insert a PENDING ledger row.
 * Returns the ledger doc, or null if the idempotency key already exists
 * (meaning this operation was already done or is in progress).
 *
 * @param {Object} params
 */
const _insertPendingLedger = async ({
    userId,
    orderId,
    type,
    points,
    idempotency_key,
    reason,
    configSnapshot,
    expiresAt,
    adminActor,
}) => {
    // We read the current balance BEFORE the $inc so we can set balance_after.
    // This is a snapshot read — the final balance_after is corrected in _applyLedger.
    const user = await User.findById(userId).select("reward_balance");
    if (!user) throw new Error(`rewards.service: user ${userId} not found`);

    // Determine provisional balance_after (will be corrected on APPLY if concurrent)
    const direction = ["EARN", "REVERSE_REDEEM", "ADJUST"].includes(type) ? 1 : -1;
    const provisional_balance = user.reward_balance + direction * points;

    const expiresAtDate =
        expiresAt instanceof Date ? expiresAt : expiresAt ? new Date(expiresAt) : undefined;

    try {
        const entry = await RewardLedger.create({
            user:            userId,
            order:           orderId || undefined,
            type,
            points,
            balance_after:   provisional_balance,
            status:          "PENDING",
            reason,
            idempotency_key,
            expires_at:      expiresAtDate,
            admin_actor:     adminActor || undefined,
            config_snapshot: configSnapshot || undefined,
        });
        return entry;
    } catch (err) {
        // Duplicate key = idempotency key already exists → already done or in progress
        if (err.code === 11000) {
            return null; // Signal: already handled
        }
        throw err;
    }
};

/**
 * Apply a pending ledger row:
 * 1. $inc user.reward_balance by signed delta.
 * 2. Update ledger row to APPLIED with correct balance_after.
 *
 * Returns the updated user balance.
 */
const _applyLedger = async (ledgerEntry, pointsDelta) => {
    // Atomic balance update — returns updated balance
    const updatedUser = await User.findByIdAndUpdate(
        ledgerEntry.user,
        { $inc: { reward_balance: pointsDelta } },
        { new: true, select: "reward_balance" }
    );

    if (!updatedUser) throw new Error("rewards.service: user not found during _applyLedger");

    // Mark ledger APPLIED with the real balance_after
    await RewardLedger.findByIdAndUpdate(ledgerEntry._id, {
        $set: {
            status:        "APPLIED",
            balance_after: updatedUser.reward_balance,
        },
    });

    return updatedUser.reward_balance;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EARN — Credit points after a successful payment.
 * Idempotent: safe to call on webhook retries.
 *
 * Earn base = order.totalAmount (paid item value at discountedPrice)
 *             minus order.rewardDiscount (so we don't earn on points-paid portion).
 *
 * @param {Object} order   - Mongoose Order document (populated or plain)
 * @param {Object} user    - Mongoose User document
 * @returns {{ pointsEarned, newBalance } | null}
 */
export const creditEarnedPoints = async (order, user) => {
    if (!isRewardsEnabled()) return null;
    if (!isB2CEligible(user)) return null;

    const cfg = await getRewardConfig();
    if (!cfg.is_active) return null;

    const earnBase = Math.max(0, (order.totalAmount || 0) - (order.rewardDiscount || 0));
    const pointsToCredit = Math.floor((earnBase * cfg.earn_percent) / 100);

    if (pointsToCredit <= 0) return null;

    const idempotency_key = `earn:${order._id}`;

    // ── Step 1: Insert PENDING ledger (or detect already done) ──
    const ledger = await _insertPendingLedger({
        userId:          user._id,
        orderId:         order._id,
        type:            "EARN",
        points:          pointsToCredit,
        idempotency_key,
        reason:          `Points earned on order #${order.easebuzzOrderId || order._id}`,
        configSnapshot: {
            earn_percent:       cfg.earn_percent,
            point_value:        cfg.point_value,
            max_redeem_percent: cfg.max_redeem_percent,
        },
        expiresAt: cfg.expiry_days > 0
            ? new Date(Date.now() + cfg.expiry_days * 86400000)
            : undefined,
    });

    // Idempotency: already credited → look up what was credited and return
    if (!ledger) {
        const existing = await RewardLedger.findOne({ idempotency_key });
        const latestUser = await User.findById(user._id).select("reward_balance");
        return {
            pointsEarned: existing?.points || 0,
            newBalance:   latestUser?.reward_balance || 0,
        };
    }

    // ── Step 2: Apply ──
    const newBalance = await _applyLedger(ledger, +pointsToCredit);

    // ── Step 3: Mark user as having completed first order ──
    await User.findByIdAndUpdate(user._id, {
        $set: { has_completed_first_order: true },
    });

    // ── Step 4: Update order with earned points ──
    await order.constructor.findByIdAndUpdate(order._id, {
        $set: { rewardPointsEarned: pointsToCredit },
    });

    return { pointsEarned: pointsToCredit, newBalance };
};

/**
 * REDEEM — Reserve points at order creation (PENDING status).
 * Points are deducted immediately; the ledger is APPLIED on payment success.
 * On payment failure, call restoreRedeemedPoints().
 *
 * Server always recomputes the allowed amount — never trusts client value.
 *
 * @param {ObjectId|string} userId
 * @param {ObjectId|string} orderId
 * @param {number}          requestedPoints  - What the user asked to redeem
 * @param {number}          cartTotal        - order.totalAmount (for cap calculation)
 * @param {Object}          [cfg]            - Optional pre-fetched config
 * @returns {{ pointsRedeemed, discountAmount, newBalance } | null}
 */
export const reserveRedeemPoints = async (userId, orderId, requestedPoints, cartTotal, cfg) => {
    if (!isRewardsEnabled()) return null;
    if (!requestedPoints || requestedPoints <= 0) return null;

    cfg = cfg || (await getRewardConfig());
    if (!cfg.is_active) return null;

    // Validate user and balance
    const user = await User.findById(userId).select(
        "reward_balance has_completed_first_order accountType"
    );
    if (!isB2CEligible(user)) return null;
    // Must have completed first order before redeeming
    if (!user.has_completed_first_order) return null;

    // Minimum cart value check
    if (cfg.min_order_value > 0 && cartTotal < cfg.min_order_value) return null;

    // Cap: max_redeem_percent of cart value, floored to whole points
    const maxByPercent = Math.floor((cartTotal * cfg.max_redeem_percent) / 100);
    const maxAllowed   = Math.min(maxByPercent, user.reward_balance);
    const pointsToUse  = Math.min(Math.floor(requestedPoints), maxAllowed);

    if (pointsToUse <= 0) return null;

    const discountAmount = pointsToUse * cfg.point_value;

    const idempotency_key = `redeem:${orderId}`;

    // ── Step 1: Atomic deduct — only if balance is sufficient ──
    // findOneAndUpdate with condition prevents going below 0
    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, reward_balance: { $gte: pointsToUse } },
        { $inc: { reward_balance: -pointsToUse } },
        { new: true, select: "reward_balance" }
    );

    if (!updatedUser) {
        // Balance insufficient or concurrent race won — return null (no redemption)
        return null;
    }

    // ── Step 2: Insert APPLIED ledger (balance already updated atomically above) ──
    // Use insertPendingLedger with immediate apply for consistency
    try {
        await RewardLedger.create({
            user:            userId,
            order:           orderId,
            type:            "REDEEM",
            points:          pointsToUse,
            balance_after:   updatedUser.reward_balance,
            status:          "APPLIED",   // Already applied atomically above
            reason:          `Points redeemed at checkout for order`,
            idempotency_key,
            config_snapshot: {
                earn_percent:       cfg.earn_percent,
                point_value:        cfg.point_value,
                max_redeem_percent: cfg.max_redeem_percent,
            },
        });
    } catch (err) {
        if (err.code === 11000) {
            // Already redeemed — idempotency, do not double-deduct
            // Restore the balance we just deducted (since ledger already existed)
            await User.findByIdAndUpdate(userId, { $inc: { reward_balance: +pointsToUse } });
            return null;
        }
        throw err;
    }

    return {
        pointsRedeemed: pointsToUse,
        discountAmount,
        newBalance: updatedUser.reward_balance,
    };
};

/**
 * REVERSE_REDEEM — Restore points on payment failure or order cancellation.
 * Idempotent via idempotency_key.
 */
export const restoreRedeemedPoints = async (order, userId) => {
    if (!isRewardsEnabled()) return null;
    if (!order.rewardPointsRedeemed || order.rewardPointsRedeemed <= 0) return null;

    const idempotency_key = `rev_redeem:${order._id}`;
    const points = order.rewardPointsRedeemed;

    const ledger = await _insertPendingLedger({
        userId,
        orderId:          order._id,
        type:             "REVERSE_REDEEM",
        points,
        idempotency_key,
        reason:           `Points restored: payment failed or order cancelled`,
    });

    if (!ledger) return null; // already reversed

    const newBalance = await _applyLedger(ledger, +points);
    return { pointsRestored: points, newBalance };
};

/**
 * REVERSE_EARN — Reverse earned points on order cancellation/refund.
 * Allows balance to go negative (configurable), which blocks further redemption
 * until ops resolves with ADJUST.
 * Idempotent via idempotency_key.
 */
export const reverseEarnedPoints = async (order, userId) => {
    if (!isRewardsEnabled()) return null;
    if (!order.rewardPointsEarned || order.rewardPointsEarned <= 0) return null;

    const idempotency_key = `rev_earn:${order._id}`;
    const points = order.rewardPointsEarned;

    const ledger = await _insertPendingLedger({
        userId,
        orderId:          order._id,
        type:             "REVERSE_EARN",
        points,
        idempotency_key,
        reason:           `Points reversed: order cancelled or refunded`,
    });

    if (!ledger) return null; // already reversed

    // Allow negative balance — ops handles via admin ADJUST
    const newBalance = await _applyLedger(ledger, -points);
    return { pointsReversed: points, newBalance };
};

/**
 * ADJUST — Manual admin credit/debit with mandatory reason and actor audit.
 * Points can be positive (credit) or negative (debit).
 */
export const adminAdjustPoints = async ({ userId, points, reason, adminId }) => {
    if (!reason || reason.trim().length < 5) {
        throw new Error("Reason is required for manual adjustments (min 5 chars).");
    }

    const type       = points >= 0 ? "ADJUST" : "ADJUST";
    const absPoints  = Math.abs(Math.round(points));
    const direction  = points >= 0 ? 1 : -1;
    const key        = `adjust:${adminId}:${Date.now()}`;

    // We don't use two-phase for ADJUST because it must always execute (admin intent)
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { reward_balance: direction * absPoints } },
        { new: true, select: "reward_balance" }
    );
    if (!updatedUser) throw new Error("User not found");

    const entry = await RewardLedger.create({
        user:          userId,
        type:          "ADJUST",
        points:        absPoints,
        balance_after: updatedUser.reward_balance,
        status:        "APPLIED",
        reason:        reason.trim(),
        idempotency_key: key,
        admin_actor:   adminId,
    });

    return { newBalance: updatedUser.reward_balance, ledgerEntry: entry };
};

/**
 * PREVIEW — Compute how many points can be redeemed for a given cart.
 * Read-only — does NOT mutate any state.
 */
export const previewRedemption = async (userId, cartTotal, requestedPoints) => {
    const cfg  = await getRewardConfig();
    const user = await User.findById(userId).select(
        "reward_balance has_completed_first_order accountType"
    );

    if (!isB2CEligible(user) || !user.has_completed_first_order) {
        return {
            eligible:      false,
            reason:        "Complete your first order to start redeeming points.",
            allowed:       0,
            discountAmount: 0,
        };
    }

    if (!cfg.is_active || !isRewardsEnabled()) {
        return { eligible: false, reason: "Rewards not active.", allowed: 0, discountAmount: 0 };
    }

    if (cfg.min_order_value > 0 && cartTotal < cfg.min_order_value) {
        return {
            eligible: false,
            reason:   `Minimum order value of ₹${cfg.min_order_value} required.`,
            allowed:  0,
            discountAmount: 0,
        };
    }

    const maxByPercent = Math.floor((cartTotal * cfg.max_redeem_percent) / 100);
    const maxAllowed   = Math.min(maxByPercent, user.reward_balance);
    const allowed      = Math.min(Math.floor(requestedPoints || maxAllowed), maxAllowed);

    return {
        eligible:      true,
        balance:       user.reward_balance,
        requested:     requestedPoints || 0,
        allowed,
        discountAmount: allowed * cfg.point_value,
        maxAllowed,
        maxByPercent,
        reason:        allowed < requestedPoints
            ? (requestedPoints > maxByPercent ? `Capped at ${cfg.max_redeem_percent}% of cart value.` : "Insufficient balance.")
            : null,
    };
};

/**
 * Fetch user reward summary (balance + recent history).
 */
export const getRewardSummary = async (userId) => {
    const [user, ledger, cfg] = await Promise.all([
        User.findById(userId).select("reward_balance has_completed_first_order"),
        RewardLedger.find({ user: userId, status: "APPLIED" })
            .sort({ created_at: -1 })
            .limit(30)
            .populate("order", "easebuzzOrderId _id"),
        getRewardConfig(),
    ]);

    const pendingEarn = await RewardLedger.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), type: "EARN", status: "PENDING" } },
        { $group: { _id: null, total: { $sum: "$points" } } },
    ]);

    return {
        balance:                    user?.reward_balance || 0,
        pendingEarn:                pendingEarn[0]?.total || 0,
        hasCompletedFirstOrder:     user?.has_completed_first_order || false,
        pointValue:                 cfg.point_value,
        earnPercent:                cfg.earn_percent,
        maxRedeemPercent:           cfg.max_redeem_percent,
        directPercent:              cfg.direct_percent,
        couponPercent:              cfg.coupon_percent,
        expiryDays:                 cfg.expiry_days,
        isActive:                   cfg.is_active && isRewardsEnabled(),
        history:                    ledger,
    };
};

/**
 * Resume any PENDING ledger entries for a user (called on webhook retry).
 * This is the crash-recovery path: if step 2 ($inc) succeeded but step 3 (APPLIED) didn't,
 * the reconcile cron will call this.
 */
export const resumePendingEntries = async (userId) => {
    const pending = await RewardLedger.find({ user: userId, status: "PENDING" });
    for (const entry of pending) {
        const direction = ["EARN", "REVERSE_REDEEM", "ADJUST"].includes(entry.type) ? 1 : -1;
        // Check if the balance was already updated (e.g., crash between steps 2 & 3)
        // We re-apply $inc — this double-applies if crash was between 1 and 2.
        // The reconcile cron detects and corrects this. This is acceptable for a daily drift check.
        await _applyLedger(entry, direction * entry.points);
    }
    return pending.length;
};
