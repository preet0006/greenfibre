import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const insertProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);

        const productData = {
            name: "Drip-Guard",
            slug: "drip-guard",
            originalPrice: 1200,
            discountedPrice: 700,
            description:
                "Heat-resistant round coasters with a matching upright holder — a small, everyday item that carries the brand well on any desk or dining table. Each set includes 6 coasters and 1 matching holder stand.",
            category: new mongoose.Types.ObjectId("6a9bf3e39d345de922350846"),
            subCategory: null,
            colors: [
                {
                    name: "Off White",
                    hex: "#F5F0E8",
                    stock: 0,
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726018/06_Green_Coaster_c01eje.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726013/01_Green_Coaster_qxdvi4.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726013/02_Green_Coaster_t30vtq.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726013/03_Green_Coaster_fe0ec1.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726014/04_Green_Coaster_khbbdb.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789726013/02_Green_Coaster_t30vtq.png",
                    ],
                },
            ],
            features: {
                "Set Contents": "6 Coasters + 1 Holder Stand",
                "Overall Dimensions": "10.5 cm × 10.5 cm × 7 cm",
                "Surface": "Heat and moisture resistant",
                "Holder": "Upright holder keeps the set tidy",
                "Usage": "Desk & Dining Table",
                "Gifting": "Suitable for corporate and family gifting",
                "Brand Display": "Perfect for brand display",
                "Customization": "Customization available",
                "Eco Friendly": "Yes",
                "Made In": "India",
            },
            materialInfo: {
                "Material": "Rice husk fibre composite",
                "Packaging": "Window box",
                "Packaging Options": "Premium packaging options available",
            },
            isFeatured: false,
            isActive: true,
            metaTitle: "Drip-Guard Coaster Set | 6 Coasters with Holder | Greenfibre",
            metaDescription:
                "Shop Greenfibre's Drip-Guard coaster set with 6 heat and moisture resistant coasters and a matching upright holder, made from rice husk fibre composite.",
            metaKeywords: [
                "Drip-Guard",
                "coaster set",
                "coasters with holder",
                "6 coaster set",
                "eco friendly coasters",
                "rice husk fibre coasters",
                "heat resistant coasters",
                "moisture resistant coasters",
                "corporate gifting",
                "Greenfibre",
            ],
        };

        const existing = await Product.findOne({ slug: productData.slug });
        let product;
        if (existing) {
            product = await Product.findByIdAndUpdate(existing._id, productData, {
                new: true,
                runValidators: true,
            });
            console.log(`🔄 Updated existing product: ${product.name} (ID: ${product._id})`);
        } else {
            product = await Product.create(productData);
            console.log(`✅ Created new product: ${product.name} (ID: ${product._id})`);
        }

        const currentProduct = await Product.findById(product._id).populate(
            "category",
            "name slug"
        );
        console.log("\n📦 Product Details in DB:");
        console.log("   - Name:", currentProduct.name);
        console.log("   - Slug:", currentProduct.slug);
        console.log(
            "   - Category:",
            currentProduct.category?.name,
            `(${currentProduct.category?.slug})`
        );
        console.log(
            "   - Price: ₹" +
                currentProduct.discountedPrice +
                " (MRP: ₹" +
                currentProduct.originalPrice +
                ")"
        );
        console.log("   - Stock:", currentProduct.colors[0]?.stock);
        console.log("   - Images count:", currentProduct.colors[0]?.images?.length);
        console.log("   - Active:", currentProduct.isActive);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding product:", error);
        process.exit(1);
    }
};

insertProduct();
