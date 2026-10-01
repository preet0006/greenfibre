import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const itemsToUpdate = [
    {
        name: "Table Top Planter",
        slugs: ["table-top-planter-4-inch", "statement-table-top-planter", "romano-planter"],
        wholesalePrice: 1499,
        unit: "piece",
    },
    {
        name: "Statement Mug - 2 Cups",
        slugs: ["statement-mug-set-of-2", "statement-mug-350-ml"],
        wholesalePrice: 899,
        unit: "set",
    },
    {
        name: "Statement Mug - 4 Cups",
        slugs: ["statement-mug-set-of-4"],
        wholesalePrice: 1199,
        unit: "set",
    },
    {
        name: "Classic Mug - 2 Cups",
        slugs: ["classic-mug-set-of-2", "classic-mug-300-ml"],
        wholesalePrice: 799,
        unit: "set",
    },
    {
        name: "Classic Mug - 4 Cups",
        slugs: ["classic-mug-set-of-4"],
        wholesalePrice: 1199,
        unit: "set",
    },
    {
        name: "Tissue Box - Pair of 2",
        slugs: ["tissue-box-pair-of-2", "velvata-tissue-box"],
        wholesalePrice: 1699,
        unit: "pair",
    },
    {
        name: "Canister 700 ml",
        slugs: ["canister-700-ml", "canister"],
        wholesalePrice: 1299,
        unit: "piece",
    },
];

const setB2BWholesalePrices = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        for (const item of itemsToUpdate) {
            const bp = item.wholesalePrice;
            const t1Price = Math.round(bp * 0.90); // 10% off
            const t2Price = Math.round(bp * 0.85); // 15% off
            const t3Price = Math.round(bp * 0.80); // 20% off

            // Update Product document
            const prod = await Product.findOneAndUpdate(
                { slug: { $in: item.slugs } },
                {
                    b2bPrice: bp,
                    discountedPrice: bp,
                    originalPrice: Math.round(bp * 1.35), // retail anchor MRP
                },
                { returnDocument: "after" }
            );

            if (prod) {
                console.log(`\n📦 Updated ${prod.name} (${prod.slug}):`);
                console.log(`   • B2B Headline Wholesale Price: ₹${bp}`);

                // Update or Create B2BProductConfig
                let cfg = await B2BProductConfig.findOne({ product: prod._id });
                if (!cfg) {
                    cfg = new B2BProductConfig({
                        product: prod._id,
                        isEnabled: true,
                        basePrice: bp,
                        moq: 10,
                        stepQuantity: 5,
                    });
                }

                cfg.isEnabled = true;
                cfg.basePrice = bp;
                cfg.moq = cfg.moq || 10;
                cfg.stepQuantity = cfg.stepQuantity || 5;

                // Configure standard wholesale volume tiers (10%, 15%, 20% off base price)
                cfg.tiers = [
                    {
                        tierLabel: "Tier 1",
                        minQty: 10,
                        maxQty: 49,
                        unitPrice: t1Price,
                        discountPercentage: 10,
                        popular: false,
                        badge: "-10%",
                        leadTime: "5 - 7 business days",
                        includedCustomizationsCount: 1,
                        customizationAllowanceText: "Choose 1 complimentary customization",
                        benefits: ["10% Wholesale Savings", "Standard Recyclable Eco Kraft Box"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                    },
                    {
                        tierLabel: "Tier 2",
                        minQty: 50,
                        maxQty: 99,
                        unitPrice: t2Price,
                        discountPercentage: 15,
                        popular: true,
                        badge: "★ POPULAR",
                        leadTime: "7 - 10 business days",
                        includedCustomizationsCount: 2,
                        customizationAllowanceText: "2 complimentary customizations included",
                        benefits: ["15% Wholesale Savings", "FREE Corporate Logo Printing", "Priority Dispatch"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                    },
                    {
                        tierLabel: "Tier 3",
                        minQty: 100,
                        maxQty: null,
                        unitPrice: t3Price,
                        discountPercentage: 20,
                        popular: false,
                        badge: "BEST VALUE",
                        leadTime: "10 - 14 business days",
                        includedCustomizationsCount: 3,
                        customizationAllowanceText: "All complimentary customizations included",
                        benefits: ["20% Wholesale Savings", "FREE Logo Printing + Custom Packaging Sleeve", "Dedicated Account Manager"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                    },
                ];

                await cfg.save();
                console.log(`   • Tier 1 (10-49): ₹${t1Price}/pc (-10%)`);
                console.log(`   • Tier 2 (50-99): ₹${t2Price}/pc (-15%)`);
                console.log(`   • Tier 3 (100+):  ₹${t3Price}/pc (-20%)`);
            } else {
                console.log(`⚠️ Product not found for slugs: ${item.slugs.join(", ")}`);
            }
        }

        console.log("\n=================================================");
        console.log("      ALL B2B WHOLESALE PRICES APPLIED");
        console.log("=================================================");
        itemsToUpdate.forEach((it) => {
            console.log(`• ${it.name}: ₹${it.wholesalePrice} (Headline B2B Price)`);
        });
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error setting B2B wholesale prices:", err);
        process.exit(1);
    }
};

setB2BWholesalePrices();
