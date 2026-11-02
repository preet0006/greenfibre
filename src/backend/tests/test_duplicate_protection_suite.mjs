/**
 * Isolated unit test for duplicate protection beyond 60s lease & upstream reconciliation
 */
import assert from 'assert';

console.log('🧪 Starting Duplicate Protection & Upstream Reconciliation Unit Suite...\n');

// Mock order document
function createMockOrder(orderNumber = 'GF-TEST-000099') {
  return {
    _id: 'mock_order_id_999',
    orderNumber,
    paymentStatus: 'paid',
    paymentMethod: 'Prepaid',
    finalAmount: 1500,
    shippingAddress: {
      streetAddress: '123 Test St',
      pincode: '201306',
      city: 'Greater Noida',
      state: 'Uttar Pradesh'
    },
    shippingDetails: {},
    items: [{ name: 'Test Product', quantity: 1, price: 1500 }],
    dispatchClaimedAt: null,
    dispatchAttemptedAt: null,
    statusHistory: []
  };
}

// Simulated reconciliation runner matching shiprocket.controller.js logic
async function runSimulatedDispatch({
  order,
  findUpstreamMock,
  createOrderMock,
  isExpiredLease = false
}) {
  const channelOrderNumber = order.orderNumber;
  let srOrderId = order.shippingDetails?.shiprocketOrderId;
  let srShipmentId = order.shippingDetails?.shiprocketShipmentId;

  // 1. Lease check
  const now = Date.now();
  if (order.dispatchClaimedAt && !isExpiredLease) {
    const elapsed = now - new Date(order.dispatchClaimedAt).getTime();
    if (elapsed < 60000) {
      return { success: false, code: 'DISPATCH_IN_PROGRESS' };
    }
  }

  // 2. Upstream idempotency pre-check
  if (!srOrderId) {
    try {
      const existingUpstream = await findUpstreamMock(channelOrderNumber);
      if (existingUpstream) {
        srOrderId = String(existingUpstream.id || existingUpstream.order_id);
        srShipmentId = String(existingUpstream.shipments?.[0]?.id || existingUpstream.shipment_id || '');
        // Reconcile into order
        order.shippingDetails.shiprocketOrderId = srOrderId;
        order.shippingDetails.shiprocketShipmentId = srShipmentId;
        order.shippingDetails.reconciledFromUpstream = true;
        order.shippingDetails.reconciledAt = new Date();
        order.statusHistory.push({
          status: 'processing',
          note: `Reconciled with existing Shiprocket order #${srOrderId} (Shipment #${srShipmentId})`
        });
      }
    } catch (searchErr) {
      if (order.dispatchAttemptedAt) {
        return {
          success: false,
          code: 'DISPATCH_RECONCILIATION_REQUIRED',
          message: `Previous dispatch status is indeterminate: ${searchErr.message}. Blind resubmission BLOCKED.`
        };
      }
    }
  }

  // 3. Create if not already existing
  if (!srOrderId) {
    order.dispatchAttemptedAt = new Date();
    const createRes = await createOrderMock(order);
    srOrderId = String(createRes.order_id);
    srShipmentId = String(createRes.shipment_id);
    order.shippingDetails.shiprocketOrderId = srOrderId;
    order.shippingDetails.shiprocketShipmentId = srShipmentId;
  }

  return {
    success: true,
    srOrderId,
    srShipmentId,
    reconciled: Boolean(order.shippingDetails.reconciledFromUpstream)
  };
}

