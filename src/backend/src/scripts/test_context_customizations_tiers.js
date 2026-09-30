import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";
import { Category } from "../models/category.model.js";
import b2bRoutes from "../routes/b2b/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/b2b", b2bRoutes);

async function runContextTest() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await connectDB();

        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        // Ensure category exists
        let category = await Category.findOne({ slug: "gift-boxes" });
        if (!category) {
            category = await Category.findOne();
        }

        const timestamp = Date.now();
        console.log("\n=======================================================");
        console.log(" 1. CREATING PRODUCT WITH DUAL CONTEXTS (Corporate & Anniversary)");
        console.log("=======================================================");

        const product = await Product.create({
            name: "Eco-Luxe Insulated Tumbler",
            slug: `eco-luxe-tumbler-${timestamp}`,
            sku: `GF-TUMB-${timestamp}`,
            unit: "piece",
            tagline: "Double-walled rice husk composite tumbler",
            description: "Earth-friendly 500ml insulated tumbler crafted from rice husk composite.",
            shortDescription: "Sustainable tumbler for hot and cold beverages.",
            category: category._id,
            colors: [
                { name: "Olive Green", hex: "#556B2F", stock: 1000, images: ["https://example.com/olive.png"] },
                { name: "Natural Husk", hex: "#D2B48C", stock: 1000, images: ["https://example.com/husk.png"] },
            ],
            images: ["https://example.com/olive.png", "https://example.com/husk.png"],
            originalPrice: 1299,
            discountedPrice: 899,
            b2cPrice: 899,
            b2bPrice: 450,
            stockQuantity: 2000,
            isActive: true,
        });

        // Create B2B config with default corporate settings AND anniversary occasion override
        const b2bConfig = await B2BProductConfig.create({
            product: product._id,
            isEnabled: true,
            basePrice: 450,
            moq: 100,
            stepQuantity: 25,
            sampleAvailable: true,
            samplePrice: 599,
            // DEFAULT / GLOBAL (e.g. Corporate bulk)
            customizationOptions: [
                {
                    key: "corp_logo_print",
                    label: "Corporate Logo Screen Print",
                    description: "Single-color screen print of company logo",
                    type: "print",
                    isPriced: true,
                    pricePerUnit: 15,
                    moq: 100,
                    isActive: true,
                },
                {
                    key: "corp_belly_band",
                    label: "Corporate Branded Sleeve",
                    description: "Custom printed sleeve with company brand guidelines",
                    type: "packaging",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 100,
                    isActive: true,
                },
            ],
            tiers: [
                {
                    tierLabel: "Corporate Starter",
                    minQty: 100,
                    maxQty: 499,
                    unitPrice: 450,
                    discountPercentage: 50,
                    popular: false,
                    benefits: ["50% Off Retail", "Standard Box"],
                    enabledCustomizationKeys: ["corp_logo_print"],
                },
                {
                    tierLabel: "Corporate Mega",
                    minQty: 500,
                    maxQty: null,
                    unitPrice: 380,
                    discountPercentage: 58,
                    popular: true,
                    benefits: ["58% Off Retail", "FREE Logo Printing"],
                    enabledCustomizationKeys: ["corp_logo_print", "corp_belly_band"],
                    customizationPriceOverrides: [{ optionKey: "corp_logo_print", pricePerUnit: 0, isFree: true }],
                },
            ],
            // OCCASION / CONTEXT OVERRIDES
            contexts: [
                {
                    contextKey: "anniversary",
                    contextLabel: "Anniversary & Milestone Celebration",
                    description: "Tailored for company anniversaries, milestone rewards, and commemorative celebrations",
                    isEnabled: true,
                    basePrice: 480,
                    moq: 25, // Lower MOQ for anniversary events!
                    stepQuantity: 5,
                    sampleAvailable: true,
                    samplePrice: 650,
                    leadTime: "5 - 7 business days",
                    customizationOptions: [
                        {
                            key: "gold_foil_monogram",
                            label: "Gold Foil Monogram & Years Engraving",
                            description: "Luxury gold metallic stamp commemorating 5th/10th/25th anniversary",
                            type: "engraving",
                            isPriced: true,
                            pricePerUnit: 40,
                            moq: 25,
                            isActive: true,
                        },
                        {
                            key: "anniversary_gift_box",
                            label: "Anniversary Keepsake Ribbon Box",
                            description: "Handcrafted rigid luxury keepsake box with silver/gold satin ribbon",
                            type: "packaging",
                            isPriced: true,
                            pricePerUnit: 60,
                            moq: 25,
                            isActive: true,
                        },
                        {
                            key: "custom_greeting_card",
                            label: "Personalized Founder Note / Greeting Card",
                            description: "Embossed message card on seed paper",
                            type: "other",
                            isPriced: true,
                            pricePerUnit: 20,
                            moq: 25,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "Milestone Celebration (25 - 99 pcs)",
                            minQty: 25,
                            maxQty: 99,
                            unitPrice: 480,
                            discountPercentage: 47,
                            popular: false,
                            benefits: ["Anniversary Commemorative Surcharge Included", "Gold Satin Ribbon"],
                            enabledCustomizationKeys: ["gold_foil_monogram", "anniversary_gift_box"],
                        },
                        {
                            tierLabel: "Silver Jubilee Bulk (100+ pcs)",
                            minQty: 100,
                            maxQty: null,
                            unitPrice: 410,
                            discountPercentage: 54,
                            popular: true,
                            benefits: ["54% Off Retail", "FREE Gold Foil Monogramming", "FREE Personalized Cards"],
                            enabledCustomizationKeys: ["gold_foil_monogram", "anniversary_gift_box", "custom_greeting_card"],
                            customizationPriceOverrides: [
                                { optionKey: "gold_foil_monogram", pricePerUnit: 0, isFree: true },
                                { optionKey: "custom_greeting_card", pricePerUnit: 0, isFree: true },
                            ],
                        },
                    ],
                },
            ],
        });

        console.log(`✅ Product and Context-Aware B2B Config created. (Product ID: ${product._id})`);

        console.log("\n=======================================================");
        console.log(" 2. TEST: DEFAULT B2B REQUEST (No Context Passed)");
        console.log("=======================================================");
        const defaultRes = await fetch(`${baseUrl}/api/b2b/products/${product.slug}`);
        const defaultData = await defaultRes.json();
        console.log("Status:", defaultRes.status);
        console.log("Active Context:", defaultData.product.activeContext);
        console.log("Available Contexts:", defaultData.product.availableContexts);
        console.log("MOQ:", defaultData.product.moq, "(Expected 100)");
        console.log("Tiers count:", defaultData.product.tiers.length, "(Expected 2)");
        console.log("Tier 1 Label:", defaultData.product.tiers[0].tierLabel);
        console.log("Customizations:", defaultData.product.customizationOptions.map((c) => c.label));

        if (defaultData.product.moq !== 100 || defaultData.product.tiers[0].tierLabel !== "Corporate Starter") {
            throw new Error("Default B2B resolution failed!");
        }

        console.log("\n=======================================================");
        console.log(" 3. TEST: ANNIVERSARY CONTEXT REQUEST (?context=anniversary)");
        console.log("=======================================================");
        const annivRes = await fetch(`${baseUrl}/api/b2b/products/${product.slug}?context=anniversary`);
        const annivData = await annivRes.json();
        console.log("Status:", annivRes.status);
        console.log("Active Context:", annivData.product.activeContext);
        console.log("MOQ:", annivData.product.moq, "(Expected 25)");
        console.log("Tiers count:", annivData.product.tiers.length, "(Expected 2 anniversary tiers)");
        console.log("Tier 1 Label:", annivData.product.tiers[0].tierLabel);
        console.log("Tier 1 MinQty:", annivData.product.tiers[0].minQty, "Price:", annivData.product.tiers[0].unitPrice);
        console.log("Anniversary Customizations:", annivData.product.customizationOptions.map((c) => c.label));

        if (annivData.product.moq !== 25 || !annivData.product.activeContext.isCustomContext || annivData.product.activeContext.key !== "anniversary") {
            throw new Error("Anniversary context resolution failed!");
        }

        console.log("\n=======================================================");
        console.log(" 4. TEST: CALCULATE QUOTE WITH CONTEXT & CUSTOMIZATIONS");
        console.log("=======================================================");
        const quoteRes = await fetch(`${baseUrl}/api/b2b/calculate-quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: product._id,
                quantity: 100,
                context: "anniversary",
                selectedCustomizations: ["gold_foil_monogram", "anniversary_gift_box", "custom_greeting_card"],
            }),
        });
        const quoteData = await quoteRes.json();
        console.log("Quote Status:", quoteRes.status);
        console.log("Applied Tier:", quoteData.calculation.appliedTier);
        console.log("Active Context:", quoteData.calculation.activeContext);
        console.log("Base Subtotal:", quoteData.calculation.subtotal);
        console.log("Customizations Breakdown:", quoteData.calculation.customizations);
        console.log("Customization Total:", quoteData.calculation.customizationTotal);
        console.log("Grand Total:", quoteData.calculation.grandTotal);

        if (quoteData.calculation.appliedTier.unitPrice !== 410) {
            throw new Error("Quote pricing calculation for anniversary tier failed!");
        }

        console.log("\n=======================================================");
        console.log(" 5. TEST: CATALOG LIST WITH CONTEXT FILTERING");
        console.log("=======================================================");
        const listRes = await fetch(`${baseUrl}/api/b2b/products?context=anniversary`);
        const listData = await listRes.json();
        const foundProductInList = listData.products.find((p) => p._id.toString() === product._id.toString());
        console.log("List Status:", listRes.status);
        console.log("List Context:", listData.context);
        console.log("Found Product MOQ in list:", foundProductInList?.moq, "(Expected 25)");
        console.log("Found Product Active Context:", foundProductInList?.activeContext);

        if (foundProductInList?.moq !== 25) {
            throw new Error("Catalog listing context resolution failed!");
        }

        console.log("\n🎉 ALL DYNAMIC CONTEXT / OCCASION CUSTOMIZATION & TIER TESTS PASSED!");
    } catch (err) {
        console.error("Test failed:", err);
        process.exitCode = 1;
    } finally {
        if (product?._id) {
            await Product.deleteOne({ _id: product._id }).catch(() => {});
            await B2BProductConfig.deleteOne({ product: product._id }).catch(() => {});
            console.log("Guaranteed cleanup of test data completed.");
        }
        if (server) {
            server.close();
        }
        process.exit(process.exitCode || 0);
    }
}

runContextTest();

