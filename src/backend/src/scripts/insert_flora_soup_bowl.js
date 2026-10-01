import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedFloraSoupBowl = async () => {
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
                { slug: "kitchen-dining" },
                { name: "Kitchen & Dining" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Tableware",
                slug: "tableware",
                description: "Eco-friendly sustainable tableware and dining accessories crafted from biocomposites.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Flora Soup Bowl - Set of 4)
        const productPayload = {
            name: "Flora Soup Bowl",
            slug: "flora-soup-bowl-set-of-4",
            sku: "GF-FLORA-BOWL-SET4",
            unit: "set",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly soup bowls made with rice husk biocomposite",
            shortDescription: "Set of 4 soup, ice-cream & fruit bowls, 350 ml, made with rice husk biocomposite. Microwave safe (reheat).",
            description:
                "Orbit Skid Soup Bowl – Set of 4, crafted from BioDur rice husk biocomposite. Earth friendly, climate positive and food contact safe, these lightweight 350 ml bowls are microwave suitable for reheating and dishwasher suitable, perfect for soup, ice-cream and fruit, hot or cold.",

            productFeatures: [
                "Made with rice husk biocomposite (BioDur)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Food contact safe – tested & certified safe up to 100°C by TUV",
                "Microwave suitable for reheat",
                "Dishwasher suitable",
                "Lightweight & impact-resistant",
                "Non-toxic & safe – free from BPA",
                "UV stabilized",
                "Suitable for soup, ice-cream & fruit, hot & cold serving",
            ],

            material: "Rice Husk Biocomposite",
            collectionName: "BioDur Tableware Collection",
            size: "350 ml",
            color: "Light Pink, Light Green",

            colors: [
                {
                    name: "Light Pink",
                    hex: "#F4C2C2",
                    stock: 745,
                    images: [
                        "/products/soup-bowl-250-ml.jpg",
                    ],
                },
                {
                    name: "Light Green",
                    hex: "#B5D8B0",
                    stock: 745,
                    images: [
                        "/products/soup-bowl-250-ml.jpg",
                    ],
                },
            ],

            images: [
                "/products/soup-bowl-250-ml.jpg",
            ],

            specs: {
                "Set Contents": "4 Soup bowls",
                "Material": "Rice Husk Biocomposite",
                "Color": "Light Pink, Light Green",
                "Capacity": "350 ml per bowl",
                "Product Weight": "125 gm per bowl (500 gm total set)",
                "Product Length": "13 cm",
                "Product Width": "13 cm",
                "Product Height": "6 cm",
                "Dishwasher Safe": "Yes",
                "Microwave Safe": "Yes (reheat)",
                "Food Contact Safe": "Yes",
                "Heat Resistance": "Up to 100°C (TUV tested)",
                "BPA Free": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 999,
            discountedPrice: 649,
            b2cPrice: 649,
            b2bPrice: 340,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 1490,

            productWeight: {
                value: 500,
                unit: "gm",
            },

            dimensions: {
                length: 13.0,
                width: 13.0,
                height: 6.0,
                unit: "cm",
            },

            package: {
                contents: "Soup bowl x 4",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "580 gm",
                length: "28 cm",
                width: "15 cm",
                height: "14 cm",
                itemsPerPackage: "1 Set (4 Bowls)",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Flora Dining Gift Box",
                description: "Corrugated partitioned gift box with full-color corporate branding sleeve.",
                pricePerBox: 40,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Dishwasher safe and microwave safe for reheating up to 100°C. Avoid abrasive metal scrubbers to preserve the natural matte finish.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste (rice husk) with food contact binders & additives",
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

            popular: false,
            isActive: true,
            isFeatured: false,

            tags: [
                "orbitSkid",
                "soupBowl",
                "icecreamBowl",
                "fruitBowl",
                "riceHusk",
                "ecoFriendly",
                "tableware",
                "reusable",
                "microwaveSafe",
                "dishwasherSafe",
                "setOf4",
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
            basePrice: 340,
            moq: 20,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 480,
            customizationNotes: "Precision screen print or laser logo on outer bowl body. Vector artwork (.ai, .svg) required.",
            adminNotes: "Standard lead time 5-7 days. Express production available for orders over 50 sets.",

            customizationOptions: [
                {
                    key: "logo_print_flora_bowls",
                    label: "Single Color Screen Print on all 4 Bowls",
                    description: "High-precision screen print with corporate logo on all 4 soup bowls",
                    type: "print",
                    tag: "Logo Print",
                    badge: "Popular",
                    icon: "palette",
                    isPriced: true,
                    pricePerUnit: 20,
                    moq: 20,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "laser_engrave_flora_bowls",
                    label: "Laser Etched Logo on 4 Bowls",
                    description: "Crisp permanent laser etching on the outer side or rim",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 30,
                    moq: 40,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_gift_box_sleeve",
                    label: "Custom Branded 4-Bowl Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapping the gift box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 35,
                    moq: 40,
                    additionalLeadTime: "3 business days",
                    isActive: true,
                },
            ],

            tiers: [
                {
                    tierLabel: "Starter Bulk",
                    minQty: 20,
                    maxQty: 49,
                    unitPrice: 340,
                    discountPercentage: 66,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "66% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual 4-Bowl Box Packaging",
                    ],
                    enabledCustomizationKeys: ["logo_print_flora_bowls", "laser_engrave_flora_bowls"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 50,
                    maxQty: 199,
                    unitPrice: 290,
                    discountPercentage: 71,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "71% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing on all 4 Bowls",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_flora_bowls", "laser_engrave_flora_bowls", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_flora_bowls",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 200,
                    maxQty: null,
                    unitPrice: 245,
                    discountPercentage: 75,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "75% Wholesale Savings vs MRP",
                        "FREE Logo Printing on all 4 Bowls + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_flora_bowls", "laser_engrave_flora_bowls", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_flora_bowls", pricePerUnit: 0, isFree: true },
                        { optionKey: "custom_gift_box_sleeve", pricePerUnit: 0, isFree: true },
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
        console.log("       FLORA SOUP BOWL SET OF 4 SEED SUMMARY");
        console.log("=================================================");
        console.log(`Name:           ${product.name}`);
        console.log(`Slug:           ${product.slug}`);
        console.log(`Category:       ${category.name} (${category.slug})`);
        console.log(`Unit:           ${product.unit}`);
        console.log(`B2C Price:      ₹${product.discountedPrice} (MRP: ₹${product.originalPrice})`);
        console.log(`B2B MOQ:        ${b2bConfig.moq} sets`);
        console.log(`B2B Base Price: ₹${b2bConfig.basePrice}/set`);
        console.log(`Tiers Count:    ${b2bConfig.tiers.length} wholesale volume slabs`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Flora Soup Bowl:", err);
        process.exit(1);
    }
};

seedFloraSoupBowl();