async function testSuite() {
  // ── TEST 1: Normal first-time creation ──
  console.log('Test 1: Fresh order -> Normal creation');
  let createCallCount = 0;
  const order1 = createMockOrder('GF-TEST-001');
  const res1 = await runSimulatedDispatch({
    order: order1,
    findUpstreamMock: async () => null,
    createOrderMock: async () => {
      createCallCount++;
      return { order_id: 1001, shipment_id: 2001 };
    }
  });
  assert.strictEqual(res1.success, true);
  assert.strictEqual(createCallCount, 1);
  assert.strictEqual(res1.srOrderId, '1001');
  assert.strictEqual(order1.shippingDetails.shiprocketOrderId, '1001');
  console.log('  ✅ PASS: Fresh order dispatched and IDs saved.\n');

  // ── TEST 2: Local timeout/crash after upstream creation, lease expires (>60s) ──
  console.log('Test 2: Upstream success followed by crash/timeout -> Expired lease retry reconciles IDs without duplicate creation');
  createCallCount = 0;
  const order2 = createMockOrder('GF-TEST-002');
  // Simulate previous crashed attempt: dispatchAttemptedAt was recorded 65 seconds ago, but local DB missed saving IDs
  order2.dispatchAttemptedAt = new Date(Date.now() - 65000);
  order2.dispatchClaimedAt = new Date(Date.now() - 65000); // lease expired!

  const res2 = await runSimulatedDispatch({
    order: order2,
    isExpiredLease: true,
    findUpstreamMock: async (orderNum) => {
      // Upstream Shiprocket has the order from previous attempt!
      return {
        id: 998811,
        order_id: 998811,
        channel_order_id: orderNum,
        shipments: [{ id: 776655 }]
      };
    },
    createOrderMock: async () => {
      createCallCount++;
      return { order_id: 999999, shipment_id: 888888 };
    }
  });

  assert.strictEqual(res2.success, true);
  assert.strictEqual(createCallCount, 0, 'createOrderMock must NEVER be called when upstream order exists!');
  assert.strictEqual(res2.srOrderId, '998811');
  assert.strictEqual(res2.srShipmentId, '776655');
  assert.strictEqual(res2.reconciled, true);
  assert.strictEqual(order2.shippingDetails.shiprocketOrderId, '998811');
  assert.strictEqual(order2.shippingDetails.shiprocketShipmentId, '776655');
  console.log('  ✅ PASS: Reconciled existing upstream IDs (Order #998811, Shipment #776655). Zero duplicate calls.\n');

  // ── TEST 3: Ambiguous timeout + upstream unreachable on retry ──
  console.log('Test 3: Prior attempt made, lease expired, but upstream search fails -> BLOCKS blind resubmission');
  createCallCount = 0;
  const order3 = createMockOrder('GF-TEST-003');
  order3.dispatchAttemptedAt = new Date(Date.now() - 65000);
  order3.dispatchClaimedAt = new Date(Date.now() - 65000);

  const res3 = await runSimulatedDispatch({
    order: order3,
    isExpiredLease: true,
    findUpstreamMock: async () => {
      throw new Error('ETIMEDOUT: Connection to apiv2.shiprocket.in timed out after 25000ms');
    },
    createOrderMock: async () => {
      createCallCount++;
      return { order_id: 999999, shipment_id: 888888 };
    }
  });

  assert.strictEqual(res3.success, false);
  assert.strictEqual(res3.code, 'DISPATCH_RECONCILIATION_REQUIRED');
  assert.strictEqual(createCallCount, 0, 'Blind order creation must be BLOCKED when status is indeterminate!');
  console.log('  ✅ PASS: Blocked blind resubmission with DISPATCH_RECONCILIATION_REQUIRED. Zero duplicate calls.\n');

  // ── TEST 4: Active lease (< 60s) blocks concurrent requests ──
  console.log('Test 4: Active lease (<60s) -> Blocks concurrent attempt');
  const order4 = createMockOrder('GF-TEST-004');
  order4.dispatchClaimedAt = new Date(Date.now() - 10000); // 10s ago

  const res4 = await runSimulatedDispatch({
    order: order4,
    isExpiredLease: false,
    findUpstreamMock: async () => null,
    createOrderMock: async () => ({ order_id: 11, shipment_id: 22 })
  });
  assert.strictEqual(res4.success, false);
  assert.strictEqual(res4.code, 'DISPATCH_IN_PROGRESS');
  console.log('  ✅ PASS: Blocked concurrent attempt with DISPATCH_IN_PROGRESS.\n');

  console.log('🎉 ALL 4 DUPLICATE PROTECTION SCENARIOS PASSED WITH 100% SUCCESS!');
}

testSuite().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});

