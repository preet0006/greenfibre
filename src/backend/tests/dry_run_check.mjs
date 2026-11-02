import axios from "axios";
import { createShiprocketOrder } from "../src/utils/shiprocket.js";

process.env.SHIPROCKET_EMAIL = "audit_user@greenfibre.org";
process.env.SHIPROCKET_PASSWORD = "mock_secret_pw";
process.env.SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
process.env.SHIPROCKET_PICKUP_LOCATION = "Primary Warehouse";
process.env.SHIPROCKET_ENABLED = "true";

let capturedAuth = null;
let capturedOrderPayload = null;

// Intercept axios directly
axios.post = async (url, data, config) => {
  if (url.includes("/auth/login")) {
    capturedAuth = { url, data };
    return { status: 200, data: { token: "MOCK_TOKEN_987654321" } };
  }
  throw new Error(`Unexpected axios.post to ${url}`);
};

axios.create = function(defaultConfig) {
  return async function mockClient(requestConfig) {
    if (requestConfig.url === "/orders/create/adhoc") {
      capturedOrderPayload = requestConfig.data;
      return {
        status: 200,
        data: {
          order_id: 88776655,
          shipment_id: 22334455,
          status: "NEW",
          status_code: 1,
        }
      };
    }
    throw new Error(`Unexpected client call to ${requestConfig.url}`);
  };
};

const syntheticThreeProductOrder = {
  orderNumber: "GF-SYNTH-001",
  createdAt: "2026-10-31T10:00:00.000Z",
  paymentStatus: "paid",
  paymentMethod: "Easebuzz",
  totalAmount: 3200,
  finalAmount: 3200,
  shippingAddress: {
    fullName: "Aarav Sharma",
    streetAddress: "Flat 402, Green Heights, Sector 62",
    landmark: "Near City Metro Station",
    city: "Noida",
    state: "Uttar Pradesh",
    pincode: "201309",
    phone: "+91 98765 43210",
    email: "aarav.sharma@example.com"
  },
  items: [
    { name: "Bamboo Fiber Mug", sku: "GF-MUG-BLK-01", quantity: 1, price: 500 },
    { name: "Organic Planter Small", sku: "GF-PLANT-SM-02", quantity: 2, price: 600 },
    { name: "Jute Fiber Coasters (Set of 4)", sku: "GF-COAST-JUT-03", quantity: 3, price: 500 }
  ]
};

async function run() {
  const res = await createShiprocketOrder(syntheticThreeProductOrder, {
    package: { weight: 1500, length: 25, breadth: 20, height: 15 }
  });
  console.log("SUCCESS! Result:", JSON.stringify(res));
  console.log("\nCaptured Auth:", JSON.stringify(capturedAuth));
  console.log("\nCaptured 3-Product Payload:\n", JSON.stringify(capturedOrderPayload, null, 2));
}

run().catch(console.error);

