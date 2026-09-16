import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const productsToImport = [
    {
        name: "Bean Green",
        slug: "bean-green-300-ml",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A softly speckled, matte-finish mug made from rice husk fibre composite, designed for everyday coffee and tea.",
        categorySlug: "drinkware",
        categoryId: "6a9bf3e39d345de922350847",
        subCategory: null,
        colors: [
            {
                name: "Blush Cream",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789454444/ChatGPT_Image_Sep_15_2026_12_09_21_PM_vtn9ht.png",
                ],
            },
        ],
        features: {
            "Size": "W 8.5 cm × H 9.5 cm",
            "Capacity": "300 ml",
            "Weight": "Approx. 141 g",
            "Packaging": "Kraft premium box / magnetic closure box",
            "MOQ": "100 sets",
            "Lead Time": "15–20 days",
            "Microwave Friendly": "Yes",
            "Dishwasher Friendly": "Yes",
            "Stackable": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
            "Finish": "Food-safe matte finish",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Bean Green 300ml Eco Mug | Green Fibre",
        metaDescription: "Premium 300ml rice husk fibre composite mug for coffee and tea.",
        metaKeywords: [
            "mug",
            "bean green",
            "rice husk mug",
            "eco friendly mug",
            "drinkware",
        ],
    },
    {
        name: "Tulsi Planter",
        slug: "tulsi-planter",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A sustainable Tulsi planter designed for home, balcony, pooja and gifting use, crafted with Green Fibre's natural eco-friendly material.",
        categorySlug: "home-and-living",
        categoryId: "6a9bf3e39d345de922350848",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452144/ChatGPT_Image_Sep_15_2026_11_24_53_AM_c4j4uj.png",
                ],
            },
        ],
        features: {
            "Use": "Tulsi planting, home, balcony, pooja and gifting",
            "Lightweight": "Yes",
            "Non Fragile": "Yes",
            "Eco Friendly": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Tulsi Planter | Green Fibre",
        metaDescription: "Eco-friendly Green Fibre Tulsi planter for home, balcony, pooja and sustainable gifting.",
        metaKeywords: [
            "tulsi planter",
            "tulsi pot",
            "eco friendly planter",
            "rice husk planter",
            "green fibre",
        ],
    },
    {
        name: "Eco-Serve Soup Bowl",
        slug: "eco-serve-soup-bowl-350-ml",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A premium rice husk fibre composite soup bowl designed for everyday serving and sustainable dining.",
        categorySlug: "kitchen-and-dining",
        categoryId: "6a9bf3e39d345de922350846",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat & Sage",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/1_hero_bowl_of_goodness_zjcypd.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/2_from_our_kitchen_pcvdqf.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/3_beautifully_useful_cvqwni.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/4_more_than_a_bowl_q2njoo.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/05_last_pic_bivhlw.png",
                ],
            },
        ],
        features: {
            "Size": "W 13 cm × H 6 cm",
            "Capacity": "350 ml",
            "Weight": "Approx. 125 g",
            "Packaging": "Printed kraft box / branded sleeve",
            "MOQ": "100 sets",
            "Lead Time": "15–20 days",
            "Chip Resistant Rim": "Yes",
            "Custom Colours": "Available above MOQ",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
            "Finish": "Matte finish",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Eco-Serve Soup Bowl 350ml | Green Fibre",
        metaDescription: "350ml sustainable rice husk fibre soup bowl with premium natural finish.",
        metaKeywords: [
            "soup bowl",
            "rice husk bowl",
            "eco tableware",
            "green fibre",
        ],
    },
    {
        name: "Drip-Guard",
        slug: "drip-guard-coaster-set",
        originalPrice: 0,
        discountedPrice: 0,
        description: "Heat-resistant round coasters with a matching holder for desks and dining tables.",
        categorySlug: "home-and-living",
        categoryId: "6a9bf3e39d345de922350848",
        subCategory: null,
        colors: [
            {
                name: "Off-White",
                stock: 20,
                images: [],
            },
        ],
        features: {
            "Size": "W 9 cm × 0.5 cm",
            "Set Contents": "6 coasters + 1 holder stand",
            "Weight": "Approx. 120 g",
            "MOQ": "200 sets",
            "Lead Time": "12–15 days",
            "Heat Resistant": "Yes",
            "Moisture Resistant": "Yes",
            "Logo Engraving": "Available",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Drip-Guard Eco Coaster Set | Green Fibre",
        metaDescription: "Six sustainable coasters with matching holder made from rice husk fibre composite.",
        metaKeywords: [
            "coaster",
            "drip guard",
            "coaster set",
            "eco friendly coaster",
        ],
    },
    {
        name: "Green Eco-sip Bottle",
        slug: "green-eco-sip-bottle-400-ml",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A compact Green Eco-sip Bottle with a natural rice husk fibre body, food-safe liner and contrasting cap.",
        categorySlug: "drinkware",
        categoryId: "6a9bf3e39d345de922350847",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452123/ChatGPT_Image_Sep_15_2026_11_14_58_AM_yzwgoe.png",
                ],
            },
        ],
        features: {
            "Capacity": "400 ml",
            "Bottle Body Color": "Natural Oat",
            "Cap Color": "Terracotta",
            "BPA Free": "Yes",
            "Double Walled": "Yes",
            "Food Safe": "Yes",
            "Jute Carry Loop": "Yes",
            "Packaging": "Kraft premium box / honeycomb wrap",
            "MOQ": "100 units",
            "Customisation": "Logo engraving and cap customisation available",
        },
        materialInfo: {
            "Body": "Rice husk fibre composite",
            "Liner": "Food-safe liner",
            "Loop": "Jute",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Green Eco-sip Bottle 400ml | Green Fibre",
        metaDescription: "400ml sustainable Green Eco-sip Bottle with natural rice husk body and contrasting cap.",
        metaKeywords: [
            "eco sip bottle",
            "400ml bottle",
            "rice husk bottle",
            "eco friendly bottle",
            "green fibre",
        ],
    },
    {
        name: "Green Eco-sip Bottle",
        slug: "green-eco-sip-bottle-900-ml",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A larger Green Eco-sip Bottle with a natural rice husk fibre body, food-safe liner and convenient carry loop.",
        categorySlug: "drinkware",
        categoryId: "6a9bf3e39d345de922350847",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543067/1_hero_hydration_ntxocy.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543068/2_thoughtful_design_nqgrjl.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543068/3_stainless_steel_insulation_bxa0ed.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543068/4_900ml_jz7zdl.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543068/06_last_pic_rocyti.png",
                ],
            },
        ],
        features: {
            "Capacity": "900 ml",
            "Bottle Body Color": "Natural Oat",
            "Cap Color": "Sage Green",
            "BPA Free": "Yes",
            "Double Walled": "Yes",
            "Food Safe": "Yes",
            "Jute Carry Loop": "Yes",
            "Packaging": "Kraft premium box / honeycomb wrap",
            "MOQ": "100 units",
            "Customisation": "Logo engraving and cap customisation available",
        },
        materialInfo: {
            "Body": "Rice husk fibre composite",
            "Liner": "Food-safe liner",
            "Loop": "Jute",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Green Eco-sip Bottle 900ml | Green Fibre",
        metaDescription: "900ml Green Eco-sip Bottle with sustainable rice husk fibre body and carry loop.",
        metaKeywords: [
            "eco sip bottle",
            "900ml bottle",
            "rice husk bottle",
            "sustainable bottle",
            "green fibre",
        ],
    },
    {
        name: "Casserole",
        slug: "casserole-4-8-l",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A lightweight and elegant casserole designed to keep everyday cooked food warm while bringing a premium sustainable touch to the dining table.",
        categorySlug: "kitchen-and-dining",
        categoryId: "6a9bf3e39d345de922350846",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452121/ChatGPT_Image_Sep_14_2026_12_10_06_AM_p9yzq3.png",
                ],
            },
        ],
        features: {
            "Size": "W 20 cm × H 11 cm",
            "Capacity": "4.8 L",
            "MOQ": "100 units",
            "Lead Time": "18–22 days",
            "Lightweight": "Yes",
            "Non Fragile": "Yes",
            "Travel Friendly": "Yes",
            "Premium Look": "Yes",
        },
        materialInfo: {
            "Body": "Rice husk fibre composite",
            "Liner": "Food-safe liner",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Eco-Friendly Casserole 4.8L | Green Fibre",
        metaDescription: "Premium 4.8L rice husk fibre casserole for everyday serving.",
        metaKeywords: [
            "casserole",
            "4.8 litre casserole",
            "rice husk casserole",
            "kitchenware",
        ],
    },
    {
        name: "Storage Box",
        slug: "storage-box-4-8-l",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A lightweight and practical storage solution designed to organise everyday household essentials.",
        categorySlug: "storage-and-baskets",
        categoryId: "6a9bf3e39d345de922350849",
        subCategory: null,
        colors: [
            {
                name: "Celeste Green",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452121/ChatGPT_Image_Sep_12_2026_04_54_36_PM_tzfn9z.png",
                ],
            },
        ],
        features: {
            "Size": "W 20 cm × H 11 cm",
            "Capacity": "4.8 L",
            "MOQ": "100 units",
            "Lead Time": "18–20 days",
            "Lightweight": "Yes",
            "Non Fragile": "Yes",
            "Home Use": "Yes",
            "Travel Friendly": "Yes",
            "Made in India": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Storage Box 4.8L | Green Fibre",
        metaDescription: "Sustainable 4.8L household storage box in Celeste Green.",
        metaKeywords: [
            "storage box",
            "eco storage",
            "rice husk storage",
            "home storage",
        ],
    },
    {
        name: "Planter Pink",
        slug: "planter-pink-6-l",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A stylish lightweight planter designed to add a natural touch to modern homes, indoor greenery and gifting.",
        categorySlug: "home-and-living",
        categoryId: "6a9bf3e39d345de922350848",
        subCategory: null,
        colors: [
            {
                name: "Pink",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452122/ChatGPT_Image_Sep_12_2026_04_59_20_PM_d6ig6p.png",
                ],
            },
        ],
        features: {
            "Size": "W 16 cm × H 14 cm",
            "Capacity": "6 L",
            "MOQ": "100 units",
            "Lead Time": "18–20 days",
            "Home Decor": "Yes",
            "Lightweight": "Yes",
            "Durable": "Yes",
            "Eco Friendly": "Yes",
            "Made in India": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Planter Pink 6L | Green Fibre",
        metaDescription: "Premium sustainable pink planter for indoor plants, decor and gifting.",
        metaKeywords: [
            "planter",
            "pink planter",
            "eco planter",
            "home decor",
        ],
    },
    {
        name: "Tissue Paper Holder",
        slug: "tissue-paper-holder",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A minimal and elegant tissue paper holder designed to keep everyday spaces neat and organised.",
        categorySlug: "home-and-living",
        categoryId: "6a9bf3e39d345de922350848",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat & Espresso",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452121/ChatGPT_Image_Sep_12_2026_04_45_12_PM_elxvys.png",
                ],
            },
        ],
        features: {
            "Size": "W 12 cm × H 8 cm",
            "MOQ": "100 units",
            "Lead Time": "18–20 days",
            "Home and Office Use": "Yes",
            "Easy to Maintain": "Yes",
            "Non Fragile": "Yes",
            "Sustainable Design": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Eco Tissue Paper Holder | Green Fibre",
        metaDescription: "Minimal sustainable tissue paper holder for home and office use.",
        metaKeywords: [
            "tissue holder",
            "tissue box",
            "eco home accessory",
            "green fibre",
        ],
    },
    {
        name: "Storage Bowl",
        slug: "storage-bowl-set",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A practical kitchen storage bowl set designed for everyday food storage and serving.",
        categorySlug: "storage-and-baskets",
        categoryId: "6a9bf3e39d345de922350849",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/1_hero_bowl_of_goodness_zjcypd.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/2_from_our_kitchen_pcvdqf.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/3_beautifully_useful_cvqwni.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/4_more_than_a_bowl_q2njoo.png",
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543178/05_last_pic_bivhlw.png",
                ],
            },
        ],
        features: {
            "Capacity": "2.9 L and 1.6 L",
            "Air-Tight Lid": "Yes",
            "Kitchen Friendly": "Yes",
            "Lightweight": "Yes",
            "Non Fragile": "Yes",
            "Travel Friendly": "Yes",
            "Made in India": "Yes",
            "Premium Look": "Yes",
            "MOQ": "100 units",
            "Lead Time": "18–20 days",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
            "Lid": "Food storage lid",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Storage Bowl Set | Green Fibre",
        metaDescription: "Premium sustainable kitchen storage bowl set in 2.9L and 1.6L capacities.",
        metaKeywords: [
            "storage bowl",
            "food storage",
            "kitchen bowl",
            "rice husk bowl",
        ],
    },
    {
        name: "Cannister",
        slug: "cannister-700-ml",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A premium cylindrical cannister designed to keep everyday dry ingredients and kitchen essentials organised.",
        categorySlug: "kitchen-and-dining",
        categoryId: "6a9bf3e39d345de922350846",
        subCategory: null,
        colors: [
            {
                name: "Natural Oat",
                stock: 20,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452121/ChatGPT_Image_Sep_15_2026_10_58_27_AM_wdxmqa.png",
                ],
            },
        ],
        features: {
            "Size": "W 8 cm × H 11.5 cm",
            "Capacity": "700 ml",
            "MOQ": "100 units",
            "Easy-Grip Lid": "Yes",
            "Wide Mouth": "Yes",
            "Easy to Fill and Clean": "Yes",
            "Lightweight": "Yes",
            "Non Fragile": "Yes",
            "Kitchen Friendly": "Yes",
            "Made in India": "Yes",
            "Travel Friendly": "Yes",
        },
        materialInfo: {
            "Material": "Rice husk fibre composite",
            "Liner": "Food-safe liner",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Cannister 700ml | Green Fibre",
        metaDescription: "Premium 700ml sustainable kitchen cannister for storing dry ingredients.",
        metaKeywords: [
            "cannister",
            "canister",
            "700ml container",
            "kitchen storage",
            "green fibre",
        ],
    },
    {
        name: "Container Box",
        slug: "container-box",
        originalPrice: 0,
        discountedPrice: 0,
        description: "A sustainable multi-purpose container designed for everyday home, kitchen and storage use.",
        categorySlug: "storage-and-baskets",
        categoryId: "6a9bf3e39d345de922350849",
        subCategory: null,
        colors: [
            {
                name: "Green & Terracotta",
                stock: 0,
                images: [
                    "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789452235/ChatGPT_Image_Sep_12_2026_04_49_37_PM_et24av.png",
                ],
            },
        ],
        features: {},
        materialInfo: {
            "Material": "Rice husk fibre composite",
        },
        isFeatured: false,
        isActive: true,
        metaTitle: "Eco Container Box | Green Fibre",
        metaDescription: "Sustainable rice husk fibre container for everyday home and kitchen use.",
        metaKeywords: [
            "container box",
            "eco container",
            "rice husk container",
            "green fibre",
        ],
    },
];

