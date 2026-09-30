import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedVioraWaterBottle = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category
        let category = await Category.findOne({
            $or: [{ slug: "bottle" }, { name: "Bottle" }, { slug: "drinkware" }],
        });

        if (!category) {
            category = await Category.create({
                name: "Bottle",
                slug: "bottle",
                description: "Eco-friendly sustainable drinkware and bottles made with biocomposite materials.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Data (Clean Base Product for B2C & Catalog)
        const productPayload = {
            name: "Viora Water Bottle",
            slug: "viora-water-bottle",
            unit: "piece",
            tagline: "Earth-friendly water bottle with stainless steel inner, made with rice husk",
            shortDescription: "400 ml water bottle with stainless steel inner, made with rice husk. For office, adults & school kids.",
            description:
                "Viora Water Bottle, 400 ml, with a stainless steel inner and an outer body crafted from BioDur rice husk biocomposite. Earth friendly, climate positive and food contact safe, this lightweight, impact-resistant bottle is ideal for office, school and everyday use by adults and kids.",
            category: category._id,
            subCategory: null,
            size: "400 ml",
            material: "Rice Husk Biocomposite with Stainless Steel Inner",
            color: "Parrot green, Orange",
            colors: [
                {
                    name: "Parrot green",
                    hex: "#5CB85C",
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574768/ChatGPT_Image_Sep_28_2026_10_45_44_AM_evaplq.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/ChatGPT_Image_Sep_28_2026_10_46_17_AM-2_ryelck.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/Untitled_-_September_28_2026_at_10.56.17-2_nhsjmb.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/Untitled_-_September_28_2026_at_10.56.17-1_1_n4dfxt.png",
                    ],
                    stock: 350,
                },
                {
                    name: "Orange",
                    hex: "#F28C28",
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_09_44_AM-3_cwpriv.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_09_49_AM-5_qloftp.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_14_57_AM_vqoz0a.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_14_50_AM_lnkina.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574888/Untitled_-_September_28_2026_at_11.11.23_yjvpgu.png",
                    ],
                    stock: 350,
                },
            ],
            images: [
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574768/ChatGPT_Image_Sep_28_2026_10_45_44_AM_evaplq.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/ChatGPT_Image_Sep_28_2026_10_46_17_AM-2_ryelck.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/Untitled_-_September_28_2026_at_10.56.17-2_nhsjmb.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574769/Untitled_-_September_28_2026_at_10.56.17-1_1_n4dfxt.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_09_44_AM-3_cwpriv.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_09_49_AM-5_qloftp.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_14_57_AM_vqoz0a.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574884/ChatGPT_Image_Sep_28_2026_11_14_50_AM_lnkina.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790574888/Untitled_-_September_28_2026_at_11.11.23_yjvpgu.png",
            ],
            specs: {
                "Set Contents": "1 Water bottle",
                "Material": "Rice Husk Biocomposite with Stainless Steel Inner",
                "Color": "Parrot green, Orange",
                "Capacity": "400 ml",
                "Product Weight": "255 gm",
                "Product Length": "7.5 cm",
                "Product Width": "7.5 cm",
                "Product Height": "20.5 cm",
                "Food Contact Safe": "Yes",
                "BPA Free": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
            },
            productFeatures: [
                "Stainless steel inner",
                "Made with rice husk biocomposite (BioDur)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Food contact safe – tested & certified safe up to 100°C by TUV",
                "Lightweight & impact-resistant",
                "Non-toxic & safe – free from BPA",
                "UV stabilized",
                "Suitable for office, adults & school kids",
                "Reusable",
            ],
            stockQuantity: 700,
            productWeight: {
                value: 255,
                unit: "gm",
            },
            dimensions: {
                length: 7.5,
                width: 7.5,
                height: 20.5,
                unit: "cm",
            },
            package: {
                contents: "Water bottle x 1",
                type: "Corrugated Box",
                giftBoxImages: [],
                itemsPerPackage: "1",
                countryOfOrigin: "India",
                deadWeight: "280 gm",
                length: "8 cm",
                width: "8 cm",
                height: "21.5 cm",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
            },
            giftSetContents: {
                totalProductTypes: 0,
                products: [],
            },
            giftPackaging: {
                available: true,
                images: [],
                title: "Eco Kraft Gift Box",
                description: "Sustainable branded gift box for corporate onboarding & client gifting.",
                pricePerBox: 30,
                customBrandingAvailable: true,
            },
            careInstructions:
                "Avoid harsh scrubs during hand wash. Avoid toxic & strong chemicals. Avoid excess heat & direct sunlight. Product is UV stabilized, but for longer use, avoid direct sunlight. Made with natural fibres; for prolonged usage follow the above.",
            sustainability: {
                madeWith: "BioDur biocomposite using crop-waste (rice husk) with food contact binders & additives",
                highlights: [
                    "Reduce CO2 emissions",
                    "Reduce waste disposal",
                    "Reduce crop burning",
                    "Reduce fossil dependency",
                    "QR code with every purchase showing the sustainability footprint of your product",
                ],
            },
            tax: {
                hsnCode: "392410",
                gstRate: 18,
                isTaxInclusive: true,
            },
            tags: [
                "Viora",
                "waterBottle",
                "stainlessSteelInner",
                "riceHusk",
                "ecoFriendly",
                "officeBottle",
                "schoolBottle",
                "reusable",
                "parrotGreen",
                "orange",
            ],
            originalPrice: 899,
            discountedPrice: 599,
            b2cPrice: 599,
            b2bPrice: 280,
            isActive: true,
            isFeatured: true,
        };

        // Upsert Product
        const product = await Product.findOneAndUpdate(
            { slug: productPayload.slug },
            productPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`📦 Product saved: ${product.name} (ID: ${product._id})`);

        // 3. Prepare B2BProductConfig (Dedicated wholesale schema)
        const b2bConfigPayload = {
            product: product._id,
            isEnabled: true,
            basePrice: 280,
            moq: 25,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 350,
            customizationNotes: "Silk-screen logo printing, UV printing, laser engraving, and custom sleeve options available.",
            adminNotes: "Lead time: 5-7 business days for unbranded, 7-10 business days with custom branding.",
            // Full menu of customizations for Viora Water Bottle
            customizationOptions: [
                {
                    key: "logo_print",
                    label: "Single Color Logo Screen Print",
                    description: "High-precision screen print with corporate logo on the outer body",
                    type: "print",
                    isPriced: true,
                    pricePerUnit: 15,
                    moq: 25,
                    additionalLeadTime: "2 business days",
                    notes: "Vector format (.ai, .svg, .eps) required. Max print area: 4cm x 8cm.",
                    isActive: true,
                },
                {
                    key: "laser_engraving",
                    label: "Laser Engraving on Lid / Steel",
                    description: "Permanent crisp laser etching on the stainless steel inner rim or metallic cap",
                    type: "engraving",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 50,
                    additionalLeadTime: "2 business days",
                    notes: "Clean monochrome finish, will never fade or peel.",
                    isActive: true,
                },
                {
                    key: "custom_gift_sleeve",
                    label: "Custom Branded Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the eco gift box",
                    type: "packaging",
                    isPriced: true,
                    pricePerUnit: 30,
                    moq: 50,
                    additionalLeadTime: "3 business days",
                    notes: "Custom artwork template provided upon order confirmation.",
                    isActive: true,
                },
            ],
            // Volume pricing tiers
            tiers: [
                {
                    tierLabel: "Starter Bulk",
                    minQty: 25,
                    maxQty: 99,
                    unitPrice: 280,
                    discountPercentage: 53,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    benefits: [
                        "53% Wholesale Savings vs Retail",
                        "Standard QC Inspection",
                        "Individual Box Packaging",
                    ],
                    enabledCustomizationKeys: ["logo_print", "laser_engraving"],
                    customizationPriceOverrides: [],
                    dedicatedAccountManager: false,
                    freeSampleIncluded: false,
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 100,
                    maxQty: 499,
                    unitPrice: 240,
                    discountPercentage: 60,
                    popular: true,
                    leadTime: "7 - 10 business days",
                    benefits: [
                        "60% Wholesale Savings vs Retail",
                        "FREE 1-Color Corporate Logo Printing",
                        "Free Digital Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print", "laser_engraving", "custom_gift_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print",
                            pricePerUnit: 0,
                            isFree: true, // Free logo printing at 100+ units!
                        },
                    ],
                    dedicatedAccountManager: true,
                    freeSampleIncluded: false,
                },
                {
                    tierLabel: "Enterprise Direct",
                    minQty: 500,
                    maxQty: null,
                    unitPrice: 195,
                    discountPercentage: 67,
                    popular: false,
                    leadTime: "10 - 14 business days",
                    benefits: [
                        "67% Wholesale Savings vs Retail",
                        "FREE Custom Logo Printing + FREE Gift Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                        "Custom Pantone Accent Options",
                    ],
                    enabledCustomizationKeys: ["logo_print", "laser_engraving", "custom_gift_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                        {
                            optionKey: "custom_gift_sleeve",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                    dedicatedAccountManager: true,
                    freeSampleIncluded: true,
                },
            ],
        };

        // Upsert B2BProductConfig
        const b2bConfig = await B2BProductConfig.findOneAndUpdate(
            { product: product._id },
            b2bConfigPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`💼 B2B Product Config saved for: ${product.name} (Config ID: ${b2bConfig._id})`);

        console.log("\n=================================================");
        console.log("             SEED SUMMARY & VERIFICATION");
        console.log("=================================================");
        console.log(`Product Name:        ${product.name}`);
        console.log(`Product Slug:        ${product.slug}`);
        console.log(`Category:            ${category.name} (${category.slug})`);
        console.log(`Color Variants:      ${product.colors.map((c) => c.name).join(", ")}`);
        console.log(`Total Stock:         ${product.totalStock} units`);
        console.log(`B2B MOQ:             ${b2bConfig.moq} units`);
        console.log(`B2B Base Price:      ₹${b2bConfig.basePrice}`);
        console.log(`Tiers Count:         ${b2bConfig.tiers.length} volume tiers`);
        b2bConfig.tiers.forEach((t) => {
            const range = t.maxQty ? `${t.minQty} - ${t.maxQty}` : `${t.minQty}+`;
            console.log(`   • Tier "${t.tierLabel}": ${range} units @ ₹${t.unitPrice}/pc (${t.discountPercentage}% off)`);
        });
        console.log(`Customizations:      ${b2bConfig.customizationOptions.map((c) => c.label).join(", ")}`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Viora Water Bottle:", err);
        process.exit(1);
    }
};

seedVioraWaterBottle();
