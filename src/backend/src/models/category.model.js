import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        slug: {
            type: String,
            unique: true,
        },

        description: {
            type: String,
        },

        image: {
            type: String, // optional banner/thumbnail
        },

        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null, // allows subcategories later
        },

        displayOrder: {
            type: Number,
            default: 0,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // ================= SEO =================
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
    },
    { timestamps: true }
);

// Auto generate slug
categorySchema.pre("save", function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
        });
    }
});

export const Category = mongoose.model("Category", categorySchema);
