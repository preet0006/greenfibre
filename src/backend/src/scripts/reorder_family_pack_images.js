import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

dotenv.config();

const primaryImage = "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683950/Untitled_-_September_29_2026_at_16.14.45_2_zs21tw.webp";

const otherImages = [
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683957/Untitled_-_September_29_2026_at_15.15.57-5_xfyfyb.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-6_d1mzxu.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-3_wsqdpr.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-4_otl9ej.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683950/Untitled_-_September_29_2026_at_15.15.57-2_tenhvl.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683948/Untitled_-_September_29_2026_at_15.15.57-1_nas9ls.webp"
];

const orderedImages = [primaryImage, ...otherImages.filter((img) => img !== primaryImage)];

async function reorderFamilyPackImages() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    const product = await Product.findOne({
      $or: [
        { slug: "greenfibre-family-pack" },
        { name: "Greenfibre Family Pack" }
      ]
    });

    if (!product) {
      console.error("Greenfibre Family Pack not found!");
      process.exit(1);
    }

    product.images = orderedImages;
    product.giftBoxImages = [primaryImage];

    if (product.colors && product.colors.length > 0) {
      product.colors[0].images = orderedImages;
    }

    if (product.giftPackaging) {
      product.giftPackaging.images = [primaryImage];
    }

    if (product.package) {
      product.package.giftBoxImages = [primaryImage];
    }

    await product.save();

    console.log("SUCCESS! Reordered images for Greenfibre Family Pack:");
    console.log("1st Image (Cover):", product.images[0]);
    console.log("2nd Image:", product.images[1]);
    console.log("Total Images:", product.images.length);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error reordering images:", err);
    process.exit(1);
  }
}

reorderFamilyPackImages();
