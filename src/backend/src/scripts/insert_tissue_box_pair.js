import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedTissueBoxPair = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category
        let category = await Category.findOne({
            $or: [
                { slug: "tableware" },
                { name: "Tableware" },
                { slug: "home-office-decor" },
                { name: "Home & Office Decor" },
                { slug: "kitchen-dining" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Tableware",
                slug: "tableware",
                description: "Eco-friendly sustainable tableware and tabletop accessories crafted from biocomposites.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Pair of 2 Tissue Boxes)
        const productPayload = {
            name: "Tissue Box - Pair of 2",
            slug: "tissue-box-pair-of-2",
            sku: "GF-TISSUE-BOX-PAIR",
            unit: "pair",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly rectangular tabletop tissue dispensers made from biocomposite crop waste",
            shortDescription: "Pair of 2 sustainable, weather-proof tissue dispenser boxes crafted from BioDur biocomposite. Durable, impact-resistant, and climate positive.",
            description:
                "Tissue Box – Pair of 2, crafted from BioDur biocomposite using agricultural crop waste (rice husk, coffee husk, bamboo fibres) with recycled binders. Weather-proof, UV-stabilized, impact-resistant and climate positive, this pair of minimal dispensers keeps dining tables, office desks, and countertops tidy while reducing your carbon footprint.",

            productFeatures: [
                "Earth Friendly – crafted from waste materials, conserves resources, prevents pollution",
                "Climate Positive – crop-waste used locks biogenic carbon and reduces CO2 footprint",
                "Weather Proof – suitable for indoor and outdoor use with UV and moisture resilience",
                "Versatile & Durable – lightweight & impact-resistant, perfect alternative to plastic, glass, melamine & ceramic",
                "Fits standard rectangular facial tissue refill packs",
                "Anti-slip weighted base prevents shifting during use",
            ],

            material: "BioDur Biocomposite (Rice Husk, Coffee Husk, Bamboo Fibres, Recycled Binders & Additives)",
            collectionName: "BioDur Tabletop Collection",
            size: "18.5 × 12 × 8 cm",
            color: "Off white, Coffee",

            colors: [
                {
                    name: "Off white",
                    hex: "#F2EEE2",
                    stock: 100,
                    images: [
                        "/products/velvata-tissue-box.jpg",
                    ],
                },
                {
                    name: "Coffee",
                    hex: "#6F4E37",
                    stock: 100,
                    images: [
                        "/products/velvata-tissue-box.jpg",
                    ],
                },
            ],

            images: [
                "/products/velvata-tissue-box.jpg",
            ],

            specs: {
                "Set Contents": "2 Tissue boxes",
                "Material": "BioDur Biocomposite",
                "Color": "Off white, Coffee",
                "Product Weight": "520 gm per pair (260 gm per box)",
                "Product Length": "18.5 cm",
                "Product Width": "12 cm",
                "Product Height": "8 cm",
                "Weather Proof": "Yes",
                "UV Resistant": "Yes",
                "Eco Friendly": "Yes",
                "Climate Positive": "Yes",
                "Carbon Negative": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 999,
            discountedPrice: 699,
            b2cPrice: 699,
            b2bPrice: 380,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 200,

            productWeight: {
                value: 520,
                unit: "gm",
            },

            dimensions: {
                length: 18.5,
                width: 12.0,
                height: 8.0,
                unit: "cm",
            },

            package: {
                contents: "Tissue Box x 2, Info Card with QR, Free Gift",
                type: "Renewable & recycled materials, minimal packaging",
                deadWeight: "600 gm",
                length: "20 cm",
                width: "14 cm",
                height: "17 cm",
                itemsPerPackage: "1 Pair (2 Tissue Boxes)",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Tabletop Gift Box",
                description: "Sleek corrugated kraft gift packaging with custom branding sleeve.",
                pricePerBox: 40,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Wipe clean with a soft damp cloth. Avoid abrasive scrubbers and harsh solvent chemicals. UV stabilized for long-term indoor and outdoor display.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste (rice husk, coffee husk, bamboo fibres), recycled binders (e.g. recycled PP) and additives (e.g. compatibilizers)",
                highlights: [
                    "Earth Friendly – crafted from waste materials, conserves resources, prevents pollution",
                    "Climate Positive – crop-waste used locks biogenic carbon and reduces CO2 footprint",
                    "Weather Proof – suitable for indoor and outdoor use with UV and moisture resilience",
                    "Versatile & Durable – lightweight & impact-resistant, alternative to plastic, glass, melamine & ceramic",
                    "Fully Carbon-Negative – certified carbon negative and climate positive",
                    "Responsibly sourced from Farmer, Factory, Forest – prevents crop burning, pollution & wildfires",
                    "Made with circular economy principles – reduces CO2 emissions, waste disposal, crop burning & fossil dependency",
                    "QR code with every purchase showing the sustainability footprint of your product",
                ],
                impactStats: {
                    co2Reduced: "1000 Tons (comparable to 700 cars in a year)",
                    wasteUpcycled: "350 Tons (India landfills 31M tons of solid waste/year)",
                    cropWasteUsed: "300 Tons (comparable to preventing 125 acres of crop-burning)",
                    fossilPlasticReduced: "400 Tons (comparable to what 26,000 adults consume in plastic/year in India)",
                },
            },

            tax: {
                hsnCode: "392410",
                gstRate: 18,
                isTaxInclusive: true,
            },

            popular: false,
            isActive: true,
            isFeatured: false,

            tags: [
                "tissueBox",
                "pairOf2",
                "tableware",
                "ecoFriendly",
                "climatePositive",
                "carbonNegative",
                "biocomposite",
                "weatherProof",
                "versatile",
            ],
        };

        // 3. Upsert Product in MongoDB
        const product = await Product.findOneAndUpdate(
            { slug: productPayload.slug },
            productPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`📦 Product saved: ${product.name} (ID: ${product._id})`);

        // 4. Prepare B2B Wholesale Config
        const b2bConfigPayload = {
            product: product._id,
            isEnabled: true,
            basePrice: 380,
            moq: 15,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 499,
            customizationNotes: "Precision screen print or laser logo on front or top lid. Vector artwork (.ai, .svg) required.",
            adminNotes: "Standard lead time 5-7 days. Express dispatch available for corporate gifting orders.",

            customizationOptions: [
                {
                    key: "logo_print_tissue_box",
                    label: "Single Color Screen Print on Both Boxes",
                    description: "High-precision screen print with corporate logo on both tissue boxes",
                    type: "print",
                    tag: "Logo Print",
                    badge: "Popular",
                    icon: "palette",
                    isPriced: true,
                    pricePerUnit: 20,
                    moq: 15,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "laser_engrave_tissue_box",
                    label: "Laser Etched Logo on Both Boxes",
                    description: "Crisp permanent laser etching on lid or front panel",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 30,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_kraft_sleeve",
                    label: "Custom Branded Gift Packaging Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapping the pair box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 35,
                    moq: 30,
                    additionalLeadTime: "3 business days",
                    isActive: true,
                },
            ],

            tiers: [
                {
                    tierLabel: "Starter Bulk",
                    minQty: 15,
                    maxQty: 49,
                    unitPrice: 380,
                    discountPercentage: 62,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "62% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual Box Packaging",
                    ],
                    enabledCustomizationKeys: ["logo_print_tissue_box", "laser_engrave_tissue_box"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 50,
                    maxQty: 149,
                    unitPrice: 325,
                    discountPercentage: 67,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "67% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing on Both Boxes",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_tissue_box", "laser_engrave_tissue_box", "custom_kraft_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_tissue_box",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 150,
                    maxQty: null,
                    unitPrice: 275,
                    discountPercentage: 72,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "72% Wholesale Savings vs MRP",
                        "FREE Logo Printing on Both Boxes + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_tissue_box", "laser_engrave_tissue_box", "custom_kraft_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_tissue_box", pricePerUnit: 0, isFree: true },
                        { optionKey: "custom_kraft_sleeve", pricePerUnit: 0, isFree: true },
                    ],
                },
            ],
        };

        // 5. Upsert B2BProductConfig
        const b2bConfig = await B2BProductConfig.findOneAndUpdate(
            { product: product._id },
            b2bConfigPayload,
            { new: true, upsert: true, runValidators: true }
        );
        console.log(`💼 B2B Product Config saved (Config ID: ${b2bConfig._id})`);

        console.log("\n=================================================");
        console.log("       TISSUE BOX PAIR OF 2 SEED SUMMARY");
        console.log("=================================================");
        console.log(`Name:           ${product.name}`);
        console.log(`Slug:           ${product.slug}`);
        console.log(`Category:       ${category.name} (${category.slug})`);
        console.log(`Unit:           ${product.unit}`);
        console.log(`B2C Price:      ₹${product.discountedPrice} (MRP: ₹${product.originalPrice})`);
        console.log(`B2B MOQ:        ${b2bConfig.moq} pairs`);
        console.log(`B2B Base Price: ₹${b2bConfig.basePrice}/pair`);
        console.log(`Tiers Count:    ${b2bConfig.tiers.length} wholesale volume slabs`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Tissue Box Pair:", err);
        process.exit(1);
    }
};

seedTissueBoxPair();
