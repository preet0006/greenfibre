import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import { Product } from "../models/product.model.js";

dotenv.config();

const rawImageUrls = [
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683957/Untitled_-_September_29_2026_at_15.15.57-5_xfyfyb.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-6_d1mzxu.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-3_wsqdpr.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683952/Untitled_-_September_29_2026_at_15.15.57-4_otl9ej.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683950/Untitled_-_September_29_2026_at_15.15.57-2_tenhvl.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683950/Untitled_-_September_29_2026_at_16.14.45_2_zs21tw.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683948/Untitled_-_September_29_2026_at_15.15.57-1_nas9ls.png"
];

// Convert to webp format as requested
const webpImages = rawImageUrls.map((url) => url.replace(/\.png$/i, ".webp"));

async function renameAndAddImages() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    // Find the product by its previous name or slug
    const product = await Product.findOne({
      $or: [
        { name: /Premium Kitchen/i },
        { slug: "premium-kitchen-and-dining-gift-set" },
        { name: "Greenfibre Family Pack" },
        { slug: "greenfibre-family-pack" }
      ]
    });

    if (!product) {
      console.error("Target product not found in MongoDB!");
      process.exit(1);
    }

    // 1. Rename and update slug
    product.name = "Greenfibre Family Pack";
    product.slug = slugify("Greenfibre Family Pack", { lower: true, strict: true });

    // 2. Attach images
    product.images = webpImages;
    product.giftBoxImages = [webpImages[0]];

    if (product.colors && product.colors.length > 0) {
      product.colors[0].images = webpImages;
    } else {
      product.colors = [
        {
          name: "Mixed / Product Assortment",
          hex: "#F2EEE2",
          images: webpImages,
          stock: 100
        }
      ];
    }

    if (!product.giftPackaging) product.giftPackaging = {};
    product.giftPackaging.available = true;
    product.giftPackaging.images = [webpImages[0]];

    if (!product.package) product.package = {};
    product.package.giftBoxImages = [webpImages[0]];

    // 3. Save
    await product.save();

    console.log("SUCCESS! Product updated:");
    console.log("New Name:", product.name);
    console.log("New Slug:", product.slug);
    console.log("Total WebP Images:", product.images.length);
    console.log("Sample Image URL:", product.images[0]);
    console.log("Gift Box Image URL:", product.giftBoxImages[0]);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error updating product:", err);
    process.exit(1);
  }
}

renameAndAddImages();