const importProducts = async () => {
    await connectDB();

    const categories = await Category.find();
    console.log(`📂 Found ${categories.length} categories in database.`);

    const categoryMap = {};
    categories.forEach((cat) => {
        categoryMap[cat.slug] = cat._id;
        categoryMap[cat._id.toString()] = cat._id;
        if (cat.name) {
            categoryMap[cat.name.toLowerCase()] = cat._id;
        }
    });

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of productsToImport) {
        let categoryId = item.categoryId;
        if (!categoryId && item.categorySlug) {
            categoryId = categoryMap[item.categorySlug];
        }
        if (!categoryId) {
            // fallback to first category if none matched
            categoryId = categories[0]?._id;
        }

        const productDoc = {
            name: item.name,
            slug: item.slug,
            originalPrice: item.originalPrice ?? 0,
            discountedPrice: item.discountedPrice ?? 0,
            description: item.description,
            category: categoryId,
            subCategory: item.subCategory || null,
            colors: item.colors,
            features: item.features || {},
            materialInfo: item.materialInfo || {},
            isFeatured: item.isFeatured ?? false,
            isActive: item.isActive !== undefined ? item.isActive : true,
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            metaKeywords: item.metaKeywords,
        };

        const existing = await Product.findOne({ slug: item.slug });
        if (existing) {
            await Product.findByIdAndUpdate(existing._id, productDoc, {
                runValidators: true,
                new: true,
            });
            console.log(`🔄 Updated product: ${item.name} (${item.slug})`);
            updatedCount++;
        } else {
            await Product.create(productDoc);
            console.log(`✅ Created product: ${item.name} (${item.slug})`);
            insertedCount++;
        }
    }

    console.log(`\n🎉 Import completed successfully!`);
    console.log(`   - Created: ${insertedCount}`);
    console.log(`   - Updated: ${updatedCount}`);
    console.log(`   - Total Processed: ${productsToImport.length}`);

    process.exit(0);
};

importProducts().catch((err) => {
    console.error("❌ Import error:", err);
    process.exit(1);
});
