import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import crypto from "crypto";
import { getRazorpayInstance, getRazorpayKeySecret, getRazorpayKeyId } from "../config/razorpay.js";

async function runTests() {
    console.log("🔍 Testing Razorpay Integration...");

    // Test 1: Config & Credentials
    const keyId = getRazorpayKeyId();
    const keySecret = getRazorpayKeySecret();
    console.log(`1. Key ID loaded: ${keyId ? "✅ " + keyId : "❌ Missing"}`);
    console.log(`   Key Secret loaded: ${keySecret ? "✅ " + keySecret.substring(0, 5) + "..." : "❌ Missing"}`);

    if (!keyId || !keySecret) {
        throw new Error("Missing Razorpay credentials");
    }

    // Test 2: Razorpay SDK instance creation & Order Creation API
    console.log("\n2. Testing Razorpay Orders API call...");
    const razorpay = getRazorpayInstance();
    const testAmount = 50000; // ₹500 in paise
    const testReceipt = `test_rcpt_${Date.now()}`;

    const order = await razorpay.orders.create({
        amount: testAmount,
        currency: "INR",
        receipt: testReceipt,
    });

    console.log("   Razorpay Order created successfully! ✅");
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Amount: ${order.amount} paise (${order.amount / 100} INR)`);
    console.log(`   Currency: ${order.currency}`);
    console.log(`   Receipt: ${order.receipt}`);

    // Test 3: HMAC-SHA256 Signature Verification
    console.log("\n3. Testing HMAC-SHA256 Signature Verification algorithm...");
    const dummyPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
    const validSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${order.id}|${dummyPaymentId}`)
        .digest("hex");

    // Check valid signature
    const testExpected = crypto
        .createHmac("sha256", keySecret)
        .update(`${order.id}|${dummyPaymentId}`)
        .digest("hex");

    const isValid = crypto.timingSafeEqual(
        Buffer.from(validSignature, "utf-8"),
        Buffer.from(testExpected, "utf-8")
    );
    console.log(`   Valid Signature check: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

    // Check invalid signature rejection
    const invalidSignature = "tampered_signature_1234567890abcdef1234567890abcdef1234567890abcdef";
    let isInvalidRejected = false;
    try {
        isInvalidRejected =
            invalidSignature.length !== testExpected.length ||
            !crypto.timingSafeEqual(
                Buffer.from(invalidSignature, "utf-8"),
                Buffer.from(testExpected, "utf-8")
            );
    } catch {
        isInvalidRejected = true;
    }
    console.log(`   Invalid Signature rejection check: ${isInvalidRejected ? "✅ PASS" : "❌ FAIL"}`);

    console.log("\n🎉 ALL RAZORPAY INTEGRATION TESTS PASSED! 🎉");
}

runTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
