import mongoose from "mongoose";
import { Gallery } from "../models/gallery.model.js";
import { Category } from "../models/category.model.js";

import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

// =============================
// CREATE GALLERY ITEMS (Admin)
// =============================
export const createGalleryItems = async (req, res) => {
    try {
        const { title, caption, category } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one image is required",
            });
        }

        let categoryDoc = null;

        if (category) {
            categoryDoc = await Category.findOne({
                name: category,
            });

            if (!categoryDoc) {
                return res.status(400).json({
                    message: "Invalid category",
                });
            }
        }

        const createdItems = [];

        for (const file of req.files) {
            const imageUrl = await uploadOnCloudinary(file.path, "gallery");

            if (imageUrl) {
                const item = await Gallery.create({
                    title,
                    caption,
                    category: categoryDoc?._id || null,
                    image: imageUrl,
                });

                createdItems.push(item);
            }
        }

        return res.status(201).json({
            success: true,
            message: "Gallery items created",
            items: createdItems,
        });
    } catch (error) {
        console.error("Gallery create error:", error);

        return res.status(500).json({
            message: "Error creating gallery items",
        });
    }
};

// =============================
// GET ALL GALLERY ITEMS (Public)
// =============================
export const getGallery = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                gallery: [],
            });
        }

        const { category, slug } = req.query;

        const filter = { isActive: true };

        if (category) {
            filter.category = category;
        }

        if (slug) {
            const categoryDoc = await Category.findOne({ slug });

            if (!categoryDoc) {
                return res.status(404).json({
                    message: "Category not found",
                });
            }

            // Include subcategories
            const subCategories = await Category.find({
                parentCategory: categoryDoc._id,
            }).select("_id");

            const categoryIds = [
                categoryDoc._id,
                ...subCategories.map((c) => c._id),
            ];

            filter.category = {
                $in: categoryIds,
            };
        }

        const gallery = await Gallery.find(filter)
            .populate("category", "name slug")
            .sort({
                order: 1,
                createdAt: -1,
            });

        // ✅ Keep same frontend structure
        const formattedGallery = gallery.map((item) => {
            const itemObj = item.toObject();

            itemObj.image = {
                original: item.image,
                large: item.image,
                medium: item.image,
                thumbnail: item.image,
            };

            return itemObj;
        });

        return res.status(200).json({
            success: true,
            gallery: formattedGallery,
        });
    } catch (error) {
        console.error("getGallery error:", error.message);
        return res.status(200).json({
            success: true,
            gallery: [],
        });
    }
};

// =============================
// TOGGLE GALLERY STATUS
// =============================
export const toggleGalleryStatus = async (req, res) => {
    try {
        const { galleryId } = req.params;

        const item = await Gallery.findById(galleryId);

        if (!item) {
            return res.status(404).json({
                message: "Gallery item not found",
            });
        }

        item.isActive = !item.isActive;

        await item.save();

        return res.status(200).json({
            success: true,
            status: item.isActive,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating status",
        });
    }
};

// =============================
// UPDATE DISPLAY ORDER
// =============================
export const updateGalleryOrder = async (req, res) => {
    try {
        const { galleryId } = req.params;

        const { order } = req.body;

        const item = await Gallery.findByIdAndUpdate(
            galleryId,
            { order },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                message: "Gallery item not found",
            });
        }

        return res.status(200).json({
            success: true,
            item,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating order",
        });
    }
};

// =============================
// DELETE GALLERY ITEM
// =============================
export const deleteGalleryItem = async (req, res) => {
    try {
        const { galleryId } = req.params;

        const item = await Gallery.findById(galleryId);

        if (!item) {
            return res.status(404).json({
                message: "Gallery item not found",
            });
        }

        if (item.image) {
            await deleteFromCloudinary(item.image);
        }

        await Gallery.findByIdAndDelete(galleryId);

        return res.status(200).json({
            success: true,
            message: "Gallery item deleted",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting gallery item",
        });
    }
};