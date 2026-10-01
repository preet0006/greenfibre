import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const updateB2BMrps = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        let drinkwareCat = await Category.findOne({
            $or: [{ slug: "drinkware" }, { name: "Drinkware" }],
        });

        // 1. Statement Mug - 2 Cups (Set of 2) -> MRP 899
        const stmt2 = await Product.findOneAndUpdate(
            { slug: { $in: ["statement-mug-set-of-2", "statement-mug-350-ml"] } },
            { originalPrice: 899, discountedPrice: 549, b2cPrice: 549 },
            { returnDocument: "after" }
        );
        if (stmt2) {
            console.log(`✅ Updated Statement Mug (2 cups) MRP -> ₹${stmt2.originalPrice}`);
            const cfg = await B2BProductConfig.findOne({ product: stmt2._id });
            if (cfg && cfg.tiers) {
                cfg.tiers.forEach((t) => {
                    t.discountPercentage = Math.max(0, Math.min(100, Math.round(((899 - t.unitPrice) / 899) * 100)));
                });
                await cfg.save();
            }
        }

        // 2. Statement Mug - 4 Cups (Set of 4) -> MRP 1199
        const stmt4 = await Product.findOneAndUpdate(
            { slug: "statement-mug-set-of-4" },
            { originalPrice: 1199, discountedPrice: 799, b2cPrice: 799 },
            { returnDocument: "after" }
        );
        if (stmt4) {
            console.log(`✅ Updated Statement Mug (4 cups) MRP -> ₹${stmt4.originalPrice}`);
            const cfg = await B2BProductConfig.findOne({ product: stmt4._id });
            if (cfg && cfg.tiers) {
                cfg.tiers.forEach((t) => {
                    t.discountPercentage = Math.max(0, Math.min(100, Math.round(((1199 - t.unitPrice) / 1199) * 100)));
                });
                await cfg.save();
            }
        }

        // 3. Classic Mug - 2 Cups (Set of 2) -> MRP 799
        let classic2 = await Product.findOneAndUpdate(
            { slug: { $in: ["classic-mug-set-of-2", "classic-mug-300-ml"] } },
            {
                name: "Classic Mug - Set of 2",
                slug: "classic-mug-set-of-2",
                sku: "GF-CLASSIC-MUG-SET2",
                unit: "set",
                originalPrice: 799,
                discountedPrice: 499,
                b2cPrice: 499,
                b2bPrice: 210,
                tagline: "Eco-friendly 300ml classic ribbed coffee mugs made with rice husk biocomposite",
                shortDescription: "Set of 2 classic coffee mugs, 300 ml, made with rice husk biocomposite. Microwave & dishwasher safe.",
                description: "Classic Coffee Mug – Set of 2, 300 ml, crafted from BioDur biocomposite using agricultural rice husk waste. Lightweight, durable, and food-contact safe, ideal for coffee, tea, and daily beverages.",
                material: "Rice Husk Biocomposite",
                size: "300 ml",
                color: "Off White, Coffee",
                colors: [
                    { name: "Off White", hex: "#F2EEE2", stock: 600, images: ["/products/classic-mug-300-ml.jpg"] },
                    { name: "Coffee", hex: "#6F4E37", stock: 600, images: ["/products/classic-mug-300-ml.jpg"] },
                ],
                images: ["/products/classic-mug-300-ml.jpg"],
                specs: {
                    "Set Contents": "2 Classic Mugs",
                    "Material": "Rice Husk Biocomposite",
                    "Capacity": "300 ml per mug",
                    "Product Weight": "95 gm per mug (190 gm total)",
                    "Microwave Safe": "Yes",
                    "Dishwasher Safe": "Yes",
                    "BPA Free": "Yes",
                    "Reusable": "Yes",
                    "Eco Friendly": "Yes",
                },
                stockQuantity: 1200,
                isActive: true,
                isFeatured: true,
            },
            { returnDocument: "after", upsert: true }
        );
        console.log(`✅ Updated Classic Mug (2 cups) MRP -> ₹${classic2.originalPrice}`);

        await B2BProductConfig.findOneAndUpdate(
            { product: classic2._id },
            {
                product: classic2._id,
                isEnabled: true,
                basePrice: 210,
                moq: 25,
                stepQuantity: 5,
                sampleAvailable: true,
                samplePrice: 299,
                tiers: [
                    {
                        tierLabel: "Starter Bulk",
                        minQty: 25,
                        maxQty: 99,
                        unitPrice: 210,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((799 - 210) / 799) * 100))),
                        leadTime: "5 - 7 business days",
                        includedCustomizationsCount: 1,
                        benefits: ["74% Wholesale Savings vs MRP", "Standard Box Packaging"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                    },
                    {
                        tierLabel: "Corporate Recommended",
                        minQty: 100,
                        maxQty: 499,
                        unitPrice: 175,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((799 - 175) / 799) * 100))),
                        popular: true,
                        badge: "★ MOST POPULAR",
                        leadTime: "7 - 10 business days",
                        includedCustomizationsCount: 2,
                        benefits: ["78% Wholesale Savings vs MRP", "FREE Corporate Logo Printing on Both Mugs"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                        customizationPriceOverrides: [{ optionKey: "logo_print", pricePerUnit: 0, isFree: true }],
                    },
                    {
                        tierLabel: "Enterprise Volume",
                        minQty: 500,
                        maxQty: null,
                        unitPrice: 145,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((799 - 145) / 799) * 100))),
                        badge: "BEST VALUE",
                        leadTime: "10 - 14 business days",
                        includedCustomizationsCount: 3,
                        benefits: ["82% Wholesale Savings vs MRP", "FREE Logo Printing + FREE Custom Box Sleeve"],
                        enabledCustomizationKeys: ["logo_print", "laser_engrave"],
                    },
                ],
                customizationOptions: [
                    {
                        key: "logo_print",
                        label: "Single Color Screen Print on Both Mugs",
                        description: "Screen print corporate logo on both mugs",
                        type: "print",
                        tag: "Logo Print",
                        isPriced: true,
                        pricePerUnit: 15,
                        moq: 25,
                        isActive: true,
                    },
                    {
                        key: "laser_engrave",
                        label: "Laser Etched Logo",
                        description: "Permanent laser etching",
                        type: "engraving",
                        tag: "Laser Etched",
                        isPriced: true,
                        pricePerUnit: 20,
                        moq: 50,
                        isActive: true,
                    },
                ],
            },
            { returnDocument: "after", upsert: true }
        );

        // 4. Classic Mug - 4 Cups (Set of 4) -> MRP 1199
        let classic4 = await Product.findOneAndUpdate(
            { slug: "classic-mug-set-of-4" },
            {
                name: "Classic Mug - Set of 4",
                slug: "classic-mug-set-of-4",
                sku: "GF-CLASSIC-MUG-SET4",
                unit: "set",
                category: drinkwareCat ? drinkwareCat._id : undefined,
                originalPrice: 1199,
                discountedPrice: 749,
                b2cPrice: 749,
                b2bPrice: 380,
                tagline: "Earth-friendly 300ml classic ribbed coffee mugs set of 4",
                shortDescription: "Set of 4 classic coffee mugs, 300 ml, made with rice husk biocomposite. Microwave & dishwasher safe.",
                description: "Classic Coffee Mug – Set of 4, 300 ml each, crafted from BioDur biocomposite using agricultural rice husk waste. Lightweight, durable, impact-resistant, and food-contact safe.",
                material: "Rice Husk Biocomposite",
                size: "300 ml",
                color: "Off White, Coffee",
                colors: [
                    { name: "Off White", hex: "#F2EEE2", stock: 600, images: ["/products/classic-mug-300-ml.jpg"] },
                    { name: "Coffee", hex: "#6F4E37", stock: 600, images: ["/products/classic-mug-300-ml.jpg"] },
                ],
                images: ["/products/classic-mug-300-ml.jpg"],
                specs: {
                    "Set Contents": "4 Classic Mugs",
                    "Material": "Rice Husk Biocomposite",
                    "Capacity": "300 ml per mug",
                    "Product Weight": "95 gm per mug (380 gm total)",
                    "Microwave Safe": "Yes",
                    "Dishwasher Safe": "Yes",
                    "BPA Free": "Yes",
                    "Reusable": "Yes",
                    "Eco Friendly": "Yes",
                },
                stockQuantity: 1200,
                isActive: true,
                isFeatured: true,
            },
            { returnDocument: "after", upsert: true }
        );
        console.log(`✅ Updated Classic Mug (4 cups) MRP -> ₹${classic4.originalPrice}`);

        await B2BProductConfig.findOneAndUpdate(
            { product: classic4._id },
            {
                product: classic4._id,
                isEnabled: true,
                basePrice: 380,
                moq: 20,
                stepQuantity: 5,
                sampleAvailable: true,
                samplePrice: 550,
                tiers: [
                    {
                        tierLabel: "Starter Bulk",
                        minQty: 20,
                        maxQty: 49,
                        unitPrice: 380,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((1199 - 380) / 1199) * 100))),
                        leadTime: "5 - 7 business days",
                        includedCustomizationsCount: 1,
                        benefits: ["68% Wholesale Savings vs MRP", "Individual 4-Mug Box Packaging"],
                        enabledCustomizationKeys: ["logo_print_4mugs"],
                    },
                    {
                        tierLabel: "Corporate Recommended",
                        minQty: 50,
                        maxQty: 199,
                        unitPrice: 330,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((1199 - 330) / 1199) * 100))),
                        popular: true,
                        badge: "★ MOST POPULAR",
                        leadTime: "7 - 10 business days",
                        includedCustomizationsCount: 2,
                        benefits: ["72% Wholesale Savings vs MRP", "FREE Corporate Logo Printing on all 4 Mugs"],
                        enabledCustomizationKeys: ["logo_print_4mugs"],
                        customizationPriceOverrides: [{ optionKey: "logo_print_4mugs", pricePerUnit: 0, isFree: true }],
                    },
                    {
                        tierLabel: "Enterprise Volume",
                        minQty: 200,
                        maxQty: null,
                        unitPrice: 285,
                        discountPercentage: Math.max(0, Math.min(100, Math.round(((1199 - 285) / 1199) * 100))),
                        badge: "BEST VALUE",
                        leadTime: "10 - 14 business days",
                        includedCustomizationsCount: 3,
                        benefits: ["76% Wholesale Savings vs MRP", "FREE Logo Printing on 4 Mugs + FREE Custom Gift Box Sleeve"],
                        enabledCustomizationKeys: ["logo_print_4mugs"],
                    },
                ],
                customizationOptions: [
                    {
                        key: "logo_print_4mugs",
                        label: "Single Color Screen Print on all 4 Mugs",
                        description: "Screen print corporate logo on all 4 mugs",
                        type: "print",
                        tag: "Logo Print",
                        isPriced: true,
                        pricePerUnit: 25,
                        moq: 20,
                        isActive: true,
                    },
                ],
            },
            { returnDocument: "after", upsert: true }
        );

        // 5. Tissue Box - Pair of 2 -> MRP 1699
        const tissue = await Product.findOneAndUpdate(
            { slug: { $in: ["tissue-box-pair-of-2", "velvata-tissue-box"] } },
            { originalPrice: 1699, discountedPrice: 999, b2cPrice: 999 },
            { returnDocument: "after" }
        );
        if (tissue) {
            console.log(`✅ Updated Tissue Box (Pair of 2) MRP -> ₹${tissue.originalPrice}`);
            const cfg = await B2BProductConfig.findOne({ product: tissue._id });
            if (cfg && cfg.tiers) {
                cfg.tiers.forEach((t) => {
                    t.discountPercentage = Math.max(0, Math.min(100, Math.round(((1699 - t.unitPrice) / 1699) * 100)));
                });
                await cfg.save();
            }
        }

        // 6. Canister 700 ml -> MRP 1299
        const canister = await Product.findOneAndUpdate(
            { slug: { $in: ["canister-700-ml", "canister"] } },
            { originalPrice: 1299, discountedPrice: 799, b2cPrice: 799 },
            { returnDocument: "after" }
        );
        if (canister) {
            console.log(`✅ Updated Canister MRP -> ₹${canister.originalPrice}`);
            const cfg = await B2BProductConfig.findOne({ product: canister._id });
            if (cfg && cfg.tiers) {
                cfg.tiers.forEach((t) => {
                    t.discountPercentage = Math.max(0, Math.min(100, Math.round(((1299 - t.unitPrice) / 1299) * 100)));
                });
                await cfg.save();
            }
        }

        // 7. Table Top Planter -> MRP 1499
        const planter = await Product.findOneAndUpdate(
            { slug: { $in: ["table-top-planter-4-inch", "statement-table-top-planter", "romano-planter"] } },
            { originalPrice: 1499, discountedPrice: 899, b2cPrice: 899 },
            { returnDocument: "after" }
        );
        if (planter) {
            console.log(`✅ Updated Table Top Planter MRP -> ₹${planter.originalPrice}`);
            const cfg = await B2BProductConfig.findOne({ product: planter._id });
            if (cfg && cfg.tiers) {
                cfg.tiers.forEach((t) => {
                    t.discountPercentage = Math.max(0, Math.min(100, Math.round(((1499 - t.unitPrice) / 1499) * 100)));
                });
                await cfg.save();
            }
        }

        console.log("\n=================================================");
        console.log("             B2B MRP UPDATE SUMMARY");
        console.log("=================================================");
        console.log("1. Statement Mug (2 Cups):    ₹899 MRP");
        console.log("2. Statement Mug (4 Cups):    ₹1199 MRP");
        console.log("3. Classic Mug (2 Cups):      ₹799 MRP");
        console.log("4. Classic Mug (4 Cups):      ₹1199 MRP");
        console.log("5. Tissue Box (Pair of 2):    ₹1699 MRP");
        console.log("6. Canister:                  ₹1299 MRP");
        console.log("7. Table Top Planter (4\"):    ₹1499 MRP");
        console.log("=================================================\n");

        await mongoose.disconnect();
        console.log("✅ All B2B MRPs updated successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error updating B2B MRPs:", err);
        process.exit(1);
    }
};

updateB2BMrps();
