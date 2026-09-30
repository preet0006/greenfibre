import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config();

const smallCutleryData = {
    name: "Small cutlery",
    slug: "small-cutlery",
    sku: "GF-TW-001",
    categoryName: "Kitchen ware",
    subCategory: null,
    unit: "set",

    tagline: "Earth-friendly small cutlery made with rice husk",
    shortDescription: "Small 6-inch cutlery made with rice husk biocomposite.",
    description:
        "Earth-friendly reusable small cutlery made with rice husk biocomposite. Lightweight, durable and designed for everyday dining and convenient use.",

    image: "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571033/ChatGPT_Image_Sep_27_2026_10_54_20_PM-4_u6jj73.png",
    images: [
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571033/ChatGPT_Image_Sep_27_2026_10_54_20_PM-4_u6jj73.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571026/ChatGPT_Image_Sep_27_2026_10_54_19_PM-3_ct62e4.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571022/ChatGPT_Image_Sep_27_2026_10_54_15_PM-1_kwjwsz.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571022/ChatGPT_Image_Sep_27_2026_10_54_17_PM-2_wmtf0d.png",
    ],

    originalPrice: 799,
    discountedPrice: 599,
    b2cPrice: 599,
    b2bPrice: 399,
    moq: 100,

    leadTime: "7 - 10 business days",
    branding: true,
    brandingTypes: ["Custom Logo Printing", "Custom Packaging", "Custom Belly Band"],

    colours: ["Off white"],
    colors: [
        {
            name: "Off white",
            hex: "#F2EEE2",
            images: [
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571033/ChatGPT_Image_Sep_27_2026_10_54_20_PM-4_u6jj73.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571026/ChatGPT_Image_Sep_27_2026_10_54_19_PM-3_ct62e4.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571022/ChatGPT_Image_Sep_27_2026_10_54_15_PM-1_kwjwsz.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790571022/ChatGPT_Image_Sep_27_2026_10_54_17_PM-2_wmtf0d.png",
            ],
            stock: 2500,
        },
    ],
    color: "Off white",
    size: "6 inch",
    material: "Rice Husk Biocomposite",

    specs: {
        "Set Contents": "Small cutlery",
        "Material": "Rice Husk Biocomposite",
        "Color": "Off white",
        "Size": "6 inch",
        "Product Weight": "15 gm",
        "Product Length": "15.5 cm",
        "Product Width": "3.5 cm",
        "Product Height": "2.5 cm",
        "Dishwasher Safe": "Yes",
        "Microwave Safe": "Yes",
        "Food Contact Safe": "Yes",
        "Reusable": "Yes",
        "Eco Friendly": "Yes",
    },

    productFeatures: [
        "Made with rice husk biocomposite",
        "Food contact safe",
        "Dishwasher safe",
        "Microwave suitable",
        "Lightweight",
        "Reusable",
        "Eco-friendly",
    ],

    collectionName: "",
    popular: true,
    stockQuantity: 2500,

    productWeight: {
        value: 15,
        unit: "gm",
    },

    dimensions: {
        length: 15.5,
        width: 3.5,
        height: 2.5,
        unit: "cm",
    },

    package: {
        contents: "Small cutlery",
        type: "Eco Box",
        giftBoxImages: [],
        itemsPerPackage: "1 Set",
        countryOfOrigin: "India",
        deadWeight: "20 gm",
        length: "16 cm",
        width: "4 cm",
        height: "3 cm",
        packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
    },

    giftSetContents: {
        totalProductTypes: 0,
        products: [],
    },

    giftPackaging: {
        available: false,
        images: [],
        title: "",
        description: "",
        pricePerBox: 0,
        customBrandingAvailable: false,
    },

    careInstructions:
        "Avoid harsh scrubs and strong chemicals. Avoid excessive heat and direct sunlight. Wash gently during hand washing.",

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

    isActive: true,
    isFeatured: true,

    tags: [
        "smallCutlery",
        "riceHusk",
        "ecoFriendly",
        "kitchenWare",
        "reusable",
        "dishwasherSafe",
        "offWhite",
    ],

    metaTitle: "Small Cutlery (6 inch) | Rice Husk Biocomposite | Greenfibre",
    metaDescription: "Small 6-inch cutlery made with rice husk biocomposite. Lightweight, durable and reusable.",
    metaKeywords: [
        "smallCutlery",
        "riceHusk",
        "ecoFriendly",
        "kitchenWare",
        "reusable",
        "dishwasherSafe",
        "offWhite",
    ],

    // B2B Config Data
    b2bConfig: {
        isEnabled: true,
        basePrice: 399,
        moq: 100,
        stepQuantity: 10,
        sampleAvailable: true,
        samplePrice: 499,
        customizationNotes: "Screen printing, custom packaging, and custom belly band options available for wholesale orders.",
        adminNotes: "Lead time: 7-10 business days.",
        customizationOptions: [
            {
                key: "custom_logo_printing",
                label: "Custom Logo Printing",
                description: "Corporate logo printed on cutlery handle / packaging",
                type: "print",
                isPriced: true,
                pricePerUnit: 10,
                moq: 100,
                additionalLeadTime: "2 business days",
                isActive: true,
            },
            {
                key: "custom_packaging",
                label: "Custom Packaging",
                description: "Custom branded box packaging for cutlery sets",
                type: "packaging",
                isPriced: true,
                pricePerUnit: 20,
                moq: 100,
                additionalLeadTime: "2 business days",
                isActive: true,
            },
            {
                key: "custom_belly_band",
                label: "Custom Belly Band",
                description: "Full-color paper sleeve / belly band wrapped around packaging",
                type: "packaging",
                isPriced: true,
                pricePerUnit: 15,
                moq: 100,
                additionalLeadTime: "2 business days",
                isActive: true,
            },
        ],
        tiers: [
            {
                tierLabel: "Starter Bulk",
                minQty: 100,
                maxQty: 299,
                unitPrice: 399,
                discountPercentage: 50,
                popular: false,
                leadTime: "7 - 10 business days",
                benefits: [
                    "50% Wholesale Savings vs Retail",
                    "Standard QC Inspection",
                    "Eco-friendly Packaging",
                ],
                enabledCustomizationKeys: ["custom_logo_printing"],
                customizationPriceOverrides: [],
                dedicatedAccountManager: false,
                freeSampleIncluded: false,
            },
            {
                tierLabel: "Corporate Recommended",
                minQty: 300,
                maxQty: 999,
                unitPrice: 359,
                discountPercentage: 55,
                popular: true,
                leadTime: "7 - 10 business days",
                benefits: [
                    "55% Wholesale Savings vs Retail",
                    "FREE Custom Logo Printing",
                    "Priority Processing & Support",
                ],
                enabledCustomizationKeys: [
                    "custom_logo_printing",
                    "custom_packaging",
                    "custom_belly_band",
                ],
                customizationPriceOverrides: [
                    {
                        optionKey: "custom_logo_printing",
                        pricePerUnit: 0,
                        isFree: true,
                    },
                ],
                dedicatedAccountManager: true,
                freeSampleIncluded: false,
            },
            {
                tierLabel: "Enterprise Direct",
                minQty: 1000,
                maxQty: null,
                unitPrice: 319,
                discountPercentage: 60,
                popular: false,
                leadTime: "10 - 14 business days",
                benefits: [
                    "60% Wholesale Savings vs Retail",
                    "FREE Custom Logo Printing + FREE Belly Band",
                    "Pre-production physical sample included",
                    "Dedicated Account Manager",
                ],
                enabledCustomizationKeys: [
                    "custom_logo_printing",
                    "custom_packaging",
                    "custom_belly_band",
                ],
                customizationPriceOverrides: [
                    {
                        optionKey: "custom_logo_printing",
                        pricePerUnit: 0,
                        isFree: true,
                    },
                    {
                        optionKey: "custom_belly_band",
                        pricePerUnit: 0,
                        isFree: true,
                    },
                ],
                dedicatedAccountManager: true,
                freeSampleIncluded: true,
            },
        ],
    },
};

