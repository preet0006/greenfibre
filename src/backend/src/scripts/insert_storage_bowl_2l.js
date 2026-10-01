import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedStorageBowl2L = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category
        let category = await Category.findOne({
            $or: [
                { slug: "storage" },
                { name: "Storage" },
                { slug: "kitchenware" },
                { slug: "kitchen-dining" },
                { name: "Kitchen & Dining" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Storage",
                slug: "storage",
                description: "Eco-friendly sustainable kitchen food storage containers, boxes, and bowls.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Storage Bowl - 2 Liter)
        const productPayload = {
            name: "Storage Bowl",
            slug: "storage-bowl-2-liter",
            sku: "GF-STRG-BOWL-2L",
            unit: "piece",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly 2L storage & serving bowl made from upcycled crop waste",
            shortDescription: "2 Liter multipurpose storage & serving bowl made from BioDur biocomposite. Microwave & dishwasher safe.",
            description:
                "Storage Bowl, 2 Liter, crafted from BioDur biocomposite using agricultural crop waste (rice husk, bamboo fibre, coffee husk) with food-contact binders and additives. Earth friendly, climate positive and food contact safe, this lightweight, impact-resistant large storage bowl is ideal for everyday food prep, serving, mixing, and kitchen storage.",

            productFeatures: [
                "Earth Friendly – crafted from waste materials, conserves resources, prevents pollution",
                "Climate Positive – crop-waste used locks biogenic carbon and reduces CO2 footprint",
                "Food Contact Safe – tested & certified safe up to 100°C by TUV, meeting international standards",
                "Great Utility – suitable for microwave reheat & dishwasher use, certified as per European standards",
                "Versatile & Durable – lightweight & impact-resistant, alternative to plastic, glass, melamine & ceramic",
                "Non-Toxic & Safe – free from BPA & formaldehyde",
                "Generous 2 Liter capacity ideal for food prep, salads, and storage",
                "Stackable nest-friendly design",
            ],

            material: "BioDur Biocomposite (Rice Husk, Bamboo Fibre, Coffee Husk)",
            collectionName: "BioDur Kitchen Storage",
            size: "2 Liter",
            color: "Natural",

            colors: [
                {
                    name: "Natural",
                    hex: "#E8DEC8",
                    stock: 400,
                    images: [
                        "/products/storage-bowl.jpg",
                    ],
                },
            ],

            images: [
                "/products/storage-bowl.jpg",
            ],

            specs: {
                "Set Contents": "1 Storage bowl",
                "Material": "BioDur Biocomposite (Rice Husk, Bamboo, Coffee Husk)",
                "Color": "Natural",
                "Capacity": "2 Liter",
                "Product Weight": "400 gm",
                "Product Length": "21 cm",
                "Product Width": "21 cm",
                "Product Height": "10.5 cm",
                "Food Contact Safe": "Yes",
                "Microwave Safe": "Yes (reheat under 1 min)",
                "Dishwasher Safe": "Yes (top rack)",
                "BPA & Formaldehyde Free": "Yes",
                "Heat Resistance": "Up to 100°C (TUV tested)",
                "Eco Friendly": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 699,
            discountedPrice: 449,
            b2cPrice: 449,
            b2bPrice: 210,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 400,

            productWeight: {
                value: 400,
                unit: "gm",
            },

            dimensions: {
                length: 21.0,
                width: 21.0,
                height: 10.5,
                unit: "cm",
            },

            package: {
                contents: "Storage bowl 2L x 1",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "490 gm",
                length: "23 cm",
                width: "23 cm",
                height: "12 cm",
                itemsPerPackage: "1 Piece",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Storage Bowl Gift Box",
                description: "Sturdy corrugated kraft box with full-color custom branding sleeve.",
                pricePerBox: 30,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Microwave safe for quick reheating under 1 minute. Dishwasher safe on the top rack. Clean with mild detergent and soft sponge.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste (rice husk, bamboo fibre, coffee husk) with food contact binders & additives",
                highlights: [
                    "Reduce CO2 emissions",
                    "Reduce waste disposal",
                    "Reduce crop burning",
                    "Reduce fossil dependency",
                    "Responsibly sourced from Farmer, Factory, Forest",
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
                "storageBowl",
                "storage",
                "ecoFriendly",
                "foodContactSafe",
                "microwaveSafe",
                "dishwasherSafe",
                "bioDur",
                "natural",
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
            basePrice: 210,
            moq: 25,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 320,
            customizationNotes: "Screen print logo on outer body or laser etched logo. Vector artwork (.ai, .svg) required.",
            adminNotes: "Standard lead time 5-7 days. Ideal for culinary gifting hampers and sustainable kitchen kits.",

            customizationOptions: [
                {
                    key: "logo_print_storage_bowl",
                    label: "Single Color Screen Print Logo",
                    description: "High-precision screen print with corporate logo on front body",
                    type: "print",
                    tag: "Logo Print",
                    badge: "Popular",
                    icon: "palette",
                    isPriced: true,
                    pricePerUnit: 15,
                    moq: 25,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "laser_engrave_storage_bowl",
                    label: "Laser Etched Logo on Bowl",
                    description: "Crisp permanent laser etched logo mark on upper rim or body",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 40,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_gift_box_sleeve",
                    label: "Custom Branded Outer Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the gift box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 30,
                    moq: 40,
                    additionalLeadTime: "3 business days",
                    isActive: true,
                },
            ],

            tiers: [
                {
                    tierLabel: "Starter Bulk",
                    minQty: 25,
                    maxQty: 99,
                    unitPrice: 210,
                    discountPercentage: 70,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "70% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual Box Packaging",
                    ],
                    enabledCustomizationKeys: ["logo_print_storage_bowl", "laser_engrave_storage_bowl"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 100,
                    maxQty: 499,
                    unitPrice: 175,
                    discountPercentage: 75,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "75% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_storage_bowl", "laser_engrave_storage_bowl", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_storage_bowl",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 500,
                    maxQty: null,
                    unitPrice: 145,
                    discountPercentage: 79,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "79% Wholesale Savings vs MRP",
                        "FREE Logo Printing + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_storage_bowl", "laser_engrave_storage_bowl", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_storage_bowl", pricePerUnit: 0, isFree: true },
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
        console.log("       STORAGE BOWL 2L SEED SUMMARY");
        console.log("=================================================");
        console.log(`Name:           ${product.name}`);
        console.log(`Slug:           ${product.slug}`);
        console.log(`Category:       ${category.name} (${category.slug})`);
        console.log(`Unit:           ${product.unit}`);
        console.log(`B2C Price:      ₹${product.discountedPrice} (MRP: ₹${product.originalPrice})`);
        console.log(`B2B MOQ:        ${b2bConfig.moq} pieces`);
        console.log(`B2B Base Price: ₹${b2bConfig.basePrice}/pc`);
        console.log(`Tiers Count:    ${b2bConfig.tiers.length} wholesale volume slabs`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting Storage Bowl 2L:", err);
        process.exit(1);
    }
};

seedStorageBowl2L();
