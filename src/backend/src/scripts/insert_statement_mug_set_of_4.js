import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedStatementMugSetOf4 = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category
        let category = await Category.findOne({
            $or: [{ slug: "drinkware" }, { name: "Drinkware" }, { slug: "bottle" }],
        });

        if (!category) {
            category = await Category.create({
                name: "Drinkware",
                slug: "drinkware",
                description: "Eco-friendly sustainable drinkware, cups, and mugs crafted from biocomposite materials.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Data (Set of 4 Statement Mugs)
        const productPayload = {
            name: "Statement Mug - Set of 4",
            slug: "statement-mug-set-of-4",
            sku: "GF-MUG-350-SET4",
            unit: "set",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly statement coffee mugs made with rice husk & bamboo",
            shortDescription: "Set of 4 statement coffee mugs, 350 ml, made with rice husk & bamboo. Microwave safe, for hot & cold servings.",
            description:
                "Statement Coffee Mug – Set of 4, crafted from BioDur biocomposite made with rice husk and bamboo fibres. Earth friendly, climate positive and food contact safe, these lightweight, impact-resistant 350 ml mugs are microwave and dishwasher suitable, perfect for hot and cold servings.",

            productFeatures: [
                "Made with rice husk & bamboo fibres (BioDur biocomposite)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Food contact safe – tested & certified safe up to 100°C by TUV",
                "Microwave suitable for reheat",
                "Dishwasher suitable",
                "Lightweight & impact-resistant",
                "Non-toxic & safe – free from BPA & formaldehyde",
                "UV stabilized",
                "Suitable for hot & cold servings",
            ],

            material: "Rice Husk & Bamboo Biocomposite",
            collectionName: "BioDur Drinkware Collection",
            size: "350 ml",
            color: "Off white, Coffee",

            colors: [
                {
                    name: "Off white",
                    hex: "#F2EEE2",
                    stock: 1000,
                    images: [
                        "/products/statement-mug-350-ml.jpg",
                    ],
                },
                {
                    name: "Coffee",
                    hex: "#6F4E37",
                    stock: 1000,
                    images: [
                        "/products/statement-mug-350-ml.jpg",
                    ],
                },
            ],

            images: [
                "/products/statement-mug-350-ml.jpg",
            ],

            specs: {
                "Set Contents": "4 Statement mugs",
                "Material": "Rice Husk & Bamboo Biocomposite",
                "Color": "Off white, Coffee",
                "Capacity": "350 ml",
                "Product Weight": "110 gm per mug (440 gm total)",
                "Product Length": "11.5 cm",
                "Product Width": "8.5 cm",
                "Product Height": "9.5 cm",
                "Dishwasher Safe": "Yes",
                "Microwave Safe": "Yes",
                "Food Contact Safe": "Yes",
                "Heat Resistance": "Up to 100°C (TUV tested)",
                "BPA & Formaldehyde Free": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
            },

            originalPrice: 1299,
            discountedPrice: 799,
            b2cPrice: 799,
            b2bPrice: 420,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 2000,

            productWeight: {
                value: 440,
                unit: "gm",
            },

            dimensions: {
                length: 20.0,
                width: 20.0,
                height: 10.0,
                unit: "cm",
            },

            package: {
                contents: "Statement mug x 4",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "520 gm",
                length: "22 cm",
                width: "22 cm",
                height: "12 cm",
                itemsPerPackage: "1 Set (4 Mugs)",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Statement 4-Mug Family Gift Box",
                description: "Sturdy corrugated kraft gift box with partitions and custom branding sleeve.",
                pricePerBox: 45,
                customBrandingAvailable: true,
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

            popular: true,
            isActive: true,
            isFeatured: true,

            tags: [
                "statementMug",
                "coffeeMug",
                "riceHusk",
                "bamboo",
                "ecoFriendly",
                "drinkware",
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
            basePrice: 420,
            moq: 20,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 599,
            customizationNotes: "Screen print / laser branding on all 4 mugs. Vector logo (.ai, .svg) required.",
            adminNotes: "Standard production 5-7 days. Express dispatch available for large corporate gifting runs.",

            customizationOptions: [
                {
                    key: "logo_print_4mugs",
                    label: "Single Color Screen Print on 4 Mugs",
                    description: "High-precision screen print with corporate logo on all 4 mugs",
                    type: "print",
                    tag: "Logo Print",
                    badge: "Popular",
                    icon: "palette",
                    isPriced: true,
                    pricePerUnit: 25,
                    moq: 20,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "laser_engrave_4mugs",
                    label: "Laser Logo Etching on 4 Mugs",
                    description: "Permanent crisp laser etching on all 4 mugs in the set",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 35,
                    moq: 40,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_gift_box_sleeve",
                    label: "Custom Branded 4-Mug Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the 4-mug gift box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 40,
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
                    unitPrice: 420,
                    discountPercentage: 68,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "68% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual 4-Mug Partition Gift Box",
                    ],
                    enabledCustomizationKeys: ["logo_print_4mugs", "laser_engrave_4mugs"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 50,
                    maxQty: 199,
                    unitPrice: 360,
                    discountPercentage: 72,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "72% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing on all 4 Mugs",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_4mugs", "laser_engrave_4mugs", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_4mugs",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 200,
                    maxQty: null,
                    unitPrice: 310,
                    discountPercentage: 76,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "76% Wholesale Savings vs MRP",
                        "FREE Logo Printing on all 4 Mugs + FREE Custom Gift Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_4mugs", "laser_engrave_4mugs", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_4mugs", pricePerUnit: 0, isFree: true },
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
        console.log("       STATEMENT MUG SET OF 4 SEED SUMMARY");
        console.log("=================================================");
        console.log(`Name:           ${product.name}`);
        console.log(`Slug:           ${product.slug}`);
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
        console.error("❌ Error inserting Statement Mug Set of 4:", err);
        process.exit(1);
    }
};

seedStatementMugSetOf4();
