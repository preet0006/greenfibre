import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const items = [
    {
        name: "Casserole",
        slugs: ["casserole-with-lid-2200-ml", "casserole-4-8-l", "casserole"],
        price: 3199,
        unit: "piece",
    },
    {
        name: "Soup Bowl",
        slugs: ["soup-bowl-set-of-4-with-spoon", "soup-bowl-250-ml", "soup-bowl"],
        price: 899,
        unit: "set",
    },
    {
        name: "Flora Soup Bowl",
        slugs: ["flora-soup-bowl-set-of-4", "flora-soup-bowl"],
        price: 1599,
        unit: "set",
    },
    {
        name: "Storage Bowl",
        slugs: ["storage-bowl-2-liter", "storage-bowl-2-9l-1-6l", "storage-bowl"],
        price: 1699,
        unit: "piece",
    },
    {
        name: "Mini Gift Set",
        slugs: ["mini-gift-packaging", "mini-gift-set"],
        price: 999,
        unit: "set",
    },
    {
        name: "Desk Gift Set",
        slugs: ["desk-gift-set", "zen-workspace-desk-gift-box"],
        price: 3199,
        unit: "set",
    },
    {
        name: "Dining Gift Set",
        slugs: ["dining-gift-set"],
        price: 6999,
        unit: "set",
    },
    {
        name: "Family Gift Set",
        slugs: ["greenfibre-family-pack", "family-gift-set", "sustainable-housewarming-gift-box"],
        price: 7999,
        unit: "set",
    },
];

const updateAllB2BPrices = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})\n`);

        for (const item of items) {
            const bp = item.price;
            const t1Price = Math.round(bp * 0.90); // 10% off
            const t2Price = Math.round(bp * 0.85); // 15% off
            const t3Price = Math.round(bp * 0.80); // 20% off

            const prods = await Product.find({ slug: { $in: item.slugs } });

            if (prods.length === 0) {
                // Try finding by name regex
                const regexProd = await Product.findOne({ name: new RegExp(item.name, "i") });
                if (regexProd) prods.push(regexProd);
            }

            if (prods.length > 0) {
                for (const prod of prods) {
                    prod.b2bPrice = bp;
                    prod.discountedPrice = bp;
                    prod.originalPrice = Math.round(bp * 1.35); // Anchor retail MRP
                    await prod.save();

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
                            customizationPriceOverrides: [
                                { optionKey: "logo_print", pricePerUnit: 0, isFree: true },
                            ],
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
                            customizationPriceOverrides: [
                                { optionKey: "logo_print", pricePerUnit: 0, isFree: true },
                                { optionKey: "custom_sleeve", pricePerUnit: 0, isFree: true },
                            ],
                        },
                    ];

                    await cfg.save();

                    console.log(`📦 ${prod.name} (${prod.slug}):`);
                    console.log(`   • Headline B2B Wholesale Price: ₹${bp}`);
                    console.log(`   • Tier 1 (10-49): ₹${t1Price} (-10%)`);
                    console.log(`   • Tier 2 (50-99): ₹${t2Price} (-15%)`);
                    console.log(`   • Tier 3 (100+):  ₹${t3Price} (-20%)\n`);
                }
            } else {
                console.log(`⚠️ Product not found for slugs: ${item.slugs.join(", ")}`);
            }
        }

        console.log("=================================================");
        console.log("      ALL REQUESTED B2B PRICES UPDATED!");
        console.log("=================================================");
        items.forEach((it) => {
            console.log(`• ${it.name}: ₹${it.price}`);
        });
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ Seed completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error updating B2B prices:", err);
        process.exit(1);
    }
};

updateAllB2BPrices();
