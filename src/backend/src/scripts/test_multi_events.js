/**
 * ================================================================
 * TEST: MULTIPLE EVENTS / OCCASIONS WITH DIFFERENT CUSTOMIZATIONS
 * ================================================================
 * Demonstrates that the SAME product (e.g., Canister) can support
 * unlimited events/occasions, each with its own:
 *   - MOQ & Step Quantity
 *   - Pricing Tiers
 *   - Customization Menu (options, icons, tags)
 *   - Lead Time
 *   - Sample Policy
 *
 * Events tested in this script:
 *   1. corporate              → bulk corporate gifting
 *   2. anniversary            → milestone celebrations
 *   3. wedding                → wedding favours & trousseau
 *   4. festive                → Diwali / Eid / Christmas hampers
 *   5. employee-onboarding    → welcome kits for new joiners
 * ================================================================
 */
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

async function runMultiEventTest() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await connectDB();

        const server = app.listen(0);
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        let category = await Category.findOne({ slug: "storage" }) || await Category.findOne();
        const timestamp = Date.now();

        // ─── Create the base product once ───────────────────────────────────
        console.log("\n═══════════════════════════════════════════════");
        console.log("1. CREATING PRODUCT (Same product, 5 events)");
        console.log("═══════════════════════════════════════════════");

        const product = await Product.create({
            name: "BioDur Airtight Canister Set",
            slug: `canister-${timestamp}`,
            sku: `GF-CAN-${timestamp}`,
            unit: "set",
            tagline: "Earth-friendly airtight canisters made with rice husk & bamboo fibres",
            description: "Set of 2 airtight storage canisters, 700 ml each, made with BioDur biocomposite.",
            shortDescription: "Rice husk & bamboo fibre canisters, 700 ml each, set of 2.",
            category: category._id,
            colors: [
                { name: "Warm White", hex: "#FAF7F0", stock: 5000, images: ["https://example.com/canister-white.png"] },
                { name: "Matte Sage", hex: "#87AE73", stock: 3000, images: ["https://example.com/canister-sage.png"] },
            ],
            images: ["https://example.com/canister-white.png"],
            originalPrice: 2295,
            discountedPrice: 1850,
            b2bPrice: 1700,
            stockQuantity: 8000,
            isActive: true,
        });

        console.log(`✅ Product created: ${product._id}`);

        // ─── Create B2BProductConfig with all 5 event contexts ──────────────
        const b2bConfig = await B2BProductConfig.create({
            product: product._id,
            isEnabled: true,
            basePrice: 1700,
            moq: 50,
            stepQuantity: 10,
            sampleAvailable: true,
            samplePrice: 449,

            // ── Global / Default Customizations (shown when no context sent) ──
            customizationOptions: [
                {
                    key: "logo_print",
                    label: "Corporate Logo Screen Print",
                    tag: "Screen Print",
                    icon: "print",
                    description: "Single-color screen print of company logo on the lid.",
                    type: "print",
                    isPriced: true,
                    pricePerUnit: 20,
                    moq: 50,
                    isActive: true,
                },
                {
                    key: "belly_band",
                    label: "Custom Belly Band Wrapper",
                    tag: "Branded Band",
                    icon: "ribbon",
                    description: "Custom printed kraft paper band wrapped around the set.",
                    type: "packaging",
                    isPriced: true,
                    pricePerUnit: 15,
                    moq: 50,
                    isActive: true,
                },
            ],

            // ── Global Tiers (default) ─────────────────────────────────────────
            tiers: [
                {
                    tierLabel: "TIER 1",
                    minQty: 50,
                    maxQty: 199,
                    unitPrice: 1700,
                    discountPercentage: 26,
                    popular: false,
                    badge: "",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included.",
                    benefits: ["26% Off MRP", "Standard Dispatch", "1 Free Customization"],
                },
                {
                    tierLabel: "TIER 2",
                    minQty: 200,
                    maxQty: 499,
                    unitPrice: 1530,
                    discountPercentage: 33,
                    popular: true,
                    badge: "★ POPULAR",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "Choose any 2 complimentary customizations below.",
                    nextTierUnlockText: "Tier 3 unlocks all 5 →",
                    benefits: ["33% Off MRP", "2 Free Customizations", "Priority Production"],
                },
                {
                    tierLabel: "TIER 3",
                    minQty: 500,
                    maxQty: null,
                    unitPrice: 1360,
                    discountPercentage: 40,
                    popular: false,
                    badge: "-40%",
                    includedCustomizationsCount: 5,
                    customizationAllowanceText: "All customizations included complimentary.",
                    nextTierUnlockText: "",
                    benefits: ["40% Off MRP", "All Customizations Free", "Dedicated Account Manager"],
                    dedicatedAccountManager: true,
                },
            ],

            // ── CONTEXT / OCCASION OVERRIDES ──────────────────────────────────
            contexts: [

                // ── EVENT 1: CORPORATE GIFTING ─────────────────────────────────
                {
                    contextKey: "corporate",
                    contextLabel: "Corporate Gifting",
                    description: "Ideal for client gifting, employee rewards, and brand merchandise.",
                    isEnabled: true,
                    basePrice: 1700,
                    moq: 100,
                    stepQuantity: 25,
                    sampleAvailable: true,
                    samplePrice: 449,
                    leadTime: "7 - 10 business days",
                    customizationOptions: [
                        {
                            key: "laser_logo",
                            label: "Custom Laser Logo Engraving",
                            tag: "Laser Etched",
                            icon: "laser",
                            description: "Permanent high-precision laser etching of your brand logo on the front surface.",
                            type: "engraving",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 100,
                            isActive: true,
                        },
                        {
                            key: "pantone_colorway",
                            label: "Custom Pantone Brand Colorway",
                            tag: "Brand Tone",
                            icon: "palette",
                            description: "Custom rice husk bio-composite body tone matched to your corporate brand guideline.",
                            type: "color",
                            isPriced: true,
                            pricePerUnit: 80,
                            moq: 200,
                            isActive: true,
                        },
                        {
                            key: "corp_gift_box",
                            label: "Bespoke Recyclable Gift Packaging",
                            tag: "Custom Box",
                            icon: "box",
                            description: "Recycled kraft presentation gift box with custom branded outer sleeve & ribbon.",
                            type: "packaging",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 100,
                            isActive: true,
                        },
                        {
                            key: "insert_card",
                            label: "Personalized Greeting & Story Card",
                            tag: "Insert Card",
                            icon: "card",
                            description: "Custom printed plantable seed paper or kraft story card inside each box with your message.",
                            type: "card",
                            isPriced: true,
                            pricePerUnit: 25,
                            moq: 100,
                            isActive: true,
                        },
                        {
                            key: "recipient_monogram",
                            label: "Individual Recipient Name Monogram",
                            tag: "Per-Piece",
                            icon: "user-check",
                            description: "Laser engraving of individual employee or recipient names for high-touch VIP gifting.",
                            type: "monogram",
                            isPriced: true,
                            pricePerUnit: 35,
                            moq: 100,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "TIER 1",
                            minQty: 100,
                            maxQty: 499,
                            unitPrice: 1700,
                            discountPercentage: 26,
                            popular: false,
                            badge: "",
                            includedCustomizationsCount: 2,
                            customizationAllowanceText: "Choose any 2 of 5 complimentary customizations below.",
                            nextTierUnlockText: "Tier 2 unlocks 3 →",
                            benefits: ["26% Off MRP", "2 Complimentary Customizations", "Standard 7-10 Day Production"],
                        },
                        {
                            tierLabel: "TIER 2",
                            minQty: 500,
                            maxQty: 999,
                            unitPrice: 1530,
                            discountPercentage: 33,
                            popular: true,
                            badge: "★ POPULAR",
                            includedCustomizationsCount: 3,
                            customizationAllowanceText: "Choose any 3 of 5 complimentary customizations below.",
                            nextTierUnlockText: "Tier 3 unlocks all 5 →",
                            benefits: ["33% Off MRP", "3 Complimentary Customizations", "Priority Dispatch"],
                        },
                        {
                            tierLabel: "TIER 3",
                            minQty: 1000,
                            maxQty: null,
                            unitPrice: 1360,
                            discountPercentage: 40,
                            popular: false,
                            badge: "-40%",
                            includedCustomizationsCount: 5,
                            customizationAllowanceText: "All 5 complimentary customizations included.",
                            nextTierUnlockText: "",
                            benefits: ["40% Off MRP", "All 5 Customizations FREE", "Dedicated Account Manager", "Eco Certification Letter"],
                            dedicatedAccountManager: true,
                        },
                    ],
                },

                // ── EVENT 2: ANNIVERSARY & MILESTONE ─────────────────────────
                {
                    contextKey: "anniversary",
                    contextLabel: "Anniversary & Milestone Celebration",
                    description: "Curated packages for company anniversaries and commemorative milestones.",
                    isEnabled: true,
                    basePrice: 1900,
                    moq: 25,
                    stepQuantity: 5,
                    sampleAvailable: true,
                    samplePrice: 599,
                    leadTime: "5 - 7 business days",
                    customizationOptions: [
                        {
                            key: "gold_foil_monogram",
                            label: "Gold Foil Monogram & Years Engraving",
                            tag: "Gold Foil",
                            icon: "sparkles",
                            description: "Luxury gold metallic stamp commemorating company anniversary years.",
                            type: "engraving",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 25,
                            isActive: true,
                        },
                        {
                            key: "anniversary_ribbon_box",
                            label: "Anniversary Keepsake Ribbon Box",
                            tag: "Keepsake Box",
                            icon: "box",
                            description: "Handcrafted rigid luxury keepsake box with silver/gold satin ribbon.",
                            type: "packaging",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 25,
                            isActive: true,
                        },
                        {
                            key: "founder_note_card",
                            label: "Personalized Founder Note / Greeting Card",
                            tag: "Insert Card",
                            icon: "card",
                            description: "Embossed message card on seed paper with personalized founder message.",
                            type: "card",
                            isPriced: true,
                            pricePerUnit: 30,
                            moq: 25,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "Milestone Starter",
                            minQty: 25,
                            maxQty: 99,
                            unitPrice: 1900,
                            discountPercentage: 17,
                            popular: false,
                            badge: "",
                            includedCustomizationsCount: 2,
                            customizationAllowanceText: "Choose any 2 of 3 complimentary customizations below.",
                            nextTierUnlockText: "Silver Jubilee unlocks all 3 →",
                            benefits: ["Anniversary Commemorative Surcharge Included", "Gold Satin Ribbon"],
                        },
                        {
                            tierLabel: "Silver Jubilee Bulk",
                            minQty: 100,
                            maxQty: null,
                            unitPrice: 1600,
                            discountPercentage: 30,
                            popular: true,
                            badge: "★ POPULAR",
                            includedCustomizationsCount: 3,
                            customizationAllowanceText: "All 3 anniversary customizations included complimentary.",
                            nextTierUnlockText: "",
                            benefits: ["30% Off MRP", "All 3 Customizations FREE", "Expedited 5-Day Production"],
                        },
                    ],
                },

                // ── EVENT 3: WEDDING GIFTING ──────────────────────────────────
                {
                    contextKey: "wedding",
                    contextLabel: "Wedding & Trousseau Gifting",
                    description: "Elegant bridal favours, trousseau gifts, and wedding return gifts.",
                    isEnabled: true,
                    basePrice: 2100,
                    moq: 50,
                    stepQuantity: 10,
                    sampleAvailable: true,
                    samplePrice: 699,
                    leadTime: "10 - 14 business days",
                    customizationOptions: [
                        {
                            key: "couple_monogram",
                            label: "Couple Name & Date Monogram",
                            tag: "Laser Etched",
                            icon: "laser",
                            description: "Engraving of both names and wedding date on each canister lid.",
                            type: "engraving",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 50,
                            isActive: true,
                        },
                        {
                            key: "blush_gift_box",
                            label: "Blush Pink Bridal Gift Box",
                            tag: "Bridal Box",
                            icon: "box",
                            description: "Premium blush pink rigid gift box with gold foil embossed lid and satin ribbon.",
                            type: "packaging",
                            isPriced: true,
                            pricePerUnit: 90,
                            moq: 50,
                            isActive: true,
                        },
                        {
                            key: "wedding_seed_card",
                            label: "Plantable Seed Paper Wedding Card",
                            tag: "Plantable Card",
                            icon: "card",
                            description: "Eco-friendly seed paper insert card with personalized wedding wishes.",
                            type: "card",
                            isPriced: true,
                            pricePerUnit: 35,
                            moq: 50,
                            isActive: true,
                        },
                        {
                            key: "floral_motif_print",
                            label: "Floral Motif Screen Print",
                            tag: "Motif Print",
                            icon: "palette",
                            description: "Custom floral or Rajasthani block-print motif printed on canister body.",
                            type: "print",
                            isPriced: true,
                            pricePerUnit: 45,
                            moq: 100,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "Shaadi Starter",
                            minQty: 50,
                            maxQty: 199,
                            unitPrice: 2100,
                            discountPercentage: 8,
                            popular: false,
                            badge: "",
                            includedCustomizationsCount: 1,
                            customizationAllowanceText: "1 complimentary bridal customization included.",
                            nextTierUnlockText: "Grand Tier unlocks 2 →",
                            benefits: ["Bridal Packaging Included", "Monogram Engraving Included", "12-Day Express Production"],
                        },
                        {
                            tierLabel: "Grand Wedding Tier",
                            minQty: 200,
                            maxQty: null,
                            unitPrice: 1800,
                            discountPercentage: 22,
                            popular: true,
                            badge: "★ POPULAR",
                            includedCustomizationsCount: 2,
                            customizationAllowanceText: "Choose any 2 of 4 bridal customizations included free.",
                            nextTierUnlockText: "",
                            benefits: ["22% Off MRP", "2 Free Bridal Customizations", "Priority Bridal Express Production"],
                        },
                    ],
                },

                // ── EVENT 4: FESTIVE GIFTING (Diwali / Eid / Christmas) ────────
                {
                    contextKey: "festive",
                    contextLabel: "Festive Season Gifting",
                    description: "Diwali hampers, Eid gifts, Christmas gifting, and seasonal celebration kits.",
                    isEnabled: true,
                    basePrice: 1750,
                    moq: 50,
                    stepQuantity: 25,
                    sampleAvailable: true,
                    samplePrice: 499,
                    leadTime: "5 - 8 business days",
                    customizationOptions: [
                        {
                            key: "festive_hamper_box",
                            label: "Festive Hamper Gift Box",
                            tag: "Hamper Box",
                            icon: "box",
                            description: "Premium decorative hamper box with tissue paper, shredded kraft filler, and ribbon bow.",
                            type: "packaging",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 50,
                            isActive: true,
                        },
                        {
                            key: "festive_motif_print",
                            label: "Festive Motif Screen Print",
                            tag: "Seasonal Print",
                            icon: "palette",
                            description: "Season-specific motif (diya, crescent star, snow flake, or rangoli) screen printed on lid.",
                            type: "print",
                            isPriced: true,
                            pricePerUnit: 30,
                            moq: 50,
                            isActive: true,
                        },
                        {
                            key: "festival_insert_card",
                            label: "Season's Greetings Insert Card",
                            tag: "Insert Card",
                            icon: "card",
                            description: "Custom festival greetings card with your company logo and personalized message.",
                            type: "card",
                            isPriced: true,
                            pricePerUnit: 20,
                            moq: 50,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "Festive Starter",
                            minQty: 50,
                            maxQty: 299,
                            unitPrice: 1750,
                            discountPercentage: 24,
                            popular: false,
                            badge: "",
                            includedCustomizationsCount: 1,
                            customizationAllowanceText: "1 complimentary festive customization included.",
                            nextTierUnlockText: "Festive Bulk unlocks 2 →",
                            benefits: ["Festive Hamper Box Included", "Standard 7-Day Production"],
                        },
                        {
                            tierLabel: "Festive Bulk",
                            minQty: 300,
                            maxQty: null,
                            unitPrice: 1450,
                            discountPercentage: 37,
                            popular: true,
                            badge: "★ POPULAR",
                            includedCustomizationsCount: 3,
                            customizationAllowanceText: "All 3 festive customizations included complimentary.",
                            benefits: ["37% Off MRP", "All Festive Customizations FREE", "Rush 5-Day Production Available"],
                        },
                    ],
                },

                // ── EVENT 5: EMPLOYEE ONBOARDING (Welcome Kits) ────────────────
                {
                    contextKey: "employee-onboarding",
                    contextLabel: "Employee Onboarding Welcome Kit",
                    description: "Thoughtful welcome kits for new employee joining days and HR culture programs.",
                    isEnabled: true,
                    basePrice: 1600,
                    moq: 20,
                    stepQuantity: 5,
                    sampleAvailable: false,
                    samplePrice: null,
                    leadTime: "3 - 5 business days",
                    customizationOptions: [
                        {
                            key: "welcome_kit_branding",
                            label: "Company Branding & Logo Engraving",
                            tag: "Laser Etched",
                            icon: "laser",
                            description: "Laser-engraved company logo and tagline on the canister lid.",
                            type: "engraving",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 20,
                            isActive: true,
                        },
                        {
                            key: "welcome_kit_box",
                            label: "Branded Welcome Kit Box",
                            tag: "Welcome Box",
                            icon: "box",
                            description: "Custom-printed rigid box with shredded paper filler, company colors, and joining day note.",
                            type: "packaging",
                            isPriced: true,
                            pricePerUnit: 70,
                            moq: 20,
                            isActive: true,
                        },
                        {
                            key: "employee_name_monogram",
                            label: "Employee Name Monogram",
                            tag: "Per-Piece",
                            icon: "user-check",
                            description: "Individual employee name laser-engraved on each canister for a personal touch.",
                            type: "monogram",
                            isPriced: true,
                            pricePerUnit: 30,
                            moq: 20,
                            isActive: true,
                        },
                        {
                            key: "welcome_note_card",
                            label: "Personalized Welcome Note Card",
                            tag: "Insert Card",
                            icon: "card",
                            description: "Custom printed plantable seed paper card with HR welcome message.",
                            type: "card",
                            isPriced: false,
                            pricePerUnit: 0,
                            moq: 20,
                            isActive: true,
                        },
                    ],
                    tiers: [
                        {
                            tierLabel: "Small Team",
                            minQty: 20,
                            maxQty: 49,
                            unitPrice: 1700,
                            discountPercentage: 26,
                            popular: false,
                            badge: "",
                            includedCustomizationsCount: 2,
                            customizationAllowanceText: "2 complimentary welcome kit customizations included.",
                            nextTierUnlockText: "Growing Team unlocks 3 →",
                            benefits: ["Suitable for startups", "2 Free Customizations", "5-Day Express Delivery"],
                        },
                        {
                            tierLabel: "Growing Team",
                            minQty: 50,
                            maxQty: 199,
                            unitPrice: 1550,
                            discountPercentage: 32,
                            popular: true,
                            badge: "★ POPULAR",
                            includedCustomizationsCount: 3,
                            customizationAllowanceText: "Choose any 3 of 4 onboarding customizations free.",
                            nextTierUnlockText: "Enterprise unlocks all 4 →",
                            benefits: ["32% Off MRP", "3 Free Customizations", "Priority Production"],
                        },
                        {
                            tierLabel: "Enterprise Hiring",
                            minQty: 200,
                            maxQty: null,
                            unitPrice: 1350,
                            discountPercentage: 41,
                            popular: false,
                            badge: "-41%",
                            includedCustomizationsCount: 4,
                            customizationAllowanceText: "All 4 onboarding customizations included complimentary.",
                            benefits: ["41% Off MRP", "All Customizations FREE", "Dedicated HR Account Manager", "Monthly Batch Scheduling"],
                            dedicatedAccountManager: true,
                        },
                    ],
                },
            ],
        });

        console.log(`✅ B2B Config created with 5 event contexts! (Config ID: ${b2bConfig._id})`);
        console.log(`   Events configured: ${b2bConfig.contexts.map(c => c.contextKey).join(", ")}`);

        // ─── Run API tests for each event ─────────────────────────────────────
        const eventsToTest = [
            { key: "corporate",           expectedMoq: 100, expectedTiers: 3, expectedCustomizations: 5 },
            { key: "anniversary",         expectedMoq: 25,  expectedTiers: 2, expectedCustomizations: 3 },
            { key: "wedding",             expectedMoq: 50,  expectedTiers: 2, expectedCustomizations: 4 },
            { key: "festive",             expectedMoq: 50,  expectedTiers: 2, expectedCustomizations: 3 },
            { key: "employee-onboarding", expectedMoq: 20,  expectedTiers: 3, expectedCustomizations: 4 },
        ];

        for (const evt of eventsToTest) {
            console.log(`\n─────────────────────────────────────────`);
            console.log(` EVENT: "${evt.key.toUpperCase()}"`);
            console.log(`─────────────────────────────────────────`);

            const res = await fetch(`${baseUrl}/api/b2b/products/${product.slug}?context=${evt.key}`);
            const data = await res.json();
            const p = data.product;

            console.log(`  Active Context: ${p.activeContext?.key} (isCustomContext: ${p.activeContext?.isCustomContext})`);
            console.log(`  MOQ: ${p.moq} (Expected: ${evt.expectedMoq})`);
            console.log(`  Tiers: ${p.tiers.length} (Expected: ${evt.expectedTiers})`);
            console.log(`  Customizations: ${p.customizationOptions.length} (Expected: ${evt.expectedCustomizations})`);
            console.log(`  Tier 1: ${p.tiers[0]?.tierLabel} → ₹${p.tiers[0]?.unitPrice}/${product.unit}`);
            console.log(`  Tier 1 Badge: "${p.tiers[0]?.badge || "(none)"}"`);
            console.log(`  Tier 1 Allowance: "${p.tiers[0]?.customizationAllowanceText}"`);
            console.log(`  Tier 1 Unlock Hint: "${p.tiers[0]?.nextTierUnlockText || "(last tier)"}"`);
            console.log(`  Customization Options:`);
            p.customizationOptions.forEach((c, i) =>
                console.log(`    ${i+1}. [${c.tag}] ${c.label}  (₹${c.pricePerUnit}/unit | icon: ${c.icon})`)
            );
            console.log(`  All available contexts: ${p.availableContexts.map(c => c.key).join(", ")}`);

            if (p.moq !== evt.expectedMoq) throw new Error(`MOQ mismatch for ${evt.key}: got ${p.moq}, expected ${evt.expectedMoq}`);
            if (p.tiers.length !== evt.expectedTiers) throw new Error(`Tiers count mismatch for ${evt.key}`);
            if (p.customizationOptions.length !== evt.expectedCustomizations) throw new Error(`Customizations count mismatch for ${evt.key}`);
            if (!p.activeContext?.isCustomContext) throw new Error(`Context not resolved for ${evt.key}`);

            console.log(`  ✅ PASSED`);
        }

        // ─── Test: NO context → falls back to global/default ─────────────────
        console.log(`\n─────────────────────────────────────────`);
        console.log(` DEFAULT (No context — fallback test)`);
        console.log(`─────────────────────────────────────────`);
        const defaultRes = await fetch(`${baseUrl}/api/b2b/products/${product.slug}`);
        const defaultData = await defaultRes.json();
        const dp = defaultData.product;
        console.log(`  Active Context: ${dp.activeContext?.key} (Standard B2B fallback)`);
        console.log(`  MOQ: ${dp.moq} (Expected: 50 — global default)`);
        console.log(`  Tiers: ${dp.tiers.length} (Global default tiers)`);
        console.log(`  Customizations: ${dp.customizationOptions.length} (Global defaults)`);
        console.log(`  All 5 available contexts: ${dp.availableContexts.map(c => c.key).join(", ")}`);
        if (dp.activeContext?.key !== "default") throw new Error("Default fallback context incorrect");
        if (dp.availableContexts.length !== 5) throw new Error(`Expected 5 available contexts, got ${dp.availableContexts.length}`);
        console.log(`  ✅ PASSED`);

        // ─── Test: Quote with employee-onboarding + allowance logic ───────────
        console.log(`\n─────────────────────────────────────────`);
        console.log(` QUOTE: employee-onboarding, 50 pcs`);
        console.log(` Growing Team tier → 3 free customizations`);
        console.log(`─────────────────────────────────────────`);
        const quoteRes = await fetch(`${baseUrl}/api/b2b/calculate-quote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: product._id,
                quantity: 50,
                context: "employee-onboarding",
                selectedCustomizations: [
                    "welcome_kit_branding",
                    "employee_name_monogram",
                    "welcome_note_card",
                ],
            }),
        });
        const qData = await quoteRes.json();
        const qc = qData.calculation;
        console.log(`  Applied Tier: ${qc.appliedTier?.tierLabel} (₹${qc.appliedTier?.unitPrice}/set)`);
        console.log(`  Allowance: ${qc.appliedTier?.includedCustomizationsCount} free customizations`);
        console.log(`  Customization Breakdown:`);
        qc.customizations.forEach(c =>
            console.log(`    - [${c.tag}] ${c.label}  → Included: ${c.isIncludedInTier} → ₹${c.pricePerUnit} extra`)
        );
        console.log(`  Subtotal: ₹${qc.subtotal} | Customization Extra: ₹${qc.customizationTotal} | Grand Total: ₹${qc.grandTotal}`);
        if (qc.appliedTier?.unitPrice !== 1550) throw new Error("Wrong tier pricing for employee-onboarding quote");
        console.log(`  ✅ PASSED`);

        console.log("\n🎉 ALL MULTI-EVENT CONTEXT TESTS PASSED! You can add unlimited events.\n");
    } catch (err) {
        console.error("\nTest failed:", err.message);
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

runMultiEventTest();

