import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            unique: true,
            index: true,
        },

        excerpt: {
            type: String,
            required: true,
            maxlength: 300,
        },

        content: {
            type: String,
            required: true,
        },

        coverImage: {
            type: String,
            required: true,
        },

        images: [String],

        tags: [String],

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        isPublished: {
            type: Boolean,
            default: false,
        },

        readingTime: Number,

        // =============================
        // SEO Fields
        // =============================

        metaTitle: {
            type: String,
            maxlength: 70,
        },

        metaDescription: {
            type: String,
            maxlength: 160,
        },

        metaKeywords: [String],

        ogImage: {
            type: String,
        },
    },
    { timestamps: true }
);

// Auto slug + reading time
blogSchema.pre("save", function () {
    if (this.isModified("title")) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
        });
    }

    if (this.isModified("content")) {
        const words = this.content.split(" ").length;
        this.readingTime = Math.ceil(words / 200);
    }
});

export const Blog = mongoose.model("Blog", blogSchema);
