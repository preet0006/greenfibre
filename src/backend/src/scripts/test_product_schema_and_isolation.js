import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import productRoutes from "../routes/product.route.js";
import b2bRoutes from "../routes/b2b.route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/product", productRoutes);
app.use("/api/b2b", b2bRoutes);

async function testProductSchemaAndIsolation() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await connectDB();

        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        // Ensure category exists
        let category = await Category.findOne();
        if (!category) {
            category = await Category.create({ name: "Eco Living", slug: "eco-living" });
        }

        console.log("\n--- TEST 1: Creating Product with standard images + optional giftBoxImages ---");
        const product = await Product.create({
            name: "Bamboo Fiber Executive Diary & Pen Set",
            slug: `executive-diary-set-${Date.now()}`,
            sku: "GF-EXEC-001",
            unit: "set",
            tagline: "Eco-luxury corporate gift set in handcrafted gift packaging",
            description: "Sustainable bamboo fiber hardcover diary paired with an impact-resistant refillable pen.",
            shortDescription: "Executive diary and pen set for corporate gifting.",
            category: category._id,
            productFeatures: [
                "100% biodegradable bamboo cover",
                "FSC-certified 80 GSM paper",
                "Laser-engraved customization available",
            ],
            // Standard product gallery images
            images: [
                "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
                "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800",
            ],
            // Optional Gift Box Images (1, 2, or 3+ photos)
            giftBoxImages: [
                "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
                "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800",
                "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800",
            ],
            giftPackaging: {
                available: true,
                images: [
                    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800",
                    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800",
                ],
                title: "Custom Gold Foil Gift Box",
                description: "Rigid luxury gift box with custom sleeve",
                pricePerBox: 45,
                customBrandingAvailable: true,
            },
            // B2C Retail Pricing
            originalPrice: 1499,
            discountedPrice: 999,
            b2cPrice: 999,
            // B2B Wholesale Pricing
            b2bPrice: 450,
            b2bPricing: {
                isEnabled: true,
                basePrice: 450,
                moq: 50,
                stepQuantity: 10,
                sampleAvailable: true,
                samplePrice: 750,
                tiers: [
                    { minQty: 50, maxQty: 200, unitPrice: 450, discountPercentage: 55, tierLabel: "Starter Bulk" },
                    { minQty: 201, maxQty: 500, unitPrice: 390, discountPercentage: 61, tierLabel: "Corporate Recommended", popular: true },
                    { minQty: 501, maxQty: null, unitPrice: 330, discountPercentage: 67, tierLabel: "Enterprise Direct" },
                ],
            },
            tax: { hsnCode: "482010", gstRate: 18, isTaxInclusive: true },
            stockQuantity: 500,
        });

        console.log("Product created with ID:", product._id.toString());
        console.log("Images count:", product.images.length);
        console.log("GiftBoxImages count:", product.giftBoxImages.length);

        console.log("\n--- TEST 2: Testing B2C Retail Endpoint (GET /api/product/:id) ---");
        const b2cRes = await fetch(`${baseUrl}/api/product/${product._id}`);
        const b2cData = await b2cRes.json();
        console.log("B2C Status:", b2cRes.status);
        console.log("B2C Retail Price:", b2cData.product.discountedPrice, "MRP:", b2cData.product.originalPrice);
        console.log("B2C Gallery Images:", b2cData.product.images);
        console.log("B2C Gift Box Images:", b2cData.product.giftBoxImages);
        console.log("B2C has internal B2B wholesale margins leaked?", b2cData.product.b2bMargin === undefined ? "NO (Protected ✅)" : "LEAKED ❌");

        if (!b2cData.product.giftBoxImages || b2cData.product.giftBoxImages.length !== 3) {
            throw new Error("B2C product missing giftBoxImages!");
        }

        console.log("\n--- TEST 3: Testing B2B Wholesale Endpoint (GET /api/b2b/products/:id) ---");
        const b2bRes = await fetch(`${baseUrl}/api/b2b/products/${product._id}`);
        const b2bData = await b2bRes.json();
        console.log("B2B Status:", b2bRes.status);
        console.log("B2B MOQ:", b2bData.product.moq);
        console.log("B2B Slabs/Tiers Count:", b2bData.product.tiers.length);
        console.log("B2B Tier 1:", b2bData.product.tiers[0].minQty, "units @ ₹", b2bData.product.tiers[0].unitPrice);
        console.log("B2B Tier 2:", b2bData.product.tiers[1].minQty, "units @ ₹", b2bData.product.tiers[1].unitPrice);
        console.log("B2B Tier 3:", b2bData.product.tiers[2].minQty, "+ units @ ₹", b2bData.product.tiers[2].unitPrice);
        console.log("B2B Gift Box Images:", b2bData.product.giftBoxImages);
        console.log("B2B Gift Packaging details:", b2bData.product.giftPackaging);

        if (!b2bData.product.tiers || b2bData.product.tiers.length !== 3 || !b2bData.product.giftBoxImages) {
            throw new Error("B2B product missing wholesale tiers or giftBoxImages!");
        }

        // Clean up test product
        await Product.deleteOne({ _id: product._id });
        console.log("\nCleaned up test product. Database is clean.");

        server.close();
        console.log("\n🎉 ALL PRODUCT SCHEMA & B2C/B2B ISOLATION TESTS PASSED!");
        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}

testProductSchemaAndIsolation();
