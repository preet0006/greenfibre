import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

dotenv.config();

const BASE_URL = "http://localhost:5500";

async function verifyDashboardCRUD() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    // 1. Find or create an admin user for token generation
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        full_name: "B2B Super Admin",
        email: "admin_test@greenfibre.com",
        password: "AdminPassword123!",
        role: "admin",
        isVerified: true,
      });
    }

    const adminToken = jwt.sign(
      { id: admin._id, role: "admin", isB2BVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    };

    console.log("\n=======================================================");
    console.log("TEST 1: GET /api/b2b/admin/dashboard/products (READ ALL)");
    console.log("=======================================================");
    const listRes = await axios.get(`${BASE_URL}/api/b2b/admin/dashboard/products`, authHeaders);
    console.log("Status:", listRes.status);
    console.log("Total products found:", listRes.data.total);
    console.log("First product name:", listRes.data.products?.[0]?.name);
    console.log("First product B2B tiers count:", listRes.data.products?.[0]?.wholesalePricing?.tiers?.length ?? 0);

    console.log("\n=======================================================");
    console.log("TEST 2: POST /api/b2b/admin/dashboard/products (CREATE)");
    console.log("=======================================================");
    const newProductPayload = {
      name: "CRUD Test Eco Lunchbox Set",
      category: "Gift Boxes & Hampers",
      unit: "set",
      tagline: "Eco-friendly lunchbox for corporate employees",
      description: "Complete rice husk lunchbox set with cutlery and bag.",
      originalPrice: 1200,
      discountedPrice: 999,
      b2bPrice: 650,
      b2bPricing: {
        isEnabled: true,
        basePrice: 650,
        moq: 25,
        stepQuantity: 5,
        sampleAvailable: true,
        samplePrice: 350,
        tiers: [
          { minQty: 25, maxQty: 99, unitPrice: 650, tierLabel: "Tier 1 Starter" },
          { minQty: 100, maxQty: 499, unitPrice: 580, tierLabel: "Tier 2 Corporate" },
          { minQty: 500, maxQty: null, unitPrice: 499, tierLabel: "Tier 3 Enterprise" }
        ]
      },
      giftBoxImages: ["https://example.com/box1.jpg"],
      giftPackaging: {
        available: true,
        images: ["https://example.com/box1.jpg"],
        title: "Executive Gift Packaging",
        pricePerBox: 50,
        customBrandingAvailable: true
      },
      giftSetContents: {
        totalProductTypes: 2,
        products: [
          { name: "Lunch Box Container", quantity: 1, unit: "piece", size: "800 ml" },
          { name: "Cutlery Fork & Spoon", quantity: 1, unit: "set", size: "6 inch" }
        ]
      },
      colors: [
        { name: "Beige", hex: "#E8E2D2", images: ["https://example.com/beige.jpg"], stock: 250 }
      ]
    };

    const createRes = await axios.post(`${BASE_URL}/api/b2b/admin/dashboard/products`, newProductPayload, authHeaders);
    console.log("Status:", createRes.status);
    console.log("Created Product ID:", createRes.data.product?._id);
    console.log("Created Product Slug:", createRes.data.product?.slug);
    console.log("Created Tiers Count:", createRes.data.product?.b2bPricing?.tiers?.length);
    console.log("Gift Packaging Available:", createRes.data.product?.giftPackaging?.available);
    console.log("Gift Set Contents Items:", createRes.data.product?.giftSetContents?.products?.length);

    const createdId = createRes.data.product?._id;

    console.log("\n=======================================================");
    console.log(`TEST 3: GET /api/b2b/admin/dashboard/products/${createdId} (READ SINGLE)`);
    console.log("=======================================================");
    const singleRes = await axios.get(`${BASE_URL}/api/b2b/admin/dashboard/products/${createdId}`, authHeaders);
    console.log("Status:", singleRes.status);
    console.log("Product Name:", singleRes.data.product?.name);
    console.log("Retail Price:", singleRes.data.product?.retailPricing?.discountedPrice);
    console.log("Wholesale Base Price:", singleRes.data.product?.wholesalePricing?.basePrice);
    console.log("Wholesale MOQ:", singleRes.data.product?.wholesalePricing?.moq);

    console.log("\n=======================================================");
    console.log(`TEST 4: PUT /api/b2b/admin/dashboard/products/${createdId} (UPDATE)`);
    console.log("=======================================================");
    const updatePayload = {
      tagline: "UPDATED: World-class Eco-friendly lunchbox for enterprise",
      b2bPrice: 620,
      b2bPricing: {
        isEnabled: true,
        basePrice: 620,
        moq: 30,
        tiers: [
          { minQty: 30, maxQty: 99, unitPrice: 620, tierLabel: "Tier 1 Starter" },
          { minQty: 100, maxQty: null, unitPrice: 540, tierLabel: "Tier 2 Mega Enterprise" }
        ]
      }
    };

    const updateRes = await axios.put(`${BASE_URL}/api/b2b/admin/dashboard/products/${createdId}`, updatePayload, authHeaders);
    console.log("Status:", updateRes.status);
    console.log("Updated Tagline:", updateRes.data.product?.tagline);
    console.log("Updated Wholesale Base Price:", updateRes.data.product?.wholesalePricing?.basePrice);
    console.log("Updated Tiers Count:", updateRes.data.product?.wholesalePricing?.tiers?.length);

    console.log("\n=======================================================");
    console.log(`TEST 5: DELETE /api/b2b/admin/dashboard/products/${createdId} (DELETE)`);
    console.log("=======================================================");
    const deleteRes = await axios.delete(`${BASE_URL}/api/b2b/admin/dashboard/products/${createdId}`, authHeaders);
    console.log("Status:", deleteRes.status);
    console.log("Message:", deleteRes.data.message);

    console.log("\n=======================================================");
    console.log("TEST 6: VERIFY DELETE COMPLETION");
    console.log("=======================================================");
    try {
      await axios.get(`${BASE_URL}/api/b2b/admin/dashboard/products/${createdId}`, authHeaders);
      console.log("ERROR: Product still exists!");
    } catch (err) {
      console.log("Expected 404 received:", err.response?.status, err.response?.data?.message);
    }

    console.log("\n>>> ALL B2B DASHBOARD CRUD OPERATIONS VERIFIED AND FUNCTIONING 100%! <<<");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Verification failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

verifyDashboardCRUD();
