import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
    {
        // ================= BASIC =================
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            unique: true,
            index: true,
        },

        // ================= PRICING =================
        originalPrice: {
            type: Number,
            required: true,
        },

        discountedPrice: {
            type: Number,
            required: true,
            validate: {
                validator: function (value) {
                    return value <= this.originalPrice;
                },
                message: "Discounted price cannot exceed original price",
            },
        },

        colors: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                hex: {
                    type: String, // optional (for UI color picker)
                },
                images: {
                    type: [String], // separate images per color
                    default: [],
                },
                stock: {
                    type: Number,
                    default: 0,
                },
            },
        ],

        // ================= DESCRIPTION =================
        description: {
            type: String,
            required: true,
        },

        // ================= CATEGORY =================
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        // ================= FEATURES =================
        features: {
            type: Object,
            default: {},
        },

        // ================= Material Info =================
        materialInfo: {
            type: Object,
            default: {},
        },

        // ================= FLAGS =================
        isActive: {
            type: Boolean,
            default: true,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        // ================= REVIEWS =================
        averageRating: {
            type: Number,
            default: 0,
        },

        reviewCount: {
            type: Number,
            default: 0,
        },

        // ================= SEO =================
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String],
        canonicalUrl: String,
        ogImage: String,
    },
    { timestamps: true }
);

// =============================
// AUTO SLUG GENERATION
// =============================
productSchema.pre("save", function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
        });
    }
});

export const Product = mongoose.model("Product", productSchema);
