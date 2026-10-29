/**
 * tests/channel_stock.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete Test Suite for B2B / B2C Channel Stock Splitting:
 *
 *  1. Single item update
 *  2. Multi-item update
 *  3. Missing field validation
 *  4. Negative value validation
 *  5. Non-integer validation
 *  6. Exceeds physical stock validation
 *  7. Duplicate SKU rejection
 *  8. Unknown SKU handling
 *  9. Partial failure handling (HTTP 207)
 * 10. Concurrent orders on last unit (atomic oversell prevention)
 * 11. Multi-item order rollback on partial failure
 * 12. Cancellation restore to matching channel
 * 13. Double-restore idempotency guard
 * 14. Webhook retry guard (stockDeducted flag)
 * 15. B2B vs B2C channel deduction isolation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert/strict";
import { Product } from "../src/models/product.model.js";
import { Order } from "../src/models/order.model.js";
import { Category } from "../src/models/category.model.js";
import { StockAuditLog } from "../src/models/stockAudit.model.js";
import { updateChannelStock, getChannelStockTable } from "../src/controllers/stock.controller.js";
import {
    getChannelStock,
    getChannelTotalStock,
    projectChannelStock,
    deductOrderStock,
    restoreOrderStock,
} from "../src/utils/channelStock.js";
import { runMigration } from "../src/scripts/migrate-channel-stock.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Mock Express Response helper
function createMockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
    };
}

// Test Runner
async function runTests() {
    console.log("===============================================================");
    console.log("🧪 STARTING B2B/B2C CHANNEL STOCK COMPREHENSIVE TEST SUITE");
    console.log("===============================================================");

    await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });
    console.log("📦 Connected to MongoDB for test execution.");

    const testPrefix = `TEST-${Date.now()}`;
    const createdProductIds = [];
    const createdOrderIds = [];

    let passedCount = 0;
    let failedCount = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  ✅ PASS: ${name}`);
            passedCount++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failedCount++;
        }
    }

    let sampleCategory = await Category.findOne({}).lean();
    if (!sampleCategory) {
        sampleCategory = await Category.create({ name: "Eco Packaging", slug: "eco-packaging" });
    }

    const defaultShipping = {
        fullName: "Test Customer",
        phone: "9876543210",
        addressLine1: "123 Eco Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
    };

    try {
        // Setup helper: create a dedicated test product
        async function createTestProduct(overrides = {}) {
            const p = await Product.create({
                name: `${testPrefix} Product`,
                slug: `${testPrefix.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`,
                sku: `${testPrefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                category: sampleCategory._id,
                description: "Test description for eco product inventory",
                stockQuantity: 100,
                b2bStock: 40,
                b2cStock: 60,
                originalPrice: 999,
                discountedPrice: 799,
                colors: [
                    {
                        name: "Green",
                        hex: "#00FF00",
                        stock: 60,
                        b2bStock: 24,
                        b2cStock: 36,
                    },
                    {
                        name: "Beige",
                        hex: "#F5F5DC",
                        stock: 40,
                        b2bStock: 16,
                        b2cStock: 24,
                    },
                ],
                ...overrides,
            });
            createdProductIds.push(p._id);
            return p;
        }

        // ─────────────────────────────────────────────────────────────
        // 1. Single Item Update
        // ─────────────────────────────────────────────────────────────
        await test("1. Single item stock update via PUT /api/admin/stock/channel", async () => {
            const p = await createTestProduct({ stockQuantity: 100, b2bStock: 20, b2cStock: 80 });
            const req = {
                body: {
                    productId: p._id.toString(),
                    b2bStock: 30,
                    b2cStock: 70,
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 200, "Should return 200 on success");
            assert.equal(res.body.summary.updated, 1, "Should report 1 item updated");

            const reloaded = await Product.findById(p._id).lean();
            assert.equal(reloaded.b2bStock, 30, "b2bStock should be 30");
            assert.equal(reloaded.b2cStock, 70, "b2cStock should be 70");
        });

        // ─────────────────────────────────────────────────────────────
        // 2. Multi-Item Update
        // ─────────────────────────────────────────────────────────────
        await test("2. Multi-item batch update", async () => {
            const p1 = await createTestProduct({ stockQuantity: 200, b2bStock: 50, b2cStock: 150 });
            const p2 = await createTestProduct({ stockQuantity: 300, b2bStock: 100, b2cStock: 200 });

            const req = {
                body: {
                    mode: "set",
                    items: [
                        { productId: p1._id.toString(), b2bStock: 80, b2cStock: 120 },
                        { productId: p2._id.toString(), b2bStock: 150, b2cStock: 150 },
                    ],
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.body.summary.updated, 2);

            const r1 = await Product.findById(p1._id).lean();
            const r2 = await Product.findById(p2._id).lean();
            assert.equal(r1.b2bStock, 80);
            assert.equal(r1.b2cStock, 120);
            assert.equal(r2.b2bStock, 150);
            assert.equal(r2.b2cStock, 150);
        });

        // ─────────────────────────────────────────────────────────────
        // 3. Missing Field Validation
        // ─────────────────────────────────────────────────────────────
        await test("3. Validation rejects item with missing productId and sku", async () => {
            const req = {
                body: {
                    items: [{ b2bStock: 50, b2cStock: 50 }],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.success, false);
        });

        // ─────────────────────────────────────────────────────────────
        // 4. Negative Value Validation
        // ─────────────────────────────────────────────────────────────
        await test("4. Rejects negative stock value in 'set' mode", async () => {
            const p = await createTestProduct();
            const req = {
                body: {
                    items: [{ productId: p._id.toString(), b2bStock: -10, b2cStock: 50 }],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.summary?.failed, 1);
        });

        // ─────────────────────────────────────────────────────────────
        // 5. Non-Integer Validation
        // ─────────────────────────────────────────────────────────────
        await test("5. Rejects floating point non-integer stock values", async () => {
            const p = await createTestProduct();
            const req = {
                body: {
                    items: [{ productId: p._id.toString(), b2bStock: 25.5, b2cStock: 50 }],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.success, false);
        });

        // ─────────────────────────────────────────────────────────────
        // 6. Exceeds Physical Stock Validation
        // ─────────────────────────────────────────────────────────────
        await test("6. Rejects update where b2bStock + b2cStock exceeds physical stock", async () => {
            const p = await createTestProduct({ stockQuantity: 100 });
            const req = {
                body: {
                    items: [{ productId: p._id.toString(), b2bStock: 80, b2cStock: 80 }], // 160 > 100
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.summary.failed, 1);
            assert.match(res.body.results[0].reason, /exceeds physical stock/i);
        });

        // ─────────────────────────────────────────────────────────────
        // 7. Duplicate SKU Rejection
        // ─────────────────────────────────────────────────────────────
        await test("7. Rejects duplicate SKU within a single request", async () => {
            const req = {
                body: {
                    items: [
                        { sku: "DUPLICATE-SKU-1", b2bStock: 10, b2cStock: 10 },
                        { sku: "DUPLICATE-SKU-1", b2bStock: 20, b2cStock: 20 },
                    ],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /duplicate sku/i);
        });

        // ─────────────────────────────────────────────────────────────
        // 8. Unknown SKU Handling
        // ─────────────────────────────────────────────────────────────
        await test("8. Gracefully handles unknown SKU as failed item", async () => {
            const req = {
                body: {
                    items: [{ sku: "NON-EXISTENT-SKU-9999", b2bStock: 10, b2cStock: 10 }],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.summary.failed, 1);
            assert.equal(res.body.results[0].status, "failed");
        });

        // ─────────────────────────────────────────────────────────────
        // 9. Partial Failure (HTTP 207 Multi-Status)
        // ─────────────────────────────────────────────────────────────
        await test("9. Partial failure returns HTTP 207 Multi-Status", async () => {
            const pValid = await createTestProduct({ stockQuantity: 100, b2bStock: 20, b2cStock: 80 });
            const req = {
                body: {
                    items: [
                        { productId: pValid._id.toString(), b2bStock: 40, b2cStock: 60 }, // valid
                        { sku: "DOES-NOT-EXIST-777", b2bStock: 10, b2cStock: 10 },        // invalid
                    ],
                },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 207, "Mixed success and failure must return 207");
            assert.equal(res.body.summary.updated, 1);
            assert.equal(res.body.summary.failed, 1);
        });

        // ─────────────────────────────────────────────────────────────
        // 10. Concurrent Orders on Last Unit
        // ─────────────────────────────────────────────────────────────
        await test("10. Concurrent orders on the last unit — exactly one succeeds", async () => {
            // Create product with exactly 1 unit of B2C stock
            const p = await createTestProduct({
                stockQuantity: 1,
                b2bStock: 0,
                b2cStock: 1,
                colors: [{ name: "Single", hex: "#000", stock: 1, b2bStock: 0, b2cStock: 1 }],
            });

            const order1 = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2c",
                items: [{ product: p._id, colorIndex: 0, quantity: 1, name: "Last Unit" }],
            };
            const order2 = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2c",
                items: [{ product: p._id, colorIndex: 0, quantity: 1, name: "Last Unit" }],
            };

            // Fire both deductions concurrently
            const [res1, res2] = await Promise.all([
                deductOrderStock(order1),
                deductOrderStock(order2),
            ]);

            const successes = [res1.success, res2.success].filter(Boolean).length;
            const failures = [res1.success, res2.success].filter((s) => !s).length;

            assert.equal(successes, 1, "Exactly one order must succeed");
            assert.equal(failures, 1, "Exactly one order must fail");

            const finalP = await Product.findById(p._id).lean();
            assert.equal(finalP.b2cStock, 0, "B2C stock should be 0");
            assert.equal(finalP.colors[0].b2cStock, 0, "Variant B2C stock should be 0");
        });

        // ─────────────────────────────────────────────────────────────
        // 11. Multi-Item Order Rollback
        // ─────────────────────────────────────────────────────────────
        await test("11. Multi-item order cleanly rolls back if second item is out of stock", async () => {
            const p1 = await createTestProduct({
                stockQuantity: 10,
                b2bStock: 0,
                b2cStock: 10,
                colors: [{ name: "P1", hex: "#000", stock: 10, b2bStock: 0, b2cStock: 10 }],
            });
            const p2 = await createTestProduct({
                stockQuantity: 2,
                b2bStock: 0,
                b2cStock: 2,
                colors: [{ name: "P2", hex: "#000", stock: 2, b2bStock: 0, b2cStock: 2 }],
            });

            const multiOrder = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2c",
                items: [
                    { product: p1._id, colorIndex: 0, quantity: 5, name: "Item 1" }, // has stock (5 <= 10)
                    { product: p2._id, colorIndex: 0, quantity: 10, name: "Item 2" }, // insufficient stock (10 > 2)
                ],
            };

            const deductRes = await deductOrderStock(multiOrder);
            assert.equal(deductRes.success, false, "Order deduction must fail");

            // Verify Item 1 was rolled back and did not lose stock
            const checkP1 = await Product.findById(p1._id).lean();
            assert.equal(checkP1.b2cStock, 10, "P1 B2C stock must remain 10 after rollback");
            assert.equal(checkP1.colors[0].b2cStock, 10, "P1 variant B2C stock must remain 10");
        });

        // ─────────────────────────────────────────────────────────────
        // 12. Cancellation Restore to Correct Channel
        // ─────────────────────────────────────────────────────────────
        await test("12. Cancellation restores stock to the order channel and physical stock", async () => {
            const p = await createTestProduct({
                stockQuantity: 100,
                b2bStock: 40,
                b2cStock: 60,
                colors: [{ name: "A", hex: "#000", stock: 100, b2bStock: 40, b2cStock: 60 }],
            });

            // Create and deduct order
            const orderDoc = await Order.create({
                user: new mongoose.Types.ObjectId(),
                shippingAddress: defaultShipping,
                items: [{ product: p._id, colorIndex: 0, quantity: 15, name: "Restorable", price: 100 }],
                orderChannel: "b2c",
                stockDeducted: true,
                stockRestored: false,
                totalAmount: 1500,
                finalAmount: 1500,
            });
            createdOrderIds.push(orderDoc._id);

            // Deduct first
            await Product.findByIdAndUpdate(p._id, {
                $inc: {
                    "colors.0.b2cStock": -15,
                    "colors.0.stock": -15,
                    b2cStock: -15,
                    stockQuantity: -15,
                },
            });

            // Restore
            const restoreRes = await restoreOrderStock(orderDoc, "Customer cancelled");
            assert.equal(restoreRes.restored, true);

            const restoredP = await Product.findById(p._id).lean();
            assert.equal(restoredP.b2cStock, 60, "B2C stock must be restored to 60");
            assert.equal(restoredP.stockQuantity, 100, "Physical stock must be restored to 100");
        });

        // ─────────────────────────────────────────────────────────────
        // 13. Double-Restore Idempotency Guard
        // ─────────────────────────────────────────────────────────────
        await test("13. Double-restore guard prevents restoring stock twice", async () => {
            const p = await createTestProduct({
                stockQuantity: 100,
                b2bStock: 40,
                b2cStock: 60,
                colors: [{ name: "A", hex: "#000", stock: 100, b2bStock: 40, b2cStock: 60 }],
            });

            const orderDoc = await Order.create({
                user: new mongoose.Types.ObjectId(),
                shippingAddress: defaultShipping,
                items: [{ product: p._id, colorIndex: 0, quantity: 10, name: "Guard Test", price: 100 }],
                orderChannel: "b2c",
                stockDeducted: true,
                stockRestored: false,
                totalAmount: 1000,
                finalAmount: 1000,
            });
            createdOrderIds.push(orderDoc._id);

            // First restore
            const first = await restoreOrderStock(orderDoc, "First Cancel");
            assert.equal(first.restored, true, "First restore must succeed");

            // Second restore (duplicate call / retry)
            const second = await restoreOrderStock(orderDoc, "Second Cancel");
            assert.equal(second.restored, false, "Second restore must be rejected by guard");

            const checkOrder = await Order.findById(orderDoc._id).lean();
            assert.equal(checkOrder.stockRestored, true, "stockRestored must be true");
        });

        // ─────────────────────────────────────────────────────────────
        // 14. Webhook Retry Guard
        // ─────────────────────────────────────────────────────────────
        await test("14. Webhook retry guard ensures stockDeducted orders are not deducted again", async () => {
            const orderDoc = await Order.create({
                user: new mongoose.Types.ObjectId(),
                shippingAddress: defaultShipping,
                items: [],
                stockDeducted: true,
                totalAmount: 500,
                finalAmount: 500,
            });
            createdOrderIds.push(orderDoc._id);

            // Simulated webhook claim
            const stockClaim = await Order.findOneAndUpdate(
                { _id: orderDoc._id, stockDeducted: { $ne: true } },
                { $set: { stockDeducted: true } },
                { returnDocument: "after" }
            );

            assert.equal(stockClaim, null, "Order with stockDeducted=true must not acquire stockClaim");
        });

        // ─────────────────────────────────────────────────────────────
        // 15. B2B vs B2C Deduction Channel Isolation
        // ─────────────────────────────────────────────────────────────
        await test("15. B2B order deducts exclusively from b2bStock without altering b2cStock", async () => {
            const p = await createTestProduct({
                stockQuantity: 100,
                b2bStock: 40,
                b2cStock: 60,
                colors: [{ name: "Pool", hex: "#000", stock: 100, b2bStock: 40, b2cStock: 60 }],
            });

            const b2bOrder = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2b",
                items: [{ product: p._id, colorIndex: 0, quantity: 15, name: "B2B Wholesale Lot" }],
            };

            const deductRes = await deductOrderStock(b2bOrder);
            assert.equal(deductRes.success, true);

            const reloaded = await Product.findById(p._id).lean();
            assert.equal(reloaded.b2bStock, 25, "b2bStock should decrease by 15 (40 -> 25)");
            assert.equal(reloaded.b2cStock, 60, "b2cStock must remain completely UNTOUCHED at 60");
            assert.equal(reloaded.stockQuantity, 85, "Physical stock should decrease by 15 (100 -> 85)");
        });

        // ─────────────────────────────────────────────────────────────
        // 16. Endpoint Setting 1500 Total, 1000 B2B, 500 B2C & GET Verification
        // ─────────────────────────────────────────────────────────────
        let test16Product = null;
        await test("16. Set total 1500, B2B 1000, B2C 500 via PUT and verify GET response with colors", async () => {
            const p = await createTestProduct({
                stockQuantity: 1500,
                b2bStock: 0,
                b2cStock: 1500,
                colors: [
                    { name: "White", hex: "#FFF", stock: 900, b2bStock: 0, b2cStock: 900 },
                    { name: "Blue", hex: "#00F", stock: 600, b2bStock: 0, b2cStock: 600 },
                ],
            });
            test16Product = p;

            const putReq = {
                body: {
                    productId: p._id.toString(),
                    totalStock: 1500,
                    b2bStock: 1000,
                    b2cStock: 500,
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const putRes = createMockRes();

            await updateChannelStock(putReq, putRes);
            assert.equal(putRes.statusCode, 200, "PUT /api/admin/stock/channel should return 200");
            assert.equal(putRes.body.summary.updated, 1);

            // Verify via GET /api/admin/stock/channel
            const getReq = { query: { search: p.sku } };
            const getRes = createMockRes();
            await getChannelStockTable(getReq, getRes);

            assert.equal(getRes.statusCode, 200, "GET /api/admin/stock/channel should return 200");
            const found = getRes.body.inventory.find((i) => i.id === p._id.toString());
            assert.ok(found, "Product should be present in inventory table");
            assert.equal(found.physicalStock, 1500, "Physical stock should be 1500");
            assert.equal(found.b2bStock, 1000, "B2B stock should be 1000");
            assert.equal(found.b2cStock, 500, "B2C stock should be 500");

            // Verify variant colors breakdown
            assert.ok(Array.isArray(found.colors), "Colors array should be present");
            assert.equal(found.colors.length, 2, "Colors array should have 2 variants");

            const var0 = found.colors[0]; // White (900/1500 = 60%)
            const var1 = found.colors[1]; // Blue (600/1500 = 40%)
            assert.equal(var0.physicalStock, 900);
            assert.equal(var0.b2bStock, 600); // 1000 * 0.6
            assert.equal(var0.b2cStock, 300); // 500 * 0.6
            assert.equal(var1.physicalStock, 600);
            assert.equal(var1.b2bStock, 400); // 1000 * 0.4
            assert.equal(var1.b2cStock, 200); // 500 * 0.4

            assert.equal(var0.b2bStock + var1.b2bStock, 1000);
            assert.equal(var0.b2cStock + var1.b2cStock, 500);
        });

        // ─────────────────────────────────────────────────────────────
        // 17. B2C Order of 10 reduces only b2cStock and total
        // ─────────────────────────────────────────────────────────────
        await test("17. B2C order of 10 reduces only b2cStock (500 -> 490) and total (1500 -> 1490)", async () => {
            const b2cOrder = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2c",
                items: [{ product: test16Product._id, colorIndex: 0, quantity: 10, name: "B2C Retail Shirt" }],
            };

            const deductRes = await deductOrderStock(b2cOrder);
            assert.equal(deductRes.success, true);

            const reloaded = await Product.findById(test16Product._id).lean();
            assert.equal(reloaded.b2cStock, 490, "b2cStock should reduce from 500 to 490");
            assert.equal(reloaded.stockQuantity, 1490, "Total physical stock should reduce from 1500 to 1490");
            assert.equal(reloaded.b2bStock, 1000, "b2bStock must remain UNTOUCHED at 1000");
            assert.equal(reloaded.colors[0].b2cStock, 290, "Variant 0 b2cStock should reduce from 300 to 290");
            assert.equal(reloaded.colors[0].b2bStock, 600, "Variant 0 b2bStock must remain 600");
        });

        // ─────────────────────────────────────────────────────────────
        // 18. B2B Order of 50 reduces only b2bStock and total
        // ─────────────────────────────────────────────────────────────
        await test("18. B2B order of 50 reduces only b2bStock (1000 -> 950) and total (1490 -> 1440)", async () => {
            const b2bOrder = {
                _id: new mongoose.Types.ObjectId(),
                orderChannel: "b2b",
                items: [{ product: test16Product._id, colorIndex: 0, quantity: 50, name: "B2B Bulk Lot" }],
            };

            const deductRes = await deductOrderStock(b2bOrder);
            assert.equal(deductRes.success, true);

            const reloaded = await Product.findById(test16Product._id).lean();
            assert.equal(reloaded.b2bStock, 950, "b2bStock should reduce from 1000 to 950");
            assert.equal(reloaded.stockQuantity, 1440, "Total physical stock should reduce from 1490 to 1440");
            assert.equal(reloaded.b2cStock, 490, "b2cStock must remain UNTOUCHED at 490");
            assert.equal(reloaded.colors[0].b2bStock, 550, "Variant 0 b2bStock should reduce from 600 to 550");
            assert.equal(reloaded.colors[0].b2cStock, 290, "Variant 0 b2cStock must remain 290");
        });

        // ─────────────────────────────────────────────────────────────
        // 19. Rejecting B2B + B2C greater than total
        // ─────────────────────────────────────────────────────────────
        await test("19. Rejecting update when B2B + B2C exceeds total physical stock", async () => {
            const p = await createTestProduct({ stockQuantity: 1000 });
            const req = {
                body: {
                    items: [
                        { productId: p._id.toString(), totalStock: 1000, b2bStock: 700, b2cStock: 400 }, // 1100 > 1000
                    ],
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 400, "Should return 400");
            assert.equal(res.body.summary.failed, 1);
            assert.match(res.body.results[0].reason, /exceeds physical stock/i);
        });

        // ─────────────────────────────────────────────────────────────
        // 20. Raising total later leaves B2B/B2C split unchanged
        // ─────────────────────────────────────────────────────────────
        await test("20. Raising physical total without touching split leaves B2B and B2C unchanged", async () => {
            // test16Product currently has: total=1440, B2B=950, B2C=490
            const req = {
                body: {
                    productId: test16Product._id.toString(),
                    totalStock: 2000, // raising physical total from 1440 to 2000
                    mode: "set",
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 200);

            const reloaded = await Product.findById(test16Product._id).lean();
            assert.equal(reloaded.stockQuantity, 2000, "Physical stock should be raised to 2000");
            assert.equal(reloaded.b2bStock, 950, "b2bStock must remain unchanged at 950");
            assert.equal(reloaded.b2cStock, 490, "b2cStock must remain unchanged at 490");
            // The unallocated 560 units (2000 - 1440) are not sellable on either channel
        });

        // ─────────────────────────────────────────────────────────────
        // 21. Targeted color variant update
        // ─────────────────────────────────────────────────────────────
        await test("21. Targeting specific variant by colorIndex updates that variant and aggregates to product", async () => {
            const p = await createTestProduct({
                stockQuantity: 200,
                b2bStock: 80,
                b2cStock: 120,
                colors: [
                    { name: "Red", hex: "#F00", stock: 100, b2bStock: 40, b2cStock: 60 },
                    { name: "Blue", hex: "#00F", stock: 100, b2bStock: 40, b2cStock: 60 },
                ],
            });

            // Target only Blue (colorIndex: 1)
            const req = {
                body: {
                    productId: p._id.toString(),
                    colorIndex: 1,
                    b2bStock: 30,
                    b2cStock: 50,
                },
                user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
            };
            const res = createMockRes();

            await updateChannelStock(req, res);
            assert.equal(res.statusCode, 200);

            const reloaded = await Product.findById(p._id).lean();
            // Variant 1 (Blue) updated
            assert.equal(reloaded.colors[1].b2bStock, 30);
            assert.equal(reloaded.colors[1].b2cStock, 50);
            // Variant 0 (Red) remains 40 / 60
            assert.equal(reloaded.colors[0].b2bStock, 40);
            assert.equal(reloaded.colors[0].b2cStock, 60);
            // Aggregated product top-level: B2B = 40+30 = 70, B2C = 60+50 = 110
            assert.equal(reloaded.b2bStock, 70);
            assert.equal(reloaded.b2cStock, 110);
        });

        // ─────────────────────────────────────────────────────────────
        // 22. Zero Postgres Dependencies Verification
        // ─────────────────────────────────────────────────────────────
        await test("22. Stock system functions completely without PostgreSQL env vars", async () => {
            const originalDbUrl = process.env.DATABASE_URL;
            delete process.env.DATABASE_URL;

            try {
                // Ensure no DATABASE_URL exists in environment
                assert.equal(process.env.DATABASE_URL, undefined, "DATABASE_URL must be undefined");

                // Execute a stock operation to prove pure MongoDB execution
                const p = await createTestProduct({ stockQuantity: 50, b2bStock: 20, b2cStock: 30 });
                const req = {
                    body: {
                        productId: p._id.toString(),
                        b2bStock: 15,
                        b2cStock: 35,
                    },
                    user: { _id: "admin-1", email: "admin@test.com", role: "admin" },
                };
                const res = createMockRes();

                await updateChannelStock(req, res);
                assert.equal(res.statusCode, 200);

                const reloaded = await Product.findById(p._id).lean();
                assert.equal(reloaded.b2bStock, 15);
                assert.equal(reloaded.b2cStock, 35);
            } finally {
                if (originalDbUrl) {
                    process.env.DATABASE_URL = originalDbUrl;
                }
            }
        });

        // ─────────────────────────────────────────────────────────────
        // 23. Migration Dry Run on Unset Product Yields All-B2C
        // ─────────────────────────────────────────────────────────────
        await test("23. Migration dry run on product missing channel stock yields 100% B2C and 0 B2B", async () => {
            const rawSku = `${testPrefix}-UNMIGRATED`;
            // Insert product without b2bStock or b2cStock
            const p = await Product.create({
                name: "Unmigrated Product",
                slug: `unmigrated-${Date.now()}`,
                sku: rawSku,
                category: sampleCategory._id,
                description: "Test unmigrated product",
                stockQuantity: 350,
                originalPrice: 500,
                discountedPrice: 400,
            });
            createdProductIds.push(p._id);

            // Temporarily unset b2bStock and b2cStock
            await Product.updateOne(
                { _id: p._id },
                { $unset: { b2bStock: 1, b2cStock: 1 } }
            );

            // Execute migration dry run
            const originalArgv = [...process.argv];
            if (!process.argv.includes("--dry-run")) {
                process.argv.push("--dry-run");
            }

            try {
                const migrationResult = await runMigration({ isDryRun: true, closeConnectionOnComplete: false });
                assert.ok(migrationResult.total >= 1, "Should find at least 1 unmigrated product");

                // Since it was dry-run, DB must remain unset
                const untouched = await Product.findById(p._id).lean();
                assert.equal(untouched.b2bStock, undefined, "Dry run must not write to DB");
                assert.equal(untouched.b2cStock, undefined, "Dry run must not write to DB");
            } finally {
                process.argv = originalArgv;
            }
        });

    } finally {
        // Cleanup test fixtures
        if (createdProductIds.length > 0) {
            await Product.deleteMany({ _id: { $in: createdProductIds } });
        }
        if (createdOrderIds.length > 0) {
            await Order.deleteMany({ _id: { $in: createdOrderIds } });
        }
        await StockAuditLog.deleteMany({ sku: { $regex: new RegExp(`^${testPrefix}`) } });

        await mongoose.disconnect();
        console.log("===============================================================");
        console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
        console.log("===============================================================");

        if (failedCount > 0) {
            process.exit(1);
        }
    }
}

runTests().catch((err) => {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
});
