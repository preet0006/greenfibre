/**
 * ============================================================
 * GREENFIBRE B2B — PRODUCTION SEED SCRIPT
 * Context-Aware Tiers & Customizations for ALL Products
 * ============================================================
 *
 * Run:  node src/scripts/seed_b2b_context_configs.js
 *
 * What it does:
 *  1. Matches existing products by slug
 *  2. Upserts a B2BProductConfig for each product with:
 *     - Global default tiers & customizations
 *     - 5 event/occasion context overrides:
 *       corporate | anniversary | wedding | festive | employee-onboarding
 *     - Each context has its own: MOQ, tiers, 5+ customization options
 *
 * Safe to re-run: uses updateOne + upsert = true
 * ============================================================
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

// ─────────────────────────────────────────────────────────────
// HELPER: Build context config block for a given product+event
// ─────────────────────────────────────────────────────────────
function buildContext(contextKey, contextLabel, description, moq, stepQty, basePrice, samplePrice, leadTime, tiers, customizationOptions) {
    return {
        contextKey,
        contextLabel,
        description,
        isEnabled: true,
        basePrice,
        moq,
        stepQuantity: stepQty,
        sampleAvailable: samplePrice !== null,
        samplePrice,
        leadTime,
        tiers,
        customizationOptions,
    };
}

// ─────────────────────────────────────────────────────────────
// PRODUCT CONFIGS
// Each entry matches a product by `slug`
// ─────────────────────────────────────────────────────────────
const PRODUCT_B2B_CONFIGS = [

    // ══════════════════════════════════════════════════════════
    // 1. CANISTER SET (Rice Husk & Bamboo Fibre)
    // ══════════════════════════════════════════════════════════
    {
        slug: "canister",
        config: {
            isEnabled: true,
            basePrice: 1700,
            moq: 100,
            stepQuantity: 25,
            sampleAvailable: true,
            samplePrice: 449,
            // ── Default / Global (no context) ─────────────────
            customizationOptions: [
                { key: "logo_print",   label: "Logo Screen Print",      tag: "Screen Print", icon: "print",     type: "print",     isPriced: true,  pricePerUnit: 20, moq: 100, isActive: true, description: "Single-color screen print of company logo on the lid." },
                { key: "belly_band",   label: "Custom Belly Band",       tag: "Branded Band", icon: "ribbon",    type: "packaging", isPriced: true,  pricePerUnit: 15, moq: 100, isActive: true, description: "Printed kraft paper band wrapped around the set." },
            ],
            tiers: [
                { tierLabel: "TIER 1", minQty: 100, maxQty: 499, unitPrice: 1700, discountPercentage: 26, popular: false, badge: "",          includedCustomizationsCount: 1, customizationAllowanceText: "1 complimentary customization included.", nextTierUnlockText: "Tier 2 unlocks 2 →", benefits: ["26% Off MRP", "Standard Dispatch"] },
                { tierLabel: "TIER 2", minQty: 500, maxQty: 999, unitPrice: 1530, discountPercentage: 33, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 complimentary customizations below.", nextTierUnlockText: "Tier 3 unlocks all →", benefits: ["33% Off MRP", "Priority Production"] },
                { tierLabel: "TIER 3", minQty: 1000, maxQty: null, unitPrice: 1360, discountPercentage: 41, popular: false, badge: "-41%",    includedCustomizationsCount: 5, customizationAllowanceText: "All customizations included.", nextTierUnlockText: "", benefits: ["41% Off MRP", "Dedicated Account Manager"], dedicatedAccountManager: true },
            ],
            // ── Context / Occasion Overrides ──────────────────
            contexts: [
                buildContext(
                    "corporate", "Corporate Gifting",
                    "Client gifts, employee rewards, and branded merchandise for enterprises.",
                    100, 25, 1700, 449, "7 - 10 business days",
                    [
                        { tierLabel: "TIER 1", minQty: 100, maxQty: 499,  unitPrice: 1700, discountPercentage: 26, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 complimentary customizations below.", nextTierUnlockText: "Tier 2 unlocks 3 →",      benefits: ["26% Off MRP", "2 Free Customizations", "Standard 7-10 Day Production"] },
                        { tierLabel: "TIER 2", minQty: 500, maxQty: 999,  unitPrice: 1530, discountPercentage: 33, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 3, customizationAllowanceText: "Choose any 3 of 5 complimentary customizations below.", nextTierUnlockText: "Tier 3 unlocks all 5 →", benefits: ["33% Off MRP", "3 Free Customizations", "Priority Dispatch"] },
                        { tierLabel: "TIER 3", minQty: 1000, maxQty: null, unitPrice: 1360, discountPercentage: 41, popular: false, badge: "-41%",      includedCustomizationsCount: 5, customizationAllowanceText: "All 5 complimentary customizations included.",                  nextTierUnlockText: "",               benefits: ["41% Off MRP", "All 5 Free", "Dedicated Account Manager", "Eco Certificate"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "laser_logo",          label: "Custom Laser Logo Engraving",          tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Permanent high-precision laser etching of your brand logo on the front surface." },
                        { key: "pantone_colorway",     label: "Custom Pantone Brand Colorway",        tag: "Brand Tone",    icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 80, moq: 200, isActive: true, description: "Custom rice husk bio-composite body tone matched to your corporate brand guideline." },
                        { key: "corp_gift_box",        label: "Bespoke Recyclable Gift Packaging",    tag: "Custom Box",    icon: "box",        type: "packaging",  isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Recycled kraft presentation gift box with custom branded outer sleeve & ribbon." },
                        { key: "insert_card",          label: "Personalized Greeting & Story Card",   tag: "Insert Card",   icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 25, moq: 100, isActive: true, description: "Custom printed plantable seed paper or kraft story card inside each box." },
                        { key: "recipient_monogram",   label: "Individual Recipient Name Monogram",   tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 35, moq: 100, isActive: true, description: "Laser engraving of individual employee or recipient names for VIP gifting." },
                    ]
                ),
                buildContext(
                    "anniversary", "Anniversary & Milestone Celebration",
                    "Curated commemorative gifting for company anniversaries and milestone rewards.",
                    25, 5, 1900, 599, "5 - 7 business days",
                    [
                        { tierLabel: "Milestone Starter",  minQty: 25,  maxQty: 99,   unitPrice: 1900, discountPercentage: 17, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 anniversary customizations below.", nextTierUnlockText: "Silver Jubilee unlocks 4 →",  benefits: ["Gold Satin Ribbon", "Anniversary Commemorative Print", "5-7 Day Production"] },
                        { tierLabel: "Silver Jubilee",     minQty: 100, maxQty: 299,  unitPrice: 1600, discountPercentage: 30, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 4, customizationAllowanceText: "Choose any 4 of 5 anniversary customizations below.", nextTierUnlockText: "Platinum unlocks all 5 →", benefits: ["30% Off MRP", "4 Free Customizations", "Expedited 5-Day Production"] },
                        { tierLabel: "Platinum Jubilee",   minQty: 300, maxQty: null, unitPrice: 1400, discountPercentage: 39, popular: false, badge: "-39%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 anniversary customizations included complimentary.", nextTierUnlockText: "", benefits: ["39% Off MRP", "All 5 Free", "White-Glove Delivery", "Commemorative Certificate"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "gold_foil_monogram",   label: "Gold Foil Monogram & Years Engraving",  tag: "Gold Foil",     icon: "sparkles",   type: "engraving",  isPriced: false, pricePerUnit: 0,   moq: 25, isActive: true, description: "Luxury gold metallic stamp commemorating your company's anniversary years." },
                        { key: "anniversary_box",      label: "Anniversary Keepsake Ribbon Box",        tag: "Keepsake Box",  icon: "box",        type: "packaging",  isPriced: false, pricePerUnit: 0,   moq: 25, isActive: true, description: "Handcrafted rigid luxury keepsake box with silver/gold satin ribbon." },
                        { key: "founder_note_card",    label: "Personalized Founder Note Card",         tag: "Insert Card",   icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 30,  moq: 25, isActive: true, description: "Embossed founder message on premium seed paper." },
                        { key: "milestone_plaque",     label: "Milestone Achievement Plaque Tag",       tag: "Plaque Tag",    icon: "award",      type: "label",      isPriced: true,  pricePerUnit: 40,  moq: 50, isActive: true, description: "Mini laser-engraved metal plaque tag showing milestone year and company name." },
                        { key: "name_monogram_anniv",  label: "Recipient Name Laser Monogram",          tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 35,  moq: 25, isActive: true, description: "Individual recipient names laser-engraved for a personalised commemorative touch." },
                    ]
                ),
                buildContext(
                    "wedding", "Wedding & Trousseau Gifting",
                    "Elegant bridal favours, wedding return gifts, and trousseau gifting.",
                    50, 10, 2100, 699, "10 - 14 business days",
                    [
                        { tierLabel: "Shaadi Starter",    minQty: 50,  maxQty: 149,  unitPrice: 2100, discountPercentage: 8,  popular: false, badge: "",          includedCustomizationsCount: 1, customizationAllowanceText: "1 complimentary bridal customization included.", nextTierUnlockText: "Baraat Tier unlocks 3 →", benefits: ["Couple Monogram Included", "Bridal Packaging", "12-Day Production"] },
                        { tierLabel: "Baraat Celebration", minQty: 150, maxQty: 399,  unitPrice: 1900, discountPercentage: 17, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 3, customizationAllowanceText: "Choose any 3 of 5 bridal customizations free.", nextTierUnlockText: "Grand Tier unlocks all 5 →", benefits: ["17% Off MRP", "3 Free Customizations", "Priority Express Production"] },
                        { tierLabel: "Grand Wedding",      minQty: 400, maxQty: null, unitPrice: 1700, discountPercentage: 26, popular: false, badge: "-26%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 bridal customizations included complimentary.",  nextTierUnlockText: "", benefits: ["26% Off MRP", "All 5 Free", "White-Glove Delivery", "Dedicated Bridal RM"] },
                    ],
                    [
                        { key: "couple_monogram",      label: "Couple Name & Date Monogram",           tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,   moq: 50,  isActive: true, description: "Both names and wedding date laser-engraved on each canister lid." },
                        { key: "blush_gift_box",       label: "Blush Pink Bridal Gift Box",            tag: "Bridal Box",    icon: "box",        type: "packaging",  isPriced: true,  pricePerUnit: 90,  moq: 50,  isActive: true, description: "Premium blush pink rigid box with gold foil embossed lid and satin ribbon." },
                        { key: "wedding_seed_card",    label: "Plantable Seed Paper Wedding Card",     tag: "Plantable",     icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 35,  moq: 50,  isActive: true, description: "Eco-friendly seed paper insert card with personalized wedding wishes." },
                        { key: "floral_motif_print",   label: "Floral / Block-Print Motif",            tag: "Motif Print",   icon: "palette",    type: "print",      isPriced: true,  pricePerUnit: 45,  moq: 100, isActive: true, description: "Rajasthani or floral block-print motif screen printed on canister body." },
                        { key: "wedding_ribbon_wrap",  label: "Silk Ribbon & Wax Seal Wrap",           tag: "Ribbon Wrap",   icon: "ribbon",     type: "packaging",  isPriced: true,  pricePerUnit: 50,  moq: 50,  isActive: true, description: "Ivory silk ribbon tied around each box with a custom wax seal impression." },
                    ]
                ),
                buildContext(
                    "festive", "Festive Season Gifting",
                    "Diwali hampers, Eid gifts, Christmas corporate kits, and seasonal celebration sets.",
                    50, 25, 1750, 499, "5 - 8 business days",
                    [
                        { tierLabel: "Festive Starter",  minQty: 50,  maxQty: 299,  unitPrice: 1750, discountPercentage: 24, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 festive customizations below.", nextTierUnlockText: "Festive Bulk unlocks 4 →", benefits: ["Festive Hamper Box", "2 Free Customizations", "7-Day Production"] },
                        { tierLabel: "Festive Bulk",     minQty: 300, maxQty: 699,  unitPrice: 1500, discountPercentage: 35, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 4, customizationAllowanceText: "Choose any 4 of 5 festive customizations free.", nextTierUnlockText: "Mega Festive unlocks all 5 →", benefits: ["35% Off MRP", "4 Free Customizations", "Rush 5-Day Production"] },
                        { tierLabel: "Mega Festive",     minQty: 700, maxQty: null, unitPrice: 1300, discountPercentage: 43, popular: false, badge: "-43%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 festive customizations included free.", nextTierUnlockText: "", benefits: ["43% Off MRP", "All 5 Free", "3-Day Rush Production", "Dedicated Festive RM"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "festive_hamper_box",   label: "Festive Hamper Gift Box",               tag: "Hamper Box",    icon: "box",        type: "packaging",  isPriced: false, pricePerUnit: 0,   moq: 50,  isActive: true, description: "Decorative hamper box with shredded kraft filler, tissue, and ribbon bow." },
                        { key: "festive_motif_print",  label: "Festive Motif Screen Print",            tag: "Seasonal Print",icon: "palette",    type: "print",      isPriced: true,  pricePerUnit: 30,  moq: 50,  isActive: true, description: "Season motif: diya, crescent star, snowflake, or rangoli on the lid." },
                        { key: "season_greet_card",    label: "Season's Greetings Insert Card",        tag: "Insert Card",   icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 20,  moq: 50,  isActive: true, description: "Custom festival greetings card with company logo and personalized message." },
                        { key: "festive_colourway",    label: "Festive Edition Body Colour",           tag: "Festive Tone",  icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 60,  moq: 100, isActive: true, description: "Seasonal colour variant: Diwali gold, Eid ivory, or Christmas red." },
                        { key: "name_monogram_festive",label: "Recipient Name Monogram",               tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 30,  moq: 50,  isActive: true, description: "Individual recipient name laser-engraved for a personalised festive touch." },
                    ]
                ),
                buildContext(
                    "employee-onboarding", "Employee Onboarding Welcome Kit",
                    "Welcome kits for new employee joining days and HR culture programs.",
                    20, 5, 1600, null, "3 - 5 business days",
                    [
                        { tierLabel: "Small Team",       minQty: 20,  maxQty: 49,   unitPrice: 1700, discountPercentage: 26, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "2 complimentary onboarding customizations included.", nextTierUnlockText: "Growing Team unlocks 4 →", benefits: ["Suitable for startups", "2 Free Customizations", "5-Day Express"] },
                        { tierLabel: "Growing Team",     minQty: 50,  maxQty: 199,  unitPrice: 1550, discountPercentage: 32, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 4, customizationAllowanceText: "Choose any 4 of 5 onboarding customizations free.", nextTierUnlockText: "Enterprise unlocks all 5 →", benefits: ["32% Off MRP", "4 Free Customizations", "Priority Production"] },
                        { tierLabel: "Enterprise Hiring",minQty: 200, maxQty: null, unitPrice: 1350, discountPercentage: 41, popular: false, badge: "-41%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 onboarding customizations included.", nextTierUnlockText: "", benefits: ["41% Off MRP", "All 5 Free", "Dedicated HR RM", "Monthly Batch Scheduling"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "company_logo_engrave", label: "Company Logo Laser Engraving",          tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,   moq: 20, isActive: true, description: "Laser-engraved company logo and tagline on the canister lid." },
                        { key: "welcome_kit_box",      label: "Branded Welcome Kit Box",               tag: "Welcome Box",   icon: "box",        type: "packaging",  isPriced: true,  pricePerUnit: 70,  moq: 20, isActive: true, description: "Custom-printed rigid box with company colors, shredded filler, and joining note." },
                        { key: "emp_name_monogram",    label: "Employee Name Monogram",                tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 30,  moq: 20, isActive: true, description: "Individual employee name laser-engraved on each canister." },
                        { key: "welcome_note_card",    label: "Personalized Welcome Note Card",        tag: "Insert Card",   icon: "card",       type: "card",       isPriced: false, pricePerUnit: 0,   moq: 20, isActive: true, description: "Custom printed plantable seed paper card with HR welcome message." },
                        { key: "brand_colorway_kit",   label: "Company Brand Colorway",                tag: "Brand Tone",    icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 60,  moq: 50, isActive: true, description: "Rice husk body tone matched to company brand color for cohesive kit look." },
                    ]
                ),
            ],
        },
    },

    // ══════════════════════════════════════════════════════════
    // 2. SMALL CUTLERY SET (Rice Husk)
    // ══════════════════════════════════════════════════════════
    {
        slug: "small-cutlery",
        config: {
            isEnabled: true,
            basePrice: 399,
            moq: 100,
            stepQuantity: 50,
            sampleAvailable: true,
            samplePrice: 149,
            customizationOptions: [
                { key: "logo_belly_band", label: "Logo Belly Band",  tag: "Branded Band", icon: "ribbon", type: "packaging", isPriced: true, pricePerUnit: 12, moq: 100, isActive: true, description: "Printed kraft band with company logo around the cutlery set." },
                { key: "pouch_print",     label: "Custom Pouch Print", tag: "Pouch Print", icon: "print",  type: "print",     isPriced: true, pricePerUnit: 18, moq: 100, isActive: true, description: "Custom logo screen print on the cotton carrying pouch." },
            ],
            tiers: [
                { tierLabel: "TIER 1", minQty: 100, maxQty: 499, unitPrice: 399, discountPercentage: 27, popular: false, badge: "",          includedCustomizationsCount: 1, customizationAllowanceText: "1 complimentary customization included.", nextTierUnlockText: "Tier 2 unlocks 3 →", benefits: ["27% Off MRP", "Eco-friendly cutlery", "Standard Dispatch"] },
                { tierLabel: "TIER 2", minQty: 500, maxQty: 999, unitPrice: 349, discountPercentage: 36, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 3, customizationAllowanceText: "Choose any 3 customizations below.", nextTierUnlockText: "Tier 3 unlocks all →", benefits: ["36% Off MRP", "3 Free Customizations"] },
                { tierLabel: "TIER 3", minQty: 1000, maxQty: null, unitPrice: 299, discountPercentage: 45, popular: false, badge: "-45%", includedCustomizationsCount: 5, customizationAllowanceText: "All customizations included.", nextTierUnlockText: "", benefits: ["45% Off MRP", "All Free", "Dedicated RM"], dedicatedAccountManager: true },
            ],
            contexts: [
                buildContext(
                    "corporate", "Corporate Gifting",
                    "Branded eco-cutlery sets for corporate events, conferences, and desk gifting.",
                    100, 50, 399, 149, "7 - 10 business days",
                    [
                        { tierLabel: "TIER 1", minQty: 100, maxQty: 499,  unitPrice: 399, discountPercentage: 27, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 complimentary customizations below.", nextTierUnlockText: "Tier 2 unlocks 3 →",      benefits: ["27% Off MRP", "2 Free Customizations", "Standard Production"] },
                        { tierLabel: "TIER 2", minQty: 500, maxQty: 999,  unitPrice: 349, discountPercentage: 36, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 3, customizationAllowanceText: "Choose any 3 of 5 complimentary customizations below.", nextTierUnlockText: "Tier 3 unlocks all 5 →", benefits: ["36% Off MRP", "3 Free Customizations", "Priority Dispatch"] },
                        { tierLabel: "TIER 3", minQty: 1000, maxQty: null, unitPrice: 299, discountPercentage: 45, popular: false, badge: "-45%",      includedCustomizationsCount: 5, customizationAllowanceText: "All 5 complimentary customizations included.",              nextTierUnlockText: "",               benefits: ["45% Off MRP", "All 5 Free", "Dedicated Account Manager"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "laser_logo_cutlery",  label: "Laser Logo on Handle",                  tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Company logo laser-engraved on the cutlery handle." },
                        { key: "branded_pouch",        label: "Custom Logo Cotton Pouch",              tag: "Branded Pouch", icon: "box",        type: "packaging",  isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Cotton carry pouch with company logo screen print." },
                        { key: "cutlery_pantone",      label: "Pantone Brand Color Match",             tag: "Brand Tone",    icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 50, moq: 200, isActive: true, description: "Rice husk cutlery body color matched to your brand Pantone." },
                        { key: "cutlery_gift_sleeve",  label: "Branded Kraft Gift Sleeve",             tag: "Sleeve Box",    icon: "ribbon",     type: "packaging",  isPriced: true,  pricePerUnit: 20, moq: 100, isActive: true, description: "Custom printed sleeve around the pouch set." },
                        { key: "recipient_tag_cutlery",label: "Recipient Name Gift Tag",               tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 15, moq: 100, isActive: true, description: "Individual name printed on a swing tag attached to each cutlery set." },
                    ]
                ),
                buildContext(
                    "anniversary", "Anniversary & Milestone Celebration",
                    "Commemorative eco-cutlery sets for milestone appreciation gifting.",
                    50, 10, 449, 199, "5 - 7 business days",
                    [
                        { tierLabel: "Milestone Set",    minQty: 50,  maxQty: 199,  unitPrice: 449, discountPercentage: 18, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 anniversary customizations below.", nextTierUnlockText: "Jubilee unlocks 4 →", benefits: ["Anniversary Gold Seal", "2 Free Customizations"] },
                        { tierLabel: "Jubilee Bulk",     minQty: 200, maxQty: 499,  unitPrice: 380, discountPercentage: 31, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 4, customizationAllowanceText: "Choose any 4 of 5 anniversary customizations free.", nextTierUnlockText: "Grand unlocks all 5 →", benefits: ["31% Off MRP", "4 Free Customizations", "Expedited 5-Day Production"] },
                        { tierLabel: "Grand Milestone",  minQty: 500, maxQty: null, unitPrice: 320, discountPercentage: 42, popular: false, badge: "-42%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 anniversary customizations included free.", nextTierUnlockText: "", benefits: ["42% Off MRP", "All 5 Free", "White-Glove Delivery"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "gold_anniversary_seal",label: "Gold Anniversary Seal Engraving",      tag: "Gold Seal",     icon: "sparkles",   type: "engraving",  isPriced: false, pricePerUnit: 0,  moq: 50,  isActive: true, description: "Gold foil anniversary seal with company name and milestone year." },
                        { key: "anniversary_pouch",    label: "Premium Velvet Keepsake Pouch",        tag: "Velvet Pouch",  icon: "box",        type: "packaging",  isPriced: false, pricePerUnit: 0,  moq: 50,  isActive: true, description: "Premium velvet pouch with satin drawstring for keepsake gifting." },
                        { key: "milestone_year_tag",   label: "Milestone Year Laser Tag",             tag: "Plaque Tag",    icon: "award",      type: "label",      isPriced: true,  pricePerUnit: 20, moq: 50,  isActive: true, description: "Mini metal plaque tag showing company milestone year." },
                        { key: "founder_message_anniv",label: "Founder Message Card",                 tag: "Insert Card",   icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 25, moq: 50,  isActive: true, description: "Embossed founder message on seed paper." },
                        { key: "name_mono_cutlery_ann",label: "Recipient Name Monogram",              tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 18, moq: 50,  isActive: true, description: "Individual recipient name laser-engraved on each cutlery handle." },
                    ]
                ),
                buildContext(
                    "wedding", "Wedding & Trousseau Gifting",
                    "Elegant eco-cutlery return gifts and wedding favours.",
                    100, 25, 499, 199, "10 - 14 business days",
                    [
                        { tierLabel: "Shaadi Favour",    minQty: 100, maxQty: 299,  unitPrice: 499, discountPercentage: 9,  popular: false, badge: "",          includedCustomizationsCount: 1, customizationAllowanceText: "1 complimentary bridal customization included.", nextTierUnlockText: "Grand Tier unlocks 3 →", benefits: ["Couple Monogram", "Bridal Packaging", "12-Day Production"] },
                        { tierLabel: "Grand Wedding",    minQty: 300, maxQty: null, unitPrice: 420, discountPercentage: 24, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 5, customizationAllowanceText: "All 5 bridal customizations included free.", nextTierUnlockText: "", benefits: ["24% Off MRP", "All 5 Free", "Priority Express Production"] },
                    ],
                    [
                        { key: "couple_name_cutlery",  label: "Couple Names on Handle",               tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Both names laser-engraved on each cutlery piece." },
                        { key: "wedding_velvet_pouch", label: "Ivory Velvet Wedding Pouch",           tag: "Bridal Pouch",  icon: "box",        type: "packaging",  isPriced: true,  pricePerUnit: 40, moq: 100, isActive: true, description: "Ivory velvet pouch with gold drawstring for bridal return gifts." },
                        { key: "wedding_date_tag",     label: "Wedding Date & Venue Tag",             tag: "Gift Tag",      icon: "card",       type: "label",      isPriced: true,  pricePerUnit: 15, moq: 100, isActive: true, description: "Luxury tag with wedding date, venue, and couple names." },
                        { key: "floral_motif_cutlery", label: "Floral Motif Print on Pouch",          tag: "Motif Print",   icon: "palette",    type: "print",      isPriced: true,  pricePerUnit: 20, moq: 100, isActive: true, description: "Floral or paisley motif screen printed on the cotton pouch." },
                        { key: "wax_seal_cutlery",     label: "Custom Wax Seal Sticker",              tag: "Wax Seal",      icon: "sparkles",   type: "label",      isPriced: true,  pricePerUnit: 12, moq: 100, isActive: true, description: "Custom wax seal sticker on each pouch with couple initials." },
                    ]
                ),
                buildContext(
                    "festive", "Festive Season Gifting",
                    "Diwali, Eid, and Christmas eco-cutlery hampers.",
                    100, 50, 420, 149, "5 - 8 business days",
                    [
                        { tierLabel: "Festive Set",      minQty: 100, maxQty: 499,  unitPrice: 420, discountPercentage: 24, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "Choose any 2 of 5 festive customizations below.", nextTierUnlockText: "Festive Mega unlocks 4 →", benefits: ["Festive Print", "2 Free Customizations", "7-Day Production"] },
                        { tierLabel: "Festive Mega",     minQty: 500, maxQty: null, unitPrice: 340, discountPercentage: 38, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 5, customizationAllowanceText: "All 5 festive customizations included complimentary.", nextTierUnlockText: "", benefits: ["38% Off MRP", "All 5 Free", "Rush 5-Day Production"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "festive_print_pouch",  label: "Festive Motif Pouch Print",            tag: "Seasonal Print",icon: "palette",    type: "print",      isPriced: false, pricePerUnit: 0,  moq: 100, isActive: true, description: "Diwali diya, Eid crescent, or Christmas motif on the pouch." },
                        { key: "festive_sleeve_box",   label: "Festive Kraft Gift Sleeve",            tag: "Gift Sleeve",   icon: "box",        type: "packaging",  isPriced: true,  pricePerUnit: 18, moq: 100, isActive: true, description: "Festive printed sleeve box for each cutlery set." },
                        { key: "season_greet_cutlery", label: "Season's Greetings Card",              tag: "Insert Card",   icon: "card",       type: "card",       isPriced: true,  pricePerUnit: 18, moq: 100, isActive: true, description: "Festival greetings card with company message inside each set." },
                        { key: "festive_color_cutlery",label: "Festive Edition Color",                tag: "Seasonal Tone", icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 40, moq: 200, isActive: true, description: "Seasonal color: Diwali gold, Eid ivory, or Christmas green." },
                        { key: "name_tag_festive_cut", label: "Recipient Name Gift Tag",              tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: true,  pricePerUnit: 12, moq: 100, isActive: true, description: "Individual name printed swing tag attached to each set." },
                    ]
                ),
                buildContext(
                    "employee-onboarding", "Employee Onboarding Welcome Kit",
                    "Eco-conscious cutlery sets for employee welcome kits and onboarding hampers.",
                    50, 10, 360, null, "3 - 5 business days",
                    [
                        { tierLabel: "Small Team",       minQty: 50,  maxQty: 149,  unitPrice: 380, discountPercentage: 31, popular: false, badge: "",          includedCustomizationsCount: 2, customizationAllowanceText: "2 complimentary onboarding customizations included.", nextTierUnlockText: "Growing Team unlocks 4 →", benefits: ["2 Free Customizations", "5-Day Express"] },
                        { tierLabel: "Growing Team",     minQty: 150, maxQty: 499,  unitPrice: 330, discountPercentage: 40, popular: true,  badge: "★ POPULAR", includedCustomizationsCount: 4, customizationAllowanceText: "Choose any 4 of 5 onboarding customizations free.", nextTierUnlockText: "Enterprise unlocks all 5 →", benefits: ["40% Off MRP", "4 Free Customizations"] },
                        { tierLabel: "Enterprise Hiring",minQty: 500, maxQty: null, unitPrice: 280, discountPercentage: 49, popular: false, badge: "-49%",       includedCustomizationsCount: 5, customizationAllowanceText: "All 5 onboarding customizations included free.", nextTierUnlockText: "", benefits: ["49% Off MRP", "All 5 Free", "Monthly Batch Scheduling"], dedicatedAccountManager: true },
                    ],
                    [
                        { key: "company_logo_cutlery", label: "Company Logo on Handle",               tag: "Laser Etched",  icon: "laser",      type: "engraving",  isPriced: false, pricePerUnit: 0,  moq: 50, isActive: true, description: "Company logo laser-engraved on each cutlery handle." },
                        { key: "welcome_kraft_sleeve", label: "Welcome Kit Kraft Sleeve",             tag: "Sleeve Box",    icon: "box",        type: "packaging",  isPriced: true,  pricePerUnit: 22, moq: 50, isActive: true, description: "Custom printed kraft sleeve with 'Welcome to the team!' message." },
                        { key: "emp_name_tag_cutlery", label: "Employee Name Tag",                    tag: "Per-Piece",     icon: "user-check", type: "monogram",   isPriced: false, pricePerUnit: 0,  moq: 50, isActive: true, description: "Employee name printed on swing tag attached to each cutlery set." },
                        { key: "welcome_note_cutlery", label: "Welcome Note Insert Card",             tag: "Insert Card",   icon: "card",       type: "card",       isPriced: false, pricePerUnit: 0,  moq: 50, isActive: true, description: "Custom HR welcome message on plantable seed paper card." },
                        { key: "brand_pouch_color",    label: "Brand Color Pouch",                    tag: "Brand Tone",    icon: "palette",    type: "color",      isPriced: true,  pricePerUnit: 25, moq: 100, isActive: true, description: "Cotton pouch color matched to company brand palette." },
                    ]
                ),
            ],
        },
    },
];

// ─────────────────────────────────────────────────────────────
// MAIN SEED RUNNER
// ─────────────────────────────────────────────────────────────
async function seedB2BContextConfigs() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await connectDB();

        let seeded = 0, skipped = 0;

        for (const { slug, config } of PRODUCT_B2B_CONFIGS) {
            const product = await Product.findOne({ slug }).lean();

            if (!product) {
                console.log(`  ⚠️  Product NOT FOUND: slug="${slug}" — skipping`);
                skipped++;
                continue;
            }

            const result = await B2BProductConfig.updateOne(
                { product: product._id },
                { $set: { product: product._id, ...config } },
                { upsert: true }
            );

            const action = result.upsertedCount > 0 ? "✅ CREATED" : "🔄 UPDATED";
            const ctxKeys = config.contexts.map(c => c.contextKey).join(", ");
            const totalCustomizations = config.contexts.reduce((sum, c) => sum + (c.customizationOptions?.length || 0), 0);
            const totalTiers = config.contexts.reduce((sum, c) => sum + (c.tiers?.length || 0), 0);

            console.log(`\n${action} B2BProductConfig for: "${product.name}" (slug: ${slug})`);
            console.log(`   Events/Contexts: ${ctxKeys}`);
            console.log(`   Total context tiers configured: ${totalTiers}`);
            console.log(`   Total context customizations: ${totalCustomizations}`);
            seeded++;
        }

        console.log(`\n${"═".repeat(50)}`);
        console.log(`SEED COMPLETE: ${seeded} product(s) configured, ${skipped} skipped (slug not found).`);
        console.log(`\nProducts will now respond to these context query params:`);
        console.log("  GET /api/b2b/products/:slug?context=corporate");
        console.log("  GET /api/b2b/products/:slug?context=anniversary");
        console.log("  GET /api/b2b/products/:slug?context=wedding");
        console.log("  GET /api/b2b/products/:slug?context=festive");
        console.log("  GET /api/b2b/products/:slug?context=employee-onboarding");
        console.log("  GET /api/b2b/products/:slug  (no context = global default)");
        console.log(`${"═".repeat(50)}\n`);

        process.exit(0);
    } catch (err) {
        console.error("\n❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seedB2BContextConfigs();
