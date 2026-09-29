import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const deskGiftSetData = {
  name: "Desk Gift Set",
  categoryName: "Gift Boxes & Hampers",
  subCategory: null,
  unit: "set",

  tagline: "Premium eco-friendly kitchen and dining gift set made with rice husk biocomposite",

  shortDescription: "A premium collection of eco-friendly kitchen and dining essentials made with BioDur rice husk biocomposite.",

  description: "A premium kitchen and dining gift set featuring carefully selected reusable products made with BioDur rice husk biocomposite. The set combines everyday dining and serving essentials including bowls, plates, cutlery, serving spoons, a serving tray and casserole. Designed for corporate gifting, festive gifting and premium sustainable gifting.",

  productFeatures: [
    "Complete kitchen and dining gift set",
    "Made with rice husk and crop-waste biocomposite",
    "Food contact safe",
    "Reusable products",
    "Lightweight and durable",
    "Eco-friendly alternative to conventional plastic tableware",
    "Suitable for corporate and premium gifting",
    "Multiple kitchen and dining essentials included"
  ],

  collectionName: "BioDur Gift Collection",

  leadTime: "7 - 10 business days",

  branding: true,

  brandingTypes: [
    "Custom Logo Printing",
    "Custom Packaging",
    "Custom Belly Band",
    "Custom Branded Gift Box"
  ],

  size: "Premium Gift Set",

  material: "BioDur Rice Husk & Crop-Waste Biocomposite",

  specs: {
    "Set Type": "Kitchen & Dining Gift Set",
    "Number of Product Types": "8",
    "Food Contact Safe": "Yes",
    "Reusable": "Yes",
    "Eco Friendly": "Yes",
    "Country of Origin": "India"
  },

  giftSetContents: {
    totalProductTypes: 8,

    products: [
      {
        name: "Small Cutlery",
        quantity: 1,
        unit: "set",
        description: "Earth-friendly reusable small cutlery made with rice husk biocomposite. Lightweight, durable and designed for everyday dining and convenient use.",
        material: "Rice Husk Biocomposite",
        size: "6 inch",
        color: "Off white",
        specifications: {
          "Product Weight": "15 gm",
          "Product Length": "15.5 cm",
          "Product Width": "3.5 cm",
          "Product Height": "2.5 cm",
          "Food Contact Safe": "Yes",
          "Dishwasher Safe": "Yes",
          "Microwave Safe": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with rice husk biocomposite",
          "Food contact safe",
          "Dishwasher safe",
          "Microwave suitable",
          "Lightweight",
          "Reusable",
          "Eco-friendly"
        ]
      },

      {
        name: "Aura Bowl",
        quantity: 1,
        unit: "set",
        description: "Aura Bowls crafted from BioDur rice husk biocomposite. Lightweight 300 ml bowls suitable for curry, snacks and hot or cold serving.",
        material: "Rice Husk Biocomposite",
        size: "300 ml",
        color: "Off white",
        specifications: {
          "Set Contents": "5 Bowls",
          "Capacity": "300 ml",
          "Product Weight": "40 gm",
          "Product Length": "10.5 cm",
          "Product Width": "11 cm",
          "Product Height": "11 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Safe": "Yes (reheat)",
          "Dishwasher Safe": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with BioDur rice husk biocomposite",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact-resistant",
          "UV stabilized",
          "Suitable for hot and cold serving"
        ]
      },

      {
        name: "Flora Soup Bowl",
        quantity: 1,
        unit: "set",
        description: "Flora Soup Bowls made from BioDur rice husk biocomposite, suitable for soup, ice cream and fruit serving.",
        material: "Rice Husk Biocomposite",
        size: "350 ml",
        color: "Light Pink, Light Green",
        specifications: {
          "Set Contents": "4 Soup Bowls",
          "Capacity": "350 ml",
          "Product Weight": "125 gm",
          "Product Length": "13 cm",
          "Product Width": "13 cm",
          "Product Height": "6 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Safe": "Yes (reheat)",
          "Dishwasher Safe": "Yes",
          "BPA Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with BioDur rice husk biocomposite",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact-resistant",
          "UV stabilized",
          "Suitable for soup, ice cream and fruit"
        ]
      },

      {
        name: "Round Dinner Plate",
        quantity: 1,
        unit: "set",
        description: "Unbreakable 11-inch dinner plates made with BioDur rice husk biocomposite. Designed for everyday meals and a sustainable alternative to conventional tableware.",
        material: "Rice Husk Biocomposite",
        size: "11 inch",
        color: "Off white",
        specifications: {
          "Set Contents": "5 Round Dinner Plates",
          "Product Weight": "210 gm",
          "Product Length": "27 cm",
          "Product Width": "27 cm",
          "Product Height": "2 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "BPA & Formaldehyde Free": "Yes",
          "Unbreakable": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with BioDur rice husk biocomposite",
          "Unbreakable",
          "Lightweight",
          "Impact-resistant",
          "Food contact safe",
          "Earth friendly",
          "Alternative to plastic, glass, melamine and ceramic"
        ]
      },

      {
        name: "Serving Tray",
        quantity: 1,
        unit: "set",
        description: "15-inch serving tray set made with BioDur rice husk biocomposite, ideal for serving tea, coffee and snacks and organizing the dining table.",
        material: "Rice Husk Biocomposite",
        size: "15 inch",
        color: "Off white",
        specifications: {
          "Set Contents": "2 Serving Trays",
          "Product Weight": "450 gm",
          "Product Length": "38 cm",
          "Product Width": "21 cm",
          "Product Height": "2 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "BPA Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with BioDur rice husk biocomposite",
          "Lightweight",
          "Impact-resistant",
          "Food contact safe",
          "Ideal for tea, coffee and snacks",
          "Dining table organizer",
          "UV stabilized"
        ]
      },

      {
        name: "Casserole",
        quantity: 1,
        unit: "piece",
        description: "2200 ml casserole with lid made from BioDur crop-waste biocomposite. Lightweight, impact-resistant and suitable for microwave reheating and dishwasher use.",
        material: "BioDur Crop-Waste Biocomposite",
        size: "2200 ml",
        color: "Off white",
        specifications: {
          "Set Contents": "1 Casserole with Lid",
          "Capacity": "2200 ml",
          "Product Weight": "650 gm",
          "Product Length": "24.5 cm",
          "Product Width": "24.5 cm",
          "Product Height": "10.5 cm",
          "Food Contact Safe": "Yes",
          "Microwave Suitable": "Yes (reheat)",
          "Dishwasher Suitable": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Made with BioDur crop-waste biocomposite",
          "Comes with lid",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact-resistant",
          "Reusable"
        ]
      },

      {
        name: "Serving Spoon",
        quantity: 1,
        unit: "set",
        description: "Set of 3 serving spoons made from BioDur crop-waste biocomposite. Lightweight, reusable and designed for everyday serving.",
        material: "BioDur Crop-Waste Biocomposite",
        size: "8.5 inch",
        color: "Off white",
        specifications: {
          "Set Contents": "3 Serving Spoons",
          "Product Weight": "4 gm per spoon",
          "Product Length": "22 cm",
          "Product Width": "7 cm",
          "Product Height": "0.5 cm",
          "Food Contact Safe": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Set of 3 serving spoons",
          "Made with BioDur crop-waste biocomposite",
          "Food contact safe",
          "Lightweight",
          "Impact-resistant",
          "Reusable",
          "Eco-friendly"
        ]
      },

      {
        name: "Quarter Plate",
        quantity: 1,
        unit: "set",
        description: "Set of 4 unbreakable 8-inch round plates made from BioDur rice husk biocomposite. Ideal for kids, breakfast and everyday meals.",
        material: "Rice Husk Biocomposite",
        size: "8 inch",
        color: "Off white",
        specifications: {
          "Set Contents": "4 Plates",
          "Product Weight": "100 gm per plate",
          "Product Length": "20 cm",
          "Product Width": "20 cm",
          "Product Height": "2 cm",
          "Food Contact Safe": "Yes",
          "Microwave Suitable": "Yes (reheat)",
          "Dishwasher Suitable": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes"
        },
        features: [
          "Set of 4 round plates",
          "Made with rice husk biocomposite",
          "Unbreakable",
          "Lightweight",
          "Impact-resistant",
          "Suitable for kids",
          "Suitable for breakfast and everyday meals",
          "Microwave suitable for reheating",
          "Dishwasher suitable"
        ]
      }
    ]
  },

  popular: false,
  isFeatured: true,
  isActive: true,

  tags: [
    "giftSet",
    "corporateGift",
    "premiumGift",
    "kitchenGift",
    "diningGift",
    "ecoFriendly",
    "riceHusk",
    "bioDur",
    "sustainableGift",
    "tableware",
    "kitchenware"
  ],

  productWeight: {
    value: 0,
    unit: "gm"
  },

  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: "cm"
  },

  careInstructions: "Follow the individual care instructions provided for each product included in the gift set. Avoid harsh scrubs, strong chemicals, excessive heat and prolonged direct sunlight.",

  sustainability: {
    madeWith: "BioDur biocomposite using rice husk and agricultural crop-waste with food contact binders and additives",
    highlights: [
      "Reduces waste disposal",
      "Reduces crop burning",
      "Reduces fossil dependency",
      "Locks biogenic carbon",
      "Reusable products",
      "QR code with purchase showing the sustainability footprint of the product"
    ]
  },

  package: {
    contents: "Small Cutlery Set, Aura Bowl Set, Flora Soup Bowl Set, Round Dinner Plate Set, Serving Tray Set, Casserole with Lid, Serving Spoon Set and Quarter Plate Set",
    type: "Premium Gift Box",
    giftBoxImages: [],
    deadWeight: "",
    length: "",
    width: "",
    height: "",
    itemsPerPackage: "1 Gift Set",
    packerDetails: "",
    countryOfOrigin: "India"
  },

  images: [],

  colors: [
    {
      name: "Mixed / Product Assortment",
      hex: "#F2EEE2",
      images: [],
      stock: 0
    }
  ],

  giftBoxImages: [],

  giftPackaging: {
    available: true,
    images: [],
    title: "Premium Corporate Gift Box",
    description: "Premium gift packaging designed for corporate, festive and sustainable gifting. Custom branding options can be provided.",
    pricePerBox: 0,
    customBrandingAvailable: true
  },

  originalPrice: 0,
  discountedPrice: 0,
  b2cPrice: null,

  stockQuantity: 0,

  b2bPrice: null,

  b2bPricing: {
    isEnabled: false,
    basePrice: null,
    moq: 1,
    stepQuantity: 1,
    sampleAvailable: false,
    samplePrice: null,
    tiers: []
  },

  tax: {
    hsnCode: "",
    gstRate: 18,
    isTaxInclusive: true
  },

  metaTitle: "Premium Eco-Friendly Kitchen & Dining Gift Set | GreenFibre",
  metaDescription: "Premium kitchen and dining gift set featuring rice husk biocomposite bowls, plates, cutlery, serving tray, casserole and serving spoons. Ideal for corporate and sustainable gifting.",
  metaKeywords: [
    "eco friendly gift set",
    "corporate gift set",
    "sustainable gift set",
    "kitchen gift set",
    "dining gift set",
    "rice husk gift set",
    "eco friendly corporate gifts",
    "BioDur gift set"
  ]
};

