import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedSoupBowlSetOf4 = async () => {
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
                description: "Sustainable tableware, bowls, plates, and dining sets made with natural biocomposite materials.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Set of 4 Soup Bowls with Spoon)
        const productPayload = {
            name: "Soup Bowl",
            slug: "soup-bowl-set-of-4-with-spoon",
            sku: "GF-BOWL-250-SET4",
            unit: "set",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly unbreakable soup bowls with spoon, made with bamboo & rice husk fibres",
            shortDescription: "Set of 4 unbreakable 250 ml soup bowls with spoon, made with bamboo fibres & rice husk. Microwave safe, for hot & cold servings.",
            description:
                "Soup Bowl 250 ml Set of 4 with spoon, crafted from BioDur biocomposite made with bamboo fibres and rice husk fibre. Earth friendly, climate positive, unbreakable and food contact safe, these lightweight bowls are microwave suitable for reheating and perfect for hot and cold servings.",

            productFeatures: [
                "Comes with spoon",
                "Made with bamboo fibres & rice husk fibre (BioDur biocomposite)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Unbreakable – lightweight & impact-resistant",
                "Food contact safe – tested & certified safe up to 100°C by TUV",
                "Microwave suitable for reheat",
                "Non-toxic & safe – free from BPA",
                "UV stabilized",
                "Suitable for hot & cold servings",
            ],

            material: "Bamboo Fibre & Rice Husk Biocomposite",
            collectionName: "BioDur Tableware Collection",
            size: "250 ml",
            color: "Light Green, Charcoal",

            colors: [
                {
                    name: "Light Green",
                    hex: "#B5D8B0",
                    stock: 745,
                    images: [
                        "/products/soup-bowl-250-ml.jpg",
                    ],
                },
                {
                    name: "Charcoal",
                    hex: "#36454F",
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
                "Set Contents": "4 Soup bowls with spoon",
                "Material": "Bamboo Fibre & Rice Husk Biocomposite",
                "Color": "Light Green, Charcoal",
                "Capacity": "250 ml per bowl",
                "Product Weight": "75 gm per bowl (360 gm total set)",
                "Product Length": "10 cm",
                "Product Width": "10 cm",
                "Product Height": "4.5 cm",
                "Microwave Safe": "Yes (reheating)",
                "Food Contact Safe": "Yes",
                "Heat Resistance": "Up to 100°C (TUV tested)",
                "BPA & Formaldehyde Free": "Yes",
                "Unbreakable": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 899,
            discountedPrice: 599,
            b2cPrice: 599,
            b2bPrice: 320,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 1490,

            productWeight: {
                value: 360,
                unit: "gm",
            },

            dimensions: {
                length: 10.0,
                width: 10.0,
                height: 4.5,
                unit: "cm",
            },

            package: {
                contents: "Soup bowl x 4, Spoon x 4",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "440 gm",
                length: "21 cm",
                width: "21 cm",
                height: "9 cm",
                itemsPerPackage: "1 Set (4 Bowls + 4 Spoons)",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Soup & Dining Gift Box",
                description: "Protective kraft partition box with full-color corporate branding sleeve.",
                pricePerBox: 35,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Avoid harsh scrubs during hand wash. Avoid toxic & strong chemicals. Avoid excess heat & direct sunlight. Product is UV stabilized, but for longer use, avoid direct sunlight. Made with natural fibres; for prolonged usage follow the above.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste (bamboo fibres, rice husk) with food contact binders & additives",
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
                "soupBowl",
                "bowlWithSpoon",
                "bamboo",
                "riceHusk",
                "ecoFriendly",
                "unbreakable",
                "tableware",
                "reusable",
                "microwaveSafe",
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
            basePrice: 320,
            moq: 20,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 450,
            customizationNotes: "Screen print on bowl sides or laser mark on matching spoons. Vector artwork required.",
            adminNotes: "Standard production 5-7 days. Express delivery available for quantities over 50 sets.",

            customizationOptions: [
                {
                    key: "logo_print_bowls",
                    label: "Single Color Screen Print on 4 Bowls",
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
                    key: "laser_engrave_spoons",
                    label: "Laser Etched Logo on 4 Spoons",
                    description: "Permanent crisp laser etching on the handle of all 4 spoons",
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
                    key: "custom_gift_box_sleeve",
                    label: "Custom Branded 4-Bowl Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the gift box",
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
                    unitPrice: 320,
                    discountPercentage: 64,
                    popular: false,
                    leadTime: "5 - 7 business days",
                    includedCustomizationsCount: 1,
                    customizationAllowanceText: "1 complimentary customization included",
                    benefits: [
                        "64% Wholesale Savings vs MRP",
                        "Standard QC Inspection",
                        "Individual 4-Bowl Partition Gift Box",
                    ],
                    enabledCustomizationKeys: ["logo_print_bowls", "laser_engrave_spoons"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 50,
                    maxQty: 199,
                    unitPrice: 275,
                    discountPercentage: 69,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "69% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing on all 4 Bowls",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_bowls", "laser_engrave_spoons", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_bowls",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 200,
                    maxQty: null,
                    unitPrice: 235,
                    discountPercentage: 74,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "74% Wholesale Savings vs MRP",
                        "FREE Logo Printing + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_bowls", "laser_engrave_spoons", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_bowls", pricePerUnit: 0, isFree: true },
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
        console.log("       SOUP BOWL SET OF 4 SEED SUMMARY");
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
        console.error("❌ Error inserting Soup Bowl Set of 4:", err);
        process.exit(1);
    }
};

seedSoupBowlSetOf4();
