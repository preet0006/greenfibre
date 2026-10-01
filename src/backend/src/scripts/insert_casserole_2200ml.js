import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const seedCasserole2200ml = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Resolve Category
        let category = await Category.findOne({
            $or: [
                { slug: "kitchenware" },
                { name: "Kitchenware" },
                { slug: "kitchen-dining" },
                { name: "Kitchen & Dining" },
                { slug: "tableware" },
            ],
        });

        if (!category) {
            category = await Category.create({
                name: "Kitchenware",
                slug: "kitchenware",
                description: "Eco-friendly sustainable kitchenware, storage and dining casseroles crafted from crop-waste biocomposites.",
                isActive: true,
            });
            console.log(`📁 Created Category: ${category.name} (${category._id})`);
        } else {
            console.log(`📁 Using existing Category: ${category.name} (${category._id})`);
        }

        // 2. Prepare Product Payload (Casserole with Lid 2200 ml)
        const productPayload = {
            name: "Casserole",
            slug: "casserole-with-lid-2200-ml",
            sku: "GF-CASSEROLE-2200",
            unit: "piece",
            category: category._id,
            subCategory: null,
            tagline: "Earth-friendly casserole with lid, made from crop-waste biocomposite",
            shortDescription: "2200 ml casserole with lid, made from crop-waste biocomposite. Microwave & dishwasher suitable.",
            description:
                "Casserole with lid, 2200 ml, crafted from BioDur biocomposite made using crop-waste with food contact binders and additives. Earth friendly, climate positive and food contact safe, this lightweight, impact-resistant casserole is suitable for microwave reheating and dishwasher use, making it a perfect alternative to plastic, glass, melamine and ceramic for everyday serving and storage.",

            productFeatures: [
                "Made with crop-waste biocomposite (BioDur)",
                "Earth friendly – crafted from waste materials",
                "Climate positive – crop-waste locks biogenic carbon",
                "Food contact safe – tested & certified safe up to 100°C by TUV",
                "Suitable for microwave reheat & dishwasher use, certified as per European standards",
                "Lightweight & impact-resistant",
                "Alternative to plastic, glass, melamine & ceramic",
                "Non-toxic & safe – free from BPA & formaldehyde",
                "UV stabilized",
                "Comes with lid",
                "Reusable",
            ],

            material: "BioDur Crop-Waste Biocomposite",
            collectionName: "BioDur Kitchenware Collection",
            size: "2200 ml",
            color: "Off white",

            colors: [
                {
                    name: "Off white",
                    hex: "#FAF9F6",
                    stock: 350,
                    images: [
                        "/products/casserole.jpg",
                    ],
                },
            ],

            images: [
                "/products/casserole.jpg",
            ],

            specs: {
                "Set Contents": "1 Casserole with lid",
                "Material": "BioDur Crop-Waste Biocomposite",
                "Color": "Off white",
                "Capacity": "2200 ml",
                "Product Weight": "650 gm",
                "Product Length": "24.5 cm",
                "Product Width": "24.5 cm",
                "Product Height": "10.5 cm",
                "Food Contact Safe": "Yes",
                "Microwave Suitable": "Yes (reheat)",
                "Dishwasher Suitable": "Yes",
                "BPA & Formaldehyde Free": "Yes",
                "Reusable": "Yes",
                "Eco Friendly": "Yes",
                "Country of Origin": "India",
            },

            originalPrice: 1299,
            discountedPrice: 799,
            b2cPrice: 799,
            b2bPrice: 390,

            leadTime: "5 - 7 business days",
            branding: true,
            brandingTypes: [
                "Single Color Logo Screen Print",
                "Laser Logo Etching",
                "Custom Branded Kraft Box",
            ],

            stockQuantity: 350,

            productWeight: {
                value: 650,
                unit: "gm",
            },

            dimensions: {
                length: 24.5,
                width: 24.5,
                height: 10.5,
                unit: "cm",
            },

            package: {
                contents: "Casserole with lid x 1",
                type: "Corrugated Kraft Gift Box",
                deadWeight: "750 gm",
                length: "26 cm",
                width: "26 cm",
                height: "12 cm",
                itemsPerPackage: "1 Piece",
                packerDetails: "Greenfibre Eco Products Pvt. Ltd.",
                countryOfOrigin: "India",
            },

            giftPackaging: {
                available: true,
                title: "Eco Kraft Casserole Gift Packaging",
                description: "Heavy-duty corrugated kraft gift box with custom full-color sleeve.",
                pricePerBox: 45,
                customBrandingAvailable: true,
            },

            careInstructions:
                "Dishwasher and microwave suitable for reheating up to 100°C. Clean with mild soap and soft sponge.",

            sustainability: {
                madeWith:
                    "BioDur biocomposite using crop-waste with food contact binders & additives",
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
                "casserole",
                "kitchenware",
                "bioDur",
                "cropWaste",
                "ecoFriendly",
                "microwaveSafe",
                "dishwasherSafe",
                "foodContactSafe",
                "reusable",
                "offWhite",
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
            basePrice: 390,
            moq: 15,
            stepQuantity: 5,
            sampleAvailable: true,
            samplePrice: 550,
            customizationNotes: "Screen print on casserole lid / body or laser mark. Vector artwork (.ai, .svg) required.",
            adminNotes: "Standard lead time 5-7 days. Ideal for festive dining hampers and executive corporate gifting.",

            customizationOptions: [
                {
                    key: "logo_print_casserole",
                    label: "Single Color Screen Print on Lid",
                    description: "High-precision screen print with corporate logo on casserole lid",
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
                    key: "laser_engrave_casserole",
                    label: "Laser Etched Logo on Lid",
                    description: "Crisp permanent laser etched logo mark",
                    type: "engraving",
                    tag: "Laser Etched",
                    icon: "laser",
                    isPriced: true,
                    pricePerUnit: 30,
                    moq: 30,
                    additionalLeadTime: "2 business days",
                    isActive: true,
                },
                {
                    key: "custom_gift_box_sleeve",
                    label: "Custom Branded Casserole Gift Box Sleeve",
                    description: "Full-color CMYK printed outer sleeve wrapped around the gift box",
                    type: "packaging",
                    tag: "Custom Box",
                    icon: "box",
                    isPriced: true,
                    pricePerUnit: 40,
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
                    unitPrice: 390,
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
                    enabledCustomizationKeys: ["logo_print_casserole", "laser_engrave_casserole"],
                },
                {
                    tierLabel: "Corporate Recommended",
                    minQty: 50,
                    maxQty: 199,
                    unitPrice: 330,
                    discountPercentage: 75,
                    popular: true,
                    badge: "★ MOST POPULAR",
                    leadTime: "7 - 10 business days",
                    includedCustomizationsCount: 2,
                    customizationAllowanceText: "2 complimentary customizations included",
                    benefits: [
                        "75% Wholesale Savings vs MRP",
                        "FREE Corporate Logo Printing on Lid",
                        "Free Digital 3D Mockup Proof within 24h",
                        "Priority Doorstep Logistics",
                    ],
                    enabledCustomizationKeys: ["logo_print_casserole", "laser_engrave_casserole", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        {
                            optionKey: "logo_print_casserole",
                            pricePerUnit: 0,
                            isFree: true,
                        },
                    ],
                },
                {
                    tierLabel: "Enterprise Volume",
                    minQty: 200,
                    maxQty: null,
                    unitPrice: 285,
                    discountPercentage: 78,
                    popular: false,
                    badge: "BEST VALUE",
                    leadTime: "10 - 14 business days",
                    includedCustomizationsCount: 3,
                    customizationAllowanceText: "All customizations included complimentary",
                    benefits: [
                        "78% Wholesale Savings vs MRP",
                        "FREE Logo Printing + FREE Custom Box Sleeve",
                        "Pre-Production Physical Sample Included",
                        "Dedicated Account Manager",
                    ],
                    enabledCustomizationKeys: ["logo_print_casserole", "laser_engrave_casserole", "custom_gift_box_sleeve"],
                    customizationPriceOverrides: [
                        { optionKey: "logo_print_casserole", pricePerUnit: 0, isFree: true },
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
        console.log("       CASSEROLE 2200 ML SEED SUMMARY");
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
        console.error("❌ Error inserting Casserole 2200ml:", err);
        process.exit(1);
    }
};

seedCasserole2200ml();