async function run() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });
    console.log("Connected to MongoDB Atlas (" + mongoose.connection.name + ")");

    // 1. Find or create Category
    let category = await Category.findOne({ name: deskGiftSetData.categoryName });
    if (!category) {
      category = await Category.create({
        name: deskGiftSetData.categoryName,
        slug: "gift-boxes-hampers",
        description: "Premium Eco-Friendly Gift Boxes & Hampers for corporate and festive gifting",
        isActive: true,
        isFeatured: true
      });
      console.log("Created Category:", category.name, category._id);
    } else {
      console.log("Found existing Category:", category.name, category._id);
    }

    // 2. Remove any previous product with the same name if exists
    await Product.deleteMany({ name: deskGiftSetData.name });

    // 3. Create Product
    const newProduct = await Product.create({
      ...deskGiftSetData,
      category: category._id,
      subCategory: null,
    });

    console.log("SUCCESS! Created Product:", {
      _id: newProduct._id,
      name: newProduct.name,
      slug: newProduct.slug,
      category: newProduct.category,
      unit: newProduct.unit,
      totalProductTypes: newProduct.giftSetContents?.totalProductTypes,
      itemsCount: newProduct.giftSetContents?.products?.length,
    });

    const totalCount = await Product.countDocuments();
    console.log(`Total products in DB now: ${totalCount}`);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error inserting product:", err);
    process.exit(1);
  }
}

run();
