import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";
import { Cart } from "../models/cart.model.js";

async function cleanTestData() {
    try {
        await connectDB();
        console.log("Connected to MongoDB");

        // Find test products (Eco-Luxe Insulated Tumbler, Bamboo Fiber Executive Diary, or other test entries)
        const testProducts = await Product.find({
            $or: [
                { name: { $regex: /Eco-Luxe Insulated Tumbler/i } },
                { slug: { $regex: /eco-luxe-tumbler/i } },
                { name: { $regex: /Bamboo Fiber Executive Diary/i } },
                { slug: { $regex: /executive-diary/i } },
                { slug: { $regex: /test/i } },
                { name: { $regex: /test product/i } }
            ]
        });

        console.log(`Found ${testProducts.length} test product(s):`);
        const productIds = testProducts.map(p => p._id);
        testProducts.forEach(p => {
            console.log(` - [${p._id}] "${p.name}" (slug: ${p.slug})`);
        });

        if (productIds.length > 0) {
            // Delete B2BProductConfigs for these test products
            const deletedConfigs = await B2BProductConfig.deleteMany({
                product: { $in: productIds }
            });
            console.log(`Deleted ${deletedConfigs.deletedCount} associated B2BProductConfig document(s).`);

            // Remove test products from any Carts if present
            const updatedCarts = await Cart.updateMany(
                { "items.product": { $in: productIds } },
                { $pull: { items: { product: { $in: productIds } } } }
            );
            console.log(`Cleaned carts: ${updatedCarts.modifiedCount} cart(s) updated.`);

            // Delete the test products
            const deletedProducts = await Product.deleteMany({
                _id: { $in: productIds }
            });
            console.log(`Deleted ${deletedProducts.deletedCount} test Product document(s).`);
        } else {
            console.log("No test products matched the search criteria.");
        }

        // Check for any orphaned B2BProductConfigs (where product doesn't exist)
        const allConfigs = await B2BProductConfig.find({});
        const validProductIds = (await Product.find({}, '_id')).map(p => p._id.toString());
        const orphanedConfigIds = allConfigs
            .filter(c => !c.product || !validProductIds.includes(c.product.toString()))
            .map(c => c._id);

        if (orphanedConfigIds.length > 0) {
            const deletedOrphans = await B2BProductConfig.deleteMany({ _id: { $in: orphanedConfigIds } });
            console.log(`Deleted ${deletedOrphans.deletedCount} orphaned B2BProductConfig document(s).`);
        }

        // Check remaining products
        const remainingProducts = await Product.find({}, 'name slug category');
        console.log("\nRemaining real products in DB:");
        remainingProducts.forEach(p => {
            console.log(` - "${p.name}" (slug: ${p.slug})`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error cleaning test data:", err);
        process.exit(1);
    }
}

cleanTestData();
