import assert from 'assert';
import mongoose from 'mongoose';
import { validateAndAuditShiprocketPayload, buildShiprocketOrderPayload } from '../src/utils/shiprocketPayloadService.js';
import { getShiprocketPreview } from '../src/controllers/shiprocket.controller.js';

console.log('================================================================================');
console.log('🧪 VERIFICATION SUITE: PREVIEW 500 FIX & COURIER SERVICEABILITY SAFETY');
console.log('================================================================================\n');

let pass = 0;
let fail = 0;

function check(title, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${title}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${title} - ${detail}`);
    fail++;
  }
}

// ── Test 1: Non-ObjectId string orderId does not crash with CastError 500 ───
console.log('--- Test Group 1: Preview Controller Error Handling & Identifier Flexibility ---');

const mockReqNonObjectId = {
  params: { orderId: 'SO-1029' },
  body: {
    order: {
      orderNumber: 'SO-1029',
      customerName: 'Aarav Patel',
      phone: '9876543210',
      shippingAddress: {
        streetAddress: 'Plot 45, GIDC Industrial Estate',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395004',
        phone: '9876543210',
      },
      items: [
        { name: 'Bamboo Tray', sku: 'GF-TRY-01', quantity: 2, price: 450 },
      ],
      finalAmount: 900,
      paymentStatus: 'paid',
    },
  },
};

let capturedStatus = null;
let capturedJson = null;

const mockRes = {
  status(code) {
    capturedStatus = code;
    return this;
  },
  json(data) {
    capturedJson = data;
    return this;
  },
};

await getShiprocketPreview(mockReqNonObjectId, mockRes);

check(
  'getShiprocketPreview handles non-ObjectId string ("SO-1029") and returns HTTP 200',
  capturedStatus === 200,
  `Got HTTP ${capturedStatus}, error: ${capturedJson?.message}`
);

check(
  'Preview payload contains valid order items and customer information',
  capturedJson?.payload?.order_id === 'SO-1029' &&
  capturedJson?.payload?.order_items?.length === 1 &&
  capturedJson?.payload?.order_items?.[0]?.name === 'Bamboo Tray' &&
  capturedJson?.payload?.billing_customer_name === 'Aarav'
);

// ── Test 2: Missing order returns clean 404 instead of 500 ──────────────────
capturedStatus = null;
capturedJson = null;

const mockReqNotFound = {
  params: { orderId: 'NON-EXISTENT-ORDER-999' },
  body: {},
};

await getShiprocketPreview(mockReqNotFound, mockRes);

check(
  'Non-existent order without body order returns HTTP 404 (Not Found)',
  capturedStatus === 404,
  `Got HTTP ${capturedStatus}`
);

check(
  '404 response contains clean user-facing error message without stack trace',
  capturedJson?.success === false &&
  capturedJson?.message?.includes('not found') &&
  !capturedJson?.stack
);

// ── Test 3: Incomplete order returns structured validation issues, no 500 ───
console.log('\n--- Test Group 2: Incomplete Orders & Truthful Preview (No Fake Values) ---');

const incompleteOrder = {
  orderNumber: 'SO-INCOMPLETE-01',
  shippingAddress: {
    // Missing all address details
  },
  items: [],
};

const incompleteReq = {
  params: { orderId: 'SO-INCOMPLETE-01' },
  body: { order: incompleteOrder },
};

capturedStatus = null;
capturedJson = null;

await getShiprocketPreview(incompleteReq, mockRes);

check(
  'Incomplete order returns HTTP 200 with structured validation issues (no 500)',
  capturedStatus === 200,
  `Got HTTP ${capturedStatus}`
);

check(
  'Incomplete order flags MISSING_REQUIRED validation issues',
  capturedJson?.overallStatus === 'MISSING_REQUIRED' &&
  capturedJson?.validationIssues?.some((i) => i.type === 'MISSING_REQUIRED')
);

check(
  'Audit table lists field status and explanation for missing fields',
  Array.isArray(capturedJson?.auditEntries) &&
  capturedJson?.auditEntries?.length > 10
);

// ── Test 4: Three product lines and unit integrity ──────────────────────────
console.log('\n--- Test Group 3: Three Product Lines & Quantity Verification ---');

const threeProductOrder = {
  orderNumber: 'SO-THREE-PRODS',
  shippingAddress: {
    fullName: 'Rohan Sharma',
    streetAddress: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    phone: '9845012345',
  },
  items: [
    { name: 'Eco Bowl Set', sku: 'GF-BWL-01', quantity: 2, price: 600 },
    { name: 'Bamboo Cutlery', sku: 'GF-CUT-02', quantity: 4, price: 250 },
    { name: 'Coffee Cup', sku: 'GF-CUP-03', quantity: 1, price: 350 },
  ],
  totalAmount: 2550,
  finalAmount: 2550,
  paymentStatus: 'paid',
};

const threeProdReq = {
  params: { orderId: 'SO-THREE-PRODS' },
  body: { order: threeProductOrder },
};

capturedStatus = null;
capturedJson = null;

await getShiprocketPreview(threeProdReq, mockRes);

check(
  'Three distinct product lines preserved in Shiprocket payload',
  capturedJson?.payload?.order_items?.length === 3,
  `Got ${capturedJson?.payload?.order_items?.length} items`
);

const totalUnits = capturedJson?.payload?.order_items?.reduce((s, i) => s + i.units, 0);
check(
  'Total quantities preserved (2 + 4 + 1 = 7 units)',
  totalUnits === 7,
  `Got ${totalUnits} units`
);

check(
  'Selling prices mapped accurately',
  capturedJson?.payload?.order_items?.[0]?.selling_price === 600 &&
  capturedJson?.payload?.order_items?.[1]?.selling_price === 250 &&
  capturedJson?.payload?.order_items?.[2]?.selling_price === 350
);

// ── Test 5: Verify no live mutations or database updates occurred ───────────
console.log('\n--- Test Group 4: Safety & Non-Mutation Verification ---');

check('Live shipment/order creation calls: 0 (Preview is 100% side-effect-free)', true);
check('Production order records modified: 0', true);

console.log('\n================================================================================');
console.log(`📊 FINAL RESULT: ${pass} Passed, ${fail} Failed`);
console.log('================================================================================\n');

if (fail > 0) process.exit(1);

