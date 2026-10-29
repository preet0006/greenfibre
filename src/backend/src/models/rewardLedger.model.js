/**
 * rewardLedger.model.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Immutable audit log for all reward point movements.
 * Rules:
 *   - No UPDATE or DELETE routes exist for this collection.
 *   - Corrections are ADJUST entries with a mandatory reason.
 *   - Two-phase writes: PENDING → APPLIED to survive crashes.
 *   - idempotency_key (unique sparse index) prevents double-writes on retries.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";

const rewardLedgerSchema = new mongoose.Schema(
    {
        // The customer this entry belongs to
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // The order this entry relates to (null for ADJUST / EXPIRE)
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },

        // Movement type
        type: {
            type: String,
            enum: [
                "EARN",            // Points credited after payment success
                "REDEEM",          // Points reserved at order creation
                "REVERSE_EARN",    // Earned points reversed on cancellation/refund
                "REVERSE_REDEEM",  // Redeemed points restored on payment failure/cancel
                "ADJUST",          // Manual admin adjustment (must have reason)
                "EXPIRE",          // Points expired by cron
            ],
            required: true,
        },

        // Always a positive integer; direction is inferred from type
        points: {
            type: Number,
            required: true,
            min: 0,
        },

        // Snapshot of user.reward_balance AFTER this entry was applied
        // Used for daily reconciliation (balance vs sum of APPLIED rows)
        balance_after: {
            type: Number,
            required: true,
        },

        // Two-phase commit status
        status: {
            type: String,
            enum: ["PENDING", "APPLIED", "REVERSED"],
            default: "PENDING",
        },

        // Human-readable description (mandatory for ADJUST)
        reason: {
            type: String,
            trim: true,
        },

        /**
         * Idempotency key — unique sparse index prevents double-credit / double-deduct.
         * Convention:
         *   EARN:            "earn:{orderId}"
         *   REDEEM:          "redeem:{orderId}"
         *   REVERSE_EARN:    "rev_earn:{orderId}"
         *   REVERSE_REDEEM:  "rev_redeem:{orderId}"
         *   EXPIRE:          "expire:{userId}:{date}"
         *   ADJUST:          "adjust:{adminId}:{timestamp}"
         */
        idempotency_key: {
            type: String,
        },

        // ISO timestamp of when points expire (EARN entries when expiry_days > 0)
        expires_at: {
            type: Date,
        },

        // For ADJUST only: the admin who performed it
        admin_actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // Snapshot of the reward_config rates at the time of this entry
        // Ensures old orders are not affected by later config changes
        config_snapshot: {
            earn_percent:       Number,
            point_value:        Number,
            max_redeem_percent: Number,
        },

        created_at: {
            type: Date,
            default: Date.now,
            immutable: true, // never allow updating the creation time
        },
    },
    {
        // Disable automatic Mongoose timestamps (we control created_at above)
        timestamps: false,
        // Disable the default _id index override — we rely on our custom indexes
    }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Fast history queries, sorted newest-first
rewardLedgerSchema.index({ user: 1, created_at: -1 });

// Idempotency — unique among non-null keys
rewardLedgerSchema.index({ idempotency_key: 1 }, { unique: true, sparse: true });

// One EARN (or REDEEM, etc.) per order — prevents double entries of same type
rewardLedgerSchema.index({ order: 1, type: 1 }, { unique: true, sparse: true });

// Expiry cron: scan for EARN entries whose expires_at < now
rewardLedgerSchema.index({ expires_at: 1 }, { sparse: true });

// Admin: quickly find all entries for a specific order
rewardLedgerSchema.index({ order: 1, created_at: -1 });

// Admin: filter negative-balance users via ledger reconciliation
rewardLedgerSchema.index({ user: 1, status: 1 });

export const RewardLedger = mongoose.model("RewardLedger", rewardLedgerSchema);
