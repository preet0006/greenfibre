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

        unit: {
            type: String,
            default: "piece",
            trim: true,
        },

        tagline: {
            type: String,
            default: "",
            trim: true,
        },

        leadTime: {
            type: String,
            default: "7 - 10 business days",
            trim: true,
        },

        branding: {
            type: Boolean,
            default: true,
        },

        brandingTypes: {
            type: [String],
            default: [],
        },

        size: {
            type: String,
            default: "",
            trim: true,
        },

        material: {
            type: String,
            default: "",
            trim: true,
        },

        specs: {
            type: Object,
            default: {},
        },

        popular: {
            type: Boolean,
            default: false,
        },

        shortDescription: {
            type: String,
            default: "",
        },

        productFeatures: {
            type: [String],
            default: [],
        },

        collectionName: {
            type: String,
            default: "",
        },

        color: {
            type: String,
            default: "Green",
            trim: true,
        },

        stockQuantity: {
            type: Number,
            default: 0,
        },

        // ================= PRODUCT IMAGES & GIFT BOX PHOTOS =================
        images: {
            type: [String],
            default: [],
        },

        giftBoxImages: {
            type: [String],
            default: [], // Optional: 1, 2, 3+ photos of gift boxes / packaging
        },

        giftPackaging: {
            available: { type: Boolean, default: false },
            images: { type: [String], default: [] },
            title: { type: String, default: "Premium Gift Box" },
            description: { type: String, default: "" },
            pricePerBox: { type: Number, default: 0 },
            customBrandingAvailable: { type: Boolean, default: true },
        },

        productWeight: {
            value: { type: Number, default: 0 },
            unit: { type: String, default: "gm" },
        },

        dimensions: {
            length: { type: Number, default: 0 },
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            unit: { type: String, default: "cm" },
        },

        package: {
            contents: { type: String, default: "" },
            type: { type: String, default: "" },
            giftBoxImages: { type: [String], default: [] },
            deadWeight: { type: String, default: "" },
            length: { type: String, default: "" },
            width: { type: String, default: "" },
            height: { type: String, default: "" },
            itemsPerPackage: { type: String, default: "" },
            packerDetails: { type: String, default: "" },
            countryOfOrigin: { type: String, default: "India" },
        },

        careInstructions: {
            type: String,
            default: "",
        },

        sustainability: {
            madeWith: { type: String, default: "" },
            highlights: { type: [String], default: [] },
        },

        // ================= GIFT SET CONTENTS (For hampers & multi-item sets) =================
        giftSetContents: {
            totalProductTypes: { type: Number, default: 0 },
            products: [
                {
                    name: { type: String, default: "" },
                    quantity: { type: Number, default: 1 },
                    unit: { type: String, default: "set" },
                    description: { type: String, default: "" },
                    material: { type: String, default: "" },
                    size: { type: String, default: "" },
                    color: { type: String, default: "" },
                    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
                    features: { type: [String], default: [] },
                },
            ],
        },


        // ================= PRICING =================
        originalPrice: {
            type: Number,
            default: 0,
        },

        discountedPrice: {
            type: Number,
            default: 0,
        },

        // Channel-specific pricing
        b2cPrice: { type: Number, default: null },
        b2bPrice: { type: Number, default: null },

        // Margins
        b2cMargin: { type: Number, default: 0 },
        b2bMargin: { type: Number, default: 0 },

        // ================= B2B WHOLESALE ADVANCED PRICING =================
        b2bPricing: {
            isEnabled: {
                type: Boolean,
                default: false,
                index: true,
            },
            basePrice: {
                type: Number,
                default: null,
            },
            moq: {
                type: Number,
                default: 1,
            },
            stepQuantity: {
                type: Number,
                default: 1,
            },
            sampleAvailable: {
                type: Boolean,
                default: false,
            },
            samplePrice: {
                type: Number,
                default: null,
            },
            tiers: [
                {
                    minQty: {
                        type: Number,
                        required: true,
                    },
                    maxQty: {
                        type: Number,
                        default: null, // null means "and above"
                    },
                    unitPrice: {
                        type: Number,
                        required: true,
                    },
                    discountPercentage: {
                        type: Number,
                        default: 0,
                    },
                    tierLabel: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                    popular: {
                        type: Boolean,
                        default: false,
                    },
                    leadTime: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                    benefits: {
                        type: [String],
                        default: [],
                    },
                    customizationOptions: {
                        type: [String],
                        default: [],
                    },
                },
            ],
        },

        // ================= B2B CUSTOMIZATION =================
        // Scoped exclusively to B2B. Controls what customization options are
        // available for a product and which tiers unlock which options.
        b2bCustomization: {
            isEnabled: {
                type: Boolean,
                default: false,
                index: true,
            },

            // ---- Global customization options for this product ----
            // Each entry describes ONE type of customization (e.g. logo print,
            // embroidery, color match, engraving …).
            options: [
                {
                    // Unique key used as a stable reference across tiers
                    // e.g. "logo_print", "embroidery", "custom_color"
                    key: {
                        type: String,
                        required: true,
                        trim: true,
                    },

                    // Human-readable label shown in the UI
                    label: {
                        type: String,
                        required: true,
                        trim: true,
                    },

                    // Optional longer description / what the buyer can expect
                    description: {
                        type: String,
                        default: "",
                        trim: true,
                    },

                    // "print" | "embroidery" | "engraving" | "color" |
                    // "packaging" | "label" | "size" | "other"
                    type: {
                        type: String,
                        enum: [
                            "print",
                            "embroidery",
                            "engraving",
                            "color",
                            "packaging",
                            "label",
                            "size",
                            "other",
                        ],
                        default: "other",
                    },

                    // Whether this customization costs extra
                    isPriced: {
                        type: Boolean,
                        default: false,
                    },

                    // Additional cost PER UNIT for this customization.
                    // 0 means included at no extra charge.
                    pricePerUnit: {
                        type: Number,
                        default: 0,
                    },

                    // Minimum qty required to avail this customization
                    moq: {
                        type: Number,
                        default: 1,
                    },

                    // Lead-time addition caused by this customization
                    additionalLeadTime: {
                        type: String,
                        default: "",
                        trim: true,
                    },

                    // Free-form notes (file formats accepted, size limits …)
                    notes: {
                        type: String,
                        default: "",
                        trim: true,
                    },

                    // Whether this option is currently offered
                    isActive: {
                        type: Boolean,
                        default: true,
                    },

                    // Which pricing tiers support this customization.
                    // Use tier _id strings OR tierLabel values.
                    // Empty array = available on ALL tiers.
                    availableOnTiers: {
                        type: [String],
                        default: [],
                    },
                },
            ],

            // ---- Per-tier customization details ----
            // Lets you declare EXACTLY what is unlocked (or overridden) at
            // each pricing tier, giving full flexibility beyond the global
            // options array above.
            tierCustomizations: [
                {
                    // Must match the tierLabel or _id of a b2bPricing.tiers entry
                    tierLabel: {
                        type: String,
                        required: true,
                        trim: true,
                    },

                    // Short headline shown on the tier card
                    // e.g. "Full branding suite included"
                    headline: {
                        type: String,
                        default: "",
                        trim: true,
                    },

                    // Array of customization option *keys* (from options[].key)
                    // that are enabled for this tier
                    enabledOptionKeys: {
                        type: [String],
                        default: [],
                    },

                    // Per-tier price overrides — lets a higher tier get a
                    // customization at a reduced or zero cost
                    priceOverrides: [
                        {
                            optionKey: { type: String, required: true },
                            pricePerUnit: { type: Number, default: 0 },
                            isFree: { type: Boolean, default: false },
                        },
                    ],

                    // Additional features / benefits exclusive to this tier
                    // (bullet points shown in the UI)
                    exclusiveFeatures: {
                        type: [String],
                        default: [],
                    },

                    // Any extra lead-time comment at the tier level
                    leadTimeNote: {
                        type: String,
                        default: "",
                        trim: true,
                    },

                    // Whether a dedicated account manager is assigned
                    dedicatedAccountManager: {
                        type: Boolean,
                        default: false,
                    },

                    // Whether samples are included free at this tier
                    freeSampleIncluded: {
                        type: Boolean,
                        default: false,
                    },

                    // Any additional notes visible only to admins
                    internalNotes: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                },
            ],

            // Overall notes about customization for this product (admin-facing)
            generalNotes: {
                type: String,
                default: "",
                trim: true,
            },
        },

        // ================= TAX & COMPLIANCE =================
        tax: {
            hsnCode: {
                type: String,
                default: "",
                trim: true,
            },
            gstRate: {
                type: mongoose.Schema.Types.Mixed,
                default: 18,
            },
            isTaxInclusive: {
                type: Boolean,
                default: true,
            },
        },

        // Competitor benchmarks
        competitors: [
            {
                id: { type: String },
                competitorName: { type: String },
                competitorProductName: { type: String },
                competitorProductUrl: { type: String },
                competitorPrice: { type: Number },
                competitorOriginalPrice: { type: Number },
                competitorNotes: { type: String },
                isPrimary: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date, default: Date.now },
            },
        ],

        colors: {
            type: [
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
            default: [
                {
                    name: "Green",
                    hex: "#2E7D32",
                    images: [],
                    stock: 0,
                },
            ],
        },

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
// AUTO SLUG & GIFT BOX IMAGES SYNC
// =============================
productSchema.pre("save", function (next) {
    if (this.isModified("name") && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
        });
    }

    // Sync giftBoxImages across giftPackaging and package sub-objects
    if (Array.isArray(this.giftBoxImages) && this.giftBoxImages.length > 0) {
        if (!this.giftPackaging) this.giftPackaging = {};
        if (!this.giftPackaging.images || this.giftPackaging.images.length === 0) {
            this.giftPackaging.images = this.giftBoxImages;
        }
        if (this.package && (!this.package.giftBoxImages || this.package.giftBoxImages.length === 0)) {
            this.package.giftBoxImages = this.giftBoxImages;
        }
    } else if (this.giftPackaging?.images?.length > 0) {
        this.giftBoxImages = this.giftPackaging.images;
    }

    if (typeof next === "function") next();
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

export const Product = mongoose.model("Product", productSchema);

