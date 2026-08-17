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
export const getAllBlogs = async (req, res) => {
    try {
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

// =============================
// Get Single Blog (Public)
// =============================
export const getSingleBlog = async (req, res) => {
    try {
        const { slug } = req.params;

        const blog = await Blog.findOne({
            slug,
            isPublished: true,
        }).populate("author", "full_name");

        if (!blog) {
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