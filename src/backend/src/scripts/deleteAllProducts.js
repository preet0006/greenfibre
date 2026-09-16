import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

dotenv.config();

const deleteAllProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);

        const countBefore = await Product.countDocuments();
        console.log(`Found ${countBefore} products in database. Deleting...`);

        const result = await Product.deleteMany({});
        console.log(`🗑️ Successfully deleted ${result.deletedCount} products from database.`);

        const countAfter = await Product.countDocuments();
        console.log(`📊 Products remaining in database: ${countAfter}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error deleting products:", error.message);
        process.exit(1);
    }
};

deleteAllProducts();
