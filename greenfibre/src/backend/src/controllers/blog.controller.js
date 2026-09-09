import mongoose from "mongoose";
import { Blog } from "../models/blog.model.js";

import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

// =============================
// CREATE BLOG (Admin)
// =============================
export const createBlog = async (req, res) => {
    try {
        const { title, excerpt, content, tags, isPublished } = req.body;

        if (!title || !excerpt || !content) {
            return res.status(400).json({
                message: "Title, excerpt and content are required",
            });
        }

        // Upload cover image
        let coverImageUrl = null;

        if (req.files?.coverImage) {
            coverImageUrl = await uploadOnCloudinary(
                req.files.coverImage[0].path,
                "blogs"
            );
        }

        if (!coverImageUrl) {
            return res.status(400).json({
                message: "Cover image is required",
            });
        }

        // Upload additional images
        let imageUrls = [];

        if (req.files?.images) {
            for (const file of req.files.images) {
                const url = await uploadOnCloudinary(file.path, "blogs");

                if (url) imageUrls.push(url);
            }
        }

        const blog = await Blog.create({
            title,
            excerpt,
            content,
            coverImage: coverImageUrl,
            images: imageUrls,
            tags: tags ? tags.split(",") : [],
            author: req.user._id,
            isPublished: isPublished === "true",
        });

        return res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog,
        });
    } catch (error) {
        console.error("Create blog error:", error);

        return res.status(500).json({
            message: "Error creating blog",
        });
    }
};

// =============================
// Get BLOGS (Public)
// =============================
const DEFAULT_BLOGS = [
    {
        _id: "blog_1",
        title: "Why Sustainable Plant-Based Homeware is the Future",
        slug: "sustainable-plant-based-homeware",
        excerpt: "Discover how eco-friendly husk and plant-fiber materials are replacing single-use plastics in modern homes.",
        content: "Discover how eco-friendly husk and plant-fiber materials are replacing single-use plastics in modern homes.",
        readingTime: 4,
        coverImage: {
            medium: "/products/romano-planter.jpg",
            original: "/products/romano-planter.jpg",
            large: "/products/romano-planter.jpg",
            thumbnail: "/products/romano-planter.jpg",
        },
        createdAt: new Date().toISOString(),
        tags: ["Sustainability", "Eco-Living"],
    },
    {
        _id: "blog_2",
        title: "Zero-Waste Kitchen: Simple Habits That Make a Big Impact",
        slug: "zero-waste-kitchen-simple-habits",
        excerpt: "Practical steps to minimize kitchen waste with reusable storage bowls, natural canisters, and mindful meal prep.",
        content: "Practical steps to minimize kitchen waste with reusable storage bowls, natural canisters, and mindful meal prep.",
        readingTime: 5,
        coverImage: {
            medium: "/products/canister-700-ml.jpg",
            original: "/products/canister-700-ml.jpg",
            large: "/products/canister-700-ml.jpg",
            thumbnail: "/products/canister-700-ml.jpg",
        },
        createdAt: new Date().toISOString(),
        tags: ["Zero Waste", "Kitchen"],
    },
    {
        _id: "blog_3",
        title: "Hydration on the Go: The Eco Spring Difference",
        slug: "hydration-eco-spring-insulated-bottle",
        excerpt: "Why choosing durable thermal-insulated bottles reduces carbon emissions and keeps your drinks at peak freshness.",
        content: "Why choosing durable thermal-insulated bottles reduces carbon emissions and keeps your drinks at peak freshness.",
        readingTime: 3,
        coverImage: {
            medium: "/products/eco-spring-insulated-bottle.jpg",
            original: "/products/eco-spring-insulated-bottle.jpg",
            large: "/products/eco-spring-insulated-bottle.jpg",
            thumbnail: "/products/eco-spring-insulated-bottle.jpg",
        },
        createdAt: new Date().toISOString(),
        tags: ["Eco-Living", "Drinkware"],
    },
];

export const getAllBlogs = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                success: true,
                blogs: DEFAULT_BLOGS,
            });
        }

        const blogs = await Blog.find({
            isPublished: true,
        }).sort({
            createdAt: -1,
        });

        // ✅ Keep same frontend structure
        const formattedBlogs = blogs.map((blog) => {
            const blogObj = blog.toObject();

            if (blogObj.coverImage) {
                blogObj.coverImage = {
                    original: blog.coverImage,
                    large: blog.coverImage,
                    medium: blog.coverImage,
                    thumbnail: blog.coverImage,
                };
            }

            if (blogObj.images && blogObj.images.length > 0) {
                blogObj.images = blog.images.map((img) => ({
                    original: img,
                }));
            }

            return blogObj;
        });

        if (!formattedBlogs || formattedBlogs.length === 0) {
            return res.status(200).json({
                success: true,
                blogs: DEFAULT_BLOGS,
            });
        }

        return res.status(200).json({
            success: true,
            blogs: formattedBlogs,
        });
    } catch (error) {
        console.error("getAllBlogs error:", error.message);
        return res.status(200).json({
            success: true,
            blogs: DEFAULT_BLOGS,
        });
    }
};

