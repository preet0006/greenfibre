import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const rawImages = [
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683973/Eco-Dining_set-8_v0ygzy.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683973/Eco-Dining_set-7_pmtfo3.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683972/Eco-Dining_set-1_psljwj.webp",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683972/Eco-Dining_set-5_ebzshm.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683972/Eco-Dining_set-4_w5gtjo.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683972/Eco-Dining_set-3_jg2rri.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683972/Eco-Dining_set-6_o4qsuo.png",
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1790683971/Eco-Dining_set-2_aq37bs.png"
];

// Convert all .png to .webp
const webpImages = rawImages.map((url) => url.replace(/\.png$/i, ".webp"));

const diningGiftSetData = {
  name: "Dining Gift Set",
  categoryName: "Gift Boxes & Hampers",
  subCategory: null,
  unit: "set",

  tagline: "A premium earth-friendly dining gift set featuring sustainable tableware and serveware essentials",

  shortDescription: "A curated dining gift set featuring plates, bowls, cutlery, spoons and casseroles made from sustainable biocomposite materials.",

  description: "Dining Gift Set featuring a curated selection of earth-friendly dining and kitchen essentials made from BioDur biocomposites using rice husk, bamboo fibres and other crop-waste materials. The set includes dinner plates, quarter plates, bowls, cutlery, soup bowls with spoons, casseroles and serving spoons, making it suitable for premium gifting, corporate gifting, festive occasions and everyday dining.",

  productFeatures: [
    "Premium dining gift set",
    "Made with BioDur biocomposites",
    "Made using crop-waste materials",
    "Earth friendly",
    "Climate positive",
    "Lightweight and impact-resistant",
    "Reusable products",
    "Food contact safe products",
    "Microwave suitable products where applicable",
    "Dishwasher suitable products where applicable",
    "Suitable for corporate and personal gifting",
    "Made in India"
  ],

  collectionName: "BioDur Dining Collection",
  leadTime: "7 - 10 business days",
  branding: true,
  brandingTypes: [
    "Custom Logo Printing",
    "Custom Packaging",
    "Custom Belly Band",
    "Custom Branded Gift Box"
  ],

  size: "Executive Dining Set",
  material: "BioDur Crop-Waste Biocomposites",
  color: "Multiple colours",

  specs: {
    "Gift Set Contents": "10 product types",
    "Total Product Types": "10",
    "Country of Origin": "India"
  },

  giftSetContents: {
    totalProductTypes: 10,
    products: [
      {
        name: "Round Dinner Plate",
        quantity: 5,
        unit: "piece",
        size: "11 inch",
        color: "Off white",
        material: "Rice Husk Biocomposite",
        description: "Earth-friendly round dinner plates made from rice husk biocomposite, designed for everyday dining with a lightweight, durable and reusable construction.",
        specifications: {
          "Set Contents": "5 Dinner Plates",
          "Size": "11 inch",
          "Product Weight": "210 gm",
          "Product Length": "27 cm",
          "Product Width": "27 cm",
          "Product Height": "2 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "BPA & Formaldehyde Free": "Yes",
          "Unbreakable": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Food contact safe",
          "Heat resistant up to 100°C",
          "TUV tested",
          "BPA free",
          "Formaldehyde free",
          "Unbreakable",
          "Reusable",
          "Eco friendly"
        ]
      },
      {
        name: "Quarter Plate",
        quantity: 5,
        unit: "piece",
        size: "8 inch",
        color: "Off white",
        material: "Rice Husk Biocomposite",
        description: "Earth-friendly quarter plates designed for kids, breakfast and everyday meals, made from durable rice husk biocomposite.",
        specifications: {
          "Set Contents": "4 Quarter Plates",
          "Size": "8 inch",
          "Product Weight": "100 gm per plate",
          "Product Length": "20 cm",
          "Product Width": "20 cm",
          "Product Height": "2 cm",
          "Food Contact Safe": "Yes",
          "Microwave Reheat": "Yes",
          "Dishwasher": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "BPA free",
          "Formaldehyde free",
          "Reusable",
          "Eco friendly",
          "Suitable for kids",
          "Suitable for breakfast",
          "Suitable for everyday meals"
        ]
      },
      {
        name: "Aura Bowl",
        quantity: 5,
        unit: "piece",
        size: "300 ml",
        color: "Off white",
        material: "Rice Husk Biocomposite",
        description: "Aura Bowls made from BioDur rice husk biocomposite. These lightweight and impact-resistant bowls are designed for everyday dining and are suitable for hot and cold servings.",
        specifications: {
          "Set Contents": "5 Bowls",
          "Capacity": "300 ml",
          "Product Weight": "40 gm",
          "Product Length": "10.5 cm",
          "Product Width": "11 cm",
          "Product Height": "11 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Reheat": "Yes",
          "Dishwasher": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "UV Stabilized": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Made with BioDur rice husk biocomposite",
          "Earth friendly",
          "Climate positive",
          "Food contact safe",
          "Heat resistant up to 100°C",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact resistant",
          "BPA free",
          "Formaldehyde free",
          "UV stabilized",
          "Suitable for hot and cold servings"
        ]
      },
      {
        name: "Small Cutlery",
        quantity: 5,
        unit: "set",
        size: "6 inch",
        color: "Off white",
        material: "Rice Husk Biocomposite",
        description: "Reusable small cutlery made from rice husk biocomposite. Lightweight and durable, designed for everyday dining use.",
        specifications: {
          "Set Contents": "Small cutlery",
          "Size": "6 inch",
          "Product Weight": "15 gm",
          "Product Length": "15.5 cm",
          "Product Width": "3.5 cm",
          "Product Height": "2.5 cm",
          "Food Contact Safe": "Yes",
          "Dishwasher": "Yes",
          "Microwave": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Made with rice husk biocomposite",
          "Earth friendly",
          "Lightweight",
          "Durable",
          "Dishwasher suitable",
          "Microwave suitable",
          "Food contact safe",
          "Reusable",
          "Eco friendly"
        ]
      },
      {
        name: "Soup Bowl",
        quantity: 5,
        unit: "set",
        size: "250 ml",
        color: "Light Green, Charcoal",
        material: "Bamboo Fibre & Rice Husk Biocomposite",
        description: "Soup Bowl 250 ml Set of 4 with spoon, crafted from BioDur biocomposite made with bamboo fibres and rice husk fibre. Earth friendly, climate positive, unbreakable and food contact safe, these lightweight bowls are suitable for microwave reheating and perfect for hot and cold servings.",
        specifications: {
          "Set Contents": "4 Soup bowls with spoon",
          "Capacity": "250 ml",
          "Product Weight": "75 gm",
          "Product Length": "10 cm",
          "Product Width": "10 cm",
          "Product Height": "4.5 cm",
          "Microwave Safe": "Yes",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "BPA & Formaldehyde Free": "Yes",
          "Unbreakable": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Comes with spoon",
          "Made with bamboo fibres and rice husk fibre",
          "Earth friendly",
          "Climate positive",
          "Unbreakable",
          "Lightweight",
          "Impact resistant",
          "Food contact safe",
          "Microwave suitable for reheating",
          "BPA free",
          "UV stabilized",
          "Suitable for hot and cold servings"
        ]
      },
      {
        name: "Undecas Spoon",
        quantity: 5,
        unit: "set",
        size: "Standard",
        color: "Off white",
        material: "BioDur Crop-Waste Biocomposite",
        description: "Earth-friendly Undecas spoon made from BioDur crop-waste biocomposite, designed as a reusable dining essential.",
        specifications: {
          "Set Contents": "Undecas Spoon",
          "Food Contact Safe": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Food contact safe",
          "Made with BioDur biocomposite",
          "Earth friendly",
          "Reusable",
          "Eco friendly"
        ]
      },
      {
        name: "Casserole 600 ml",
        quantity: 1,
        unit: "piece",
        size: "600 ml",
        color: "Off white",
        material: "BioDur Crop-Waste Biocomposite",
        description: "Earth-friendly casserole with lid made from BioDur biocomposite using crop waste including rice husk, coffee husk and bamboo fibres with food-contact binders and additives. Lightweight, impact-resistant and suitable for microwave reheating and dishwasher use.",
        specifications: {
          "Capacity": "600 ml",
          "Set Contents": "1 Casserole with lid",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Reheat": "Yes",
          "Dishwasher": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "UV Stabilized": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Earth friendly",
          "Climate positive",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact resistant",
          "BPA free",
          "Formaldehyde free",
          "UV stabilized",
          "Reusable"
        ]
      },
      {
        name: "Casserole 1200 ml",
        quantity: 1,
        unit: "piece",
        size: "1200 ml",
        color: "Off white",
        material: "BioDur Crop-Waste Biocomposite",
        description: "Earth-friendly casserole with lid made from BioDur biocomposite using crop waste including rice husk, coffee husk and bamboo fibres with food-contact binders and additives. Lightweight, impact-resistant and suitable for microwave reheating and dishwasher use.",
        specifications: {
          "Capacity": "1200 ml",
          "Set Contents": "1 Casserole with lid",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Reheat": "Yes",
          "Dishwasher": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "UV Stabilized": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Earth friendly",
          "Climate positive",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact resistant",
          "BPA free",
          "Formaldehyde free",
          "UV stabilized",
          "Reusable"
        ]
      },
      {
        name: "Casserole 2200 ml",
        quantity: 1,
        unit: "piece",
        size: "2200 ml",
        color: "Off white",
        material: "BioDur Crop-Waste Biocomposite",
        description: "Earth-friendly casserole with lid made from BioDur biocomposite using crop waste including rice husk, coffee husk and bamboo fibres with food-contact binders and additives. Lightweight, impact-resistant and suitable for microwave reheating and dishwasher use.",
        specifications: {
          "Capacity": "2200 ml",
          "Set Contents": "1 Casserole with lid",
          "Product Weight": "650 gm",
          "Product Length": "24.5 cm",
          "Product Width": "24.5 cm",
          "Product Height": "10.5 cm",
          "Food Contact Safe": "Yes",
          "Heat Resistance": "Up to 100°C (TUV tested)",
          "Microwave Reheat": "Yes",
          "Dishwasher": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "UV Stabilized": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Earth friendly",
          "Climate positive",
          "Food contact safe",
          "Microwave suitable for reheating",
          "Dishwasher suitable",
          "Lightweight",
          "Impact resistant",
          "BPA free",
          "Formaldehyde free",
          "UV stabilized",
          "Reusable"
        ]
      },
      {
        name: "Serving Spoon",
        quantity: 3,
        unit: "set",
        size: "8.5 inch",
        color: "Off white",
        material: "BioDur Crop-Waste Biocomposite",
        description: "Reusable serving spoons made from BioDur crop-waste biocomposite, designed for everyday dining and serving.",
        specifications: {
          "Set Contents": "3 Serving Spoons",
          "Size": "8.5 inch",
          "Product Weight": "4 gm per spoon",
          "Product Length": "22 cm",
          "Product Width": "7 cm",
          "Product Height": "0.5 cm",
          "Food Contact Safe": "Yes",
          "BPA & Formaldehyde Free": "Yes",
          "Reusable": "Yes",
          "Eco Friendly": "Yes"
        },
        features: [
          "Food contact safe",
          "BPA free",
          "Formaldehyde free",
          "Reusable",
          "Eco friendly"
        ]
      }
    ]
  },

  images: webpImages,
  giftBoxImages: [webpImages[0]],

  giftPackaging: {
    available: true,
    images: [webpImages[0]],
    title: "Premium Corporate Gift Packaging",
    description: "Premium gift packaging available.",
    pricePerBox: 0,
    customBrandingAvailable: true
  },

  colors: [
    {
      name: "Multiple colours",
      hex: "#F2EEE2",
      images: webpImages,
      stock: 100
    }
  ],

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
    value: 0,
    unit: "gm"
  },

  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: "cm"
  },

  package: {
    contents: "Round Dinner Plate x 5, Quarter Plate x 5, Aura Bowl x 5, Small Cutlery x 5, Soup Bowl 250 ml x 5, Undecas Spoon x 5, Casserole 600 ml x 1, Casserole 1200 ml x 1, Casserole 2200 ml x 1, Serving Spoon x 3",
    type: "Premium Gift Box",
    giftBoxImages: [webpImages[0]],
    itemsPerPackage: "1 Dining Gift Set",
    countryOfOrigin: "India"
  },

  careInstructions: "Avoid harsh scrubs and toxic or strong chemicals when cleaning. Avoid excess heat and direct sunlight. Products containing natural fibres should be handled according to their individual care requirements.",

  sustainability: {
    madeWith: "BioDur biocomposites using crop-waste materials including rice husk, bamboo fibres and other natural fibres with food-contact binders and additives where applicable.",
    highlights: [
      "Reduce CO2 emissions",
      "Reduce waste disposal",
      "Reduce crop burning",
      "Reduce fossil dependency",
      "Reusable products",
      "Sustainable alternative to conventional materials",
      "QR code with every purchase showing the sustainability footprint of the product"
    ]
  },

  tax: {
    hsnCode: "39241090",
    gstRate: 18,
    isTaxInclusive: true
  },

  popular: false,
  isFeatured: true,
  isActive: true,

  tags: [
    "diningGiftSet",
    "giftSet",
    "diningSet",
    "premiumGiftSet",
    "sustainableGift",
    "ecoFriendly",
    "corporateGifting",
    "tableware",
    "kitchenware",
    "bioDur",
    "riceHusk",
    "bamboo",
    "cropWaste",
    "reusable",
    "sustainableLiving"
  ]
};

