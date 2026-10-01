import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-SCHEMA: Customization Option
// Describes ONE type of customization (logo print, embroidery, engraving …).
// These are the "menu" of what this product CAN offer.
// ─────────────────────────────────────────────────────────────────────────────
const CustomizationOptionSchema = new mongoose.Schema(
    {
        // Stable machine-readable key — used to cross-reference tiers.
        // e.g. "laser_logo", "pantone_colorway", "bespoke_packaging", "greeting_card", "recipient_monogram"
        key: {
            type: String,
            required: true,
            trim: true,
        },

        // Human-facing label shown in the storefront / admin panel
        // e.g. "Custom Laser Logo Engraving"
        label: {
            type: String,
            required: true,
            trim: true,
        },

        // Short category pill / tag displayed on the UI card badge
        // e.g. "Laser Etched", "Brand Tone", "Custom Box", "Insert Card", "Per-Piece"
        tag: {
            type: String,
            default: "",
            trim: true,
        },
        badge: {
            type: String,
            default: "",
            trim: true,
        },

        // Icon identifier or emoji for the UI card
        // e.g. "sparkles", "laser", "palette", "box", "card", "user-check", "ribbon"
        icon: {
            type: String,
            default: "sparkles",
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
            enum: ["print", "embroidery", "engraving", "color", "packaging", "card", "monogram", "label", "size", "other"],
            default: "other",
        },

        // If true, this option costs extra on top of the unit price (when not covered by tier allowance)
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
// SUB-SCHEMA: Additional Product
// A complementary / upsell product shown alongside the main B2B product.
// e.g. matching lid for a bottle, gift bag, greeting card, straw, etc.
// The admin attaches a reference to an existing Product document plus
// optional display metadata.  The storefront fetches full product details
// via the ref — no duplication needed.
// ─────────────────────────────────────────────────────────────────────────────
const AdditionalProductSchema = new mongoose.Schema(
    {
        // Reference to the companion Product document
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        // Short display label shown in the UI, e.g. "Matching Lid", "Gift Bag", "Straw Set"
        // Falls back to the product's own name if left empty.
        label: {
            type: String,
            default: "",
            trim: true,
        },

        // Brief note for the buyer, e.g. "Pairs perfectly with this bottle"
        note: {
            type: String,
            default: "",
            trim: true,
        },

        // When this add-on should become visible in the storefront:
        //   "always"    – shown right away on the product page
        //   "on_select" – shown only after the buyer picks/configures the main product
        //   "on_quote"  – surfaced only on the quote request form
        displayTrigger: {
            type: String,
            enum: ["always", "on_select", "on_quote"],
            default: "on_select",
        },

        // Whether buyers can add this companion product to their order / quote
        isSelectable: {
            type: Boolean,
            default: true,
        },

        // Sort order in the UI (lower = shown first)
        sortOrder: {
            type: Number,
            default: 0,
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
        // e.g. "TIER 1", "TIER 2", "TIER 3", "Tier 1 (MOQ Starter)", "Tier 2 (Volume Partner)"
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

        // Display badge on top-right of tier card (e.g. "★ POPULAR", "-20%", "BEST VALUE")
        badge: {
            type: String,
            default: "",
            trim: true,
        },

        // Number of complimentary customizations included in this tier
        // e.g. 2 for Tier 1, 3 for Tier 2, 5 for Tier 3 (or -1 for all)
        includedCustomizationsCount: {
            type: Number,
            default: null,
        },

        // Descriptive banner text, e.g. "Choose any 3 of 5 complimentary customizations below."
        customizationAllowanceText: {
            type: String,
            default: "",
            trim: true,
        },

        // Next tier upsell hint, e.g. "Tier 3 unlocks all 5 →"
        nextTierUnlockText: {
            type: String,
            default: "",
            trim: true,
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
// SUB-SCHEMA: Context / Occasion Config
// Allows the same product to offer different tiers, MOQs, and customization
// options when viewed in different contexts (e.g., "anniversary", "corporate",
// "wedding", "festive", "employee-onboarding", "merchandise", etc.).
// ─────────────────────────────────────────────────────────────────────────────
const ContextConfigSchema = new mongoose.Schema(
    {
        // Stable machine-readable key, e.g. "anniversary", "corporate", "wedding", "festive"
        contextKey: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        // Human-facing label shown in UI, e.g. "Anniversary Gifting", "Corporate Gifting"
        contextLabel: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        isEnabled: {
            type: Boolean,
            default: true,
        },

        // Context-specific pricing overrides (if null, falls back to product/global base config)
        basePrice: {
            type: Number,
            default: null,
            min: 0,
        },
        moq: {
            type: Number,
            default: null,
            min: 1,
        },
        stepQuantity: {
            type: Number,
            default: null,
            min: 1,
        },
        sampleAvailable: {
            type: Boolean,
            default: null,
        },
        samplePrice: {
            type: Number,
            default: null,
            min: 0,
        },
        leadTime: {
            type: String,
            default: "",
            trim: true,
        },

        // Context-specific volume tiers (if empty, falls back to global tiers)
        tiers: [PricingTierSchema],

        // Context-specific customization options menu (if empty, falls back to global options)
        customizationOptions: [CustomizationOptionSchema],

        // Context-specific media (e.g. anniversary gift box mockups, wedding ribbon packaging)
        images: {
            type: [String],
            default: [],
        },
        giftBoxImages: {
            type: [String],
            default: [],
        },
        customizationShowcaseImages: {
            type: [String],
            default: [],
        },
        customizationNotes: {
            type: String,
            default: "",
            trim: true,
        },
        adminNotes: {
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

        // ── Context / Occasion Specific Overrides ────────────────────────────
        // Holds customized tiers & customization options for specific occasions
        // e.g., "anniversary", "corporate", "wedding", "festive", etc.
        contexts: [ContextConfigSchema],

        // ── Global customization notes (admin-facing) ────────────────────────
        customizationNotes: {
            type: String,
            default: "",
            trim: true,
        },

        // ── Additional / Companion Products ──────────────────────────────────
        // Products shown alongside this one on the B2B storefront (e.g. lids,
        // straws, gift bags).  Each entry carries a ref to a Product document
        // so the storefront can populate full details on demand.
        additionalProducts: {
            type: [AdditionalProductSchema],
            default: [],
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
b2bProductConfigSchema.index({ "contexts.contextKey": 1 });

// ─────────────────────────────────────────────────────────────────────────────
// PURE RESOLUTION HELPER (For Docs & Lean Objects)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves effective B2B configuration (tiers, customizations, MOQ, base price, media)
 * for a specific context / occasion (e.g. "anniversary", "corporate", "wedding").
 * Works on both Mongoose documents and plain JavaScript objects.
 *
 * @param {object|null} b2bConfig - Raw B2BProductConfig object or doc
 * @param {string} [contextKey=""] - Context name from query/body/header (e.g. "anniversary")
 * @returns {object} Resolved configuration with fallback to default B2B settings
 */
export const resolveConfigForContext = (b2bConfig, contextKey = "") => {
    if (!b2bConfig) {
        return {
            _id: null,
            product: null,
            isEnabled: false,
            basePrice: null,
            moq: 1,
            stepQuantity: 1,
            sampleAvailable: false,
            samplePrice: null,
            leadTime: "",
            tiers: [],
            customizationOptions: [],
            images: [],
            giftBoxImages: [],
            customizationShowcaseImages: [],
            customizationNotes: "",
            adminNotes: "",
            additionalProducts: [],
            activeContext: {
                key: "default",
                label: "Standard B2B",
                isCustomContext: false,
            },
            availableContexts: [],
        };
    }

    const rawContexts = Array.isArray(b2bConfig.contexts) ? b2bConfig.contexts : [];
    const availableContexts = rawContexts
        .filter((c) => c && c.isEnabled !== false)
        .map((c) => ({
            key: (c.contextKey || "").toLowerCase().trim(),
            label: c.contextLabel || c.contextKey,
            description: c.description || "",
        }));

    const normalizedReqContext = (contextKey || "").toString().trim().toLowerCase();

    // Find matching context if requested
    let matchedContext = null;
    if (normalizedReqContext && rawContexts.length > 0) {
        matchedContext = rawContexts.find((c) => {
            if (!c || c.isEnabled === false) return false;
            const key = (c.contextKey || "").toLowerCase().trim();
            const label = (c.contextLabel || "").toLowerCase().trim();
            // Match exact key, exact label, or normalized variations
            return (
                key === normalizedReqContext ||
                label === normalizedReqContext ||
                key.replace(/[-_\s]+/g, "") === normalizedReqContext.replace(/[-_\s]+/g, "")
            );
        });
    }

    if (matchedContext) {
        // Resolve with context-specific overrides falling back to base config
        const resolvedTiers = Array.isArray(matchedContext.tiers) && matchedContext.tiers.length > 0
            ? matchedContext.tiers
            : (b2bConfig.tiers || []);

        const resolvedCustomizations = Array.isArray(matchedContext.customizationOptions) && matchedContext.customizationOptions.length > 0
            ? matchedContext.customizationOptions
            : (b2bConfig.customizationOptions || []);

        const resolvedImages = Array.isArray(matchedContext.images) && matchedContext.images.length > 0
            ? matchedContext.images
            : (b2bConfig.images || []);

        const resolvedGiftBoxImages = Array.isArray(matchedContext.giftBoxImages) && matchedContext.giftBoxImages.length > 0
            ? matchedContext.giftBoxImages
            : (b2bConfig.giftBoxImages || []);

        const resolvedShowcaseImages = Array.isArray(matchedContext.customizationShowcaseImages) && matchedContext.customizationShowcaseImages.length > 0
            ? matchedContext.customizationShowcaseImages
            : (b2bConfig.customizationShowcaseImages || []);

        return {
            _id: b2bConfig._id,
            product: b2bConfig.product,
            isEnabled: b2bConfig.isEnabled,
            basePrice: matchedContext.basePrice !== null && matchedContext.basePrice !== undefined
                ? matchedContext.basePrice
                : b2bConfig.basePrice,
            moq: matchedContext.moq !== null && matchedContext.moq !== undefined
                ? matchedContext.moq
                : (b2bConfig.moq || 1),
            stepQuantity: matchedContext.stepQuantity !== null && matchedContext.stepQuantity !== undefined
                ? matchedContext.stepQuantity
                : (b2bConfig.stepQuantity || 1),
            sampleAvailable: matchedContext.sampleAvailable !== null && matchedContext.sampleAvailable !== undefined
                ? matchedContext.sampleAvailable
                : Boolean(b2bConfig.sampleAvailable),
            samplePrice: matchedContext.samplePrice !== null && matchedContext.samplePrice !== undefined
                ? matchedContext.samplePrice
                : b2bConfig.samplePrice,
            leadTime: matchedContext.leadTime || "",
            tiers: resolvedTiers,
            customizationOptions: resolvedCustomizations,
            images: resolvedImages,
            giftBoxImages: resolvedGiftBoxImages,
            customizationShowcaseImages: resolvedShowcaseImages,
            customizationNotes: matchedContext.customizationNotes || b2bConfig.customizationNotes || "",
            adminNotes: matchedContext.adminNotes || b2bConfig.adminNotes || "",
            // additionalProducts always comes from the root config (not context-specific)
            additionalProducts: b2bConfig.additionalProducts || [],
            activeContext: {
                key: matchedContext.contextKey,
                label: matchedContext.contextLabel,
                isCustomContext: true,
            },
            availableContexts,
            contexts: rawContexts,
        };
    }

    // Default global configuration
    return {
        _id: b2bConfig._id,
        product: b2bConfig.product,
        isEnabled: b2bConfig.isEnabled,
        basePrice: b2bConfig.basePrice,
        moq: b2bConfig.moq || 1,
        stepQuantity: b2bConfig.stepQuantity || 1,
        sampleAvailable: Boolean(b2bConfig.sampleAvailable),
        samplePrice: b2bConfig.samplePrice,
        leadTime: "",
        tiers: b2bConfig.tiers || [],
        customizationOptions: b2bConfig.customizationOptions || [],
        images: b2bConfig.images || [],
        giftBoxImages: b2bConfig.giftBoxImages || [],
        customizationShowcaseImages: b2bConfig.customizationShowcaseImages || [],
        customizationNotes: b2bConfig.customizationNotes || "",
        adminNotes: b2bConfig.adminNotes || "",
        additionalProducts: b2bConfig.additionalProducts || [],
        activeContext: {
            key: "default",
            label: "Standard B2B",
            isCustomContext: false,
        },
        availableContexts,
        contexts: rawContexts,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves configuration for a specific context / occasion.
 * @param {string} contextKey
 * @returns {object}
 */
b2bProductConfigSchema.methods.resolveForContext = function (contextKey = "") {
    return resolveConfigForContext(this, contextKey);
};

/**
 * Returns the tier object that covers the given quantity for the specified context.
 * @param {number} qty
 * @param {string} [contextKey=""]
 * @returns {object|null}
 */
b2bProductConfigSchema.methods.getTierForQty = function (qty, contextKey = "") {
    const resolved = this.resolveForContext(contextKey);
    const tiers = resolved.tiers || [];
    if (tiers.length === 0) return null;
    return (
        tiers.find((t) => {
            const aboveMin = qty >= t.minQty;
            const belowMax = t.maxQty === null || qty <= t.maxQty;
            return aboveMin && belowMax;
        }) ?? null
    );
};

/**
 * Returns the resolved unit price for a given quantity and context, or null if
 * the config is disabled or no tier matches.
 * @param {number} qty
 * @param {string} [contextKey=""]
 * @returns {number|null}
 */
b2bProductConfigSchema.methods.getPriceForQty = function (qty, contextKey = "") {
    if (!this.isEnabled) return null;
    const resolved = this.resolveForContext(contextKey);
    const tier = this.getTierForQty(qty, contextKey);
    return tier ? tier.unitPrice : (resolved.basePrice || null);
};

/**
 * Returns the resolved price for a customization option at a given quantity and context.
 * Applies tier-level price overrides automatically.
 * Returns null if the option is not enabled on this tier.
 * @param {string} optionKey
 * @param {number} qty
 * @param {string} [contextKey=""]
 * @returns {number|null}
 */
b2bProductConfigSchema.methods.getCustomizationPrice = function (optionKey, qty, contextKey = "") {
    const resolved = this.resolveForContext(contextKey);
    const option = (resolved.customizationOptions || []).find((o) => o.key === optionKey && o.isActive);
    if (!option) return null;

    const tier = this.getTierForQty(qty, contextKey);
    if (!tier) return null;

    // Option must be explicitly enabled on this tier
    if (!tier.enabledCustomizationKeys?.includes(optionKey)) return null;

    // Check for a price override on this tier
    const override = tier.customizationPriceOverrides?.find((o) => o.optionKey === optionKey);
    if (override) return override.isFree ? 0 : override.pricePerUnit;

    return option.pricePerUnit;
};

b2bProductConfigSchema.set("toObject", { virtuals: true });
b2bProductConfigSchema.set("toJSON", { virtuals: true });

export const B2BProductConfig = mongoose.model("B2BProductConfig", b2bProductConfigSchema);

