import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

// =============================
// CREATE CATEGORY
// =============================
export const createCategory = async (req, res) => {
    try {
        const {
            name,
            description,
            parentCategory,
            displayOrder,
            metaTitle,
            metaDescription,
            metaKeywords,
            isFeatured,
        } = req.body;

        let imageUrl;

        if (req.file) {
            imageUrl = await uploadOnCloudinary(req.file.path, "categories");
        }

        const category = await Category.create({
            name,
            description,
            parentCategory: parentCategory || null,
            displayOrder,
            metaTitle,
            metaDescription,
            metaKeywords: metaKeywords ? metaKeywords.split(",") : [],
            image: imageUrl,
            isFeatured: isFeatured ? isFeatured : !isFeatured,
        });

        res.status(201).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("createCategory", error);

        res.status(500).json({
            message: "Error creating category",
        });
    }
};

// =============================
// GET ALL CATEGORIES (Public)
// =============================
export const getAllCategories = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                categories: [],
            });
        }

        const categories = await Category.find({
            isActive: true,
        }).sort({
            displayOrder: 1,
            name: 1,
        });

        const formattedCategories = [];

        for (const category of categories) {
            const categoryObj = category.toObject();

            // Count active products and fetch first product
            const [productCount, firstProduct] = await Promise.all([
                Product.countDocuments({ category: category._id, isActive: true }),
                Product.findOne({ category: category._id, isActive: true })
                    .sort({ createdAt: -1 })
                    .lean(),
            ]);

            categoryObj.productCount = productCount;

            // Filter out unnecessary/empty categories with 0 products unless explicitly requested
            if (req.query.includeEmpty !== "true" && productCount === 0) {
                continue;
            }

            // Real first product image
            let realImage = null;
            if (firstProduct) {
                if (firstProduct.mainImage) {
                    realImage = firstProduct.mainImage;
                } else if (firstProduct.thumbnail) {
                    realImage = firstProduct.thumbnail;
                } else if (firstProduct.colors && firstProduct.colors.length > 0) {
                    const colorImgs = firstProduct.colors[0]?.images;
                    if (colorImgs && colorImgs.length > 0) {
                        const firstImg = colorImgs[0];
                        realImage = typeof firstImg === "string" ? firstImg : firstImg?.card || firstImg?.original || firstImg?.medium;
                    }
                }
            }

            // Fallback to category image if no product image found
            if (!realImage && category.image) {
                realImage = typeof category.image === "string" ? category.image : category.image.original || category.image.large;
            }

            if (realImage) {
                categoryObj.image = {
                    original: realImage,
                    large: realImage,
                    medium: realImage,
                    thumbnail: realImage,
                };
                categoryObj.firstProductImage = realImage;
            }

            formattedCategories.push(categoryObj);
        }

        return res.status(200).json({
            success: true,
            categories: formattedCategories,
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({
            message: "Error fetching categories",
        });
    }
};

// =============================
// GET SINGLE CATEGORY
// =============================
export const getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug,
            isActive: true,
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        // ✅ Keep same frontend structure
        const categoryObj = category.toObject();

        if (categoryObj.image) {
            categoryObj.image = {
                original: category.image,
                large: category.image,
                medium: category.image,
            };
        }

        res.status(200).json({
            success: true,
            category: categoryObj,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching category",
        });
    }
};

// =============================
// UPDATE CATEGORY
// =============================
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        if (req.file) {
            if (category.image) {
                await deleteFromCloudinary(category.image);
            }

            const uploaded = await uploadOnCloudinary(
                req.file.path,
                "categories"
            );

            category.image = uploaded;
        }

        if (req.body.parentCategory === "") {
            req.body.parentCategory = null;
        }

        if (req.body.isFeatured !== undefined) {
            req.body.isFeatured = req.body.isFeatured === "true";
        }

        if (req.body.isActive !== undefined) {
            req.body.isActive = req.body.isActive === "true";
        }

        Object.assign(category, req.body);

        if (req.body.metaKeywords) {
            category.metaKeywords = req.body.metaKeywords.split(",");
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// =============================
// DELETE CATEGORY
// =============================
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        if (category.image) {
            await deleteFromCloudinary(category.image);
        }

        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting category",
        });
    }
};

// =============================
// TOGGLE STATUS
// =============================
export const toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        category.isActive = !category.isActive;

        await category.save();

        res.status(200).json({
            success: true,
            isActive: category.isActive,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error toggling status",
        });
    }
};