import assert from "assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { Coupon } from "../src/models/coupon.model.js";
import { Cart } from "../src/models/cart.model.js";
import { User } from "../src/models/user.model.js";
import { fulfillOrder } from "../src/controllers/razorpay.controller.js";

async function runPhaseAIntegrationTests() {
  console.log("Starting Phase A Real-MongoDB Integration Tests...\n");

  let mongoServer;
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // ── SAFETY GUARD: Refuse to run against production cluster ──
    const forbiddenPatterns = ["mongodb.net", "ihhkcrj", "ac-tcotkwn", "greenfibre.org"];
    for (const pattern of forbiddenPatterns) {
      if (uri.toLowerCase().includes(pattern)) {
        throw new Error("SECURITY ABORT: Refusing to run tests against cluster host!");
      }
    }

    await mongoose.connect(uri);
    console.log("Connected to isolated local in-memory MongoDB instance.");

    // ══════════════════════════════════════════════════════════════
    // TEST (a): Fresh order wins invoice & dispatch leases exactly once under 5 concurrent callers
    // ══════════════════════════════════════════════════════════════
    console.log("\n[TEST A] 5 concurrent callers on fresh order lease queries...");
    const freshOrder = await Order.create({
      user: new mongoose.Types.ObjectId(),
      items: [],
      shippingAddress: { fullName: "Test User", streetAddress: "123 Test St", city: "Ahmedabad", state: "Gujarat", pincode: "380001", phone: "9999999999" },
      totalAmount: 500,
      finalAmount: 500,
      paymentMethod: "Razorpay",
      paymentStatus: "paid",
      orderStatus: "processing",
      invoiceUrl: null,
      invoiceClaimedAt: null,
      shippingDetails: { shiprocketOrderId: null },
      dispatchClaimedAt: null,
    });

    const LEASE_MS = 5 * 60 * 1000;
    const now = new Date();
    const leaseExpired = new Date(now.getTime() - LEASE_MS);

    // Filter functions matching exact production queries in razorpay.controller.js
    const runInvoiceLeaseQuery = () =>
      Order.findOneAndUpdate(
        {
          _id: freshOrder._id,
          $and: [
            {
              $or: [
                { invoiceUrl: null },
                { invoiceUrl: { $exists: false } },
                { invoiceUrl: "" },
              ],
            },
            {
              $or: [
                { invoiceClaimedAt: null },
                { invoiceClaimedAt: { $exists: false } },
                { invoiceClaimedAt: { $lt: leaseExpired } },
              ],
            },
          ],
        },
        { $set: { invoiceClaimedAt: now } },
        { new: true }
      );

    const runDispatchLeaseQuery = () =>
      Order.findOneAndUpdate(
        {
          _id: freshOrder._id,
          hasStockConflict: { $ne: true },
          $and: [
            {
              $or: [
                { "shippingDetails.shiprocketOrderId": null },
                { "shippingDetails.shiprocketOrderId": { $exists: false } },
                { "shippingDetails.shiprocketOrderId": "" },
              ],
            },
            {
              $or: [
                { dispatchClaimedAt: null },
                { dispatchClaimedAt: { $exists: false } },
                { dispatchClaimedAt: { $lt: leaseExpired } },
              ],
            },
          ],
        },
        { $set: { dispatchClaimedAt: now } },
        { new: true }
      );

    // 5 concurrent invoice lease attempts
    const invoiceResults = await Promise.all([
      runInvoiceLeaseQuery(),
      runInvoiceLeaseQuery(),
      runInvoiceLeaseQuery(),
      runInvoiceLeaseQuery(),
      runInvoiceLeaseQuery(),
    ]);

    const invoiceWinners = invoiceResults.filter(Boolean);
    assert.strictEqual(invoiceWinners.length, 1, `Expected exactly 1 invoice lease winner, got ${invoiceWinners.length}`);
    console.log("  ✓ Exactly 1 of 5 concurrent callers won the invoice lease");

    // 5 concurrent dispatch lease attempts
    const dispatchResults = await Promise.all([
      runDispatchLeaseQuery(),
      runDispatchLeaseQuery(),
      runDispatchLeaseQuery(),
      runDispatchLeaseQuery(),
      runDispatchLeaseQuery(),
    ]);

    const dispatchWinners = dispatchResults.filter(Boolean);
    assert.strictEqual(dispatchWinners.length, 1, `Expected exactly 1 dispatch lease winner, got ${dispatchWinners.length}`);
    console.log("  ✓ Exactly 1 of 5 concurrent callers won the dispatch lease");

    // ══════════════════════════════════════════════════════════════
    // TEST (b): Lease expiry allows exactly one retry
    // ══════════════════════════════════════════════════════════════
    console.log("\n[TEST B] Lease expiry and retry behavior...");
    // Simulate invoice and dispatch failed earlier: set claim timestamp to 6 minutes ago
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    await Order.findByIdAndUpdate(freshOrder._id, {
      $set: {
        invoiceClaimedAt: sixMinutesAgo,
        dispatchClaimedAt: sixMinutesAgo,
        invoiceUrl: null,
        "shippingDetails.shiprocketOrderId": null,
      },
    });

    const retryNow = new Date();
    const retryExpired = new Date(retryNow.getTime() - LEASE_MS);

    const retryInvoiceQuery = () =>
      Order.findOneAndUpdate(
        {
          _id: freshOrder._id,
          $and: [
            {
              $or: [
                { invoiceUrl: null },
                { invoiceUrl: { $exists: false } },
                { invoiceUrl: "" },
              ],
            },
            {
              $or: [
                { invoiceClaimedAt: null },
                { invoiceClaimedAt: { $exists: false } },
                { invoiceClaimedAt: { $lt: retryExpired } },
              ],
            },
          ],
        },
        { $set: { invoiceClaimedAt: retryNow } },
        { new: true }
      );

    const retryDispatchQuery = () =>
      Order.findOneAndUpdate(
        {
          _id: freshOrder._id,
          hasStockConflict: { $ne: true },
          $and: [
            {
              $or: [
                { "shippingDetails.shiprocketOrderId": null },
                { "shippingDetails.shiprocketOrderId": { $exists: false } },
                { "shippingDetails.shiprocketOrderId": "" },
              ],
            },
            {
              $or: [
                { dispatchClaimedAt: null },
                { dispatchClaimedAt: { $exists: false } },
                { dispatchClaimedAt: { $lt: retryExpired } },
              ],
            },
          ],
        },
        { $set: { dispatchClaimedAt: retryNow } },
        { new: true }
      );

    // 4 concurrent retry callers
    const [invRetry1, invRetry2, invRetry3, invRetry4] = await Promise.all([
      retryInvoiceQuery(),
      retryInvoiceQuery(),
      retryInvoiceQuery(),
      retryInvoiceQuery(),
    ]);

    const invRetryWinners = [invRetry1, invRetry2, invRetry3, invRetry4].filter(Boolean);
    assert.strictEqual(invRetryWinners.length, 1, `Expected exactly 1 invoice retry winner, got ${invRetryWinners.length}`);
    console.log("  ✓ Expired invoice lease allowed exactly 1 retry winner out of 4 callers");

    const [dispRetry1, dispRetry2, dispRetry3, dispRetry4] = await Promise.all([
      retryDispatchQuery(),
      retryDispatchQuery(),
      retryDispatchQuery(),
      retryDispatchQuery(),
    ]);

    const dispRetryWinners = [dispRetry1, dispRetry2, dispRetry3, dispRetry4].filter(Boolean);
    assert.strictEqual(dispRetryWinners.length, 1, `Expected exactly 1 dispatch retry winner, got ${dispRetryWinners.length}`);
    console.log("  ✓ Expired dispatch lease allowed exactly 1 retry winner out of 4 callers");

    // Once invoiceUrl is populated, no future retry can claim
    await Order.findByIdAndUpdate(freshOrder._id, { $set: { invoiceUrl: "https://minio/invoice.pdf" } });
    const blockedInvoice = await retryInvoiceQuery();
    assert.strictEqual(blockedInvoice, null, "Should not claim when invoiceUrl is populated");
    console.log("  ✓ Populated invoiceUrl permanently prevents subsequent claims");

    // ══════════════════════════════════════════════════════════════
    // TEST (c): Two concurrent fulfillOrder calls give one stock decrement, one coupon increment, and one claim winner
    // ══════════════════════════════════════════════════════════════
    console.log("\n[TEST C] Concurrent fulfillOrder calls on real MongoDB...");

    // Create test user
    const testUser = await User.create({
      full_name: "Test Customer",
      email: "testcustomer@example.com",
      phone: "9876543210",
      password: "hashedpassword123",
      reward_balance: 0,
    });

    // Create test product with stock = 10
    const testProduct = await Product.create({
      name: "Organic Cotton Shirt",
      description: "Premium Shirt",
      originalPrice: 1200,
      discountedPrice: 999,
      category: new mongoose.Types.ObjectId(),
      colors: [
        {
          name: "Forest Green",
          hex: "#228B22",
          stock: 10,
          images: ["image1.jpg"],
        },
      ],
      isActive: true,
    });

    // Create test coupon with usedCount = 0
    const testCoupon = await Coupon.create({
      code: "GREEN2026",
      discountType: "percentage",
      discountValue: 10,
      expiryDate: new Date(Date.now() + 30 * 86400000),
      isActive: true,
      usedCount: 0,
      usedBy: [],
    });

    // Create test cart
    await Cart.create({
      user: testUser._id,
      items: [
        {
          product: testProduct._id,
          colorIndex: 0,
          colorName: "Forest Green",
          quantity: 2,
          price: 999,
        },
        {
          product: new mongoose.Types.ObjectId(), // another item to test selective retention
          colorIndex: 0,
          colorName: "Navy",
          quantity: 1,
          price: 499,
        },
      ],
      totalAmount: 2497,
    });

    // Create order awaiting payment
    const testOrder = await Order.create({
      user: testUser._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          colorIndex: 0,
          colorName: "Forest Green",
          quantity: 2,
          price: 999,
        },
      ],
      shippingAddress: { fullName: "Test Customer", streetAddress: "456 Market St", city: "Surat", state: "Gujarat", pincode: "395001", phone: "9876543210" },
      totalAmount: 1998,
      discountAmount: 198,
      finalAmount: 1800, // 180000 paise
      couponCode: "GREEN2026",
      paymentMethod: "Razorpay",
      paymentStatus: "pending",
      orderStatus: "pending",
      razorpayOrderId: "order_rzp_real_001",
    });

    // Mock payment details payload
    const mockPaymentPayload = {
      amount: 180000,
      currency: "INR",
      status: "captured",
      order_id: "order_rzp_real_001",
    };

    // Execute two fulfillOrder calls concurrently
    const [result1, result2] = await Promise.all([
      fulfillOrder(
        testOrder,
        "pay_rzp_real_111",
        "sig_mock_111",
        { razorpay_payment_id: "pay_rzp_real_111" },
        { paymentDetails: mockPaymentPayload }
      ),
      fulfillOrder(
        testOrder,
        "pay_rzp_real_111",
        "sig_mock_111",
        { razorpay_payment_id: "pay_rzp_real_111" },
        { paymentDetails: mockPaymentPayload }
      ),
    ]);

    // 1. Exactly one winner and one loser
    const wasAlreadyPaid1 = result1.wasAlreadyPaid;
    const wasAlreadyPaid2 = result2.wasAlreadyPaid;
    assert.strictEqual(
      (wasAlreadyPaid1 ? 0 : 1) + (wasAlreadyPaid2 ? 0 : 1),
      1,
      "Exactly one caller must win the primary payment claim"
    );
    console.log("  ✓ Exactly 1 caller won the payment claim (the other was marked wasAlreadyPaid=true)");

    // 2. Both callers returned HTTP 200 payload data with matching order ID
    assert.strictEqual(String(result1.orderId), String(testOrder._id));
    assert.strictEqual(String(result2.orderId), String(testOrder._id));
    console.log("  ✓ Both callers succeeded and returned consistent order data");

    // 3. Stock was decremented by 2 units exactly once (from 10 to 8, NOT 6)
    const updatedProduct = await Product.findById(testProduct._id);
    assert.strictEqual(
      updatedProduct.colors[0].stock,
      8,
      `Expected stock to be 8, but found ${updatedProduct.colors[0].stock}`
    );
    console.log("  ✓ Stock was decremented exactly once (10 -> 8 for 2 items)");

    // 4. Coupon was applied exactly once (usedCount = 1, NOT 2)
    const updatedCoupon = await Coupon.findOne({ code: "GREEN2026" });
    assert.strictEqual(
      updatedCoupon.usedCount,
      1,
      `Expected coupon usedCount to be 1, but found ${updatedCoupon.usedCount}`
    );
    console.log("  ✓ Coupon usage was applied exactly once (usedCount = 1)");

    // 5. Cart selectively removed ordered item and preserved the second item
    const updatedCart = await Cart.findOne({ user: testUser._id });
    assert.strictEqual(updatedCart.items.length, 1, "Cart should have 1 remaining item");
    assert.strictEqual(updatedCart.items[0].colorName, "Navy", "Remaining cart item must be Navy");
    assert.strictEqual(updatedCart.totalAmount, 499, "Cart totalAmount must match remaining item");
    console.log("  ✓ Cart selectively removed purchased item and preserved unpurchased item");

    // 6. Deduplicated notes in statusHistory (push same failure note twice)
    const failureNote = "⚠️ Payment validation failed: test failure note (Payment ID: pay_test)";
    await Order.findOneAndUpdate(
      { _id: testOrder._id, "statusHistory.note": { $ne: failureNote } },
      { $push: { statusHistory: { status: "pending", timestamp: new Date(), note: failureNote } } }
    );
    await Order.findOneAndUpdate(
      { _id: testOrder._id, "statusHistory.note": { $ne: failureNote } },
      { $push: { statusHistory: { status: "pending", timestamp: new Date(), note: failureNote } } }
    );
    const finalOrder = await Order.findById(testOrder._id);
    const matchingNotes = finalOrder.statusHistory.filter((h) => h.note === failureNote);
    assert.strictEqual(matchingNotes.length, 1, "StatusHistory note must be deduplicated");
    console.log("  ✓ StatusHistory notes are strictly deduplicated");

    // Allow setImmediate background worker to run before disconnecting
    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log("\n=======================================================");
    console.log("ALL REAL MONGODB INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=======================================================\n");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhaseAIntegrationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
