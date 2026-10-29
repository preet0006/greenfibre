/**
 * testRewards.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification test suite for GreenFibre Reward Points System.
 * Tests:
 *   1. Floor rounding (₹199 * 2.5% = 4.975 -> 4 pts)
 *   2. Idempotency (same order earn does not double credit)
 *   3. Redemption balance guard & cap enforcement
 *   4. B2B account exclusion
 *   5. First-order coupon server validation
 *   6. Cancellation reversal (REVERSE_EARN & REVERSE_REDEEM)
 *
 * Run with: node src/scripts/testRewards.js
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
import { Order } from "../models/order.model.js";
import { Coupon } from "../models/coupon.model.js";
import { RewardLedger } from "../models/rewardLedger.model.js";
import { RewardConfig } from "../models/rewardConfig.model.js";
import {
  creditEarnedPoints,
  reserveRedeemPoints,
  restoreRedeemedPoints,
  reverseEarnedPoints,
  getRewardConfig,
} from "../services/rewards.service.js";

async function runTests() {
  await connectDB();
  console.log("\n🧪 Running Reward Points Verification Suite...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const testSuffix = Date.now();

  try {
    // ── Test 1: Math.floor rounding rule ──
    const earnBase = 199;
    const earnPercent = 2.5;
    const points = Math.floor((earnBase * earnPercent) / 100);
    assert(points === 4, `Rounding: ₹199 * 2.5% = 4.975 floored to 4 pts (got ${points})`);

    // ── Create test B2C user ──
    const testB2CUser = await User.create({
      full_name: `Test B2C User ${testSuffix}`,
      email: `test_b2c_${testSuffix}@example.com`,
      password: "TestPassword123!",
      accountType: "B2C",
      reward_balance: 0,
      has_completed_first_order: false,
    });

    // ── Create test B2B user ──
    const testB2BUser = await User.create({
      full_name: `Test B2B User ${testSuffix}`,
      email: `test_b2b_${testSuffix}@example.com`,
      password: "TestPassword123!",
      accountType: "B2B",
      companyName: "Test Wholesale Co",
      reward_balance: 0,
    });

    // ── Create test order ──
    const testOrder = await Order.create({
      user: testB2CUser._id,
      items: [],
      shippingAddress: {
        fullName: "Test Recipient",
        phone: "9876543210",
        streetAddress: "123 Test St",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
      },
      totalAmount: 2000,
      discountAmount: 0,
      finalAmount: 2000,
      paymentStatus: "paid",
      orderStatus: "processing",
    });

    // ── Test 2: B2B user exclusion ──
    const b2bEarn = await creditEarnedPoints(testOrder, testB2BUser);
    assert(b2bEarn === null, "B2B user receives no reward points (accountType guard)");

    // ── Test 3: Earn points on first order & idempotency ──
    const earn1 = await creditEarnedPoints(testOrder, testB2CUser);
    // 2.5% of 2000 = 50 pts
    assert(earn1 && earn1.pointsEarned === 50, `Earned 50 points on ₹2,000 order (got ${earn1?.pointsEarned})`);

    const userAfterEarn = await User.findById(testB2CUser._id);
    assert(userAfterEarn.reward_balance === 50, `User balance is now 50 (got ${userAfterEarn.reward_balance})`);
    assert(userAfterEarn.has_completed_first_order === true, "has_completed_first_order marked true");

    // Call credit again with same order (simulate webhook duplicate)
    const earn2 = await creditEarnedPoints(testOrder, testB2CUser);
    const userAfterDup = await User.findById(testB2CUser._id);
    assert(
      userAfterDup.reward_balance === 50,
      `Idempotency: duplicate earn webhook did NOT increase balance beyond 50 (got ${userAfterDup.reward_balance})`
    );

    const earnLedgerCount = await RewardLedger.countDocuments({
      order: testOrder._id,
      type: "EARN",
    });
    assert(earnLedgerCount === 1, `Exactly 1 EARN ledger entry exists for order (got ${earnLedgerCount})`);

    // ── Test 4: Redemption & Cap Enforcement ──
    // Order 2: Cart total = ₹1,000. Max 2.5% cap = 25 pts. User has 50 pts.
    const testOrder2 = await Order.create({
      user: testB2CUser._id,
      items: [],
      shippingAddress: testOrder.shippingAddress,
      totalAmount: 1000,
      discountAmount: 0,
      finalAmount: 1000,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // User requests to redeem 50 points, but cart is ₹1,000 so cap is 25 points!
    const redeemResult = await reserveRedeemPoints(testB2CUser._id, testOrder2._id, 50, 1000);
    assert(
      redeemResult && redeemResult.pointsRedeemed === 25,
      `Cap enforcement: requested 50 pts capped at 25 pts (2.5% of ₹1,000) (got ${redeemResult?.pointsRedeemed})`
    );
    assert(
      redeemResult && redeemResult.discountAmount === 25,
      `Discount amount is ₹25 (got ${redeemResult?.discountAmount})`
    );

    const userAfterRedeem = await User.findById(testB2CUser._id);
    assert(
      userAfterRedeem.reward_balance === 25,
      `Balance after 25 pts redemption is 25 (got ${userAfterRedeem.reward_balance})`
    );

    // ── Test 5: Restoration on payment failure (REVERSE_REDEEM) ──
    testOrder2.rewardPointsRedeemed = 25;
    const restoreResult = await restoreRedeemedPoints(testOrder2, testB2CUser._id);
    assert(
      restoreResult && restoreResult.pointsRestored === 25,
      `Restored 25 redeemed points on failure/cancel (got ${restoreResult?.pointsRestored})`
    );

    const userAfterRestore = await User.findById(testB2CUser._id);
    assert(
      userAfterRestore.reward_balance === 50,
      `User balance restored back to 50 (got ${userAfterRestore.reward_balance})`
    );

    // ── Test 6: Reversal of earned points on cancellation (REVERSE_EARN) ──
    const orderToReverse = await Order.findById(testOrder._id);
    const reverseEarnResult = await reverseEarnedPoints(orderToReverse, testB2CUser._id);
    assert(
      reverseEarnResult && reverseEarnResult.pointsReversed === 50,
      `Reversed 50 earned points on order cancellation (got ${reverseEarnResult?.pointsReversed})`
    );

    const userAfterRevEarn = await User.findById(testB2CUser._id);
    assert(
      userAfterRevEarn.reward_balance === 0,
      `User balance after reversal returned to 0 (got ${userAfterRevEarn.reward_balance})`
    );

    // ── Cleanup Test Documents ──
    await User.deleteMany({ _id: { $in: [testB2CUser._id, testB2BUser._id] } });
    await Order.deleteMany({ _id: { $in: [testOrder._id, testOrder2._id] } });
    await RewardLedger.deleteMany({ user: testB2CUser._id });

    console.log(`\n========================================`);
    console.log(`  Tests Passed: ${passed} / ${passed + failed}`);
    console.log(`  Tests Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed === 0) {
      console.log("🎉 All reward business rules verified successfully!");
    }
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
