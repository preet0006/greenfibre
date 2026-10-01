import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectDB } from "../db/connectDB.js";
import { Product } from "../models/product.model.js";

const updates = [
    {
        slug: "dining-gift-set",
        newName: "Eco Dining Set",
        matchNameRegex: /Dining Gift Set/i
    },
    {
        slug: "desk-gift-set",
        newName: "Eco Desk Set",
        matchNameRegex: /Desk Gift Set/i
    },
    {
        slug: "greenfibre-family-pack",
        newName: "Eco Green Fibre Family Pack",
        matchNameRegex: /Greenfibre Family Pack/i
    },
    {
        slug: "mini-gift-packaging",
        newName: "Eco Mini Gift Packaging",
        matchNameRegex: /Mini Gift Packaging/i
    }
];

async function renameProducts() {
    try {
        await connectDB();
        console.log("Connected to MongoDB");

        for (const item of updates) {
            const product = await Product.findOne({
                $or: [
                    { slug: item.slug },
                    { name: item.matchNameRegex }
                ]
            });

            if (product) {
                const oldName = product.name;
                product.name = item.newName;
                await product.save();
                console.log(`✅ Renamed [${product._id}]: "${oldName}" ➔ "${product.name}" (slug: ${product.slug})`);
            } else {
                console.log(`⚠️ Product matching ${item.slug} not found.`);
            }
        }

        const allProducts = await Product.find({}, 'name slug');
        console.log("\n📦 All Products in DB now:");
        allProducts.forEach(p => console.log(` - "${p.name}" (slug: ${p.slug})`));

        process.exit(0);
    } catch (err) {
        console.error("Error renaming products:", err);
        process.exit(1);
    }
}

renameProducts();
