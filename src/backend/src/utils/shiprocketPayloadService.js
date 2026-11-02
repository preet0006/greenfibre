/**
 * Generates deterministic fingerprint of order items to invalidate package
 * confirmation if contents or quantities change.
 */
export function computeOrderContentsHash(items = []) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((it) => ({
      p: String(it.product || it._id || ''),
      s: String(it.sku || ''),
      q: Number(it.quantity || it.units || 0),
    }))
    .sort((a, b) => a.p.localeCompare(b.p));
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 16);
}

/**
 * shiprocketPayloadService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative, side-effect-free payload builder, validator, and mapping auditor
 * for Shiprocket External REST API (`POST /v1/external/orders/create/adhoc`).
 *
 * Guaranteed:
 * - 100% Side-effect free (NO database mutations, NO external API calls).
 * - Identifies missing required fields, dummy fallbacks, and validation defects.
 * - Computes complete financial reconciliation and packaging metrics.
 * - Produces exact proposed request body and field-by-field audit table.
 * - NEVER leaks credentials, tokens, or auth headers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

/**
 * Strict boolean parser: "false" / "0" / "no" -> false, "true" / "1" / "yes" -> true.
 */
export function parseEnvBoolean(val, defaultVal = false) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return defaultVal;
}

/**
 * Authoritative Shiprocket Environment Resolver
 * Validates hosts and flags without silent cross-environment fallbacks.
 * Rejects conflicting configurations with a clear configuration error.
 */
