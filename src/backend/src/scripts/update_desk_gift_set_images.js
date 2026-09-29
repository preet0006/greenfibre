import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";

dotenv.config();

const imageUrls = [
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790679588/ChatGPT_Image_Sep_28_2026_09_12_46_PM_on1hu1.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790679583/01_water_bottle_and_mug_1254x1254_byyqir.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790679584/03_canister_1254x1254_oynwef.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790679585/02_planter_and_coasters_1254x1254_pmmeds.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790680473/planter_wzueb4.webp"
];

async function updateDeskGiftSetImages() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    const product = await Product.findOne({
      $or: [{ slug: "desk-gift-set" }, { name: "Desk Gift Set" }]
    });

    if (!product) {
      console.error("Desk Gift Set not found!");
      process.exit(1);
    }

    product.images = imageUrls;
    product.giftBoxImages = [imageUrls[0]];

    if (product.colors && product.colors.length > 0) {
      product.colors[0].images = imageUrls;
    } else {
      product.colors = [
        {
          name: "Natural Assortment",
          hex: "#F2EEE2",
          images: imageUrls,
          stock: 50
        }
      ];
    }

    if (!product.giftPackaging) product.giftPackaging = {};
    product.giftPackaging.available = true;
    product.giftPackaging.images = [imageUrls[0]];

    if (!product.package) product.package = {};
    product.package.giftBoxImages = [imageUrls[0]];

    await product.save();

    console.log("SUCCESS! Updated Desk Gift Set with images:");
    console.log("Product Name:", product.name);
    console.log("Primary Images Count:", product.images.length);
    console.log("Gift Box Images Count:", product.giftBoxImages.length);
    console.log("Color Variant Images Count:", product.colors[0]?.images?.length);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error updating images:", err);
    process.exit(1);
  }
}

updateDeskGiftSetImages();
