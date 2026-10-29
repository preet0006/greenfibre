import assert from "assert";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Order } from "../src/models/order.model.js";
import { User } from "../src/models/user.model.js";
import { handleShiprocketWebhook } from "../src/controllers/shiprocket.controller.js";
import {
    updateOrderStatus,
    getMyOrders,
    getSingleOrder,
} from "../src/controllers/order.controller.js";

// Helper to mock Express req and res
function createMockReqRes({ body = {}, headers = {}, params = {}, query = {}, user = null }) {
    const req = { body, headers, params, query, user };
    let statusCode = 200;
    let responseData = null;

    const res = {
        status(code) {
            statusCode = code;
            return res;
        },
        json(data) {
            responseData = data;
            return res;
        },
        getStatusCode: () => statusCode,
        getData: () => responseData,
    };

    return { req, res };
}

async function runStage2IntegrationTests() {
    console.log("================================================================================");
    console.log("🧪 RUNNING STAGE 2 REAL-MONGODB INTEGRATION TESTS (mongodb-memory-server)");
    console.log("================================================================================\n");

    let mongoServer;
    let passed = 0;
    let failed = 0;

    function recordPass(desc) {
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
    }

    function recordFail(desc, err) {
        console.error(`  ❌ FAIL: ${desc}`, err || "");
        failed++;
    }

    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // ── 1. SECURITY AUDIT GUARD ──
        // Refuse to run against any production or remote cluster host
        const forbiddenPatterns = ["mongodb.net", "ihhkcrj", "ac-tcotkwn", "greenfibre.org"];
        for (const pattern of forbiddenPatterns) {
            if (uri.toLowerCase().includes(pattern)) {
                throw new Error("SECURITY ABORT: Refusing to run tests against remote/production cluster host!");
            }
        }
        // Do NOT print connection string per user requirements
        console.log("🔒 Verified local-only memory instance (production hosts strictly refused).");

        await mongoose.connect(uri);
        console.log("📡 Connected to isolated in-memory MongoDB.\n");

        // Set webhook secret for tests
        process.env.SHIPPING_WEBHOOK_SECRET = "stage2_test_secret_token";
        const webhookHeaders = { "x-api-key": "stage2_test_secret_token" };

        const testUser = await User.create({
            full_name: "Customer User",
            email: "customer@greenfibre.com",
            phone: "9876543210",
            password: "password123",
            role: "user",
        });

        const adminUser = await User.create({
            full_name: "Admin User",
            email: "admin@greenfibre.com",
            phone: "9999999999",
            password: "adminpassword123",
            role: "admin",
        });

        const defaultShippingAddress = {
            fullName: "Customer User",
            phone: "9876543210",
            streetAddress: "123 Green Way",
            city: "Ahmedabad",
            state: "Gujarat",
            pincode: "380001",
        };

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 1: DELIVERED on a processing order (Forward jump allowed)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("── Case 1: DELIVERED on a processing order (Forward jump allowed) ──");
        const order1 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1200,
            finalAmount: 1200,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: {
                trackingNumber: "AWB_CASE_1",
                awbCode: "AWB_CASE_1",
                shiprocketOrderId: "SR_CASE_1",
            },
            statusHistory: [
                { status: "processing", timestamp: new Date(), note: "Order confirmed and processing" },
            ],
        });

        const { req: req1, res: res1 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_1",
                current_status: "DELIVERED",
                current_timestamp: "2026-10-22 10:00:00",
                courier_name: "Delhivery",
            },
        });

        await handleShiprocketWebhook(req1, res1);
        const data1 = res1.getData();
        const updated1 = await Order.findById(order1._id);

        assert.strictEqual(res1.getStatusCode(), 200, "Webhook responds with 200");
        assert.strictEqual(data1.processed, true, "Case 1: event was processed");
        assert.strictEqual(updated1.orderStatus, "delivered", "Case 1: orderStatus jumped from processing to delivered");
        assert.strictEqual(updated1.shippingDetails.lastCourierStatus, "DELIVERED", "Case 1: lastCourierStatus recorded");
        assert(updated1.shippingDetails.deliveredAt, "Case 1: deliveredAt timestamp set");
        recordPass("DELIVERED on a processing order applied successfully via forward jump.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 2: IN TRANSIT after DELIVERED (Ignored, no history appended)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 2: IN TRANSIT after DELIVERED (Ignored, terminal state) ──");
        const histLenBefore2 = updated1.statusHistory.length;

        const { req: req2, res: res2 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_1",
                current_status: "IN TRANSIT",
                current_timestamp: "2026-10-22 11:00:00",
            },
        });

        await handleShiprocketWebhook(req2, res2);
        const data2 = res2.getData();
        const updated2 = await Order.findById(order1._id);

        assert.strictEqual(res2.getStatusCode(), 200, "Responds with 200 to acknowledge webhook");
        assert.strictEqual(data2.processed, false, "Case 2: rejected because order is already terminal delivered");
        assert.strictEqual(data2.reason, "invalid_or_regressive_transition");
        assert.strictEqual(updated2.orderStatus, "delivered", "Case 2: orderStatus remains delivered");
        assert.strictEqual(updated2.statusHistory.length, histLenBefore2, "Case 2: NO history entry appended for backward move");
        recordPass("IN TRANSIT after DELIVERED is safely ignored with zero history appended.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 3: Two concurrent pushes (One winner via atomic findOneAndUpdate)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 3: Two concurrent pushes (One winner via atomic update) ──");
        const order3 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1500,
            finalAmount: 1500,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: {
                trackingNumber: "AWB_CASE_3",
                awbCode: "AWB_CASE_3",
            },
            statusHistory: [
                { status: "processing", timestamp: new Date(), note: "Processing" },
            ],
        });

        const { req: req3a, res: res3a } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_3",
                current_status: "DELIVERED",
                current_timestamp: "2026-10-22 12:00:00",
            },
        });
        const { req: req3b, res: res3b } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_3",
                current_status: "DELIVERED",
                current_timestamp: "2026-10-22 12:00:00",
            },
        });

        await Promise.all([
            handleShiprocketWebhook(req3a, res3a),
            handleShiprocketWebhook(req3b, res3b),
        ]);

        const data3a = res3a.getData();
        const data3b = res3b.getData();
        const updated3 = await Order.findById(order3._id);

        const winners = [data3a, data3b].filter((d) => d?.processed === true);
        const losers = [data3a, data3b].filter((d) => d?.processed === false);

        assert.strictEqual(winners.length, 1, "Exactly one concurrent webhook caller wins the atomic write");
        assert.strictEqual(losers.length, 1, "The second concurrent caller is safely rejected");
        assert.strictEqual(updated3.orderStatus, "delivered", "Final order status is delivered");
        const deliveredHistory = updated3.statusHistory.filter((h) => h.status === "delivered");
        assert.strictEqual(deliveredHistory.length, 1, "Exactly one history entry created, not two");
        recordPass("Two concurrent pushes yielded exactly 1 winner and 1 loser with atomic deduplication.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 4: Unpaid order push (Ignored, no DB write)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 4: Unpaid order push (Ignored, no DB write) ──");
        const order4 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 800,
            finalAmount: 800,
            paymentStatus: "pending", // NOT paid
            orderStatus: "placed",
            shippingDetails: {
                trackingNumber: "AWB_CASE_4",
            },
            statusHistory: [
                { status: "placed", timestamp: new Date(), note: "Placed" },
            ],
        });

        const { req: req4, res: res4 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_4",
                current_status: "SHIPPED",
                current_timestamp: "2026-10-22 13:00:00",
            },
        });

        await handleShiprocketWebhook(req4, res4);
        const data4 = res4.getData();
        const updated4 = await Order.findById(order4._id);

        assert.strictEqual(res4.getStatusCode(), 200, "Responds 200");
        assert.strictEqual(data4.processed, false, "Not processed");
        assert.strictEqual(data4.reason, "order_not_paid", "Reason is order_not_paid");
        assert.strictEqual(updated4.orderStatus, "placed", "Order status untouched");
        assert.strictEqual(updated4.shippingDetails.lastCourierStatus, undefined, "No shippingDetails DB write");
        assert.strictEqual(updated4.statusHistory.length, 1, "History length untouched");
        recordPass("Unpaid order push was ignored with 200 { processed:false, reason:'order_not_paid' } and no DB write.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 5: Duplicate push (Ignored)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 5: Duplicate push (Same status & timestamp) ──");
        const order5 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 900,
            finalAmount: 900,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: {
                trackingNumber: "AWB_CASE_5",
            },
        });

        const { req: req5a, res: res5a } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_5",
                current_status: "SHIPPED",
                current_timestamp: "2026-10-22 14:00:00",
            },
        });
        await handleShiprocketWebhook(req5a, res5a);
        assert.strictEqual(res5a.getData().processed, true, "First push succeeds");

        const { req: req5b, res: res5b } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_5",
                current_status: "SHIPPED",
                current_timestamp: "2026-10-22 14:00:00",
            },
        });
        await handleShiprocketWebhook(req5b, res5b);
        const data5b = res5b.getData();
        assert.strictEqual(data5b.processed, false, "Duplicate push is not processed");
        assert.strictEqual(data5b.reason, "duplicate_or_superseded_event", "Deduplicated via atomic filter");
        recordPass("Duplicate push event safely recognized and ignored.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 6: Unknown status (Raw metadata saved, orderStatus untouched)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 6: Unknown status (Raw metadata saved, orderStatus untouched) ──");
        const order6 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1100,
            finalAmount: 1100,
            paymentStatus: "paid",
            orderStatus: "shipped",
            shippingDetails: {
                trackingNumber: "AWB_CASE_6",
            },
            statusHistory: [{ status: "shipped", timestamp: new Date(), note: "Shipped" }],
        });

        const { req: req6, res: res6 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_CASE_6",
                current_status: "SOME_UNMAPPED_COURIER_PING",
                current_timestamp: "2026-10-22 15:00:00",
            },
        });

        await handleShiprocketWebhook(req6, res6);
        const data6 = res6.getData();
        const updated6 = await Order.findById(order6._id);

        assert.strictEqual(res6.getStatusCode(), 200, "Responds 200");
        assert.strictEqual(data6.processed, false);
        assert.strictEqual(data6.reason, "unmapped_status");
        assert.strictEqual(updated6.orderStatus, "shipped", "orderStatus remains untouched");
        assert.strictEqual(updated6.shippingDetails.lastCourierStatus, "SOME_UNMAPPED_COURIER_PING", "Raw status saved");
        recordPass("Unknown status saved raw courier metadata without mutating orderStatus.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 7: Admin override without reason (Blocked on terminal / locked order)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 7: Admin override without reason (Blocked on terminal order) ──");
        const order7 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1400,
            finalAmount: 1400,
            paymentStatus: "paid",
            orderStatus: "delivered", // Terminal
            shippingDetails: { trackingNumber: "AWB_CASE_7" },
        });

        const { req: req7, res: res7 } = createMockReqRes({
            user: adminUser,
            params: { orderId: order7._id.toString() },
            body: {
                status: "shipped",
                overrideReason: "", // Empty reason
            },
        });

        await updateOrderStatus(req7, res7);
        const data7 = res7.getData();
        const updated7 = await Order.findById(order7._id);

        assert.strictEqual(res7.getStatusCode(), 400, "Blocked with HTTP 400");
        assert.strictEqual(data7.success, false);
        assert.strictEqual(data7.requiresOverride, true, "Returns requiresOverride flag");
        assert.strictEqual(updated7.orderStatus, "delivered", "Status remains delivered in DB");
        recordPass("Admin override without reason correctly blocked on terminal order.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 8: Admin override with reason (Allowed, audit note stored, customer API sanitizes)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 8: Admin override with reason & customer API note sanitization ──");
        const { req: req8, res: res8 } = createMockReqRes({
            user: adminUser,
            params: { orderId: order7._id.toString() },
            body: {
                status: "shipped",
                overrideReason: "Customer phoned: package delivered to wrong flat, reshipping",
            },
        });

        await updateOrderStatus(req8, res8);
        const data8 = res8.getData();
        const updated8 = await Order.findById(order7._id);

        assert.strictEqual(res8.getStatusCode(), 200, "Admin override with reason succeeds");
        assert.strictEqual(data8.success, true);
        assert.strictEqual(updated8.orderStatus, "shipped", "Status updated to shipped in DB");

        // Verify audit note is stored in DB
        const lastHistEntry = updated8.statusHistory[updated8.statusHistory.length - 1];
        assert(lastHistEntry.note.includes("[Admin Override]"), "DB history has [Admin Override]");
        assert(lastHistEntry.note.includes("package delivered to wrong flat"), "DB history records admin reason");

        // Test customer API (getSingleOrder as customer)
        const { req: reqCust, res: resCust } = createMockReqRes({
            user: testUser, // Customer role
            params: { orderId: order7._id.toString() },
        });
        await getSingleOrder(reqCust, resCust);
        const custOrderData = resCust.getData().order;

        const custAuditEntry = custOrderData.statusHistory.find((h) =>
            h.note && (h.note.includes("[Admin Override]") || h.note.includes("package delivered to wrong flat"))
        );
        assert.strictEqual(custAuditEntry, undefined, "Customer API MUST NOT return the internal admin audit note");

        // Test customer API (getMyOrders as customer)
        const { req: reqMyOrders, res: resMyOrders } = createMockReqRes({
            user: testUser,
            query: { page: 1, limit: 10 },
        });
        await getMyOrders(reqMyOrders, resMyOrders);
        const myOrdersData = resMyOrders.getData().orders;
        const matchedMyOrder = myOrdersData.find((o) => o._id.toString() === order7._id.toString());
        assert(matchedMyOrder, "Order found in my-orders");
        const myOrdersAuditEntry = matchedMyOrder.statusHistory.find((h) =>
            h.note && (h.note.includes("[Admin Override]") || h.note.includes("package delivered to wrong flat"))
        );
        assert.strictEqual(myOrdersAuditEntry, undefined, "getMyOrders API MUST NOT return the internal admin audit note");

        // Test admin API (getSingleOrder as admin): SHOULD return the internal note
        const { req: reqAdminCheck, res: resAdminCheck } = createMockReqRes({
            user: adminUser, // Admin role
            params: { orderId: order7._id.toString() },
        });
        await getSingleOrder(reqAdminCheck, resAdminCheck);
        const adminOrderData = resAdminCheck.getData().order;
        const adminAuditEntry = adminOrderData.statusHistory.find((h) =>
            h.note && h.note.includes("[Admin Override]")
        );
        assert(adminAuditEntry, "Admin API retains the full internal audit note");

        recordPass("Admin override with reason stored audit note in DB, which was stripped from customer APIs and retained for admin.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 9 (3a): True race condition with barrier (Both handlers read before either updates)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 9 (3a): True race barrier (Pause both after read, release before update) ──");
        const orderRace = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 2000,
            finalAmount: 2000,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: {
                trackingNumber: "AWB_TRUE_RACE",
                awbCode: "AWB_TRUE_RACE",
            },
            statusHistory: [
                { status: "processing", timestamp: new Date(), note: "Initial processing" },
            ],
        });

        // Set up synchronization barrier
        let readBarrierCount = 0;
        let releaseBarrier;
        const barrierPromise = new Promise((resolve) => {
            releaseBarrier = resolve;
        });

        const originalFindOne = Order.findOne.bind(Order);
        Order.findOne = async function (filter, ...args) {
            const result = await originalFindOne(filter, ...args);
            // Intercept our specific race order
            if (result && result.shippingDetails?.awbCode === "AWB_TRUE_RACE") {
                readBarrierCount++;
                if (readBarrierCount === 2) {
                    // Second handler has completed read; release both handlers into update phase!
                    releaseBarrier();
                } else {
                    // First handler waits until second handler completes read
                    await barrierPromise;
                }
            }
            return result;
        };

        const { req: reqRaceA, res: resRaceA } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_TRUE_RACE",
                current_status: "DELIVERED",
                current_timestamp: "2026-10-22 17:00:00",
                courier_name: "BlueDart",
            },
        });
        const { req: reqRaceB, res: resRaceB } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_TRUE_RACE",
                current_status: "DELIVERED",
                current_timestamp: "2026-10-22 17:00:00",
                courier_name: "BlueDart",
            },
        });

        try {
            await Promise.all([
                handleShiprocketWebhook(reqRaceA, resRaceA),
                handleShiprocketWebhook(reqRaceB, resRaceB),
            ]);
        } finally {
            // Restore original findOne
            Order.findOne = originalFindOne;
        }

        const dataRaceA = resRaceA.getData();
        const dataRaceB = resRaceB.getData();
        const updatedRace = await Order.findById(orderRace._id);

        const raceWinners = [dataRaceA, dataRaceB].filter((d) => d?.processed === true);
        const raceLosers = [dataRaceA, dataRaceB].filter((d) => d?.processed === false);

        assert.strictEqual(readBarrierCount, 2, "Both webhook handlers participated in the pre-update barrier");
        assert.strictEqual(raceWinners.length, 1, "Exactly one concurrent caller won the atomic write");
        assert.strictEqual(raceLosers.length, 1, "The second concurrent caller was rejected by atomic filter");
        assert.strictEqual(raceLosers[0].reason, "duplicate_or_superseded_event");
        assert.strictEqual(updatedRace.orderStatus, "delivered", "Final order status is delivered");
        const deliveredHist = updatedRace.statusHistory.filter((h) => h.status === "delivered");
        assert.strictEqual(deliveredHist.length, 1, "Exactly one history entry recorded in statusHistory");
        recordPass("True race with barrier yielded exactly one write and zero duplicate history entries.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 10 (3b): Real Shiprocket timestamp format & missing current_timestamp
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 10 (3b): Real Shiprocket timestamp format ('DD MM YYYY HH:mm:ss') & missing timestamp ──");
        // Part 1: Real timestamp format "09 09 2026 16:13:13"
        const order10a = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1300,
            finalAmount: 1300,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: { trackingNumber: "AWB_SR_TIMESTAMP" },
            statusHistory: [{ status: "processing", timestamp: new Date(), note: "Processing" }],
        });

        const realSrTimestamp = "09 09 2026 16:13:13";
        const { req: req10a1, res: res10a1 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_SR_TIMESTAMP",
                current_status: "IN TRANSIT",
                current_timestamp: realSrTimestamp,
            },
        });
        await handleShiprocketWebhook(req10a1, res10a1);
        const data10a1 = res10a1.getData();
        const updated10a1 = await Order.findById(order10a._id);

        assert.strictEqual(data10a1.processed, true, "Real format timestamp processed successfully");
        assert.strictEqual(updated10a1.orderStatus, "shipped");
        assert.strictEqual(updated10a1.shippingDetails.lastCourierTimestamp, realSrTimestamp);

        // Deduplication test with exact same real timestamp
        const { req: req10a2, res: res10a2 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_SR_TIMESTAMP",
                current_status: "IN TRANSIT",
                current_timestamp: realSrTimestamp,
            },
        });
        await handleShiprocketWebhook(req10a2, res10a2);
        assert.strictEqual(res10a2.getData().processed, false);
        assert.strictEqual(res10a2.getData().reason, "duplicate_or_superseded_event");

        // Part 2: Missing current_timestamp (omitted from payload)
        const order10b = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1350,
            finalAmount: 1350,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: { trackingNumber: "AWB_MISSING_TIMESTAMP" },
            statusHistory: [{ status: "processing", timestamp: new Date(), note: "Processing" }],
        });

        const { req: req10b1, res: res10b1 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_MISSING_TIMESTAMP",
                current_status: "SHIPPED",
                // current_timestamp is omitted
            },
        });
        await handleShiprocketWebhook(req10b1, res10b1);
        const data10b1 = res10b1.getData();
        const updated10b1 = await Order.findById(order10b._id);

        assert.strictEqual(data10b1.processed, true, "Payload with missing timestamp processed successfully");
        assert.strictEqual(updated10b1.orderStatus, "shipped");
        assert.strictEqual(updated10b1.shippingDetails.lastCourierTimestamp, "");

        // Duplicate push with missing timestamp deduplicated by status + targetOrderStatus
        const { req: req10b2, res: res10b2 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_MISSING_TIMESTAMP",
                current_status: "SHIPPED",
            },
        });
        await handleShiprocketWebhook(req10b2, res10b2);
        assert.strictEqual(res10b2.getData().processed, false);
        assert.strictEqual(res10b2.getData().reason, "duplicate_or_superseded_event");
        recordPass("Real Shiprocket format ('DD MM YYYY HH:mm:ss') and missing timestamp both processed and deduplicated correctly.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 11 (3c): undelivered -> out for delivery (Re-attempt transition)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 11 (3c): undelivered -> out for delivery (Re-attempt delivery) ──");
        const order11 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1700,
            finalAmount: 1700,
            paymentStatus: "paid",
            orderStatus: "undelivered",
            shippingDetails: { trackingNumber: "AWB_UNDELIVERED_RETRY" },
            statusHistory: [
                { status: "processing", timestamp: new Date(Date.now() - 3600000), note: "Processing" },
                { status: "shipped", timestamp: new Date(Date.now() - 1800000), note: "Shipped" },
                { status: "undelivered", timestamp: new Date(Date.now() - 900000), note: "Customer unavailable" },
            ],
        });

        const { req: req11, res: res11 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_UNDELIVERED_RETRY",
                current_status: "OUT FOR DELIVERY",
                current_timestamp: "22 10 2026 15:30:00",
                courier_name: "Shadowfax",
            },
        });

        await handleShiprocketWebhook(req11, res11);
        const data11 = res11.getData();
        const updated11 = await Order.findById(order11._id);

        assert.strictEqual(res11.getStatusCode(), 200);
        assert.strictEqual(data11.processed, true, "Transition from undelivered to out for delivery permitted");
        assert.strictEqual(updated11.orderStatus, "shipped", "Order status moved from undelivered back to shipped");
        const lastHist11 = updated11.statusHistory[updated11.statusHistory.length - 1];
        assert.strictEqual(lastHist11.status, "shipped");
        assert(lastHist11.note.includes("OUT FOR DELIVERY"));
        recordPass("Transition from undelivered -> out for delivery successfully updated status to shipped.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 12 (3d): Automated push on a lost order is ignored (Locked state)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 12 (3d): Automated push on a lost order is ignored ──");
        const order12 = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 2200,
            finalAmount: 2200,
            paymentStatus: "paid",
            orderStatus: "lost", // Locked state
            shippingDetails: {
                trackingNumber: "AWB_LOST_LOCKED",
                lastCourierStatus: "LOST",
            },
            statusHistory: [
                { status: "shipped", timestamp: new Date(Date.now() - 7200000), note: "Shipped" },
                { status: "lost", timestamp: new Date(Date.now() - 3600000), note: "Shipment lost in transit" },
            ],
        });
        const histLenBefore12 = order12.statusHistory.length;

        const { req: req12, res: res12 } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                awb: "AWB_LOST_LOCKED",
                current_status: "DELIVERED",
                current_timestamp: "22 10 2026 16:45:00",
            },
        });

        await handleShiprocketWebhook(req12, res12);
        const data12 = res12.getData();
        const updated12 = await Order.findById(order12._id);

        assert.strictEqual(res12.getStatusCode(), 200, "Responds with 200 to acknowledge webhook");
        assert.strictEqual(data12.processed, false, "Automated courier push on lost order is rejected");
        assert.strictEqual(data12.reason, "invalid_or_regressive_transition");
        assert.strictEqual(updated12.orderStatus, "lost", "orderStatus remains strictly lost");
        assert.strictEqual(updated12.statusHistory.length, histLenBefore12, "Zero history entries appended for locked state rejection");
        assert.strictEqual(updated12.shippingDetails.lastCourierStatus, "DELIVERED", "Latest raw courier status saved for inspection");
        recordPass("Automated push on lost order was ignored with zero status mutation and zero history entry.");

        // ─────────────────────────────────────────────────────────────────────────────
        // CASE 13 (3e): Push for an order with no AWB (Matched by sr_order_id or order_id)
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n── Case 13 (3e): Push for order with no AWB (Matched by sr_order_id & order_id) ──");
        // Subcase 13A: Matched by sr_order_id
        const order13a = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1800,
            finalAmount: 1800,
            paymentStatus: "paid",
            orderStatus: "processing",
            shippingDetails: {
                shiprocketOrderId: "99887766", // No AWB code yet!
            },
            statusHistory: [{ status: "processing", timestamp: new Date(), note: "Processing" }],
        });

        const { req: req13a, res: res13a } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                sr_order_id: "99887766",
                awb: "AWB_NEW_DISPATCH_13A",
                current_status: "SHIPPED",
                current_timestamp: "22 10 2026 17:15:00",
                courier_name: "Xpressbees",
            },
        });

        await handleShiprocketWebhook(req13a, res13a);
        const data13a = res13a.getData();
        const updated13a = await Order.findById(order13a._id);

        assert.strictEqual(data13a.processed, true, "Matched by sr_order_id when order had no AWB");
        assert.strictEqual(updated13a.orderStatus, "shipped");
        assert.strictEqual(updated13a.shippingDetails.awbCode, "AWB_NEW_DISPATCH_13A", "Incoming AWB assigned to order");
        assert.strictEqual(updated13a.shippingDetails.trackingNumber, "AWB_NEW_DISPATCH_13A");
        assert.strictEqual(updated13a.shippingDetails.trackingUrl, "https://shiprocket.co/tracking/AWB_NEW_DISPATCH_13A");

        // Subcase 13B: Matched by order_id (with prefix stripping)
        process.env.SHIPROCKET_ORDER_ID_PREFIX = "TEST-";
        const order13b = await Order.create({
            user: testUser._id,
            shippingAddress: defaultShippingAddress,
            totalAmount: 1950,
            finalAmount: 1950,
            paymentStatus: "paid",
            orderStatus: "processing",
            easebuzzOrderId: "GF_ORDER_NOAWB_13B", // No AWB, no sr_order_id
            statusHistory: [{ status: "processing", timestamp: new Date(), note: "Processing" }],
        });

        const { req: req13b, res: res13b } = createMockReqRes({
            headers: webhookHeaders,
            body: {
                order_id: "TEST-GF_ORDER_NOAWB_13B", // Prefixed order_id
                awb: "AWB_NEW_DISPATCH_13B",
                current_status: "SHIPPED",
                current_timestamp: "22 10 2026 17:30:00",
                courier_name: "Delhivery",
            },
        });

        await handleShiprocketWebhook(req13b, res13b);
        const data13b = res13b.getData();
        const updated13b = await Order.findById(order13b._id);

        assert.strictEqual(data13b.processed, true, "Matched by prefixed order_id when order had no AWB");
        assert.strictEqual(updated13b.orderStatus, "shipped");
        assert.strictEqual(updated13b.shippingDetails.awbCode, "AWB_NEW_DISPATCH_13B");
        recordPass("Orders with no AWB matched successfully by sr_order_id and prefixed order_id, assigning incoming AWB.");

        // ─────────────────────────────────────────────────────────────────────────────
        // SUMMARY
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n================================================================================");
        console.log(`🎯 INTEGRATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log("================================================================================\n");

        if (failed > 0) {
            process.exit(1);
        }
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    }
}

runStage2IntegrationTests().catch((err) => {
    console.error("FATAL: Uncaught error in integration test runner:", err);
    process.exit(1);
});
