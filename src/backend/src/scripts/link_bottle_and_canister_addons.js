import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

const linkBottleAndCanister = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})\n`);

        // 1. Find Canister Products
        const canisters = await Product.find({
            slug: { $in: ["canister-700-ml", "canister"] },
        });

        // 2. Find Bottle Products
        const bottles = await Product.find({
            slug: { $in: ["viora-water-bottle", "motiva-insulated-bottle", "eco-spring-insulated-bottle"] },
        });

        if (canisters.length === 0) {
            console.error("❌ No Canister product found!");
            process.exit(1);
        }

        if (bottles.length === 0) {
            console.error("❌ No Bottle products found!");
            process.exit(1);
        }

        const primaryCanister = canisters[0];
        const primaryBottle = bottles.find((b) => b.slug === "viora-water-bottle") || bottles[0];

        console.log(`📦 Primary Canister: ${primaryCanister.name} (${primaryCanister._id})`);
        console.log(`📦 Primary Bottle:   ${primaryBottle.name} (${primaryBottle._id})\n`);

        // 3. For every Bottle -> Add Canister as Add-On
        for (const bottle of bottles) {
            let b2bCfg = await B2BProductConfig.findOne({ product: bottle._id });
            if (!b2bCfg) {
                b2bCfg = new B2BProductConfig({
                    product: bottle._id,
                    isEnabled: true,
                    basePrice: bottle.b2bPrice || bottle.discountedPrice || 280,
                });
            }

            // Remove existing duplicate canister entries if any
            b2bCfg.additionalProducts = (b2bCfg.additionalProducts || []).filter(
                (ap) => ap.product && ap.product.toString() !== primaryCanister._id.toString()
            );

            // Push Canister as companion product
            b2bCfg.additionalProducts.push({
                product: primaryCanister._id,
                label: "Airtight Eco Canister 700ml",
                note: "Matching desk & kitchen storage companion crafted from rice husk",
                displayTrigger: "always",
                isSelectable: true,
                sortOrder: 1,
                isActive: true,
            });

            await b2bCfg.save();
            console.log(`🔗 Added Canister add-on to Bottle: "${bottle.name}" (${bottle.slug})`);
        }

        // 4. For every Canister -> Add Bottle as Add-On
        for (const canister of canisters) {
            let b2bCfg = await B2BProductConfig.findOne({ product: canister._id });
            if (!b2bCfg) {
                b2bCfg = new B2BProductConfig({
                    product: canister._id,
                    isEnabled: true,
                    basePrice: canister.b2bPrice || canister.discountedPrice || 1299,
                });
            }

            // Remove existing duplicate bottle entries if any
            b2bCfg.additionalProducts = (b2bCfg.additionalProducts || []).filter(
                (ap) => ap.product && ap.product.toString() !== primaryBottle._id.toString()
            );

            // Push Bottle as companion product
            b2bCfg.additionalProducts.push({
                product: primaryBottle._id,
                label: "Viora Eco Water Bottle 400ml",
                note: "Matching hydration companion with stainless steel inner & rice husk body",
                displayTrigger: "always",
                isSelectable: true,
                sortOrder: 1,
                isActive: true,
            });

            await b2bCfg.save();
            console.log(`🔗 Added Bottle add-on to Canister: "${canister.name}" (${canister.slug})`);
        }

        console.log("\n=================================================");
        console.log("   BOTTLE & CANISTER ADD-ONS LINKED SUCCESSFULLY!");
        console.log("=================================================");
        console.log("• Bottles now display Canister in additionalProducts");
        console.log("• Canisters now display Viora Bottle in additionalProducts");
        console.log("=================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error linking bottle and canister add-ons:", err);
        process.exit(1);
    }
};

linkBottleAndCanister();
