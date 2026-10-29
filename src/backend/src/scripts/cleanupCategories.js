import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../db/connectDB.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

async function run() {
  await connectDB();
  console.log("Connected to DB");

  const categories = await Category.find({});
  console.log("Total categories in DB:", categories.length);

  for (const cat of categories) {
    const prodCount = await Product.countDocuments({ category: cat._id, isActive: true });
    console.log(`Category: ${cat.name} (${cat.slug}) -> ${prodCount} active products`);

    if (prodCount === 0) {
      cat.isActive = false;
      await cat.save();
      console.log(`  -> Deactivated empty category: ${cat.name}`);
    } else {
      // Find first product to ensure category has a real product image
      const firstProduct = await Product.findOne({ category: cat._id, isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      let firstImg = null;
      if (firstProduct) {
        if (firstProduct.mainImage) {
          firstImg = firstProduct.mainImage;
        } else if (firstProduct.thumbnail) {
          firstImg = firstProduct.thumbnail;
        } else if (firstProduct.colors?.[0]?.images?.[0]) {
          const f = firstProduct.colors[0].images[0];
          firstImg = typeof f === "string" ? f : f.card || f.original || f.medium || f.thumbnail;
        }
      }

      if (firstImg) {
        cat.image = firstImg;
        cat.isActive = true;
        await cat.save();
        console.log(`  -> Updated category image with first product image: ${firstImg}`);
      }
    }
  }

  console.log("Done cleanupCategories!");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
