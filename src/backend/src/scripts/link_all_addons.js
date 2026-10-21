import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { B2BProductConfig } from "../models/b2bProductConfig.model.js";

dotenv.config({ path: "./.env" });

async function inspectAndLinkAddons() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB (${mongoose.connection.name})\n`);

        const allProducts = await Product.find({}, '_id name slug b2bPrice discountedPrice').lean();
        console.log("All products in database:");
        allProducts.forEach(p => console.log(`- [${p.slug}] "${p.name}" (ID: ${p._id})`));

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

inspectAndLinkAddons();
