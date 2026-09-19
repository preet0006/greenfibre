import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

dotenv.config();

const verify = async () => {
    await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.MONGO_DB_NAME });
    
    console.log("=== ALL CATEGORIES ===");
    const cats = await Category.find().sort("displayOrder");
    for (const c of cats) {
        const count = await Product.countDocuments({ category: c._id });
        console.log(`📂 ${c.name} (slug: ${c.slug}) -> ${count} products`);
    }

    console.log("\n=== GIFT BOX PRODUCTS ===");
    const giftCat = await Category.findOne({ slug: "gift-boxes" });
    if (giftCat) {
        const giftProds = await Product.find({ category: giftCat._id });
        for (const p of giftProds) {
            console.log(`🎁 ${p.name}`);
            console.log(`   Slug: ${p.slug}`);
            console.log(`   Price: ₹${p.discountedPrice} (Original: ₹${p.originalPrice})`);
            console.log(`   Variants: ${p.colors.map(c => `${c.name} [Stock: ${c.stock}]`).join(", ")}`);
            console.log(`   Image: ${p.colors[0]?.images[0]}`);
            console.log(`   Features: ${Object.keys(p.features || {}).length} features defined\n`);
        }
    }

    const total = await Product.countDocuments();
    console.log(`Total Products in DB: ${total}`);
    process.exit(0);
};

verify().catch((err) => {
    console.error(err);
    process.exit(1);
});