async function run() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "greenfibre",
    });

    console.log("Connected to MongoDB Atlas");

    let category = await Category.findOne({ name: diningGiftSetData.categoryName });
    if (!category) {
      category = await Category.create({
        name: diningGiftSetData.categoryName,
        slug: "gift-boxes-hampers",
        description: "Premium Eco-Friendly Gift Boxes & Hampers for corporate and festive gifting",
        isActive: true,
        isFeatured: true
      });
      console.log("Created Category:", category.name, category._id);
    } else {
      console.log("Found Category:", category.name, category._id);
    }

    // Remove any previous product with the same name
    await Product.deleteMany({
      $or: [{ name: diningGiftSetData.name }, { slug: "dining-gift-set" }]
    });

    // Create product
    const product = await Product.create({
      ...diningGiftSetData,
      slug: slugify(diningGiftSetData.name, { lower: true, strict: true }),
      category: category._id,
      subCategory: null,
    });

    console.log("SUCCESS! Created Dining Gift Set:");
    console.log("ID:", product._id);
    console.log("Name:", product.name);
    console.log("Slug:", product.slug);
    console.log("Gift Set Items Types:", product.giftSetContents?.totalProductTypes);
    console.log("Images Count:", product.images.length);
    console.log("Sample Image URL:", product.images[0]);

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
