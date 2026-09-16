import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

dotenv.config();

const addContainerBox = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || undefined,
        });
        console.log(`✅ Connected to MongoDB Atlas (${mongoose.connection.name})`);

        // Find Storage & Baskets category
        const categoryDoc = await Category.findOne({ slug: "storage-and-baskets" });
        if (!categoryDoc) {
            console.error("❌ Category 'storage-and-baskets' not found!");
            process.exit(1);
        }

        const productData = {
            name: "Container Box",
            slug: "container-box",
            originalPrice: 0,
            discountedPrice: 0,
            description: "A sustainable multi-purpose container designed for everyday home, kitchen and storage use.",
            category: categoryDoc._id,
            subCategory: null,
            colors: [
                {
                    name: "Green & Terracotta",
                    stock: 20,
                    images: [
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543085/06_last_pic_lrjyw6.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543084/1_hero_happy_pets_iooc2e.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543083/2_sustainable_every_bite_hl6lpu.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543084/3_healthy_pets_happier_lives_puwxqg.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543084/4_easy_to_carry_dmzwke.png",
                        "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789543084/5_dishwasher_safe_mdl3sr.png",
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
        };

        const existing = await Product.findOne({ slug: productData.slug });
        if (existing) {
            await Product.findByIdAndUpdate(existing._id, productData, {
                new: true,
                runValidators: true,
            });
            console.log(`🔄 Updated existing product: ${productData.name} (${productData.slug})`);
        } else {
            await Product.create(productData);
            console.log(`✅ Created product: ${productData.name} (${productData.slug})`);
        }

        const currentProduct = await Product.findOne({ slug: productData.slug }).populate("category", "name slug");
        console.log("\n📦 Product Details in DB:");
        console.log("   - Name:", currentProduct.name);
        console.log("   - Slug:", currentProduct.slug);
        console.log("   - Category:", currentProduct.category?.name, `(${currentProduct.category?.slug})`);
        console.log("   - Stock:", currentProduct.colors[0]?.stock);
        console.log("   - Images count:", currentProduct.colors[0]?.images?.length);
        console.log("   - Active:", currentProduct.isActive);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding product:", error);
        process.exit(1);
    }
};

addContainerBox();
