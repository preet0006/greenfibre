import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMA: Customization Option
// Describes ONE type of customization (logo print, embroidery, engraving …).
// These are the "menu" of what this product CAN offer.
// ─────────────────────────────────────────────────────────────────────────────
const CustomizationOptionSchema = new mongoose.Schema(
    {
        // Stable machine-readable key — used to cross-reference tiers.
        // e.g. "logo_print", "embroidery", "gift_wrap"
        key: {
            type: String,
            required: true,
            trim: true,
        },

        // Human-facing label shown in the storefront / admin panel
        label: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        // Category of customization for filtering / grouping in UI
        type: {
            type: String,
            enum: ["print", "embroidery", "engraving", "color", "packaging", "label", "size", "other"],
            default: "other",
        },

        // If true, this option costs extra on top of the unit price
        isPriced: {
            type: Boolean,
            default: false,
        },

        // Base additional cost per unit (can be overridden per tier)
        pricePerUnit: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Minimum quantity needed to unlock this customization
        moq: {
            type: Number,
            default: 1,
            min: 1,
        },

        // Extra production time this customization adds
        additionalLeadTime: {
            type: String,
            default: "",
            trim: true,
        },

        // File specs, colour limits, size constraints, etc.
        notes: {
            type: String,
            default: "",
            trim: true,
        },

        // Admin toggle — hide without deleting
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMA: Pricing Tier
// One tier = one quantity bracket with its own unit price and perks.
// ─────────────────────────────────────────────────────────────────────────────
const PricingTierSchema = new mongoose.Schema(
    {
        // Unique label displayed on the UI tier card
        // e.g. "Starter", "Pro", "Enterprise"
        tierLabel: {
            type: String,
            required: true,
            trim: true,
        },

        // Quantity range
        minQty: {
            type: Number,
            required: true,
            min: 1,
        },
        // null = "and above" (open-ended top tier)
        maxQty: {
            type: Number,
            default: null,
        },

        // Price charged per unit at this tier
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        // Calculated field for display purposes (% off basePrice)
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // Highlight this tier as most popular in the UI
        popular: {
            type: Boolean,
            default: false,
        },

        // Production lead time for this tier
        leadTime: {
            type: String,
            default: "",
            trim: true,
        },

        // Generic bullet-point perks shown on this tier card
        // e.g. ["Priority dispatch", "Dedicated RM"]
        benefits: {
            type: [String],
            default: [],
        },

        // ── Customization config for THIS tier ──────────────────────────────
        // Which customization option *keys* (from b2bProductConfig.customizationOptions)
        // are unlocked at this tier. Empty = none unlocked at this tier.
        enabledCustomizationKeys: {
            type: [String],
            default: [],
        },

        // Per-tier price overrides for individual customization options.
        // Lets higher tiers offer a customization for free or at a discount.
        customizationPriceOverrides: [
            {
                optionKey:    { type: String, required: true },
                pricePerUnit: { type: Number, default: 0, min: 0 },
                isFree:       { type: Boolean, default: false },
            },
        ],

        // Features exclusive to buyers at this tier
        exclusiveFeatures: {
            type: [String],
            default: [],
        },

        // Operational perks
        dedicatedAccountManager: {
            type: Boolean,
            default: false,
        },
        freeSampleIncluded: {
            type: Boolean,
            default: false,
        },

        // Admin-only note, never sent to clients
        internalNotes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCHEMA: B2BProductConfig
// One document per product. Completely decoupled from the Product model.
// The Product document itself stays clean — no B2B data lives there.
// ─────────────────────────────────────────────────────────────────────────────
const b2bProductConfigSchema = new mongoose.Schema(
    {
        // ── Reference ───────────────────────────────────────────────────────
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true, // one config per product
            index: true,
        },

        // ── Global switch ────────────────────────────────────────────────────
        // If false, this config is ignored and the product is treated as B2C only.
        isEnabled: {
            type: Boolean,
            default: false,
            index: true,
        },

        // ── Base pricing settings ────────────────────────────────────────────
        // The "rack rate" before tier discounts apply.
        basePrice: {
            type: Number,
            default: null,
            min: 0,
        },

        // Global minimum order quantity for this product in B2B
        moq: {
            type: Number,
            default: 1,
            min: 1,
        },

        // Quantity must be ordered in multiples of this number
        // e.g. stepQuantity: 50 → orders of 50, 100, 150 …
        stepQuantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        // ── Sample policy ────────────────────────────────────────────────────
        sampleAvailable: {
            type: Boolean,
            default: false,
        },
        samplePrice: {
            type: Number,
            default: null,
            min: 0,
        },

        // ── B2B Media Overrides (Optional) ──────────────────────────────────
        // If provided, B2B storefront displays these corporate/branding photos
        // instead of retail B2C photos. If empty, falls back to Product.images.
        images: {
            type: [String],
            default: [],
        },

        // Dedicated corporate gift box & packaging photos
        giftBoxImages: {
            type: [String],
            default: [],
        },

        // Customization mockup & logo placement showcase images
        customizationShowcaseImages: {
            type: [String],
            default: [],
        },

        // ── Pricing tiers ────────────────────────────────────────────────────
        // Ordered array — lower index = smaller qty bracket.
        // System picks the applicable tier at order time using minQty / maxQty.
        tiers: [PricingTierSchema],

        // ── Customization options (the full product "menu") ──────────────────
        // Every customization this product CAN support across all tiers.
        // Individual tiers reference these by `key` to enable / override them.
        customizationOptions: [CustomizationOptionSchema],

        // ── Global customization notes (admin-facing) ────────────────────────
        customizationNotes: {
            type: String,
            default: "",
            trim: true,
        },

        // ── Internal config notes ────────────────────────────────────────────
        adminNotes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────
b2bProductConfigSchema.index({ isEnabled: 1, createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the tier object that covers the given quantity.
 * @param {number} qty
 * @returns {object|null}
 */
b2bProductConfigSchema.methods.getTierForQty = function (qty) {
    if (!this.tiers || this.tiers.length === 0) return null;
    return (
        this.tiers.find((t) => {
            const aboveMin = qty >= t.minQty;
            const belowMax = t.maxQty === null || qty <= t.maxQty;
            return aboveMin && belowMax;
        }) ?? null
    );
};

/**
 * Returns the resolved unit price for a given quantity, or null if
 * the config is disabled or no tier matches.
 * @param {number} qty
 * @returns {number|null}
 */
b2bProductConfigSchema.methods.getPriceForQty = function (qty) {
    if (!this.isEnabled) return null;
    const tier = this.getTierForQty(qty);
    return tier ? tier.unitPrice : null;
};

/**
 * Returns the resolved price for a customization option at a given quantity.
 * Applies tier-level price overrides automatically.
 * Returns null if the option is not enabled on this tier.
 * @param {string} optionKey
 * @param {number} qty
 * @returns {number|null}
 */
b2bProductConfigSchema.methods.getCustomizationPrice = function (optionKey, qty) {
    const option = this.customizationOptions.find((o) => o.key === optionKey && o.isActive);
    if (!option) return null;

    const tier = this.getTierForQty(qty);
    if (!tier) return null;

    // Option must be explicitly enabled on this tier
    if (!tier.enabledCustomizationKeys.includes(optionKey)) return null;

    // Check for a price override on this tier
    const override = tier.customizationPriceOverrides.find((o) => o.optionKey === optionKey);
    if (override) return override.isFree ? 0 : override.pricePerUnit;

    return option.pricePerUnit;
};

b2bProductConfigSchema.set("toObject", { virtuals: true });
b2bProductConfigSchema.set("toJSON", { virtuals: true });

export const B2BProductConfig = mongoose.model("B2BProductConfig", b2bProductConfigSchema);