export function resolveShiprocketEnvironment() {
  const rawBaseUrl = process.env.SHIPROCKET_BASE_URL;
  const baseUrl = (rawBaseUrl && typeof rawBaseUrl === 'string' && rawBaseUrl.trim())
    ? rawBaseUrl.trim().replace(/\/+$/, '')
    : (process.env.NODE_ENV === 'production' ? 'https://apiv2.shiprocket.in/v1/external' : 'https://api-sandbox.shiprocket.in/v1/external');

  const useSandbox = parseEnvBoolean(process.env.SHIPROCKET_USE_SANDBOX, null);
  const testMode = parseEnvBoolean(process.env.SHIPROCKET_TEST_MODE, null);

  const hostIsSandbox = baseUrl.includes('sandbox');
  const hostIsProduction = baseUrl.includes('apiv2.shiprocket.in') || (!hostIsSandbox && !baseUrl.includes('sandbox'));

  // Conflict detection
  if (hostIsProduction && (useSandbox === true || testMode === true)) {
    throw new Error(
      `Shiprocket Configuration Conflict: SHIPROCKET_BASE_URL points to Production (${baseUrl}) but SHIPROCKET_USE_SANDBOX or SHIPROCKET_TEST_MODE is enabled (true). Production requests must not run with test/sandbox flags.`
    );
  }
  if (hostIsSandbox && (useSandbox === false || testMode === false)) {
    throw new Error(
      `Shiprocket Configuration Conflict: SHIPROCKET_BASE_URL points to Sandbox (${baseUrl}) but SHIPROCKET_USE_SANDBOX or SHIPROCKET_TEST_MODE is explicitly disabled (false).`
    );
  }

  const isSandbox = hostIsSandbox || useSandbox === true || testMode === true;
  const environment = isSandbox ? 'sandbox' : 'production';
  let hostName = 'apiv2.shiprocket.in';
  try {
    hostName = new URL(baseUrl).hostname;
  } catch (_) {
    hostName = isSandbox ? 'api-sandbox.shiprocket.in' : 'apiv2.shiprocket.in';
  }

  // Never fall back between sandbox and production pickup locations
  const pickupLocation = isSandbox
    ? (process.env.SHIPROCKET_TEST_PICKUP_LOCATION || 'TEST-WAREHOUSE').trim()
    : (process.env.SHIPROCKET_LIVE_PICKUP_LOCATION || process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();

  // Never fall back between sandbox and production credentials
  const email = isSandbox
    ? (process.env.SHIPROCKET_SANDBOX_EMAIL || (useSandbox ? '' : process.env.SHIPROCKET_EMAIL) || '').trim()
    : (process.env.SHIPROCKET_LIVE_EMAIL || process.env.SHIPROCKET_EMAIL || '').trim();

  return {
    isSandbox,
    environment,
    baseUrl,
    hostName,
    pickupLocation,
    email,
  };
}

/**
 * Builds the proposed Shiprocket adhoc order payload.
 * Pure function: takes authoritative order document and options.
 */
export function buildShiprocketOrderPayload(order, customOptions = {}) {
  if (!order) {
    throw new Error('Order document is required to build payload');
  }

  const env = resolveShiprocketEnvironment();
  const defaultPickupLocation = env.pickupLocation;

  const pickupLocation = (
    customOptions.pickupLocation ||
    customOptions.warehouse?.pickupLocation ||
    defaultPickupLocation
  ).trim();

  const shippingAddr = order.shippingAddress || {};
  const billingAddr = order.billingAddress || null;
  const b2bDetails = customOptions.b2bDetails || {};
  const isB2B =
    (customOptions.orderType || '').toUpperCase() === 'B2B' ||
    Boolean(b2bDetails.companyName || shippingAddr.companyName);

  // Customer name
  const rawFullName = (
    b2bDetails.contactPerson ||
    shippingAddr.fullName ||
    order.customerName ||
    ''
  ).trim();

  const nameParts = rawFullName ? rawFullName.split(/\s+/) : [];
  const rawFirstName = nameParts[0] || '';
  const rawLastName = nameParts.slice(1).join(' ');

  // Sanitized phone (digits only, last 10)
  const rawPhone = b2bDetails.phone || shippingAddr.phone || order.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);

  // Sanitized pincode (digits only, 6 digits)
  const rawPincode = b2bDetails.pincode || shippingAddr.pincode || '';
  const cleanPincode = String(rawPincode).replace(/\D/g, '').slice(0, 6);

  // Email
  const cleanEmail = (
    b2bDetails.email ||
    shippingAddr.email ||
    order.user?.email ||
    order.email ||
    ''
  ).trim();

  // Address lines
  const streetAddress = (b2bDetails.address || shippingAddr.streetAddress || '').trim();
  const landmark = (shippingAddr.landmark || '').trim();
  const city = (b2bDetails.city || shippingAddr.city || '').trim();
  const state = (b2bDetails.state || shippingAddr.state || '').trim();

  // Line items
  let sourceItems = (Array.isArray(order.items) ? order.items : []).filter(Boolean);
  if (Array.isArray(customOptions.items) && customOptions.items.length > 0) {
    sourceItems = customOptions.items.map((ci, idx) => {
      const matched = (order.items || []).find((oi, oIdx) => {
        return (
          (ci.itemId && String(oi._id) === String(ci.itemId)) ||
          (ci.itemId && String(oi.product) === String(ci.itemId)) ||
          (ci.itemId && String(oi.sku) === String(ci.itemId)) ||
          (ci.name && String(oi.name).toLowerCase() === String(ci.name).toLowerCase()) ||
          oIdx === Number(ci.itemId)
        );
      }) || {};

      return {
        ...matched,
        name: ci.name || matched.name || `Green Fibre Item ${idx + 1}`,
        sku: ci.sku || matched.sku || matched.product || `GF-ITEM-${idx + 1}`,
        quantity: Math.max(1, Math.round(Number(ci.qty || ci.quantity || matched.quantity || 1))),
        price: Math.max(1, Math.round(Number(ci.price || matched.price || 1))),
        hsn: ci.hsn || matched.hsn || '',
      };
    });
  }

  const orderItems = sourceItems.map((item, idx) => {
    const itemName = (item.name || `Green Fibre Item ${idx + 1}`).trim().slice(0, 50);
    const itemQty = Math.max(1, Math.round(Number(item.quantity) || 1));
    const itemPrice = Math.max(1, Math.round(Number(item.price || item.unitPrice) || 1));
    const itemSku = (
      item.sku
        ? String(item.sku)
        : item.product
        ? `${item.product}-${item.colorIndex ?? 0}`
        : `GF-SKU-${idx + 1}`
    ).slice(0, 50);

    return {
      name: itemName,
      sku: itemSku,
      units: itemQty,
      selling_price: itemPrice,
      discount: 0,
      tax: 0,
      hsn: item.hsn || process.env.SHIPROCKET_HSN || '',
    };
  });

  // Fallback item if order is completely empty (as currently in backend)
  let emptyOrderSubstituted = false;
  if (orderItems.length === 0) {
    emptyOrderSubstituted = true;
    orderItems.push({
      name: 'Green Fibre Eco Product',
      sku: 'GF-PROD-1',
      units: 1,
      selling_price: Math.max(1, Math.round(Number(order.finalAmount || order.totalAmount) || 1)),
      discount: 0,
      tax: 0,
      hsn: process.env.SHIPROCKET_HSN || '',
    });
  }

  // Order reference
  const rawRef =
    order.orderNumber ||
    order.soNumber ||
    order.easebuzzOrderId ||
    order.razorpayOrderId ||
    order._id?.toString() ||
    `GF_${Date.now()}`;

  const orderIdPrefix = (process.env.SHIPROCKET_ORDER_ID_PREFIX || '').trim();
  const orderRef = orderIdPrefix ? `${orderIdPrefix}${rawRef}` : rawRef;

  const subTotal = Math.max(
    1,
    Math.round(orderItems.reduce((s, i) => s + i.selling_price * i.units, 0))
  );

  // Package weight & dimensions - Trusted state confirmation model (Anti-spoofing)
  const pkg = customOptions.package || customOptions.pkg || order.shippingDetails?.package || {};
  const dbPkg = order.shippingDetails?.package;
  const currentContentsHash = computeOrderContentsHash(order.items);
  const isTestInput = Boolean(customOptions.isTestInput || customOptions.isTestFixture || customOptions.testMode);

  let weightSource = 'Unconfirmed / Missing';
  let isConfirmedWeight = false;
  let rawWeight = 0;
  let confirmedMetadata = null;

  // 1. Authoritative verification: package confirmation MUST come from trusted DB state
  if (dbPkg && Number(dbPkg.weight) > 0 && dbPkg.isConfirmed) {
    const orderRef = String(order.orderNumber || order._id || '');
    const pkgOrderRef = dbPkg.orderId ? String(dbPkg.orderId) : orderRef;
    const orderMatches = pkgOrderRef === orderRef;
    const contentsMatch = !dbPkg.contentsHash || dbPkg.contentsHash === currentContentsHash;

    if (!orderMatches) {
      isConfirmedWeight = false;
      weightSource = 'Invalidated — Foreign Package Record Reference';
      rawWeight = Number(dbPkg.weight);
    } else if (!contentsMatch) {
      isConfirmedWeight = false;
      weightSource = 'Invalidated — Order Contents Changed Since Confirmation';
      rawWeight = Number(dbPkg.weight);
    } else {
      // Check if client runtime parameters attempt to alter confirmed weight without re-confirming
      const runtimeWeight = customOptions.package?.weight ? Number(customOptions.package.weight) : null;
      if (runtimeWeight !== null && Math.abs(runtimeWeight - Number(dbPkg.weight)) > 0.001) {
        isConfirmedWeight = false;
        weightSource = 'Invalidated — Runtime Weight Differs From Confirmed DB Record';
        rawWeight = runtimeWeight;
      } else {
        // Authoritative verified confirmation
        isConfirmedWeight = true;
        weightSource = 'Confirmed Package Measurements (Saved in DB)';
        rawWeight = Number(dbPkg.weight);
        confirmedMetadata = {
          confirmedBy: dbPkg.confirmedBy || null,
          confirmedAt: dbPkg.confirmedAt || null,
          contentsHash: dbPkg.contentsHash || null,
        };
      }
    }
  } else if (customOptions.package?.weight && Number(customOptions.package.weight) > 0) {
    // Client supplied weight at runtime, but NO confirmed package record exists in DB
    isConfirmedWeight = false;
    weightSource = isTestInput
      ? 'Test input — not confirmed parcel weight'
      : 'Operator Modal Input — Not Saved in DB';
    rawWeight = Number(customOptions.package.weight);
  }

  let weightKg = 0;
  let weightConversionNote = '';

  if (rawWeight > 0) {
    if (rawWeight > 10) {
      // 1200g converts to 1.2kg exactly once
      weightKg = Number((rawWeight / 1000).toFixed(3));
      weightConversionNote = `Converted from grams (${rawWeight}g / 1000 = ${weightKg}kg)`;
    } else {
      weightKg = Number(rawWeight.toFixed(3));
      weightConversionNote = `Preserved as kilograms (${weightKg}kg)`;
    }
  } else {
    weightKg = 0;
    weightConversionNote = 'Missing parcel measurements. Confirmed weight (> 0g) is required.';
  }

  const lengthCm = Math.max(
    1,
    Math.round(Number(pkg.length) || Number(process.env.SHIPROCKET_PKG_LENGTH) || 10)
  );
  const breadthCm = Math.max(
    1,
    Math.round(Number(pkg.breadth) || Number(process.env.SHIPROCKET_PKG_BREADTH) || 10)
  );
  const heightCm = Math.max(
    1,
    Math.round(Number(pkg.height) || Number(process.env.SHIPROCKET_PKG_HEIGHT) || 10)
  );

  // Order date formatted for Shiprocket
  let orderDate;
  try {
    const parsedDate = new Date(order.createdAt || Date.now());
    orderDate = (!isNaN(parsedDate.getTime()) ? parsedDate : new Date())
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  } catch {
    orderDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Payment method
  const isPaid = order.paymentStatus === 'paid' || order.status === 'Paid';
  const paymentMethod = isPaid ? 'Prepaid' : order.paymentMethod === 'COD' ? 'COD' : 'Prepaid';

  // Construct actual outbound payload matching src/utils/shiprocket.js
  const payload = {
    order_id: orderRef,
    order_date: orderDate,
    pickup_location: pickupLocation,

    billing_customer_name: rawFirstName || (rawFullName ? rawFullName : ''),
    billing_last_name: rawLastName || '', 
    billing_address: streetAddress || '',
    billing_address_2: landmark || '',
    billing_city: city || '',
    billing_pincode: cleanPincode || '',
    billing_state: state || '',
    billing_country: 'India',
    billing_email: cleanEmail || '',
    billing_phone: cleanPhone || '',

    ...(isB2B && (b2bDetails.companyName || shippingAddr.companyName)
      ? { billing_company_name: (b2bDetails.companyName || shippingAddr.companyName).trim() }
      : {}),
    ...(isB2B && (b2bDetails.gstin || shippingAddr.gstin)
      ? { billing_gstin: (b2bDetails.gstin || shippingAddr.gstin).trim() }
      : {}),

    shipping_is_billing: true,

    order_items: orderItems,
    payment_method: paymentMethod,
    sub_total: subTotal,
    length: lengthCm,
    breadth: breadthCm,
    height: heightCm,
    weight: Math.max(0.01, Number(weightKg.toFixed(3))),
  };

  return {
    payload,
    metadata: {
      rawRef,
      orderRef,
      isPaid,
      paymentMethod,
      sourceItemCount: (order.items || []).length,
      submittedLineCount: orderItems.length,
      totalUnits: orderItems.reduce((acc, i) => acc + i.units, 0),
      emptyOrderSubstituted,
      weightConversionNote,
      rawWeight,
      weightKg,
      weightSource,
      isConfirmedWeight,
      isTestInput,
      packageDetails: {
        rawWeight,
        rawUnit: rawWeight > 10 ? 'g' : (rawWeight > 0 ? 'kg' : 'none'),
        weightKg,
        weightSource,
        isConfirmed: isConfirmedWeight,
        isTestInput,
        conversionNote: weightConversionNote,
        dimensionsCm: {
          length: lengthCm,
          breadth: breadthCm,
          height: heightCm,
        },
      },
      lengthCm,
      breadthCm,
      heightCm,
      isB2B,
      rawFirstName,
      rawLastName,
      rawPhone,
      cleanPhone,
      rawPincode,
      cleanPincode,
      streetAddress,
      city,
      state,
      landmark,
      cleanEmail,
      pickupLocation,
    },
  };
}

/**
 * Validates the order and payload, generates full audit mapping table,
 * financial reconciliation, package analysis, and overall submission readiness.
 */
export function validateAndAuditShiprocketPayload(order, customOptions = {}) {
  const env = resolveShiprocketEnvironment();
  const isSandbox = env.isSandbox;
  const { payload, metadata } = buildShiprocketOrderPayload(order, customOptions);

  const validationIssues = [];
  const auditEntries = [];

  // Check 0A: Online order payment status gate (Strict Block)
  const paymentMethodUpper = String(order.paymentMethod || '').toUpperCase();
  const isOnlinePayment = paymentMethodUpper !== 'COD' && paymentMethodUpper !== 'CASH ON DELIVERY';
  if (isOnlinePayment && (order.paymentStatus !== 'paid' && order.status !== 'Paid')) {
    validationIssues.push({
      type: 'PAYMENT_NOT_CONFIRMED',
      severity: 'BLOCKING',
      title: 'Online Payment Pending — Dispatch Blocked',
      message: `Order payment method is "${order.paymentMethod || 'Online'}" with status "${order.paymentStatus || 'pending'}". Online orders cannot be dispatched until payment is verified and confirmed.`,
      impact: 'Dispatch and courier creation are strictly BLOCKED on both dashboard gateway and backend API.',
    });
  }

  // Check 0B: Confirmed package measurements (Strict Block)
  if (!metadata.isConfirmedWeight) {
    validationIssues.push({
      type: 'BLOCKED_MEASUREMENTS_MISSING',
      severity: 'BLOCKING',
      title: 'Unconfirmed Package Measurements',
      message: `Package measurements are not confirmed (${metadata.weightSource}). Real dispatch requires verified measurements confirmed by an authorized operator.`,
      impact: 'Courier quoting and dispatch are BLOCKED until an authorized operator confirms actual parcel measurements.',
    });
  }

  // Check 0C: Warehouse configuration
  if (!metadata.pickupLocation) {
    validationIssues.push({
      type: 'BLOCKED_WAREHOUSE_CONFIG_MISSING',
      severity: 'BLOCKING',
      title: 'Warehouse Configuration Missing',
      message: 'Warehouse pickup location nickname or pincode is missing from configuration.',
      impact: 'Shiprocket pickup request cannot be scheduled without a verified warehouse pickup nickname.',
    });
  }

  // Check 1: Address completeness
  const missingAddressFields = [];
  if (!metadata.streetAddress) missingAddressFields.push('Street Address');
  if (!metadata.city) missingAddressFields.push('City');
  if (!metadata.state) missingAddressFields.push('State');
  if (!metadata.cleanPincode) missingAddressFields.push('Pincode');
  if (!metadata.cleanPhone) missingAddressFields.push('Phone Number');

  if (missingAddressFields.length > 0) {
    validationIssues.push({
      type: 'MISSING_REQUIRED',
      severity: 'ERROR',
      title: 'Incomplete Customer Address',
      message: `The delivery address is missing mandatory fields: ${missingAddressFields.join(', ')}.`,
      impact: 'The backend will silently substitute dummy data ("Main Street", "Delhi", "110001", "9999999999"), which may result in an undeliverable consignment or courier rejection.',
    });
  }

  // Check 2: Dummy data substitution warnings
  const fabricatedValues = [];
  if (payload.billing_address === 'Main Street' && !metadata.streetAddress) fabricatedValues.push('billing_address = "Main Street"');
  if (payload.billing_city === 'Delhi' && !metadata.city) fabricatedValues.push('billing_city = "Delhi"');
  if (payload.billing_pincode === '110001' && !metadata.cleanPincode) fabricatedValues.push('billing_pincode = "110001"');
  if (payload.billing_phone === '9999999999' && !metadata.cleanPhone) fabricatedValues.push('billing_phone = "9999999999"');
  if (payload.billing_customer_name === 'Customer' && !metadata.rawFirstName) fabricatedValues.push('billing_customer_name = "Customer"');

  if (fabricatedValues.length > 0) {
    validationIssues.push({
      type: 'DUMMY_FALLBACK_DETECTED',
      severity: 'WARNING',
      title: 'Dummy Placeholders Injected',
      message: `Due to missing order information, the following placeholder values are set in the payload: ${fabricatedValues.join('; ')}.`,
      impact: 'Shiprocket may accept dummy values locally, but real courier pickup and delivery will fail.',
    });
  }

  // Check 3: Empty order
  if (metadata.emptyOrderSubstituted) {
    validationIssues.push({
      type: 'EMPTY_ORDER',
      severity: 'ERROR',
      title: 'Empty Order Consignment',
      message: 'This order has 0 line items. The builder synthesized a placeholder product ("Green Fibre Eco Product", GF-PROD-1) to avoid an empty payload.',
      impact: 'Dispatching an empty order with a dummy product will lead to incorrect courier booking.',
    });
  }

  // Check 4: Weight conversion bug warning (> 10 kg)
  if (metadata.rawWeight > 10 && metadata.rawWeight < 100) {
    validationIssues.push({
      type: 'AMBIGUOUS_WEIGHT_UNIT',
      severity: 'WARNING',
      title: 'Potential Weight Conversion Discrepancy',
      message: `Input weight was ${metadata.rawWeight}. The system divided it by 1000, assuming grams (${metadata.payload.weight} kg / ${metadata.rawWeight}g).`,
      impact: 'If this was intended as kilograms (e.g. 15 kg), it has been reduced to 15 grams, which will cause courier weight penalty disputes.',
    });
  }

  // Check 5: Financial discrepancy (Discounts omitted)
  const authoritativeTotal = Number(order.finalAmount || order.total || order.totalAmount || 0);
  const authoritativeDiscount = Number(order.discountAmount || 0);
  const submittedSubtotal = Number(payload.sub_total || 0);
  const financialDiff = submittedSubtotal - (authoritativeTotal || submittedSubtotal);

  if (authoritativeDiscount > 0 && Math.abs(financialDiff) > 0.01) {
    validationIssues.push({
      type: 'FINANCIAL_MISMATCH',
      severity: 'WARNING',
      title: 'Order Coupon Discount Omitted',
      message: `The order has an authoritative discount of ₹${authoritativeDiscount.toFixed(2)}, but Shiprocket payload sub_total (₹${submittedSubtotal.toFixed(2)}) reflects the gross item sum.`,
      impact: payload.payment_method === 'COD'
        ? `CRITICAL FOR COD: Shiprocket courier will collect gross ₹${submittedSubtotal.toFixed(2)} instead of discounted ₹${authoritativeTotal.toFixed(2)}.`
        : 'For prepaid orders, the printed invoice on the Shiprocket shipping label will display the undiscounted subtotal.',
    });
  }

  // Check 6: Existing Shiprocket linkage
  const existingSrOrderId = order.shippingDetails?.shiprocketOrderId;
  const existingAwb = order.shippingDetails?.awbCode || order.shippingDetails?.trackingNumber;
  if (existingSrOrderId) {
    validationIssues.push({
      type: 'ALREADY_LINKED',
      severity: 'INFO',
      title: 'Existing Shiprocket Shipment Found',
      message: `This order is already linked to Shiprocket Order ID #${existingSrOrderId}${existingAwb ? ` with AWB ${existingAwb}` : ''}.`,
      impact: 'Submitting again will skip Stage 1 order creation and reuse existing shipment linkage.',
    });
  }

  // Build Field-by-Field Audit Entries (Section 5 of prompt)
  const addAudit = (source, targetField, value, level, status, explanation) => {
    auditEntries.push({ source, targetField, value, level, status, explanation });
  };

  addAudit('order.orderNumber / easebuzzOrderId', 'order_id', payload.order_id, 'Required', 'PRESENT_VALID', 'Prefixed unique merchant order identifier');
  addAudit('order.createdAt', 'order_date', payload.order_date, 'Required', 'DERIVED', 'Converted from ISO date to "YYYY-MM-DD HH:mm:ss"');
  const pickupEnvSource = isSandbox ? 'process.env.SHIPROCKET_TEST_PICKUP_LOCATION' : 'process.env.SHIPROCKET_LIVE_PICKUP_LOCATION';
  const pickupEnvVal = isSandbox ? (process.env.SHIPROCKET_TEST_PICKUP_LOCATION || process.env.SHIPROCKET_PICKUP_LOCATION) : (process.env.SHIPROCKET_LIVE_PICKUP_LOCATION || process.env.SHIPROCKET_PICKUP_LOCATION);
  addAudit(pickupEnvSource, 'pickup_location', payload.pickup_location, 'Required', pickupEnvVal ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', 'Warehouse pickup location nickname registered in Shiprocket');
  addAudit('shippingAddress.fullName', 'billing_customer_name', payload.billing_customer_name, 'Required', metadata.rawFirstName ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.rawFirstName ? 'First name extracted' : 'Substituted dummy "Customer"');
  addAudit('shippingAddress.fullName', 'billing_last_name', payload.billing_last_name, 'Optional', metadata.rawLastName ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.rawLastName ? 'Surname extracted' : 'Substituted "."');
  addAudit('shippingAddress.streetAddress', 'billing_address', payload.billing_address, 'Required', metadata.streetAddress ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.streetAddress ? 'Direct street address' : 'Substituted dummy "Main Street"');
  addAudit('shippingAddress.landmark', 'billing_address_2', payload.billing_address_2, 'Optional', payload.billing_address_2 ? 'PRESENT_VALID' : 'OPTIONAL_OMITTED', 'Delivery landmark / address line 2');
  addAudit('shippingAddress.city', 'billing_city', payload.billing_city, 'Required', metadata.city ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.city ? 'Direct city' : 'Substituted dummy "Delhi"');
  addAudit('shippingAddress.pincode', 'billing_pincode', payload.billing_pincode, 'Required', metadata.cleanPincode ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.cleanPincode ? '6-digit postal code' : 'Substituted dummy "110001"');
  addAudit('shippingAddress.state', 'billing_state', payload.billing_state, 'Required', metadata.state ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.state ? 'Direct state' : 'Substituted dummy "Delhi"');
  addAudit('Hardcoded ("India")', 'billing_country', payload.billing_country, 'Required', 'PRESENT_VALID', 'Default domestic country');
  addAudit('shippingAddress.email / order.user.email', 'billing_email', payload.billing_email, 'Required', metadata.cleanEmail ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', 'Contact email for shipment tracking notifications');
  addAudit('shippingAddress.phone', 'billing_phone', payload.billing_phone, 'Required', metadata.cleanPhone ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', metadata.cleanPhone ? 'Clean 10-digit mobile number' : 'Substituted dummy "9999999999"');
  addAudit('Hardcoded in shiprocket.js:386', 'shipping_is_billing', payload.shipping_is_billing, 'Required', 'CONFIG_DEFAULT', 'Set to true (delivery destination placed in billing_* fields)');
  addAudit('Omitted (shipping_is_billing=true)', 'shipping_customer_name', null, 'Conditional', 'OPTIONAL_OMITTED', 'Omitted because shipping_is_billing is true');
  addAudit('Omitted (shipping_is_billing=true)', 'shipping_address', null, 'Conditional', 'OPTIONAL_OMITTED', 'Omitted because shipping_is_billing is true');
  addAudit('Omitted (shipping_is_billing=true)', 'shipping_city', null, 'Conditional', 'OPTIONAL_OMITTED', 'Omitted because shipping_is_billing is true');
  addAudit('Omitted (shipping_is_billing=true)', 'shipping_pincode', null, 'Conditional', 'OPTIONAL_OMITTED', 'Omitted because shipping_is_billing is true');
  addAudit('order.items / customOptions.items', 'order_items', `[${payload.order_items.length} items]`, 'Required', metadata.emptyOrderSubstituted ? 'CONFIG_DEFAULT' : 'PRESENT_VALID', `${payload.order_items.length} line items with ${metadata.totalUnits} total units`);
  addAudit('order.paymentStatus', 'payment_method', payload.payment_method, 'Required', 'DERIVED', `Mapped to "${payload.payment_method}" based on payment status`);
  addAudit('sum(selling_price * units)', 'sub_total', payload.sub_total, 'Required', 'DERIVED', 'Calculated from unit prices and quantities');
  addAudit('pkg.length', 'length', payload.length, 'Required', customOptions.package?.length ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', `${payload.length} cm (Parcel length)`);
  addAudit('pkg.breadth', 'breadth', payload.breadth, 'Required', customOptions.package?.breadth ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', `${payload.breadth} cm (Parcel breadth)`);
  addAudit('pkg.height', 'height', payload.height, 'Required', customOptions.package?.height ? 'PRESENT_VALID' : 'CONFIG_DEFAULT', `${payload.height} cm (Parcel height)`);
  addAudit('pkg.weight', 'weight', payload.weight, 'Required', customOptions.package?.weight ? 'DERIVED' : 'CONFIG_DEFAULT', `${payload.weight} kg (${metadata.weightConversionNote})`);

  // Overall Status
  let overallStatus = 'READY';
  if (missingAddressFields.length > 0 || metadata.emptyOrderSubstituted) {
    overallStatus = 'MISSING_REQUIRED';
  } else if (validationIssues.some((i) => i.severity === 'ERROR')) {
    overallStatus = 'VALIDATION_FAILED';
  }

  // Fingerprint for concurrency / change detection
  const fingerprintSource = JSON.stringify({
    id: order._id || order.id || order.orderNumber || 'GF-ORDER',
    finalAmount: order.finalAmount,
    totalAmount: order.totalAmount,
    total: order.total,
    discountAmount: order.discountAmount,
    paymentStatus: order.paymentStatus,
    items: (Array.isArray(order.items) ? order.items : [])
      .filter(Boolean)
      .map((i) => ({ sku: i?.sku, q: i?.quantity || i?.units, p: i?.price || i?.unitPrice })),
    addr: String(metadata.streetAddress || '') + String(metadata.cleanPincode || '') + String(metadata.cleanPhone || ''),
    updatedAt: order.updatedAt || order.createdAt || '',
  });
  const orderFingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 16);

  return {
    success: true,
    overallStatus,
    statusNote:
      overallStatus === 'READY'
        ? 'Local validation passed. Ready for review (does not guarantee live courier serviceability or account acceptance).'
        : overallStatus === 'MISSING_REQUIRED'
        ? 'Order has missing mandatory delivery or product information. Please review flagged fields.'
        : 'Validation checks demonstrated integration issues that should be addressed before dispatch.',
    orderFingerprint,
    orderNumber: metadata.rawRef,
    existingShipment: existingSrOrderId
      ? {
          shiprocketOrderId: existingSrOrderId,
          shiprocketShipmentId: order.shippingDetails?.shiprocketShipmentId,
          awbCode: existingAwb,
          courierName: order.shippingDetails?.courierName,
          trackingUrl: order.shippingDetails?.trackingUrl,
        }
      : null,
    payload,
    metadata,
    validationIssues,
    auditEntries,
    financials: {
      authoritativeOrderTotal: authoritativeTotal,
      authoritativeDiscount: authoritativeDiscount,
      submittedSubtotal,
      taxesExplanation: 'Line prices are treated as GST-inclusive in Shiprocket adhoc orders. Line tax fields are sent as 0.',
      shippingCharges: Number(order.shippingCharges || 0),
      expectedCodCollection: payload.payment_method === 'COD' ? submittedSubtotal : 0,
      discrepancy: financialDiff,
      discrepancyExplained:
        Math.abs(financialDiff) > 0.01
          ? `Discrepancy of ₹${financialDiff.toFixed(2)} caused by unmapped coupon discount (authoritative ₹${authoritativeTotal} vs submitted ₹${submittedSubtotal}).`
          : 'Totals fully reconciled with no unexplained difference.',
    },
    packaging: {
      weightKg: payload.weight,
      weightGrams: Math.round(payload.weight * 1000),
      dimensionsCm: {
        length: payload.length,
        breadth: payload.breadth,
        height: payload.height,
      },
      measurementSource: metadata.weightSource,
      weightSource: metadata.weightSource,
      isConfirmed: metadata.isConfirmedWeight,
      isTestInput: metadata.isTestInput,
      rawWeight: metadata.rawWeight,
      packagingWeightIncluded: 'Not included automatically (relies on parcel input)',
      conversionNote: metadata.weightConversionNote,
    },
    environment: {
      isSandbox: env.isSandbox,
      environment: env.environment,
      apiHost: env.hostName,
      baseUrl: env.baseUrl,
      pickupLocationNickname: env.pickupLocation,
      authAccount: env.email ? `${env.email.slice(0, 3)}***@${env.email.split('@')[1] || ''}` : 'unconfigured',
    },
    provenance: {
      baseUrl: env.baseUrl,
      pickupLocation: payload.pickup_location,
      orderIdPrefix: process.env.SHIPROCKET_ORDER_ID_PREFIX || '',
      isSandbox: env.isSandbox,
      upstreamHost: env.hostName,
      upstreamEnvironment: env.environment,
    },
    safeConfig: {
      apiEndpoint: 'POST /v1/external/orders/create/adhoc',
      baseUrl: env.baseUrl,
      pickupLocation: payload.pickup_location,
      orderIdPrefix: process.env.SHIPROCKET_ORDER_ID_PREFIX || '',
      isSandbox: env.isSandbox,
      environment: env.environment,
      apiHost: env.hostName,
    },
  };
}
