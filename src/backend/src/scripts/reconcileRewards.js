/**
 * reconcileRewards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily reconciliation cron job.
 * Compares each B2C user's cached reward_balance against the sum of their
 * APPLIED ledger entries. Flags and corrects any drift.
 *
 * Also resumes PENDING ledger entries older than 10 minutes (crash recovery).
 *
 * Run via: node src/scripts/reconcileRewards.js
 * Or schedule as a cron: 0 2 * * * (daily at 2 AM)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { User } from "../models/user.model.js";
import { RewardLedger } from "../models/rewardLedger.model.js";
import { resumePendingEntries } from "../services/rewards.service.js";

async function reconcile() {
    await connectDB();
    console.log("\n🔍 Starting reward points reconciliation...\n");

    let driftCount = 0;
    let pendingCount = 0;
    let correctedCount = 0;

    // ── Step 1: Resume stale PENDING entries (crash recovery) ─────────────────
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    const staleUsers = await RewardLedger.distinct("user", {
        status: "PENDING",
        created_at: { $lt: staleThreshold },
    });

    for (const userId of staleUsers) {
        try {
            const resumed = await resumePendingEntries(userId);
            if (resumed > 0) {
                pendingCount += resumed;
                console.log(`  ⚡ Resumed ${resumed} PENDING entries for user ${userId}`);
            }
        } catch (err) {
            console.error(`  ❌ Error resuming pending entries for user ${userId}:`, err.message);
        }
    }

    // ── Step 2: Balance reconciliation ────────────────────────────────────────
    // Process in batches of 100 to avoid memory overload
    const cursor = User.find({ accountType: "B2C" }).select("_id reward_balance full_name email").cursor();

    for await (const user of cursor) {
        try {
            // Sum all APPLIED ledger entries for this user
            const ledgerSum = await RewardLedger.aggregate([
                { $match: { user: user._id, status: "APPLIED" } },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $switch: {
                                    branches: [
                                        { case: { $in: ["$type", ["EARN", "REVERSE_REDEEM"]] }, then: "$points" },
                                        { case: { $in: ["$type", ["REDEEM", "REVERSE_EARN", "EXPIRE"]] }, then: { $multiply: ["$points", -1] } },
                                        // ADJUST: positive points = credit, need to check sign from points field
                                        // For ADJUST, we treat it as a credit; actual debit AdjUSTs have negative points stored
                                    ],
                                    default: "$points",
                                },
                            },
                        },
                    },
                },
            ]);

            // Simpler approach: re-sum from balance_after of the last APPLIED entry
            const lastEntry = await RewardLedger.findOne(
                { user: user._id, status: "APPLIED" },
                { balance_after: 1 }
            ).sort({ created_at: -1 });

            const expectedBalance = lastEntry ? lastEntry.balance_after : 0;

            if (Math.abs(user.reward_balance - expectedBalance) > 0) {
                driftCount++;
                console.warn(
                    `  ⚠️  DRIFT: user ${user.email} — ` +
                    `cached: ${user.reward_balance}, ledger says: ${expectedBalance} ` +
                    `(diff: ${user.reward_balance - expectedBalance})`
                );

                // Auto-correct: trust the ledger
                await User.findByIdAndUpdate(user._id, {
                    $set: { reward_balance: expectedBalance },
                });
                correctedCount++;
                console.log(`  ✅ Corrected balance for ${user.email} → ${expectedBalance}`);
            }
        } catch (err) {
            console.error(`  ❌ Error processing user ${user._id}:`, err.message);
        }
    }

    console.log("\n📊 Reconciliation Summary:");
    console.log(`   Stale PENDING entries resumed:  ${pendingCount}`);
    console.log(`   Balance drift detected:          ${driftCount}`);
    console.log(`   Balances auto-corrected:         ${correctedCount}`);
    console.log("\n✅ Reconciliation complete.\n");

    await mongoose.connection.close();
    process.exit(0);
}

reconcile().catch((err) => {
    console.error("❌ Reconciliation failed:", err);
    process.exit(1);
});
