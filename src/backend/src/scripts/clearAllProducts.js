import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";

async function clearProducts() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await connectDB();

        const countBefore = await Product.countDocuments();
        console.log(`Current product count in database: ${countBefore}`);

        const result = await Product.deleteMany({});
        console.log(`Deleted ${result.deletedCount} products from the database.`);

        const countAfter = await Product.countDocuments();
        console.log(`Products remaining in database: ${countAfter}`);

        console.log("\n All product data has been completely removed.");
        process.exit(0);
    } catch (err) {
        console.error("Error clearing products:", err);
        process.exit(1);
    }
}

clearProducts();
