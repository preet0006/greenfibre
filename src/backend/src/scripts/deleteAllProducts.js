import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

dotenv.config();

import { Cart } from "../models/cart.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { Review } from "../models/review.model.js";

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

        // Clean up stale product references in carts, wishlists, and reviews
        const cartResult = await Cart.updateMany({}, { items: [], totalAmount: 0 });
        console.log(`🛒 Reset ${cartResult.modifiedCount} user carts.`);

        const wishlistResult = await Wishlist.deleteMany({});
        console.log(`❤️ Cleared ${wishlistResult.deletedCount} wishlists.`);

        const reviewResult = await Review.deleteMany({});
        console.log(`⭐ Cleared ${reviewResult.deletedCount} reviews.`);

        const countAfter = await Product.countDocuments();
        console.log(`📊 Products remaining in database: ${countAfter}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error deleting products:", error.message);
        process.exit(1);
    }
};

deleteAllProducts();
