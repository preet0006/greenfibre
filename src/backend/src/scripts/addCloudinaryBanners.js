import mongoose from "mongoose";
import dotenv from "dotenv";
import { Banner } from "../models/banner.model.js";
import { Category } from "../models/category.model.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const updateBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);

        // Find available categories
        const drinkwareCat = await Category.findOne({ slug: { $in: ["drinkware", "drinkware-and-bottles"] } }) || await Category.findOne();
        const tablewareCat = await Category.findOne({ slug: { $in: ["kitchen-and-dining", "tableware-and-dining", "kitchen-dining"] } }) || drinkwareCat;

        if (!drinkwareCat) {
            console.error("❌ No categories found in database. Please seed categories first.");
            process.exit(1);
        }

        console.log("Drinkware Category ID:", drinkwareCat._id, drinkwareCat.name);

        // Remove old mock / sample banners
        await Banner.deleteMany({ mediaType: "image" });
        console.log("Cleared old image banners");

        const newBanners = [
            {
                title: "Small Sips, Big Impact",
                subtitle: "Thoughtfully designed eco-friendly drinkware crafted from sustainable rice husk.",
                mediaType: "image",
                mediaUrl: "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543040/1_hero_small_sips_ltzdys.webp",
                category: drinkwareCat._id,
                isActive: true,
                order: 1,
            },
            {
                title: "",
                subtitle: "",
                mediaType: "image",
                mediaUrl: "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543040/06_last_pic_gqoc0e.png",
                category: tablewareCat ? tablewareCat._id : drinkwareCat._id,
                isActive: true,
                order: 2,
            },
        ];

        const inserted = await Banner.insertMany(newBanners);
        console.log(`✅ Successfully added ${inserted.length} Cloudinary banners!`);
        inserted.forEach(b => console.log(`  - [${b.order}] ${b.title}: ${b.mediaUrl}`));

        process.exit(0);
    } catch (err) {
        console.error("❌ Error updating banners:", err);
        process.exit(1);
    }
};

updateBanners();
