import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const syncDiscountedPrices = async () => {
    await connectDB();

    const products = await Product.find({});
    console.log(`Found ${products.length} products in DB.`);

    let updatedCount = 0;
    for (const p of products) {
        const orig = Number(p.originalPrice) || 0;
        const currentDisc = Number(p.discountedPrice) || 0;

        // If discountedPrice is 0 or unset, or equal/greater than originalPrice
        if (orig > 0 && (currentDisc === 0 || currentDisc >= orig)) {
            const newDisc = Math.round(orig * 0.80);
            p.discountedPrice = newDisc;
            if (!p.b2cPrice) {
                p.b2cPrice = newDisc;
            }
            await p.save();
            console.log(`Updated ${p.name} (${p.slug}): MRP ₹${orig} -> Discounted ₹${newDisc}`);
            updatedCount++;
        } else {
            console.log(`Skipped ${p.name}: already has valid discountedPrice ₹${currentDisc} (MRP ₹${orig})`);
        }
    }

    console.log(`\n🎉 Completed! Updated ${updatedCount} products.`);
    process.exit(0);
};

syncDiscountedPrices().catch((err) => {
    console.error("❌ Error syncing discounted prices:", err);
    process.exit(1);
});
