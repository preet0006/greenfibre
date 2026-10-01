import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedTableTopPlanter = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category & SubCategory
        let category = await Category.findOne({
            $or: [
                { slug: "planters" },
                { slug: "planter" },
                { name: "Planter" },
                { name: "Planters" },
                { slug: "home-decor" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Planter",
                slug: "planter",
                description: "Eco-friendly sustainable indoor and outdoor planters made from crop-waste biocomposites.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Table Top Planter - 4 Inch)
        const productPayload = {
            name: "Table top",
            slug: "table-top-planter-4-inch",
            sku: "GF-PLANTER-4INCH",
            unit: "piece",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly bamboo-based table top planter, perfect for gifting",
            shortDescription: "4 inch bamboo-based table top planter for gifting. For indoor, balcony & window flower pots.",
            description:
                "Table Top Planter, 4 inch, crafted from BioDur bamboo-based biocomposite made using crop-waste. Earth friendly and climate positive, this lightweight, impact-resistant planter is perfect for gifting and ideal for indoor spaces, balconies and window flower pots. Available in Off white and Light green.",

            productFeatures: [
                "Made with bamboo-based biocomposite (BioDur)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Lightweight & impact-resistant",
                "Non-toxic & safe – free from BPA & formaldehyde",
                "UV stabilized",
                "Perfect for gifting",
                "Suitable for indoor, balcony & window use",
                "Available in Off white & Light green",
                "Reusable",
            ],

            material: "Bamboo Based Biocomposite",
            collectionName: "BioDur Eco Planters",
            size: "4 inch",
            color: "Off white, Light green",

            colors: [
                {
                    name: "Off white",
                    hex: "#F2EEE2",
                    stock: 500,
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790680473/planter_wzueb4.webp",
                        "/products/statement-table-top-planter.jpg",
                    ],
                },
                {
                    name: "Light green",
                    hex: "#B5D8B0",
                    stock: 500,
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790680473/planter_wzueb4.webp",
                        "/products/statement-table-top-planter.jpg",
                    ],
                },
            ],

            images: [
                "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790680473/planter_wzueb4.webp",
                "/products/statement-table-top-planter.jpg",
            ],

            specs: {
                "Set Contents": "1 Table top planter",
                "Material": "Bamboo Based Biocomposite",
                "Color": "Off white, Light green",
                "Size": "4 inch",
                "Product Weight": "170 gm",
                "Product Length": "10.5 cm",
                "Product Width": "10.5 cm",
                "Product Height": "9.5 cm",
                "BPA & Formaldehyde Free": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 499,
            discountedPrice: 299,
            b2cPrice: 299,
            b2bPrice: 135,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Sleeve",
            ],

            stockQuantity: 1000,

            productWeight: {
                value: 170,
                unit: "gm",
            },

            dimensions: {
                length: 10.5,
                width: 10.5,
                height: 9.5,
                unit: "cm",
            },

            package: {
                contents: "Table top planter x 1",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "220 gm",
                length: "11.5 cm",
                width: "11.5 cm",
                height: "10.5 cm",
                itemsPerPackage: "1 Piece",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Tabletop Planter Gift Box",
                description: "Sustainable branded kraft box with custom sleeve for corporate onboarding and plant gifting.",
                pricePerBox: 25,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Clean with a soft damp cloth. Suitable for succulents, indoor foliage, and desktop plants. UV stabilized for both indoor and outdoor sun exposure.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste (bamboo fibres) with binders & additives",
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
                "tableTopPlanter",
                "planter",
                "giftingPlanter",
                "bambooBased",
                "bioDur",
                "ecoFriendly",
                "indoorPlanter",
                "balconyPlanter",
                "reusable",
                "offWhite",
                "lightGreen",
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
            basePrice: 135,
            moq: 25,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 220,
            customizationNotes: "Screen print on side or laser etched logo. Vector artwork (.ai, .svg) required.",
            adminNotes: "Standard lead time 5-7 days. Ideal for employee welcome kits and green gifting initiatives.",

            customizationOptions: [
                {
                    key: "logo_print_planter",
                    label: "Single Color Screen Print Logo",
                    description: "High-precision screen print with corporate logo on side panel",
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
                    key: "laser_engrave_planter",
                    label: "Laser Etched Logo on Planter",
                    description: "Permanent crisp laser etching on the planter face",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 20,
                    moq: 50,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_planter_sleeve",
                    label: "Custom Branded Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the planter gift box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 50,
                    additionalLeadTime: "3 business days",
                    isActive: true,
                },
            ],

            tiers: [
                {
                    tierLabel: "Starter Bulk",
                    minQty: 25,
                    maxQty: 99,
                    unitPrice: 135,
                    discountPercentage: 73,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "73% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual Box Packaging",
                    ],
                    enabledCustomizationKeys: ["logo_print_planter", "laser_engrave_planter"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 100,
                    maxQty: 499,
                    unitPrice: 110,
                    discountPercentage: 78,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "78% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_planter", "laser_engrave_planter", "custom_planter_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_planter",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 500,
                    maxQty: null,
                    unitPrice: 89,
                    discountPercentage: 82,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "82% Wholesale Savings vs MRP",
                        "FREE Logo Printing + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_planter", "laser_engrave_planter", "custom_planter_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_planter", pricePerUnit: 0, isFree: true },
                        { optionKey: "custom_planter_sleeve", pricePerUnit: 0, isFree: true },
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
        console.log("       TABLE TOP PLANTER SEED SUMMARY");
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
        console.error("❌ Error inserting Table Top Planter:", err);
        process.exit(1);
    }
};

seedTableTopPlanter();