// =============================
// Get Single Blog (Public)
// =============================
export const getSingleBlog = async (req, res) => {
    const { slug } = req.params;
    try {
        if (mongoose.connection.readyState !== 1) {
            const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug);
            if (fallback) {
                return res.status(200).json({
                    success: true,
                    blog: fallback,
                });
            }
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        const blog = await Blog.findOne({
            slug,
            isPublished: true,
        }).populate("author", "full_name");

        if (!blog) {
            const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug);
            if (fallback) {
                return res.status(200).json({
                    success: true,
                    blog: fallback,
                });
            }
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        const blogObj = blog.toObject();

        // ✅ Keep same response structure
        if (blogObj.coverImage) {
            blogObj.coverImage = {
                original: blog.coverImage,
                large: blog.coverImage,
                medium: blog.coverImage,
            };
        }

        if (blogObj.images && blogObj.images.length > 0) {
            blogObj.images = blog.images.map((img) => ({
                original: img,
            }));
        }

        return res.status(200).json({
            success: true,
            blog: blogObj,
        });
    } catch (error) {
        console.error("getSingleBlog error:", error.message);
        const fallback = DEFAULT_BLOGS.find((b) => b.slug === slug);
        if (fallback) {
            return res.status(200).json({
                success: true,
                blog: fallback,
            });
        }
        return res.status(500).json({
            message: "Error fetching blog",
        });
    }
};

// =============================
// UPDATE BLOG (Admin)
// =============================
export const updateBlog = async (req, res) => {
    try {
        const { blogId } = req.params;

        const {
            title,
            excerpt,
            content,
            tags,
            isPublished,
            metaTitle,
            metaDescription,
            metaKeywords,
        } = req.body;

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        // Update basic fields
        if (title) blog.title = title;

        if (excerpt) blog.excerpt = excerpt;

        if (content) blog.content = content;

        if (tags) blog.tags = tags.split(",");

        if (isPublished !== undefined) {
            blog.isPublished = isPublished === "true";
        }

        // SEO fields
        if (metaTitle) blog.metaTitle = metaTitle;

        if (metaDescription) {
            blog.metaDescription = metaDescription;
        }

        if (metaKeywords) {
            blog.metaKeywords = metaKeywords.split(",");
        }

        // Cover image update
        if (req.files?.coverImage) {
            // Delete old image
            if (blog.coverImage) {
                await deleteFromCloudinary(blog.coverImage);
            }

            blog.coverImage = await uploadOnCloudinary(
                req.files.coverImage[0].path,
                "blogs"
            );
        }

        // Additional images update
        if (req.files?.images) {
            // Delete old images
            for (const img of blog.images) {
                await deleteFromCloudinary(img);
            }

            let imageUrls = [];

            for (const file of req.files.images) {
                const url = await uploadOnCloudinary(file.path, "blogs");

                if (url) imageUrls.push(url);
            }

            blog.images = imageUrls;
        }

        await blog.save();

        return res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog,
        });
    } catch (error) {
        console.error("Update blog error:", error);

        return res.status(500).json({
            message: "Error updating blog",
        });
    }
};

// =============================
// DELETE BLOG (Admin)
// =============================
export const deleteBlog = async (req, res) => {
    try {
        const { blogId } = req.params;

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        // Delete cover image
        if (blog.coverImage) {
            await deleteFromCloudinary(blog.coverImage);
        }

        // Delete additional images
        for (const img of blog.images) {
            await deleteFromCloudinary(img);
        }

        await Blog.findByIdAndDelete(blogId);

        return res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        console.error("Delete blog error:", error);

        return res.status(500).json({
            message: "Error deleting blog",
        });
    }
};

// =============================
// TOGGLE BLOG PUBLISH STATUS (Admin)
// =============================
export const togglePublishStatus = async (req, res) => {
    try {
        const { blogId } = req.params;

        const { isPublished } = req.body;

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        // If explicit value provided
        if (typeof isPublished === "boolean") {
            blog.isPublished = isPublished;
        } else {
            // Otherwise toggle
            blog.isPublished = !blog.isPublished;
        }

        await blog.save();

        return res.status(200).json({
            success: true,
            message: `Blog ${
                blog.isPublished ? "published" : "unpublished"
            } successfully`,
            isPublished: blog.isPublished,
        });
    } catch (error) {
        console.error("Toggle publish error:", error);

        return res.status(500).json({
            message: "Error toggling publish status",
        });
    }
};

// =============================
// Get BLOGS (Admin)
// =============================
export const getAllBlogsAdmin = async (req, res) => {
    try {
        const blogs = await Blog.find().select("-content").sort({
            createdAt: -1,
        });

        // ✅ Keep same frontend structure
        const formattedBlogs = blogs.map((blog) => {
            const blogObj = blog.toObject();

            if (blogObj.coverImage) {
                blogObj.coverImage = {
                    original: blog.coverImage,
                    thumbnail: blog.coverImage,
                };
            }

            return blogObj;
        });

        return res.status(200).json({
            success: true,
            blogs: formattedBlogs,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching blogs",
        });
    }
};