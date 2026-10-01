import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config();

try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
    console.warn("Could not set custom DNS servers:", dnsErr.message);
}

const deleteSmallCutlery = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error("MONGO_URL is not defined in .env");
        }

        await mongoose.connect(mongoUrl, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

        // 1. Find product
        const product = await Product.findOne({
            $or: [
                { slug: "small-cutlery" },
                { name: /^Small cutlery$/i },
            ]
        });

        if (!product) {
            console.log("⚠️ No product found with slug 'small-cutlery' or name 'Small cutlery'. Checking by slug regex...");
            const altProduct = await Product.findOne({ slug: /small-cutlery/i });
            if (!altProduct) {
                console.log("❌ Product not found in database.");
                await mongoose.disconnect();
                process.exit(0);
            }
        }

        const targetProduct = product || (await Product.findOne({ slug: /small-cutlery/i }));
        const productId = targetProduct._id;

        console.log(`Found Product: "${targetProduct.name}" (ID: ${productId}, Slug: ${targetProduct.slug})`);

        // 2. Remove references from any B2BProductConfig additionalProducts
        const configRefUpdate = await B2BProductConfig.updateMany(
            { "additionalProducts.product": productId },
            { $pull: { additionalProducts: { product: productId } } }
        );
        console.log(`🧹 Cleaned references in B2BProductConfig additionalProducts: ${configRefUpdate.modifiedCount} documents updated.`);

        // 3. Remove references from any Product giftSetContents
        const productRefUpdate = await Product.updateMany(
            { "giftSetContents.products.product": productId },
            { $pull: { "giftSetContents.products": { product: productId } } }
        );
        console.log(`🧹 Cleaned references in other Product giftSetContents: ${productRefUpdate.modifiedCount} documents updated.`);

        // 4. Delete B2BProductConfig for this product
        const deletedConfig = await B2BProductConfig.deleteMany({ product: productId });
        console.log(`🗑️ Deleted B2BProductConfig entries: ${deletedConfig.deletedCount}`);

        // 5. Delete the Product
        const deletedProduct = await Product.findByIdAndDelete(productId);
        console.log(`🗑️ Deleted Product document: ${deletedProduct.name} (${deletedProduct._id})`);

        console.log("\n=================================================");
        console.log("       PRODUCT REMOVED SUCCESSFULLY");
        console.log("=================================================");
        console.log(`Deleted Product ID:   ${productId}`);
        console.log(`Deleted Product Name: ${targetProduct.name}`);
        console.log(`Deleted Product Slug: ${targetProduct.slug}`);
        console.log("=================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error deleting product:", err);
        process.exit(1);
    }
};

deleteSmallCutlery();