const insertSmallCutlery = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category "Kitchen ware"
        let category = await Category.findOne({
            $or: [
                { name: /^Kitchen\s*ware$/i },
                { slug: "kitchen-ware" },
                { name: "Kitchen ware" },
                { slug: "kitchen-and-dining" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Kitchen ware",
                slug: "kitchen-ware",
                description: "Sustainable kitchenware and dining essentials made with biocomposite materials.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload
        const productPayload = {
            name: smallCutleryData.name,
            slug: smallCutleryData.slug,
            sku: smallCutleryData.sku,
            unit: smallCutleryData.unit,
            tagline: smallCutleryData.tagline,
            shortDescription: smallCutleryData.shortDescription,
            description: smallCutleryData.description,
            category: category._id,
            subCategory: null,
            size: smallCutleryData.size,
            material: smallCutleryData.material,
            color: smallCutleryData.color,
            colors: smallCutleryData.colors,
            images: smallCutleryData.images,
            specs: smallCutleryData.specs,
            features: smallCutleryData.specs,
            productFeatures: smallCutleryData.productFeatures,
            collectionName: smallCutleryData.collectionName,
            stockQuantity: smallCutleryData.stockQuantity,
            productWeight: smallCutleryData.productWeight,
            dimensions: smallCutleryData.dimensions,
            package: smallCutleryData.package,
            giftSetContents: smallCutleryData.giftSetContents,
            giftPackaging: smallCutleryData.giftPackaging,
            careInstructions: smallCutleryData.careInstructions,
            sustainability: smallCutleryData.sustainability,
            tax: smallCutleryData.tax,
            tags: smallCutleryData.tags,
            originalPrice: smallCutleryData.originalPrice,
            discountedPrice: smallCutleryData.discountedPrice,
            b2cPrice: smallCutleryData.b2cPrice,
            b2bPrice: smallCutleryData.b2bPrice,
            leadTime: smallCutleryData.leadTime,
            branding: smallCutleryData.branding,
            brandingTypes: smallCutleryData.brandingTypes,
            popular: smallCutleryData.popular,
            isActive: smallCutleryData.isActive,
            isFeatured: smallCutleryData.isFeatured,
            metaTitle: smallCutleryData.metaTitle,
            metaDescription: smallCutleryData.metaDescription,
            metaKeywords: smallCutleryData.metaKeywords,
        };

        // 3. Upsert Product
        const product = await Product.findOneAndUpdate(
            { slug: productPayload.slug },
            productPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`📦 Product saved: ${product.name} (ID: ${product._id}, Slug: ${product.slug})`);

        // 4. Prepare B2BProductConfig
        const b2bConfigPayload = {
            product: product._id,
            ...smallCutleryData.b2bConfig,
        };

        const b2bConfig = await B2BProductConfig.findOneAndUpdate(
            { product: product._id },
            b2bConfigPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`💼 B2B Product Config saved for: ${product.name} (Config ID: ${b2bConfig._id})`);

        console.log("\n=================================================");
        console.log("             INSERTION SUMMARY");
        console.log("=================================================");
        console.log(`Product ID:          ${product._id}`);
        console.log(`Product Name:        ${product.name}`);
        console.log(`SKU:                 ${product.sku}`);
        console.log(`Product Slug:        ${product.slug}`);
        console.log(`Category:            ${category.name} (${category.slug})`);
        console.log(`Retail Price:        ₹${product.discountedPrice} (MRP ₹${product.originalPrice})`);
        console.log(`B2B Base Price:      ₹${b2bConfig.basePrice}`);
        console.log(`B2B MOQ:             ${b2bConfig.moq} sets (Step: ${b2bConfig.stepQuantity})`);
        console.log(`Sample Price:        ₹${b2bConfig.samplePrice}`);
        console.log(`Colors:              ${product.colors.map((c) => `${c.name} (${c.stock} stock, ${c.images.length} imgs)`).join(", ")}`);
        console.log(`Total Stock:         ${product.totalStock} units`);
        console.log(`Images Count:        ${product.images.length}`);
        console.log(`Tiers Count:         ${b2bConfig.tiers.length} volume tiers`);
        b2bConfig.tiers.forEach((t) => {
            const range = t.maxQty ? `${t.minQty} - ${t.maxQty}` : `${t.minQty}+`;
            console.log(`   • Tier "${t.tierLabel}": ${range} sets @ ₹${t.unitPrice}/set (${t.discountPercentage}% off)`);
        });
        console.log(`Customizations:      ${b2bConfig.customizationOptions.map((c) => c.label).join(", ")}`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Small cutlery product inserted successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Small cutlery:", err);
        process.exit(1);
    }
};

insertSmallCutlery();
