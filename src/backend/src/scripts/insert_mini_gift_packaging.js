import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const rawImages = [
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683936/Eco_Mini_Gift_set_le8wqj.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789639925/03_Top_View_nuryfa.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789639924/02_Elevated_jqbbxi.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789639923/04_Coffee_frrazk.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790243919/ChatGPT_Image_Sep_24_2026_03_21_42_PM_3_erisp8.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790243920/ChatGPT_Image_Sep_24_2026_03_21_41_PM_2_uquvy6.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790243920/ChatGPT_Image_Sep_24_2026_03_21_40_PM_1_bhf37u.png"
];

// Convert all .png to .webp
const webpImages = rawImages.map((url) => url.replace(/\.png$/i, ".webp"));

// Off White images vs Coffee images if distinguishable, or full set on both
const offWhiteImages = [
  webpImages[0],
  webpImages[1],
  webpImages[2],
  webpImages[4],
  webpImages[5],
  webpImages[6]
];

const coffeeImages = [
  webpImages[3],
  webpImages[0],
  webpImages[1],
  webpImages[2]
];

const miniGiftData = {
  name: "Mini Gift Packaging",
  categoryName: "Gift Boxes & Hampers",
  subCategoryName: "Mini Gift Sets",
  unit: "set",

  tagline: "A thoughtful eco-friendly mini gift set with statement mugs and coasters",

  shortDescription: "Mini gift set featuring 2 Statement Mugs and 4 Coasters with Stand, made from eco-friendly biocomposite materials.",

  description: "Mini Gift Packaging combines two Statement Mugs with four Coasters with Stand to create a stylish and practical eco-friendly gifting set. The Statement Mugs are made with rice husk and bamboo biocomposite, while the Coasters with Stand are crafted from rice husk biocomposite. Designed for everyday use and gifting, this set brings together sustainable drinkware and functional table accessories in one thoughtful package.",

  productFeatures: [
    "Includes 2 Statement Mugs",
    "Includes 4 Coasters with Stand",
    "Eco-friendly biocomposite products",
    "Statement Mugs made with rice husk & bamboo fibres",
    "Coasters made with rice husk biocomposite",
    "Lightweight and durable",
    "Reusable",
    "Food contact safe",
    "Microwave suitable mugs",
    "Dishwasher suitable mugs",
    "Suitable for hot and cold servings",
    "Ideal for gifting"
  ],

  collectionName: "Mini Gift Packaging",
  leadTime: "7 - 10 business days",
  branding: true,
  brandingTypes: [
    "Custom Logo Printing on Mug",
    "Custom Packaging",
    "Custom Belly Band"
  ],

  size: "Mini Gift Set",
  material: "Rice Husk & Bamboo Biocomposite",
  color: "Off White, Coffee",

  specs: {
    "Gift Set Contents": "2 Statement Mugs + 4 Coasters with Stand",
    "Statement Mug Quantity": "2",
    "Coaster Quantity": "4",
    "Mug Capacity": "350 ml",
    "Mug Material": "Rice Husk & Bamboo Biocomposite",
    "Coaster Material": "Rice Husk Biocomposite",
    "Mug Colors": "Off White, Coffee",
    "Coaster Color": "Off White",
    "Mug Microwave Safe": "Yes",
    "Mug Dishwasher Safe": "Yes",
    "Food Contact Safe": "Yes",
    "Reusable": "Yes",
    "Eco Friendly": "Yes"
  },

  giftSetContents: {
    totalProductTypes: 2,
    products: [
      {
        name: "Statement Mug",
        quantity: 2,
        unit: "piece",
        size: "350 ml",
        color: "Off White, Coffee",
        material: "Rice Husk & Bamboo Biocomposite",
        description: "Statement Coffee Mug made with rice husk and bamboo fibres using BioDur biocomposite. Lightweight, impact-resistant, food contact safe and suitable for hot and cold servings.",
        specifications: {
          "Capacity": "350 ml",
          "Product Weight": "110 gm",
          "Product Length": "11.5 cm",
          "Product Width": "8.5 cm",
          "Product Height": "9.5 cm",
          "Microwave Safe": "Yes",
          "Dishwasher Safe": "Yes",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "BPA Free": "Yes",
          "Reusable": "Yes"
        }
      },
      {
        name: "Coaster with Stand",
        quantity: 4,
        unit: "set",
        size: "10.5 × 10.5 × 7 cm",
        color: "Off White",
        material: "Rice Husk Biocomposite",
        description: "Reusable coasters with a matching stand, crafted from rice husk biocomposite and designed to protect tables and other surfaces from water marks, spills and heat.",
        specifications: {
          "Set Contents": "6 Coasters with 1 Stand",
          "Product Length": "10.5 cm",
          "Product Width": "10.5 cm",
          "Product Height": "7 cm",
          "Food Contact Safe": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes",
          "BPA & Formaldehyde Free": "Yes"
        }
      }
    ]
  },

  originalPrice: 0,
  discountedPrice: 0,
  b2cPrice: null,
  b2bPrice: null,

  b2bPricing: {
    isEnabled: true,
    basePrice: null,
    moq: 1,
    stepQuantity: 1,
    sampleAvailable: true,
    samplePrice: null,
    tiers: []
  },

  stockQuantity: 100,

  productWeight: {
    value: 380,
    unit: "gm"
  },

  dimensions: {
    length: 24,
    width: 14,
    height: 12,
    unit: "cm"
  },

  package: {
    contents: "2 Statement Mugs + 4 Coasters with Stand",
    type: "Mini Gift Packaging",
    giftBoxImages: [webpImages[0]],
    itemsPerPackage: "1 Mini Gift Set",
    countryOfOrigin: "India"
  },

  images: webpImages,
  giftBoxImages: [webpImages[0]],

  giftPackaging: {
    available: true,
    images: [webpImages[0]],
    title: "Eco Mini Gift Box",
    description: "Eco-friendly mini gift packaging with custom sleeve and branding option.",
    pricePerBox: 0,
    customBrandingAvailable: true
  },

  colors: [
    {
      name: "Off White",
      hex: "#F2EEE2",
      images: offWhiteImages,
      stock: 50
    },
    {
      name: "Coffee",
      hex: "#6F4E37",
      images: coffeeImages,
      stock: 50
    }
  ],

  careInstructions: "Avoid harsh scrubs during cleaning. Avoid toxic and strong chemicals. Avoid excess heat and direct sunlight. Wash mugs and coasters with mild soap and water.",

  sustainability: {
    madeWith: "BioDur biocomposite using crop-waste materials including rice husk and bamboo fibres with food-contact binders and additives",
    highlights: [
      "Reduce CO2 emissions",
      "Reduce waste disposal",
      "Reduce crop burning",
      "Reduce fossil dependency",
      "QR code with every purchase showing the sustainability footprint"
    ]
  },

  tax: {
    hsnCode: "39241090",
    gstRate: 18,
    isTaxInclusive: true
  },

  metaTitle: "Mini Gift Packaging | Statement Mugs & Coasters | GreenFibre",
  metaDescription: "Mini Gift Packaging featuring 2 Statement Mugs and 4 Coasters with Stand, made with eco-friendly rice husk and bamboo biocomposite.",
  metaKeywords: [
    "mini gift packaging",
    "mini gift set",
    "statement mug gift set",
    "eco friendly gift set",
    "mug and coaster gift set",
    "sustainable gift set",
    "corporate gift",
    "rice husk gift set"
  ],

  popular: false,
  isFeatured: true,
  isActive: true,

  tags: [
    "miniGiftPackaging",
    "miniGiftSet",
    "statementMug",
    "coasterWithStand",
    "ecoFriendly",
    "sustainableGift",
    "corporateGift",
    "drinkware",
    "tableware",
    "riceHusk",
    "bamboo"
  ]
};

