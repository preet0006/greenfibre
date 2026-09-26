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
                    const orig =
                        this.originalPrice ??
                        this.getUpdate?.()?.originalPrice ??
                        this.getUpdate?.()?.$set?.originalPrice;
                    if (orig === undefined) return true;
                    return value <= orig;
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

        // ================= TAGS (for mobile sections) =================
        // Use these to bucket products into homepage sections
        // e.g. ["gift", "bestSeller"]  or  ["newArrival"]
        tags: {
            type: [String],
            enum: ["gift", "bestSeller", "newArrival", "featured", "trending"],
            default: [],
            index: true,
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
// VIRTUAL: totalStock (sum across all color variants)
// =============================
productSchema.virtual("totalStock").get(function () {
    if (!this.colors || this.colors.length === 0) return 0;
    return this.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
});

// =============================
// AUTO SLUG GENERATION
// =============================
productSchema.pre("save", function () {
    if (this.isModified("name") && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
        });
    }
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

export const Product = mongoose.model("Product", productSchema);
