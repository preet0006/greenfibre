import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config();

const canisterRawData = {
    name: "Canister",
    slug: "canister",
    sku: "",
    categoryName: "Storage",
    subCategory: null,
    unit: "set",

    tagline: "Earth-friendly airtight canisters made with rice husk & bamboo fibres",
    shortDescription: "Set of 2 airtight storage canisters, 700 ml each, unbreakable, made with rice husk & bamboo fibres.",
    description: "Canister Storage Container Set of 2 with airtight lids, 700 ml each, crafted from BioDur biocomposite made with rice husk and bamboo fibres. Earth friendly, climate positive, unbreakable and food contact safe, these lightweight canisters are ideal for storing dry foods and essentials in your kitchen.",

    image: "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_50_PM-2_dr8sli.png",
    images: [
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_50_PM-2_dr8sli.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_52_PM-3_eqcptw.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_48_PM-1_lxc1f2.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579452/ChatGPT_Image_Sep_28_2026_12_36_58_PM-5_isjpmv.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579453/ChatGPT_Image_Sep_28_2026_12_36_56_PM-4_nrh01w.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570705/1_b6tkuj.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570706/2_ogxaas.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570707/3_bnflhm.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570721/4_g7ydgb.png",
        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570722/5_khbaeu.png",
    ],

    price: null,
    retailPrice: null,
    originalPrice: 0,
    discountedPrice: 0,
    b2cPrice: null,
    b2bPrice: null,
    moq: 1,

    b2bEnabled: true,
    tiers: [],
    b2bConfig: null,

    leadTime: "7 - 10 business days",
    branding: false,
    brandingTypes: [],

    colours: ["Off white", "Charcoal"],
    colors: [
        {
            name: "Off white",
            hex: "#F2EEE2",
            images: [
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_50_PM-2_dr8sli.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_52_PM-3_eqcptw.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579451/ChatGPT_Image_Sep_28_2026_12_36_48_PM-1_lxc1f2.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579452/ChatGPT_Image_Sep_28_2026_12_36_58_PM-5_isjpmv.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790579453/ChatGPT_Image_Sep_28_2026_12_36_56_PM-4_nrh01w.png",
            ],
            stock: 450,
        },
        {
            name: "Charcoal",
            hex: "#36454F",
            images: [
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570705/1_b6tkuj.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570706/2_ogxaas.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570707/3_bnflhm.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570721/4_g7ydgb.png",
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790570722/5_khbaeu.png",
            ],
            stock: 450,
        },
    ],
    color: "Off white, Charcoal",
    size: "700 ml",
    material: "Rice Husk & Bamboo Fibre Biocomposite",

    specs: {
        "Set Contents": "2 Canisters with airtight lids",
        "Material": "Rice Husk & Bamboo Fibre Biocomposite",
        "Color": "Off white, Charcoal",
        "Capacity": "700 ml each",
        "Product Weight": "120 gm",
        "Product Length": "11.5 cm",
        "Product Width": "8 cm",
        "Product Height": "11.5 cm",
        "Airtight Lid": "Yes",
        "Food Contact Safe": "Yes",
        "Heat Resistance": "Up to 100°C (TUV tested)",
        "BPA Free": "Yes",
        "Unbreakable": "Yes",
        "Reusable": "Yes",
        "Eco Friendly": "Yes",
    },

    productFeatures: [
        "Airtight lid for kitchen storage",
        "Made with rice husk & bamboo fibres (BioDur biocomposite)",
        "Earth friendly – crafted from waste materials",
        "Climate positive – crop-waste locks biogenic carbon",
        "Unbreakable – lightweight & impact-resistant",
        "Food contact safe – tested & certified safe up to 100°C by TUV",
        "Non-toxic & safe – free from BPA",
        "UV stabilized",
        "Reusable",
    ],

    collectionName: "",
    popular: false,
    stockQuantity: 900,

    productWeight: {
        value: 120,
        unit: "gm",
    },

    dimensions: {
        length: 11.5,
        width: 8,
        height: 11.5,
        unit: "cm",
    },

    package: {
        contents: "Canister x 2",
        type: "Eco Box",
        giftBoxImages: [],
        itemsPerPackage: "1 Set (2 Canisters)",
        countryOfOrigin: "India",
        deadWeight: "260 gm",
        length: "12 cm",
        width: "9 cm",
        height: "24 cm",
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
        "Avoid harsh scrubs during hand wash. Avoid toxic & strong chemicals. Avoid excess heat & direct sunlight. Product is UV stabilized, but for longer use, avoid direct sunlight. Made with natural fibres; for prolonged usage follow the above.",

    sustainability: {
        madeWith:
            "BioDur biocomposite using crop-waste (rice husk, bamboo fibres) with food contact binders & additives",
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
        "canister",
        "storageContainer",
        "airtight",
        "riceHusk",
        "bamboo",
        "ecoFriendly",
        "unbreakable",
        "kitchenStorage",
        "reusable",
        "setOf2",
    ],

    isActive: true,
    isFeatured: false,
    metaTitle: "Canister Storage Container Set of 2 (700 ml) | Greenfibre",
    metaDescription:
        "Set of 2 airtight storage canisters, 700 ml each, unbreakable, made with rice husk & bamboo fibres.",
    metaKeywords: [
        "canister",
        "storageContainer",
        "airtight",
        "riceHusk",
        "bamboo",
        "ecoFriendly",
        "unbreakable",
        "kitchenStorage",
        "reusable",
        "setOf2",
    ],
};

const insertCanisterProduct = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category "Storage"
        let category = await Category.findOne({
            $or: [{ slug: "storage" }, { name: "Storage" }, { slug: "storage-and-baskets" }],
        });

        if (!category) {
            category = await Category.create({
                name: "Storage",
                slug: "storage",
                description: "Eco-friendly sustainable storage containers and canisters.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload
        const productPayload = {
            name: canisterRawData.name,
            slug: canisterRawData.slug,
            unit: canisterRawData.unit,
            tagline: canisterRawData.tagline,
            shortDescription: canisterRawData.shortDescription,
            description: canisterRawData.description,
            category: category._id,
            subCategory: null,
            size: canisterRawData.size,
            material: canisterRawData.material,
            color: canisterRawData.color,
            colors: canisterRawData.colors,
            images: canisterRawData.images,
            specs: canisterRawData.specs,
            features: canisterRawData.specs,
            productFeatures: canisterRawData.productFeatures,
            collectionName: canisterRawData.collectionName,
            stockQuantity: canisterRawData.stockQuantity,
            productWeight: canisterRawData.productWeight,
            dimensions: canisterRawData.dimensions,
            package: canisterRawData.package,
            giftSetContents: canisterRawData.giftSetContents,
            giftPackaging: canisterRawData.giftPackaging,
            careInstructions: canisterRawData.careInstructions,
            sustainability: canisterRawData.sustainability,
            tax: canisterRawData.tax,
            tags: canisterRawData.tags,
            originalPrice: canisterRawData.originalPrice,
            discountedPrice: canisterRawData.discountedPrice,
            b2cPrice: canisterRawData.b2cPrice,
            b2bPrice: canisterRawData.b2bPrice,
            leadTime: canisterRawData.leadTime,
            branding: canisterRawData.branding,
            brandingTypes: canisterRawData.brandingTypes,
            popular: canisterRawData.popular,
            isActive: canisterRawData.isActive,
            isFeatured: canisterRawData.isFeatured,
            metaTitle: canisterRawData.metaTitle,
            metaDescription: canisterRawData.metaDescription,
            metaKeywords: canisterRawData.metaKeywords,
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
            isEnabled: true,
            basePrice: null,
            moq: 1,
            stepQuantity: 1,
            sampleAvailable: true,
            samplePrice: null,
            customizationNotes: "Airtight canister set of 2 made with BioDur rice husk & bamboo fibre composite.",
            adminNotes: "Lead time: 7-10 business days.",
            customizationOptions: [],
            tiers: [],
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
        console.log(`Product Slug:        ${product.slug}`);
        console.log(`Category:            ${category.name} (${category.slug})`);
        console.log(`Colors:              ${product.colors.map((c) => `${c.name} (${c.stock} stock, ${c.images.length} imgs)`).join(", ")}`);
        console.log(`Total Stock:         ${product.totalStock} units`);
        console.log(`Images Count:        ${product.images.length}`);
        console.log(`B2B Config ID:       ${b2bConfig._id}`);
        console.log(`B2B isEnabled:       ${b2bConfig.isEnabled}`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Operation completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Canister product:", err);
        process.exit(1);
    }
};

insertCanisterProduct();
