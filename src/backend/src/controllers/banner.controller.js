import mongoose from "mongoose";
import { Banner } from "../models/banner.model.js";
import { Category } from "../models/category.model.js";

import {
    uploadOnCloudinary,
    uploadVideoToCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

// =============================
// CREATE BANNER (Admin)
// =============================
export const createBanner = async (req, res) => {
    try {
        const { title, subtitle, mediaType, category } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "Banner media is required",
            });
        }

        // ✅ Validate category
        const categoryDoc = await Category.findById(category);

        if (!categoryDoc) {
            return res.status(400).json({
                message: "Invalid category",
            });
        }

        let mediaUrl;

        if (mediaType === "image") {
            mediaUrl = await uploadOnCloudinary(req.file.path, "banners");
        } else if (mediaType === "video") {
            mediaUrl = await uploadVideoToCloudinary(req.file.path);
        } else {
            return res.status(400).json({
                message: "Invalid media type",
            });
        }

        const banner = await Banner.create({
            title,
            subtitle,
            mediaType,
            mediaUrl,
            category: categoryDoc._id,
        });

        return res.status(201).json({
            success: true,
            banner,
        });
    } catch (error) {
        console.error("Create banner error:", error);

        return res.status(500).json({
            message: "Error creating banner",
        });
    }
};

// =============================
// GET ACTIVE BANNERS (Public)
// =============================
export const getBanners = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                count: 0,
                banners: [],
            });
        }

        const { category, slug } = req.query;

        let filter = { isActive: true };

        // =============================
        // FILTER BY CATEGORY ID
        // =============================
        if (category) {
            filter.category = category;
        }

        // =============================
        // FILTER BY SLUG
        // =============================
        if (slug) {
            const categoryDoc = await Category.findOne({
                slug,
            });

            if (!categoryDoc) {
                return res.status(404).json({
                    message: "Category not found",
                });
            }

            // include subcategories
            const subCategories = await Category.find({
                parentCategory: categoryDoc._id,
            }).select("_id");

            const categoryIds = [
                categoryDoc._id,
                ...subCategories.map((c) => c._id),
            ];

            filter.category = { $in: categoryIds };
        }

        const banners = await Banner.find(filter)
            .populate("category", "name slug")
            .sort({ order: 1, createdAt: -1 });

        // ✅ Keep same response structure
        const formattedBanners = banners.map((banner) => {
            const bannerObj = banner.toObject();

            if (banner.mediaType === "image") {
                bannerObj.mediaUrl = {
                    original: banner.mediaUrl,
                    desktop: banner.mediaUrl,
                    tablet: banner.mediaUrl,
                    mobile: banner.mediaUrl,
                };
            }

            return bannerObj;
        });

        return res.status(200).json({
            success: true,
            count: formattedBanners.length,
            banners: formattedBanners,
        });
    } catch (error) {
        console.error("Fetch banner error:", error);

        return res.status(500).json({
            message: "Error fetching banners",
        });
    }
};

// =============================
// TOGGLE BANNER STATUS
// =============================
export const toggleBannerStatus = async (req, res) => {
    try {
        const { bannerId } = req.params;

        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({
                message: "Banner not found",
            });
        }

        banner.isActive = !banner.isActive;

        await banner.save();

        return res.status(200).json({
            success: true,
            isActive: banner.isActive,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error toggling banner",
        });
    }
};

// =============================
// UPDATE BANNER ORDER
// =============================
export const swapBannerOrder = async (req, res) => {
    try {
        const { sourceId, targetId } = req.body;

        const source = await Banner.findById(sourceId);

        const target = await Banner.findById(targetId);

        if (!source || !target) {
            return res.status(404).json({
                message: "Banner not found",
            });
        }

        // 🔁 Swap orders
        const tempOrder = source.order;

        source.order = target.order;
        target.order = tempOrder;

        await source.save();
        await target.save();

        return res.status(200).json({
            success: true,
            message: "Order swapped successfully",
        });
    } catch (error) {
        console.error("Swap order error:", error);

        return res.status(500).json({
            message: "Error updating order",
        });
    }
};

// =============================
// DELETE BANNER
// =============================
export const deleteBanner = async (req, res) => {
    try {
        const { bannerId } = req.params;

        const banner = await Banner.findById(bannerId);

        if (!banner) {
            return res.status(404).json({
                message: "Banner not found",
            });
        }

        // ✅ Delete from Cloudinary
        if (banner.mediaUrl) {
            await deleteFromCloudinary(banner.mediaUrl);
        }

        await Banner.findByIdAndDelete(bannerId);

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error) {
        console.error("Delete banner error:", error);
        return res.status(500).json({
            message: "Error deleting banner",
        });
    }
};