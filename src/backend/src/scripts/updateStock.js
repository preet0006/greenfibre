import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

dotenv.config();

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

const updateStock = async () => {
    await connectDB();

    const stockValue = 20;

    // Update all color variants for every product to stock: 20
    const result = await Product.updateMany(
        {},
        { $set: { "colors.$[].stock": stockValue } }
    );

    console.log(`\n📦 Bulk update completed!`);
    console.log(`   - Matched Products: ${result.matchedCount}`);
    console.log(`   - Modified Products: ${result.modifiedCount}`);

    // Verify and list updated products
    const products = await Product.find({}, "name slug colors");
    console.log(`\n📋 Current stock for all products:`);
    products.forEach((p, idx) => {
        const variantStock = p.colors.map((c) => `${c.name}: ${c.stock}`).join(", ");
        console.log(`   ${idx + 1}. ${p.name} (${p.slug}) -> [${variantStock}]`);
    });

    process.exit(0);
};

updateStock().catch((err) => {
    console.error("❌ Error updating stock:", err);
    process.exit(1);
});