async function run() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    // 1. Find or create Category
    let category = await Category.findOne({ name: miniGiftData.categoryName });
    if (!category) {
      category = await Category.create({
        name: miniGiftData.categoryName,
        slug: "gift-boxes-hampers",
        description: "Premium Eco-Friendly Gift Boxes & Hampers",
        isActive: true,
        isFeatured: true
      });
    }

    // 2. Find or create SubCategory
    let subCategory = await Category.findOne({ name: miniGiftData.subCategoryName });
    if (!subCategory) {
      subCategory = await Category.create({
        name: miniGiftData.subCategoryName,
        slug: slugify(miniGiftData.subCategoryName, { lower: true, strict: true }),
        parentCategory: category._id,
        description: "Mini Gift Sets for corporate and personal gifting",
        isActive: true,
        isFeatured: true
      });
      console.log("Created SubCategory:", subCategory.name, subCategory._id);
    }

    // 3. Remove existing product if present
    await Product.deleteMany({
      $or: [
        { name: miniGiftData.name },
        { slug: slugify(miniGiftData.name, { lower: true, strict: true }) }
      ]
    });

    // 4. Create Product
    const product = await Product.create({
      ...miniGiftData,
      slug: slugify(miniGiftData.name, { lower: true, strict: true }),
      category: category._id,
      subCategory: subCategory._id,
    });

    console.log("SUCCESS! Created Mini Gift Packaging:");
    console.log("ID:", product._id);
    console.log("Name:", product.name);
    console.log("Slug:", product.slug);
    console.log("Total Images:", product.images.length);
    console.log("Color Variants Count:", product.colors.length);
    console.log("Gift Set Content Items:", product.giftSetContents?.products?.length);

    const totalCount = await Product.countDocuments();
    console.log(`Total products in database now: ${totalCount}`);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error creating product:", err);
    process.exit(1);
  }
}

run();
