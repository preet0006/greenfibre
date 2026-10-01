import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { B2BProductConfig, resolveConfigForContext } from "../models/b2bProductConfig.model.js";
import { Category } from "../models/category.model.js";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { B2BQuote } from "../models/b2bQuote.model.js";
import { OTP } from "../models/otp.model.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendMail } from "../utils/sendMail.js";
import { baseEmailTemplate } from "../utils/emailTemplate.js";
import {
    authCookieOptions,
    clearAuthCookieOptions,
    USER_TOKEN_COOKIE,
} from "../utils/cookieAuth.js";
import { calculateProductPricing, calculateTaxBreakdown } from "../utils/pricingEngine.js";

// ============================================================================
// 1. AUTHENTICATION & B2B USER PROFILE
// ============================================================================

/**
 * Helper to build standard B2B user response payload
 */
export const formatB2BUserResponse = (user) => {
    const isVerified = Boolean(
        user.isB2BVerified ||
        user.role === "b2b_verified" ||
        user.b2bProfile?.verificationStatus === "verified"
    );

    const effectiveRole = user.role && user.role !== "user"
        ? user.role
        : isVerified ? "b2b_verified" : "b2b_buyer";

    const company = user.companyName || user.b2bProfile?.companyName || "";
    const gstin = user.gstin || user.b2bProfile?.gstin || "";
    const bType = user.businessType || user.b2bProfile?.businessType || "Corporate Gifting & HR";

    return {
        id: user._id.toString(),
        fullName: user.full_name,
        full_name: user.full_name,
        companyName: company,
        email: user.email,
        phone: user.phone || "",
        businessType: bType,
        gstin: gstin,
        role: effectiveRole,
        isB2BVerified: isVerified,
        accountType: user.accountType || "B2B",
        b2bProfile: user.b2bProfile || {},
        billingAddress: user.billingAddress || {},
        createdAt: user.createdAt,
    };
};

/**
 * Register a new B2B Enterprise Account
 */
export const registerB2BUser = async (req, res) => {
    try {
        const {
            fullName,
            full_name,
            companyName,
            email,
            phone,
            businessType,
            gstin,
            password,
            billingAddress,
            rememberMe,
        } = req.body;

        const name = (fullName || full_name || "").trim();
        const company = (companyName || "").trim();
        const rawEmail = (email || "").trim();

        if (!name || !company || !rawEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, company name, email and password are required",
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = rawEmail.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this work email already exists",
            });
        }

        const user = await User.create({
            full_name: name,
            companyName: company,
            email: normalizedEmail,
            password,
            phone: phone ? String(phone).trim() : "",
            businessType: businessType || "Corporate Gifting & HR",
            gstin: gstin ? String(gstin).toUpperCase().trim() : "",
            role: "b2b_buyer",
            accountType: "B2B",
            isVerified: true, // Enterprise accounts are immediately active
            isB2BVerified: false,
            billingAddress: billingAddress || {},
            b2bProfile: {
                companyName: company,
                gstin: gstin ? String(gstin).toUpperCase().trim() : "",
                businessType: businessType || "Corporate Gifting & HR",
                verificationStatus: "pending",
                appliedAt: new Date(),
            },
        });

        // Generate JWT Token (at least 24h, default 7d, or 30d if rememberMe)
        const tokenExpiry = rememberMe ? "30d" : "7d";
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                isB2BVerified: user.isB2BVerified,
                accountType: "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "Enterprise account created successfully",
            token,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("registerB2BUser error:", error);
        return res.status(500).json({
            success: false,
            message: `Error creating B2B account: ${error.message}`,
        });
    }
};

/**
 * Sign In to B2B Enterprise Account
 */
export const loginB2BUser = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Auto mark as active if not yet verified
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }

        // Token Expiration: at least 24 hours (default 7 days, 30 days if rememberMe)
        const tokenExpiry = rememberMe ? "30d" : "7d";
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role || "b2b_buyer",
                isB2BVerified: Boolean(user.isB2BVerified || user.role === "b2b_verified" || user.b2bProfile?.verificationStatus === "verified"),
                accountType: user.accountType || "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.cookie(USER_TOKEN_COOKIE, token, {
            ...authCookieOptions,
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Sign in successful",
            token,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("loginB2BUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error during B2B login",
        });
    }
};

/**
 * Get Current Authenticated B2B User Profile (GET /api/b2b/me and /api/b2b/profile)
 */
export const getB2BProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("getB2BProfile error:", error);
        return res.status(500).json({ success: false, message: "Error fetching profile" });
    }
};

/**
 * Auto-Refresh JWT Token (POST /api/b2b/refresh-token)
 * Keeps session active indefinitely for active sessions
 */
export const refreshB2BToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        let existingToken = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            existingToken = authHeader.slice(7).trim();
        } else if (req.cookies?.[USER_TOKEN_COOKIE]) {
            existingToken = req.cookies[USER_TOKEN_COOKIE];
        } else if (req.body?.token) {
            existingToken = req.body.token;
        }

        if (!existingToken) {
            return res.status(401).json({
                success: false,
                message: "No active token provided for refresh",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
        } catch (err) {
            // If token is expired within last 7 days, allow refresh
            decoded = jwt.decode(existingToken);
            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token. Please login again.",
                });
            }
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found",
            });
        }

        // Issue fresh 7-day token
        const newToken = jwt.sign(
            {
                id: user._id,
                role: user.role || "b2b_buyer",
                isB2BVerified: Boolean(user.isB2BVerified || user.role === "b2b_verified" || user.b2bProfile?.verificationStatus === "verified"),
                accountType: user.accountType || "B2B",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie(USER_TOKEN_COOKIE, newToken, authCookieOptions);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            token: newToken,
            user: formatB2BUserResponse(user),
        });
    } catch (error) {
        console.error("refreshB2BToken error:", error);
        return res.status(500).json({
            success: false,
            message: "Error refreshing token",
        });
    }
};

/**
 * Update B2B Business Profile
 */
export const updateB2BProfile = async (req, res) => {
    try {
        const {
            companyName,
            gstin,
            panNumber,
            businessType,
            phone,
            tradeLicenseDoc,
            gstCertificateDoc,
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (phone) user.phone = phone;
        if (!user.b2bProfile) user.b2bProfile = {};

        if (companyName) user.b2bProfile.companyName = companyName.trim();
        if (gstin) user.b2bProfile.gstin = gstin.toUpperCase().trim();
        if (panNumber) user.b2bProfile.panNumber = panNumber.toUpperCase().trim();
        if (businessType) user.b2bProfile.businessType = businessType;
        if (tradeLicenseDoc) user.b2bProfile.tradeLicenseDoc = tradeLicenseDoc;
        if (gstCertificateDoc) user.b2bProfile.gstCertificateDoc = gstCertificateDoc;

        // If newly updating business details, keep verification status active or pending
        if (!user.b2bProfile.verificationStatus) {
            user.b2bProfile.verificationStatus = "pending";
        }
        user.accountType = "B2B";

        await user.save();

        return res.status(200).json({
            success: true,
            message: "B2B Business profile updated successfully.",
            b2bProfile: user.b2bProfile,
        });
    } catch (error) {
        console.error("updateB2BProfile error:", error);
        return res.status(500).json({ success: false, message: "Error updating B2B profile." });
    }
};

// ============================================================================
// 2. B2B PRODUCTS CATALOG & PRICING
// ============================================================================

export const generateDefaultTierBenefits = (index, minQty, unitPrice, retailPrice = 0) => {
    const savings = retailPrice > unitPrice ? `Save ₹${retailPrice - unitPrice} / unit vs Retail MRP` : "Direct Factory Wholesale Price";
    if (index === 0) {
        return [
            savings,
            "Standard Eco Protective Packaging",
            "Full Batch Quality Inspection Certificate",
            "Sample Fee 100% Refundable on Bulk Order",
            "Standard Dispatch (5–7 Business Days)",
        ];
    } else if (index === 1) {
        return [
            savings,
            "FREE 1-Color Custom Logo Branding Included",
            "Custom Branded Sleeve / Belly Band Included",
            "Priority Production Line & Fast QC",
            "Dedicated B2B Key Account Manager",
            "Express Dispatch (7–10 Business Days)",
        ];
    } else {
        return [
            savings,
            "FREE Custom Pantone Color Matching on Product",
            "FREE Full Custom Gift Box / Outer Packaging",
            "Free Pre-Production Physical Golden Sample",
            "Priority Doorstep Logistics & Pallet Delivery",
            "Flexible Credit / Net 30 Terms Available on Request",
        ];
    }
};

/**
 * Helper to format product document to the exact B2B specification
 */
/**
 * Helper to extract context / occasion key from request (query, body, or headers)
 * e.g. "anniversary", "corporate", "wedding", "festive"
 */
export const extractB2BContext = (req) => {
    if (!req) return "";
    return (
        req.query?.context ||
        req.query?.occasion ||
        req.query?.segment ||
        req.query?.categoryContext ||
        req.body?.context ||
        req.body?.occasion ||
        req.body?.segment ||
        req.headers?.["x-b2b-context"] ||
        req.headers?.["x-occasion"] ||
        ""
    ).toString().trim().toLowerCase();
};

/**
 * Helper to format product document to the exact B2B specification,
 * dynamically resolved for a given context / occasion (e.g. "anniversary", "corporate").
 *
 * @param {object} product   - Lean Product document
 * @param {boolean} isB2BVerified
 * @param {object|null} b2bConfig - B2BProductConfig document (or null)
 * @param {string} [contextKey=""] - Optional context/occasion key
 */
export const formatB2BProduct = (product, isB2BVerified = false, b2bConfig = null, contextKey = "") => {
    // Resolve context-specific configuration (falls back to global B2B config)
    const cfg = resolveConfigForContext(b2bConfig, contextKey);
    const moq = Math.max(1, Number(cfg.moq) || Number(product.moq) || 1);
    const pricingAtMoq = calculateProductPricing(product, moq, {
        isB2BVerified,
        b2bConfig: cfg,
        context: contextKey,
    });
    const retailPrice = Number(product.originalPrice) || Number(product.discountedPrice) || 0;

    // Format tiers — source is cfg.tiers (context-resolved)
    const rawTiers = Array.isArray(cfg.tiers) && cfg.tiers.length > 0
        ? cfg.tiers
        : [];

    const allOptions = Array.isArray(cfg.customizationOptions) ? cfg.customizationOptions : [];
    const totalOptsCount = allOptions.length || 5;

    const formattedTiers = rawTiers
        .map((t, idx) => {
            const min = Number(t.minQty ?? t.min);
            const price = Number(t.unitPrice ?? t.price);
            const max = t.maxQty !== undefined && t.maxQty !== null && t.maxQty !== "" ? Number(t.maxQty) : null;
            const discount = t.discountPercentage || (retailPrice > 0 ? Math.round(((retailPrice - price) / retailPrice) * 100) : 0);
            const tierLabel = t.tierLabel?.trim() || `TIER ${idx + 1}`;
            const popular = Boolean(t.popular !== undefined ? t.popular : idx === 1);
            const badge = t.badge?.trim() || (popular ? "★ POPULAR" : (discount > 0 ? `-${discount}%` : ""));
            const leadTime = t.leadTime?.trim() || (cfg.leadTime || product.leadTime || "5 - 7 business days");
            const benefits = Array.isArray(t.benefits) && t.benefits.length > 0
                ? t.benefits
                : generateDefaultTierBenefits(idx, min, price, retailPrice);

            const includedCustomizationsCount = typeof t.includedCustomizationsCount === "number"
                ? t.includedCustomizationsCount
                : (idx === 0 ? 2 : idx === 1 ? 3 : totalOptsCount);

            const allowanceText = t.customizationAllowanceText?.trim() ||
                (includedCustomizationsCount >= totalOptsCount
                    ? `All ${totalOptsCount} complimentary customizations included.`
                    : `Choose any ${includedCustomizationsCount} of ${totalOptsCount} complimentary customizations below.`);

            let nextTierUnlockText = t.nextTierUnlockText?.trim() || "";
            if (!nextTierUnlockText && idx + 1 < rawTiers.length) {
                const nextTierObj = rawTiers[idx + 1];
                const nextAllowance = typeof nextTierObj.includedCustomizationsCount === "number"
                    ? nextTierObj.includedCustomizationsCount
                    : (idx + 1 === 1 ? 3 : totalOptsCount);
                nextTierUnlockText = nextAllowance >= totalOptsCount
                    ? `Tier ${idx + 2} unlocks all ${totalOptsCount} →`
                    : `Tier ${idx + 2} unlocks ${nextAllowance} →`;
            }

            // Resolve enabled customization labels for this tier from B2BProductConfig
            const enabledKeys = Array.isArray(t.enabledCustomizationKeys) ? t.enabledCustomizationKeys : [];
            const customizationOptions = enabledKeys.length > 0
                ? allOptions.filter((o) => enabledKeys.includes(o.key) && o.isActive !== false).map((o) => o.label)
                : (allOptions.length > 0
                    ? allOptions.filter((o) => o.isActive !== false).map((o) => o.label)
                    : (product.brandingTypes && product.brandingTypes.length > 0
                        ? product.brandingTypes
                        : ["Laser Engraving", "Custom Packaging"]));

            const unitName = product.unit ? (product.unit.toLowerCase().endsWith("s") ? product.unit : product.unit + "s") : "Sets";
            const subLabel = max ? `${min}–${max} ${unitName}` : `${min}+ ${unitName}`;

            return {
                _id: t._id,
                tierIndex: idx + 1,
                min,
                max,
                price,
                unitPrice: price,
                minQty: min,
                maxQty: max,
                discountPercentage: discount,
                tierLabel,
                popular,
                badge,
                includedCustomizationsCount,
                customizationAllowanceText: allowanceText,
                nextTierUnlockText,
                leadTime,
                benefits,
                customizationOptions,
                enabledCustomizationKeys: enabledKeys,
                customizationPriceOverrides: t.customizationPriceOverrides || [],
                label: max ? `${min} - ${max} ${product.unit || "pcs"}` : `${min}+ ${product.unit || "pcs"}`,
                subLabel,
                savingsPerUnit: Math.max(0, retailPrice - price),
            };
        })
        .filter((t) => t.min && t.price)
        .sort((a, b) => a.min - b.min);

    // Primary image & gallery (B2B override takes priority if defined)
    const b2bCustomImages = Array.isArray(cfg.images) && cfg.images.length > 0 ? cfg.images : null;

    const mainImage =
        (b2bCustomImages && b2bCustomImages[0]) ||
        product.image ||
        product.colors?.[0]?.images?.[0] ||
        product.ogImage ||
        (Array.isArray(product.images) && product.images[0]) ||
        "";

    const allImages = b2bCustomImages || (product.colors || [])
        .flatMap((c) => c.images || [])
        .concat(product.images || [])
        .filter(Boolean);

    // Colours array
    const colours = (product.colors || []).map((c) => c.name).filter(Boolean);

    // Active B2B base price — sourced from context-resolved config
    const basePrice =
        Number(cfg.basePrice) ||
        Number(product.b2bPrice) ||
        (formattedTiers.length > 0 ? formattedTiers[0].price : null) ||
        Number(product.discountedPrice) ||
        Number(product.originalPrice) ||
        0;

    // Specs
    const specs =
        product.specs && Object.keys(product.specs).length > 0
            ? product.specs
            : product.features && Object.keys(product.features).length > 0
                ? product.features
                : {};

    const categoryName =
        product.category?.name ||
        product.category?.title ||
        (typeof product.category === "string" ? product.category : "Eco Goods");

    const giftBoxPhotos = (Array.isArray(cfg.giftBoxImages) && cfg.giftBoxImages.length > 0)
        ? cfg.giftBoxImages
        : (Array.isArray(product.giftBoxImages) && product.giftBoxImages.length > 0
            ? product.giftBoxImages
            : (product.giftPackaging?.images || product.package?.giftBoxImages || []));

    const formattedCustomizations = (cfg.customizationOptions || []).map((o) => ({
        _id: o._id,
        key: o.key,
        label: o.label,
        tag: o.tag || (o.type === "engraving" ? "Laser Etched" : o.type === "color" ? "Brand Tone" : o.type === "packaging" ? "Custom Box" : o.type === "card" ? "Insert Card" : o.type === "monogram" ? "Per-Piece" : "Custom Add-on"),
        badge: o.badge || o.tag || "",
        icon: o.icon || (o.type === "engraving" ? "laser" : o.type === "color" ? "palette" : o.type === "packaging" ? "box" : o.type === "card" ? "card" : o.type === "monogram" ? "user-check" : "sparkles"),
        description: o.description || "",
        type: o.type || "other",
        isPriced: Boolean(o.isPriced),
        pricePerUnit: Number(o.pricePerUnit) || 0,
        moq: Number(o.moq) || 1,
        additionalLeadTime: o.additionalLeadTime || "",
        notes: o.notes || "",
        isActive: o.isActive !== false,
    }));

    return {
        _id: product._id,
        id: product._id,
        name: product.name,
        slug: product.slug,
        sku: product.sku || "",
        category: categoryName,
        categoryObj: product.category,
        subCategory: product.subCategory,
        unit: product.unit || "piece",
        tagline: product.tagline || product.features?.tagline || "",
        desc: product.description || product.desc || "",
        description: product.description || product.desc || "",
        image: mainImage,
        images: allImages.length > 0 ? allImages : [mainImage].filter(Boolean),
        moq,
        price: basePrice,
        tiers: formattedTiers,
        leadTime: cfg.leadTime || product.leadTime || "7 - 10 business days",
        branding: product.branding !== undefined ? product.branding : true,
        brandingTypes:
            Array.isArray(product.brandingTypes) && product.brandingTypes.length > 0
                ? product.brandingTypes
                : ["Laser Engraving on Lid", "Custom Belly Band"],
        colours: colours.length > 0 ? colours : ["Default"],
        colors: product.colors || [],
        size: product.size || product.features?.size || "",
        material: product.material || product.materialInfo?.material || product.features?.material || "",
        specs,
        popular: Boolean(
            product.popular ||
            product.isFeatured ||
            (Array.isArray(product.tags) && (product.tags.includes("trending") || product.tags.includes("bestSeller") || product.tags.includes("popular")))
        ),
        shortDescription: product.shortDescription || "",
        productFeatures: product.productFeatures || [],
        collection: product.collection || product.collectionName || "",
        color: product.color || "",
        stockQuantity: product.stockQuantity || (product.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0),
        productWeight: product.productWeight || { value: 0, unit: "gm" },
        dimensions: product.dimensions || { length: 0, width: 0, height: 0, unit: "cm" },
        package: product.package || {},
        giftSetContents: product.giftSetContents || { totalProductTypes: 0, products: [] },
        giftBoxImages: giftBoxPhotos,
        giftPackaging: product.giftPackaging || {
            available: Boolean(giftBoxPhotos.length > 0),
            images: giftBoxPhotos,
            title: "Premium Gift Box",
            description: "",
            pricePerBox: 0,
            customBrandingAvailable: true,
        },
        careInstructions: product.careInstructions || "",
        sustainability: product.sustainability || { madeWith: "", highlights: [] },
        tags: product.tags || [],
        totalStock: (product.colors || []).reduce((sum, c) => sum + (c.stock || 0), 0),
        retailPrice: product.discountedPrice || product.originalPrice,
        originalPrice: product.originalPrice,
        mrp: product.originalPrice || product.discountedPrice,
        b2bEnabled: Boolean(cfg.isEnabled || product.b2bPrice),

        // Context / Occasion Information
        activeContext: cfg.activeContext || { key: "default", label: "Standard B2B", isCustomContext: false },
        availableContexts: cfg.availableContexts || [],
        customizationOptions: formattedCustomizations,

        // Companion / additional products (e.g. lids, straws, gift bags)
        // Each entry has the full product doc populated + display metadata from the config.
        additionalProducts: (cfg.additionalProducts || [])
            .filter((ap) => ap.isActive !== false && ap.product)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((ap) => ({
                _id: ap._id,
                label: ap.label || ap.product?.name || "",
                note: ap.note || "",
                displayTrigger: ap.displayTrigger || "on_select",
                isSelectable: ap.isSelectable !== false,
                sortOrder: ap.sortOrder || 0,
                product: ap.product
                    ? {
                        _id: ap.product._id,
                        name: ap.product.name,
                        slug: ap.product.slug,
                        images: ap.product.images || [],
                        image: (ap.product.images || [])[0] || "",
                        discountedPrice: ap.product.discountedPrice || 0,
                        originalPrice: ap.product.originalPrice || 0,
                        unit: ap.product.unit || "piece",
                        tagline: ap.product.tagline || "",
                        shortDescription: ap.product.shortDescription || "",
                    }
                    : null,
            })),

        // Full B2B config for frontend if needed (customization menu, notes, showcase photos, etc.)
        b2bConfig: cfg._id ? {
            configId: cfg._id,
            moq: cfg.moq,
            stepQuantity: cfg.stepQuantity,
            sampleAvailable: cfg.sampleAvailable,
            samplePrice: cfg.samplePrice,
            customizationOptions: formattedCustomizations,
            customizationNotes: cfg.customizationNotes || "",
            customizationShowcaseImages: cfg.customizationShowcaseImages || [],
            activeContext: cfg.activeContext,
            availableContexts: cfg.availableContexts,
            additionalProducts: (cfg.additionalProducts || [])
                .filter((ap) => ap.isActive !== false)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        } : null,
        tax: product.tax || { hsnCode: "", gstRate: 18, isTaxInclusive: true },
        pricingAtMoq,
        isB2BVerifiedUser: isB2BVerified,
    };
};


/**
 * Get products for B2B platform with tier pricing, MOQ, volume discounts,
 * and context/occasion-specific customizations & slabs.
 */
export const getB2BProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;
        const contextKey = extractB2BContext(req);

        const isB2BVerified =
            req.user?.accountType === "B2B" &&
            req.user?.b2bProfile?.verificationStatus === "verified";

        const filter = { isActive: true };

        if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
            filter.category = req.query.category;
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), "i");
            filter.$or = [{ name: searchRegex }, { description: searchRegex }, { tagline: searchRegex }, { sku: searchRegex }];
        }

        // b2bOnly filter: only products that have an enabled B2BProductConfig
        let b2bEnabledProductIds = null;
        if (req.query.b2bOnly === "true") {
            const enabledConfigs = await B2BProductConfig.find({ isEnabled: true }, "product").lean();
            b2bEnabledProductIds = enabledConfigs.map((c) => c.product);
            filter._id = { $in: b2bEnabledProductIds };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug title")
                .populate("subCategory", "name slug title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
        ]);

        // Batch-fetch all B2BProductConfigs for this page in ONE query (no N+1)
        const productIds = products.map((p) => p._id);
        const configs = await B2BProductConfig.find({ product: { $in: productIds }, isEnabled: true })
            .populate("additionalProducts.product", "name slug images discountedPrice originalPrice unit tagline isActive")
            .lean();
        const configMap = Object.fromEntries(configs.map((c) => [c.product.toString(), c]));

        const formattedProducts = products.map((product) =>
            formatB2BProduct(product, isB2BVerified, configMap[product._id.toString()] || null, contextKey)
        );

        return res.status(200).json({
            success: true,
            context: contextKey || "default",
            products: formattedProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("getB2BProducts error:", error);
        return res.status(500).json({ success: false, message: "Error fetching B2B products." });
    }
};

/**
 * Get single product by slug or ID with full wholesale tier matrix
 * resolved for the requested context/occasion (e.g. ?context=anniversary).
 */
export const getB2BProductDetails = async (req, res) => {
    try {
        const { identifier } = req.params;
        const contextKey = extractB2BContext(req);
        const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

        const filter = isObjectId
            ? { _id: identifier, isActive: true }
            : { slug: identifier, isActive: true };

        // Fetch product + its B2BProductConfig in parallel
        const product = await Product.findOne(filter)
            .populate("category", "name slug title")
            .populate("subCategory", "name slug title")
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const [b2bConfig, isB2BVerified] = await Promise.all([
            B2BProductConfig.findOne({ product: product._id, isEnabled: true })
                .populate("additionalProducts.product", "name slug images discountedPrice originalPrice unit tagline shortDescription isActive")
                .lean(),
            Promise.resolve(
                req.user?.accountType === "B2B" &&
                req.user?.b2bProfile?.verificationStatus === "verified"
            ),
        ]);

        const formattedProduct = formatB2BProduct(product, isB2BVerified, b2bConfig, contextKey);

        return res.status(200).json({
            success: true,
            product: formattedProduct,
        });
    } catch (error) {
        console.error("getB2BProductDetails error:", error);
        return res.status(500).json({ success: false, message: "Error fetching product details." });
    }
};

/**
 * Dynamic Pricing Calculator (for real-time quantity & customization changes in frontend UI)
 * Supports context/occasion-specific tiers and customizations.
 */
export const calculateB2BQuote = async (req, res) => {
    try {
        const { productId, quantity, selectedCustomizations = [] } = req.body;
        const contextKey = extractB2BContext(req);

        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required." });
        }

        const [product, rawB2bConfig] = await Promise.all([
            Product.findById(productId).lean(),
            B2BProductConfig.findOne({ product: productId, isEnabled: true })
                .populate("additionalProducts.product", "name slug images discountedPrice originalPrice unit tagline isActive")
                .lean(),
        ]);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const resolvedConfig = resolveConfigForContext(rawB2bConfig, contextKey);

        // Pass resolved b2bConfig into pricing engine so it uses the correct context-specific tiers/moq
        const calculation = calculateProductPricing(product, quantity, {
            isB2BVerified: true,
            b2bConfig: resolvedConfig,
            context: contextKey,
        });

        // Calculate customization add-ons with complimentary tier allowance logic
        let customizationTotal = 0;
        const resolvedCustomizationItems = [];

        if (Array.isArray(selectedCustomizations) && selectedCustomizations.length > 0) {
            const availableOptions = resolvedConfig.customizationOptions || [];
            const reqQty = Math.max(1, parseInt(quantity, 10) || 1);
            const allowance = calculation.appliedTier?.includedCustomizationsCount ?? 2;
            let complimentaryCountUsed = 0;

            for (const item of selectedCustomizations) {
                const optKey = typeof item === "string" ? item : item.key;
                const optDoc = availableOptions.find((o) => o.key === optKey && o.isActive !== false);
                if (optDoc) {
                    let baseItemPrice = Number(optDoc.pricePerUnit) || 0;
                    let isFreeOverride = !optDoc.isPriced;

                    // Check if tier has a price override for this option
                    if (calculation.appliedTier && Array.isArray(resolvedConfig.tiers)) {
                        const matchingTier = resolvedConfig.tiers.find(
                            (t) => t.minQty === calculation.appliedTier.minQty
                        );
                        const override = matchingTier?.customizationPriceOverrides?.find(
                            (o) => o.optionKey === optKey
                        );
                        if (override) {
                            if (override.isFree) isFreeOverride = true;
                            baseItemPrice = Number(override.pricePerUnit) || 0;
                        }
                    }

                    // Check if covered under tier complimentary allowance
                    let isIncludedInTier = false;
                    let effectivePricePerUnit = baseItemPrice;

                    if (isFreeOverride) {
                        isIncludedInTier = true;
                        effectivePricePerUnit = 0;
                    } else if (complimentaryCountUsed < allowance) {
                        complimentaryCountUsed++;
                        isIncludedInTier = true;
                        effectivePricePerUnit = 0;
                    } else {
                        isIncludedInTier = false;
                        effectivePricePerUnit = baseItemPrice;
                    }

                    const itemTotal = effectivePricePerUnit * reqQty;
                    customizationTotal += itemTotal;
                    resolvedCustomizationItems.push({
                        key: optDoc.key,
                        label: optDoc.label,
                        tag: optDoc.tag || (optDoc.type === "engraving" ? "Laser Etched" : optDoc.type === "color" ? "Brand Tone" : optDoc.type === "packaging" ? "Custom Box" : optDoc.type === "card" ? "Insert Card" : optDoc.type === "monogram" ? "Per-Piece" : "Custom Add-on"),
                        badge: optDoc.badge || optDoc.tag || "",
                        icon: optDoc.icon || "sparkles",
                        isIncludedInTier,
                        pricePerUnit: effectivePricePerUnit,
                        totalPrice: itemTotal,
                    });
                }
            }
        }

        const grandTotal = Math.round((calculation.subtotal + customizationTotal) * 100) / 100;

        return res.status(200).json({
            success: true,
            calculation: {
                ...calculation,
                customizations: resolvedCustomizationItems,
                customizationTotal,
                grandTotal,
                activeContext: resolvedConfig.activeContext,
                availableContexts: resolvedConfig.availableContexts,
            },
        });
    } catch (error) {
        console.error("calculateB2BQuote error:", error);
        return res.status(500).json({ success: false, message: "Error calculating pricing quote." });
    }
};

// ============================================================================
// 3. B2B CART MANAGEMENT
// ============================================================================

/**
 * Get B2B Cart with live tier pricing and MOQ validations
 */
export const getB2BCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const isB2BVerified =
            req.user?.accountType === "B2B" &&
            req.user?.b2bProfile?.verificationStatus === "verified";

        let cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                cart: {
                    items: [],
                    subtotal: 0,
                    taxAmount: 0,
                    totalAmount: 0,
                    totalSavings: 0,
                    hasValidationErrors: false,
                },
            });
        }

        const productIds = cart.items.map((i) => i.product?._id).filter(Boolean);
        const configs = await B2BProductConfig.find({ product: { $in: productIds } }).lean();
        const configMap = Object.fromEntries(configs.map((c) => [c.product.toString(), c]));

        let subtotal = 0;
        let totalSavings = 0;
        let totalTax = 0;
        let hasValidationErrors = false;

        const resolvedItems = cart.items
            .filter((item) => item.product && item.product.isActive)
            .map((item) => {
                const product = item.product;
                const b2bConfig = configMap[product._id.toString()] || null;
                const contextKey = item.context || "";
                const calculation = calculateProductPricing(product, item.quantity, {
                    isB2BVerified,
                    b2bConfig,
                    context: contextKey,
                });

                if (!calculation.isValidMoq || !calculation.isValidStep) {
                    hasValidationErrors = true;
                }

                subtotal += calculation.subtotal;
                totalSavings += calculation.totalSavings;
                totalTax += calculation.tax.taxAmount;

                const colorVariant = product.colors?.[item.colorIndex] || {};

                return {
                    productId: product._id,
                    name: product.name,
                    slug: product.slug,
                    colorIndex: item.colorIndex,
                    colorName: item.colorName || colorVariant.name,
                    colorHex: item.colorHex || colorVariant.hex,
                    image: colorVariant.images?.[0] || "",
                    quantity: item.quantity,
                    context: item.context || "",
                    customizations: item.customizations || [],
                    unitPrice: calculation.unitPrice,
                    subtotal: calculation.subtotal,
                    appliedTier: calculation.appliedTier,
                    nextTier: calculation.nextTier,
                    moq: calculation.moq,
                    stepQuantity: calculation.stepQuantity,
                    isValidMoq: calculation.isValidMoq,
                    isValidStep: calculation.isValidStep,
                    validationError: calculation.validationError,
                    tax: calculation.tax,
                    activeContext: calculation.activeContext,
                };
            });

        return res.status(200).json({
            success: true,
            cart: {
                items: resolvedItems,
                subtotal: Math.round(subtotal * 100) / 100,
                taxAmount: Math.round(totalTax * 100) / 100,
                totalAmount: Math.round(subtotal * 100) / 100,
                totalSavings: Math.round(totalSavings * 100) / 100,
                hasValidationErrors,
            },
        });
    } catch (error) {
        console.error("getB2BCart error:", error);
        return res.status(500).json({ success: false, message: "Error fetching B2B cart." });
    }
};

/**
 * Add / Update Item in B2B Cart
 */
export const addToB2BCart = async (req, res) => {
    try {
        const { productId, colorIndex = 0, quantity, context = "", customizations = [] } = req.body;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, message: "Product not found or inactive." });
        }

        const isB2BVerified =
            req.user?.accountType === "B2B" &&
            req.user?.b2bProfile?.verificationStatus === "verified";

        const b2bConfig = await B2BProductConfig.findOne({ product: productId, isEnabled: true }).lean();
        const resolvedConfig = resolveConfigForContext(b2bConfig, context);

        const moq = Math.max(1, Number(resolvedConfig.moq) || Number(product.b2bPricing?.moq) || 1);
        const reqQty = Math.max(moq, parseInt(quantity, 10) || moq);

        const calculation = calculateProductPricing(product, reqQty, {
            isB2BVerified,
            b2bConfig: resolvedConfig,
            context,
        });

        const colorVariant = product.colors?.[colorIndex] || { name: "Standard", hex: "" };

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const normContext = (context || "").trim().toLowerCase();
        const existingIndex = cart.items.findIndex(
            (i) =>
                i.product.toString() === productId &&
                i.colorIndex === Number(colorIndex) &&
                (i.context || "").trim().toLowerCase() === normContext
        );

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity = reqQty;
            cart.items[existingIndex].price = calculation.unitPrice;
            if (customizations && customizations.length > 0) {
                cart.items[existingIndex].customizations = customizations;
            }
        } else {
            cart.items.push({
                product: productId,
                colorIndex: Number(colorIndex),
                colorName: colorVariant.name || "Default",
                colorHex: colorVariant.hex || "",
                quantity: reqQty,
                price: calculation.unitPrice,
                context: normContext,
                customizations: Array.isArray(customizations) ? customizations : [],
            });
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item added to B2B cart.",
            cart,
        });
    } catch (error) {
        console.error("addToB2BCart error:", error);
        return res.status(500).json({ success: false, message: "Error adding item to B2B cart." });
    }
};

/**
 * Update quantity of item in B2B cart
 */
export const updateB2BCartItem = async (req, res) => {
    try {
        const { productId, colorIndex, quantity, context = "" } = req.body;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const normContext = (context || "").trim().toLowerCase();
        const itemIndex = cart.items.findIndex(
            (i) =>
                i.product.toString() === productId &&
                i.colorIndex === Number(colorIndex) &&
                (normContext ? (i.context || "").trim().toLowerCase() === normContext : true)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart." });
        }

        const isB2BVerified =
            req.user?.accountType === "B2B" &&
            req.user?.b2bProfile?.verificationStatus === "verified";

        const b2bConfig = await B2BProductConfig.findOne({ product: productId, isEnabled: true }).lean();
        const itemContext = cart.items[itemIndex].context || context;
        const calculation = calculateProductPricing(product, quantity, {
            isB2BVerified,
            b2bConfig,
            context: itemContext,
        });

        cart.items[itemIndex].quantity = Math.max(1, parseInt(quantity, 10));
        cart.items[itemIndex].price = calculation.unitPrice;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "B2B Cart item updated.",
            item: {
                productId,
                quantity: cart.items[itemIndex].quantity,
                context: cart.items[itemIndex].context,
                unitPrice: calculation.unitPrice,
                subtotal: calculation.subtotal,
                appliedTier: calculation.appliedTier,
                validationError: calculation.validationError,
            },
        });
    } catch (error) {
        console.error("updateB2BCartItem error:", error);
        return res.status(500).json({ success: false, message: "Error updating B2B cart item." });
    }
};

/**
 * Remove item from B2B cart
 */
export const removeB2BCartItem = async (req, res) => {
    try {
        const { productId, colorIndex } = req.body;
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        cart.items = cart.items.filter(
            (i) => !(i.product.toString() === productId && i.colorIndex === Number(colorIndex))
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item removed from B2B cart.",
        });
    } catch (error) {
        console.error("removeB2BCartItem error:", error);
        return res.status(500).json({ success: false, message: "Error removing cart item." });
    }
};

// ============================================================================
// 4. REQUEST FOR QUOTE (RFQ) & CUSTOM ORDERS
// ============================================================================

/**
 * Submit Request For Custom Wholesale Quote (RFQ)
 */
export const requestB2BQuote = async (req, res) => {
    try {
        const {
            items,
            customRequirements,
            deliveryPincode,
            contactPerson,
            phone,
            email,
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "At least one item is required for quote." });
        }

        const quoteItems = [];
        for (const it of items) {
            const prod = await Product.findById(it.productId);
            if (prod) {
                quoteItems.push({
                    product: prod._id,
                    productName: prod.name,
                    colorName: it.colorName || "",
                    colorHex: it.colorHex || "",
                    requestedQuantity: Math.max(1, parseInt(it.quantity, 10)),
                    targetPricePerUnit: it.targetPrice ? Number(it.targetPrice) : null,
                });
            }
        }

        const quote = await B2BQuote.create({
            user: user._id,
            companyName: user.b2bProfile?.companyName || user.full_name,
            contactPerson: contactPerson || user.full_name,
            email: email || user.email,
            phone: phone || user.phone || "",
            gstin: user.b2bProfile?.gstin || "",
            deliveryPincode,
            items: quoteItems,
            customRequirements: customRequirements || "",
            status: "submitted",
        });

        return res.status(201).json({
            success: true,
            message: "Quote request submitted successfully. Our wholesale sales team will contact you shortly.",
            quote,
        });
    } catch (error) {
        console.error("requestB2BQuote error:", error);
        return res.status(500).json({ success: false, message: "Error submitting quote request." });
    }
};

/**
 * Get Buyer's submitted RFQ Quotes
 */
export const getUserB2BQuotes = async (req, res) => {
    try {
        const quotes = await B2BQuote.find({ user: req.user._id })
            .populate("items.product", "name slug images")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            quotes,
        });
    } catch (error) {
        console.error("getUserB2BQuotes error:", error);
        return res.status(500).json({ success: false, message: "Error fetching quotes." });
    }
};

// ============================================================================
// 5. ADMIN B2B MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Admin: View all B2B Buyer applications
 */
export const adminGetB2BApplications = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { accountType: "B2B" };

        if (status) {
            filter["b2bProfile.verificationStatus"] = status;
        }

        const buyers = await User.find(filter).select("-password").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            buyers,
        });
    } catch (error) {
        console.error("adminGetB2BApplications error:", error);
        return res.status(500).json({ success: false, message: "Error fetching B2B applications." });
    }
};

/**
 * Admin: Approve or Reject B2B Buyer verification status
 */
export const adminVerifyB2BUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, notes, creditLimit, creditTermsDays } = req.body;

        if (!["verified", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid verification status." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (!user.b2bProfile) user.b2bProfile = {};
        user.b2bProfile.verificationStatus = status;
        user.b2bProfile.verificationNotes = notes || "";
        if (creditLimit !== undefined) user.b2bProfile.creditLimit = Number(creditLimit);
        if (creditTermsDays !== undefined) user.b2bProfile.creditTermsDays = Number(creditTermsDays);

        if (status === "verified") {
            user.b2bProfile.verifiedAt = new Date();
        }

        await user.save();

        // Send notification email to buyer
        if (status === "verified") {
            await sendMail(
                user.email,
                "GreenFibre B2B Wholesale Account Approved!",
                baseEmailTemplate({
                    title: "B2B Account Approved",
                    subtitle: `Welcome ${user.b2bProfile.companyName || user.full_name}`,
                    body: `
                        <p>Hi <b>${user.full_name}</b>,</p>
                        <p>Congratulations! Your wholesale account for <b>${user.b2bProfile.companyName || "your company"}</b> has been approved.</p>
                        <p>You can now log in to the B2B portal to view exclusive volume tier pricing, sample requests, and instant wholesale discounts.</p>
                    `,
                })
            );
        }

        return res.status(200).json({
            success: true,
            message: `User B2B account has been marked as ${status}.`,
            user: {
                id: user._id,
                email: user.email,
                b2bProfile: user.b2bProfile,
            },
        });
    } catch (error) {
        console.error("adminVerifyB2BUser error:", error);
        return res.status(500).json({ success: false, message: "Error updating user B2B verification." });
    }
};

/**
 * Admin: Update B2B Quantity Slabs & MOQ for a Product
 */
export const adminUpdateProductB2BTiers = async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            isEnabled,
            basePrice,
            moq,
            stepQuantity,
            sampleAvailable,
            samplePrice,
            tiers,
            tax,
            sku,
            unit,
            tagline,
            leadTime,
            branding,
            brandingTypes,
            size,
            material,
            specs,
            popular,
            desc,
            description,
        } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        if (!product.b2bPricing) product.b2bPricing = {};

        if (isEnabled !== undefined) product.b2bPricing.isEnabled = Boolean(isEnabled);
        if (basePrice !== undefined) product.b2bPricing.basePrice = Number(basePrice);
        if (moq !== undefined) product.b2bPricing.moq = Math.max(1, Number(moq));
        if (stepQuantity !== undefined) product.b2bPricing.stepQuantity = Math.max(1, Number(stepQuantity));
        if (sampleAvailable !== undefined) product.b2bPricing.sampleAvailable = Boolean(sampleAvailable);
        if (samplePrice !== undefined) product.b2bPricing.samplePrice = Number(samplePrice);

        if (sku !== undefined) product.sku = sku.trim();
        if (unit !== undefined) product.unit = unit.trim();
        if (tagline !== undefined) product.tagline = tagline.trim();
        if (leadTime !== undefined) product.leadTime = leadTime.trim();
        if (branding !== undefined) product.branding = Boolean(branding);
        if (brandingTypes !== undefined && Array.isArray(brandingTypes)) product.brandingTypes = brandingTypes;
        if (size !== undefined) product.size = size.trim();
        if (material !== undefined) product.material = material.trim();
        if (specs !== undefined && typeof specs === "object") product.specs = specs;
        if (popular !== undefined) product.popular = Boolean(popular);
        if (desc !== undefined || description !== undefined) product.description = desc || description;

        if (Array.isArray(tiers)) {
            // Sort tiers ascending by minQty
            product.b2bPricing.tiers = tiers
                .filter((t) => (t.minQty || t.min) && (t.unitPrice || t.price))
                .map((t) => ({
                    minQty: Number(t.minQty ?? t.min),
                    maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== "" ? Number(t.maxQty) : null,
                    unitPrice: Number(t.unitPrice ?? t.price),
                    discountPercentage: Number(t.discountPercentage) || 0,
                }))
                .sort((a, b) => a.minQty - b.minQty);
        }

        if (tax) {
            if (!product.tax) product.tax = {};
            if (tax.hsnCode !== undefined) product.tax.hsnCode = tax.hsnCode.trim();
            if (tax.gstRate !== undefined) product.tax.gstRate = Number(tax.gstRate);
            if (tax.isTaxInclusive !== undefined) product.tax.isTaxInclusive = Boolean(tax.isTaxInclusive);
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product B2B wholesale pricing tiers and specifications updated successfully.",
            product: formatB2BProduct(product, true),
        });
    } catch (error) {
        console.error("adminUpdateProductB2BTiers error:", error);
        return res.status(500).json({ success: false, message: "Error updating product B2B tiers." });
    }
};

/**
 * Admin: View and respond to B2B Quote Requests (RFQs)
 */
export const adminGetB2BQuotes = async (req, res) => {
    try {
        const quotes = await B2BQuote.find()
            .populate("user", "full_name email phone b2bProfile")
            .populate("items.product", "name slug images originalPrice discountedPrice")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            quotes,
        });
    } catch (error) {
        console.error("adminGetB2BQuotes error:", error);
        return res.status(500).json({ success: false, message: "Error fetching RFQs." });
    }
};

/**
 * Admin: Update/Respond to RFQ Quote with custom offered price
 */
export const adminRespondToB2BQuote = async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { status, adminNote, totalOfferedAmount, validDays = 7 } = req.body;

        const quote = await B2BQuote.findById(quoteId);
        if (!quote) {
            return res.status(404).json({ success: false, message: "Quote not found." });
        }

        if (status) quote.status = status;
        if (adminNote !== undefined) quote.adminNote = adminNote;
        if (totalOfferedAmount !== undefined) quote.totalOfferedAmount = Number(totalOfferedAmount);

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Number(validDays));
        quote.validUntil = expiryDate;

        await quote.save();

        return res.status(200).json({
            success: true,
            message: "B2B Quote response saved.",
            quote,
        });
    } catch (error) {
        console.error("adminRespondToB2BQuote error:", error);
        return res.status(500).json({ success: false, message: "Error updating quote." });
    }
};

// ============================================================================
// 6. UNIFIED DASHBOARD CONTROLLERS (FETCH & UPDATE ALL B2B + B2C PRODUCT DATA)
// ============================================================================

/**
 * Admin Dashboard: Fetch all products with 100% complete B2C + B2B schema details
 */
export const adminGetDashboardProducts = async (req, res) => {
    try {
        const { search, category, isActive, isFeatured, popular, page, limit, all } = req.query;

        const filter = {};

        if (isActive !== undefined) filter.isActive = isActive === "true";
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
        if (popular !== undefined) filter.popular = popular === "true";

        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category = category;
            } else {
                const catDoc = await Category.findOne({
                    name: { $regex: new RegExp(`^${category.trim()}$`, "i") },
                });
                if (catDoc) filter.category = catDoc._id;
            }
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { name: searchRegex },
                { sku: searchRegex },
                { tagline: searchRegex },
                { description: searchRegex },
            ];
        }

        const isAll = all === "true" || !limit;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = isAll ? 1000 : Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate("category", "name slug description")
                .populate("subCategory", "name slug description")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter),
        ]);

        const formattedProducts = products.map((p) => {
            const b2bFormatted = formatB2BProduct(p, true);
            return {
                ...p,
                // Unified B2C fields
                retailPricing: {
                    originalPrice: p.originalPrice || 0,
                    discountedPrice: p.discountedPrice || 0,
                    b2cPrice: p.b2cPrice || p.discountedPrice || 0,
                    b2cMargin: p.b2cMargin || 0,
                },
                // Unified B2B fields
                wholesalePricing: b2bFormatted.b2bPricing || {
                    isEnabled: Boolean(p.b2bPricing?.isEnabled || p.b2bPrice),
                    basePrice: p.b2bPricing?.basePrice || p.b2bPrice || 0,
                    moq: p.b2bPricing?.moq || 1,
                    stepQuantity: p.b2bPricing?.stepQuantity || 1,
                    sampleAvailable: Boolean(p.b2bPricing?.sampleAvailable),
                    samplePrice: p.b2bPricing?.samplePrice || null,
                    tiers: p.b2bPricing?.tiers || [],
                },
                b2bFormatted,
            };
        });

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            products: formattedProducts,
        });
    } catch (error) {
        console.error("adminGetDashboardProducts error:", error);
        return res.status(500).json({ success: false, message: "Error fetching dashboard products." });
    }
};

/**
 * Admin Dashboard: Fetch single product by ID or Slug with full B2C + B2B schema details
 */
export const adminGetDashboardProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(productId);

        const filter = isObjectId ? { _id: productId } : { slug: productId };

        const product = await Product.findOne(filter)
            .populate("category", "name slug description")
            .populate("subCategory", "name slug description")
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const b2bFormatted = formatB2BProduct(product, true);

        return res.status(200).json({
            success: true,
            product: {
                ...product,
                retailPricing: {
                    originalPrice: product.originalPrice || 0,
                    discountedPrice: product.discountedPrice || 0,
                    b2cPrice: product.b2cPrice || product.discountedPrice || 0,
                    b2cMargin: product.b2cMargin || 0,
                },
                wholesalePricing: b2bFormatted.b2bPricing || {
                    isEnabled: Boolean(product.b2bPricing?.isEnabled || product.b2bPrice),
                    basePrice: product.b2bPricing?.basePrice || product.b2bPrice || 0,
                    moq: product.b2bPricing?.moq || 1,
                    stepQuantity: product.b2bPricing?.stepQuantity || 1,
                    sampleAvailable: Boolean(product.b2bPricing?.sampleAvailable),
                    samplePrice: product.b2bPricing?.samplePrice || null,
                    tiers: product.b2bPricing?.tiers || [],
                },
                b2bFormatted,
            },
        });
    } catch (error) {
        console.error("adminGetDashboardProductById error:", error);
        return res.status(500).json({ success: false, message: "Error fetching product details." });
    }
};

/**
 * Admin Dashboard: Update ANY and EVERY field in the Product Schema
 */
export const adminUpdateDashboardProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(productId);

        const filter = isObjectId ? { _id: productId } : { slug: productId };

        const product = await Product.findOne(filter);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const b = req.body;

        // Basic Info
        if (b.name !== undefined) product.name = b.name.trim();
        if (b.slug !== undefined) product.slug = b.slug.trim();
        if (b.sku !== undefined) product.sku = b.sku.trim();
        if (b.unit !== undefined) product.unit = b.unit.trim();
        if (b.tagline !== undefined) product.tagline = b.tagline.trim();
        if (b.description !== undefined) product.description = b.description;
        if (b.desc !== undefined && b.description === undefined) product.description = b.desc;
        if (b.shortDescription !== undefined) product.shortDescription = b.shortDescription;
        if (b.productFeatures !== undefined && Array.isArray(b.productFeatures)) product.productFeatures = b.productFeatures;
        if (b.material !== undefined) product.material = b.material.trim();
        if (b.collectionName !== undefined) product.collectionName = b.collectionName.trim();
        if (b.collection !== undefined && b.collectionName === undefined) product.collectionName = b.collection.trim();
        if (b.size !== undefined) product.size = b.size.trim();
        if (b.color !== undefined) product.color = b.color.trim();
        if (b.leadTime !== undefined) product.leadTime = b.leadTime.trim();
        if (b.branding !== undefined) product.branding = Boolean(b.branding);
        if (b.brandingTypes !== undefined && Array.isArray(b.brandingTypes)) product.brandingTypes = b.brandingTypes;
        if (b.popular !== undefined) product.popular = Boolean(b.popular);
        if (b.isActive !== undefined) product.isActive = Boolean(b.isActive);
        if (b.isFeatured !== undefined) product.isFeatured = Boolean(b.isFeatured);
        if (b.tags !== undefined && Array.isArray(b.tags)) product.tags = b.tags;
        if (b.stockQuantity !== undefined) product.stockQuantity = Number(b.stockQuantity) || 0;

        // Category Resolution
        if (b.category !== undefined) {
            if (mongoose.Types.ObjectId.isValid(b.category)) {
                product.category = b.category;
            } else if (typeof b.category === "string" && b.category.trim()) {
                let catDoc = await Category.findOne({
                    name: { $regex: new RegExp(`^${b.category.trim()}$`, "i") },
                });
                if (!catDoc) {
                    catDoc = await Category.create({ name: b.category.trim() });
                }
                product.category = catDoc._id;
            }
        }
        if (b.subCategory !== undefined) product.subCategory = b.subCategory || null;

        // B2C Retail Pricing
        if (b.originalPrice !== undefined) product.originalPrice = Number(b.originalPrice) || 0;
        if (b.discountedPrice !== undefined) product.discountedPrice = Number(b.discountedPrice) || 0;
        if (b.b2cPrice !== undefined) product.b2cPrice = b.b2cPrice !== null && b.b2cPrice !== "" ? Number(b.b2cPrice) : null;
        if (b.b2cMargin !== undefined) product.b2cMargin = Number(b.b2cMargin) || 0;

        // B2B Wholesale Pricing
        if (b.b2bPrice !== undefined) {
            product.b2bPrice = b.b2bPrice !== null && b.b2bPrice !== "" ? Number(b.b2bPrice) : null;
            if (!product.b2bPricing) product.b2bPricing = {};
            product.b2bPricing.basePrice = product.b2bPrice;
        }
        if (b.b2bMargin !== undefined) product.b2bMargin = Number(b.b2bMargin) || 0;

        if (b.b2bPricing && typeof b.b2bPricing === "object") {
            if (!product.b2bPricing) product.b2bPricing = {};
            if (b.b2bPricing.isEnabled !== undefined) product.b2bPricing.isEnabled = Boolean(b.b2bPricing.isEnabled);
            if (b.b2bPricing.basePrice !== undefined) {
                product.b2bPricing.basePrice = b.b2bPricing.basePrice !== null && b.b2bPricing.basePrice !== "" ? Number(b.b2bPricing.basePrice) : null;
                product.b2bPrice = product.b2bPricing.basePrice;
            }
            if (b.b2bPricing.moq !== undefined) product.b2bPricing.moq = Math.max(1, Number(b.b2bPricing.moq));
            if (b.b2bPricing.stepQuantity !== undefined) product.b2bPricing.stepQuantity = Math.max(1, Number(b.b2bPricing.stepQuantity));
            if (b.b2bPricing.sampleAvailable !== undefined) product.b2bPricing.sampleAvailable = Boolean(b.b2bPricing.sampleAvailable);
            if (b.b2bPricing.samplePrice !== undefined) product.b2bPricing.samplePrice = b.b2bPricing.samplePrice !== null ? Number(b.b2bPricing.samplePrice) : null;

            if (Array.isArray(b.b2bPricing.tiers)) {
                product.b2bPricing.tiers = b.b2bPricing.tiers
                    .filter((t) => (t.minQty || t.min) && (t.unitPrice || t.price))
                    .map((t) => ({
                        minQty: Number(t.minQty ?? t.min),
                        maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== "" ? Number(t.maxQty) : null,
                        unitPrice: Number(t.unitPrice ?? t.price),
                        discountPercentage: Number(t.discountPercentage) || 0,
                        tierLabel: t.tierLabel?.trim() || "",
                        popular: Boolean(t.popular),
                        leadTime: t.leadTime?.trim() || "",
                        benefits: Array.isArray(t.benefits) ? t.benefits : [],
                        customizationOptions: Array.isArray(t.customizationOptions) ? t.customizationOptions : [],
                    }))
                    .sort((a, b) => a.minQty - b.minQty);
            }
        } else if (Array.isArray(b.tiers)) {
            if (!product.b2bPricing) product.b2bPricing = {};
            product.b2bPricing.tiers = b.tiers
                .filter((t) => (t.minQty || t.min) && (t.unitPrice || t.price))
                .map((t) => ({
                    minQty: Number(t.minQty ?? t.min),
                    maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== "" ? Number(t.maxQty) : null,
                    unitPrice: Number(t.unitPrice ?? t.price),
                    discountPercentage: Number(t.discountPercentage) || 0,
                    tierLabel: t.tierLabel?.trim() || "",
                    popular: Boolean(t.popular),
                    leadTime: t.leadTime?.trim() || "",
                    benefits: Array.isArray(t.benefits) ? t.benefits : [],
                    customizationOptions: Array.isArray(t.customizationOptions) ? t.customizationOptions : [],
                }))
                .sort((a, b) => a.minQty - b.minQty);
        }

        // Color Variants
        if (Array.isArray(b.colors)) {
            product.colors = b.colors.map((c) => ({
                name: c.name?.trim() || "Default",
                hex: c.hex?.trim() || "",
                images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
                stock: Number(c.stock) || 0,
            }));
        }

        // Specs & Features
        if (b.specs !== undefined && typeof b.specs === "object") product.specs = b.specs;
        if (b.features !== undefined && typeof b.features === "object") product.features = b.features;
        if (b.materialInfo !== undefined && typeof b.materialInfo === "object") product.materialInfo = b.materialInfo;

        // Weight & Dimensions
        if (b.productWeight !== undefined) {
            product.productWeight = {
                value: Number(b.productWeight?.value) || 0,
                unit: b.productWeight?.unit?.trim() || "gm",
            };
        }
        if (b.dimensions !== undefined) {
            product.dimensions = {
                length: Number(b.dimensions?.length) || 0,
                width: Number(b.dimensions?.width) || 0,
                height: Number(b.dimensions?.height) || 0,
                unit: b.dimensions?.unit?.trim() || "cm",
            };
        }

        // Gift Box Images & Packaging
        if (Array.isArray(b.giftBoxImages)) product.giftBoxImages = b.giftBoxImages.filter(Boolean);
        if (Array.isArray(b.images)) product.images = b.images.filter(Boolean);
        if (b.giftPackaging !== undefined && typeof b.giftPackaging === "object") {
            product.giftPackaging = b.giftPackaging;
        }

        // Gift Set Contents (for hampers & sets)
        if (b.giftSetContents !== undefined && typeof b.giftSetContents === "object") {
            product.giftSetContents = b.giftSetContents;
        }

        // Packaging & Care
        if (b.package !== undefined && typeof b.package === "object") {
            product.package = {
                contents: b.package.contents || "",
                type: b.package.type || "",
                giftBoxImages: Array.isArray(b.package.giftBoxImages) ? b.package.giftBoxImages : product.giftBoxImages || [],
                deadWeight: b.package.deadWeight || "",
                length: b.package.length || "",
                width: b.package.width || "",
                height: b.package.height || "",
                itemsPerPackage: b.package.itemsPerPackage || "",
                packerDetails: b.package.packerDetails || "",
                countryOfOrigin: b.package.countryOfOrigin || "India",
            };
        }
        if (b.careInstructions !== undefined) product.careInstructions = b.careInstructions;

        // Sustainability
        if (b.sustainability !== undefined && typeof b.sustainability === "object") {
            product.sustainability = {
                madeWith: b.sustainability.madeWith || "",
                highlights: Array.isArray(b.sustainability.highlights) ? b.sustainability.highlights : [],
            };
        }

        // Tax
        if (b.tax !== undefined && typeof b.tax === "object") {
            if (!product.tax) product.tax = {};
            if (b.tax.hsnCode !== undefined) product.tax.hsnCode = b.tax.hsnCode.trim();
            if (b.tax.gstRate !== undefined) product.tax.gstRate = b.tax.gstRate;
            if (b.tax.isTaxInclusive !== undefined) product.tax.isTaxInclusive = Boolean(b.tax.isTaxInclusive);
        }

        // SEO
        if (b.metaTitle !== undefined) product.metaTitle = b.metaTitle;
        if (b.metaDescription !== undefined) product.metaDescription = b.metaDescription;
        if (b.metaKeywords !== undefined && Array.isArray(b.metaKeywords)) product.metaKeywords = b.metaKeywords;
        if (b.canonicalUrl !== undefined) product.canonicalUrl = b.canonicalUrl;
        if (b.ogImage !== undefined) product.ogImage = b.ogImage;

        await product.save();

        // Sync to B2BProductConfig collection
        const b2bConfigDoc = await B2BProductConfig.findOne({ product: product._id });
        const contextsPayload = b.contexts || b.b2bPricing?.contexts || (b2bConfigDoc ? b2bConfigDoc.contexts : []);
        const customizationOptionsPayload = b.customizationOptions || b.b2bPricing?.customizationOptions || (b2bConfigDoc ? b2bConfigDoc.customizationOptions : []);

        const syncedB2bConfig = await B2BProductConfig.findOneAndUpdate(
            { product: product._id },
            {
                product: product._id,
                isEnabled: Boolean(product.b2bPricing?.isEnabled || product.b2bPrice),
                basePrice: product.b2bPricing?.basePrice || product.b2bPrice || null,
                moq: product.b2bPricing?.moq || 1,
                stepQuantity: product.b2bPricing?.stepQuantity || 1,
                sampleAvailable: Boolean(product.b2bPricing?.sampleAvailable),
                samplePrice: product.b2bPricing?.samplePrice || null,
                tiers: product.b2bPricing?.tiers || [],
                customizationOptions: customizationOptionsPayload,
                contexts: contextsPayload,
                giftBoxImages: product.giftBoxImages || [],
                images: product.images || [],
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const updatedPopulated = await Product.findById(product._id)
            .populate("category", "name slug description")
            .populate("subCategory", "name slug description")
            .lean();

        const b2bFormatted = formatB2BProduct(updatedPopulated, true, syncedB2bConfig);

        return res.status(200).json({
            success: true,
            message: "Product updated successfully with all B2C & B2B attributes.",
            product: {
                ...updatedPopulated,
                retailPricing: {
                    originalPrice: updatedPopulated.originalPrice || 0,
                    discountedPrice: updatedPopulated.discountedPrice || 0,
                    b2cPrice: updatedPopulated.b2cPrice || updatedPopulated.discountedPrice || 0,
                    b2cMargin: updatedPopulated.b2cMargin || 0,
                },
                wholesalePricing: {
                    isEnabled: Boolean(updatedPopulated.b2bPricing?.isEnabled || updatedPopulated.b2bPrice),
                    basePrice: updatedPopulated.b2bPricing?.basePrice || updatedPopulated.b2bPrice || 0,
                    moq: updatedPopulated.b2bPricing?.moq || 1,
                    stepQuantity: updatedPopulated.b2bPricing?.stepQuantity || 1,
                    sampleAvailable: Boolean(updatedPopulated.b2bPricing?.sampleAvailable),
                    samplePrice: updatedPopulated.b2bPricing?.samplePrice || null,
                    tiers: updatedPopulated.b2bPricing?.tiers || [],
                },
                b2bFormatted,
            },
        });
    } catch (error) {
        console.error("adminUpdateDashboardProduct error:", error);
        return res.status(500).json({ success: false, message: `Error updating product: ${error.message}` });
    }
};

/**
 * Admin Dashboard: Create a brand new product with full B2C + B2B schema
 */
export const adminCreateDashboardProduct = async (req, res) => {
    try {
        const b = req.body;

        if (!b.name?.trim()) {
            return res.status(400).json({ success: false, message: "Product name is required." });
        }

        let categoryId = b.category;
        if (b.category && !mongoose.Types.ObjectId.isValid(b.category)) {
            let catDoc = await Category.findOne({
                name: { $regex: new RegExp(`^${b.category.trim()}$`, "i") },
            });
            if (!catDoc) {
                catDoc = await Category.create({ name: b.category.trim() });
            }
            categoryId = catDoc._id;
        }

        if (!categoryId) {
            let defaultCat = await Category.findOne({});
            if (!defaultCat) defaultCat = await Category.create({ name: "General" });
            categoryId = defaultCat._id;
        }

        // Normalize B2B tiers
        let normalizedTiers = [];
        const rawTiers = b.b2bPricing?.tiers || b.tiers;
        if (Array.isArray(rawTiers)) {
            normalizedTiers = rawTiers
                .filter((t) => (t.minQty || t.min) && (t.unitPrice || t.price))
                .map((t, idx) => ({
                    minQty: Number(t.minQty ?? t.min),
                    maxQty: t.maxQty !== null && t.maxQty !== undefined && t.maxQty !== "" ? Number(t.maxQty) : null,
                    unitPrice: Number(t.unitPrice ?? t.price),
                    discountPercentage: Number(t.discountPercentage) || 0,
                    tierLabel: t.tierLabel?.trim() || (idx === 1 ? "Corporate Recommended" : idx >= 2 ? "Enterprise Direct" : "Starter Bulk"),
                    popular: Boolean(t.popular !== undefined ? t.popular : idx === 1),
                    leadTime: t.leadTime?.trim() || (b.leadTime || "5 - 7 business days"),
                    benefits: Array.isArray(t.benefits) ? t.benefits : generateDefaultTierBenefits(idx, Number(t.minQty ?? t.min), Number(t.unitPrice ?? t.price), Number(b.originalPrice || b.discountedPrice || 0)),
                    customizationOptions: Array.isArray(t.customizationOptions) ? t.customizationOptions : (b.brandingTypes || ["Laser Engraving", "Custom Packaging"]),
                }))
                .sort((a, b) => a.minQty - b.minQty);
        }

        const b2bBasePrice = b.b2bPricing?.basePrice !== undefined ? Number(b.b2bPricing.basePrice) : b.b2bPrice ? Number(b.b2bPrice) : null;

        const product = await Product.create({
            name: b.name.trim(),
            sku: b.sku?.trim() || "",
            category: categoryId,
            subCategory: b.subCategory || null,
            unit: b.unit?.trim() || "piece",
            tagline: b.tagline?.trim() || "",
            description: b.description || b.desc || "Sustainable eco-friendly product.",
            shortDescription: b.shortDescription || "",
            productFeatures: Array.isArray(b.productFeatures) ? b.productFeatures : [],
            material: b.material?.trim() || "",
            collectionName: b.collectionName?.trim() || b.collection?.trim() || "",
            size: b.size?.trim() || "",
            color: b.color?.trim() || "",
            colors: Array.isArray(b.colors) ? b.colors : [],
            images: Array.isArray(b.images) ? b.images.filter(Boolean) : [],
            giftBoxImages: Array.isArray(b.giftBoxImages) ? b.giftBoxImages.filter(Boolean) : [],
            giftPackaging: b.giftPackaging || { available: false, images: [], title: "Premium Gift Box", description: "", pricePerBox: 0, customBrandingAvailable: true },
            giftSetContents: b.giftSetContents || { totalProductTypes: 0, products: [] },
            specs: b.specs || {},
            features: b.features || {},
            materialInfo: b.materialInfo || {},
            originalPrice: Number(b.originalPrice) || 0,
            discountedPrice: Number(b.discountedPrice) || 0,
            b2cPrice: b.b2cPrice ? Number(b.b2cPrice) : null,
            b2cMargin: Number(b.b2cMargin) || 0,
            b2bPrice: b2bBasePrice,
            b2bMargin: Number(b.b2bMargin) || 0,
            b2bPricing: {
                isEnabled: Boolean(b.b2bPricing?.isEnabled ?? true),
                basePrice: b2bBasePrice,
                moq: Math.max(1, Number(b.b2bPricing?.moq) || Number(b.moq) || 50),
                stepQuantity: Math.max(1, Number(b.b2bPricing?.stepQuantity) || Number(b.stepQuantity) || 10),
                sampleAvailable: Boolean(b.b2bPricing?.sampleAvailable ?? true),
                samplePrice: b.b2bPricing?.samplePrice ? Number(b.b2bPricing.samplePrice) : null,
                tiers: normalizedTiers,
            },
            leadTime: b.leadTime?.trim() || "5 - 7 business days",
            branding: b.branding !== undefined ? Boolean(b.branding) : true,
            brandingTypes: Array.isArray(b.brandingTypes) ? b.brandingTypes : ["Custom Logo", "Custom Box Packaging"],
            stockQuantity: Number(b.stockQuantity) || 0,
            productWeight: b.productWeight || { value: 0, unit: "gm" },
            dimensions: b.dimensions || { length: 0, width: 0, height: 0, unit: "cm" },
            package: b.package || {},
            careInstructions: b.careInstructions || "",
            sustainability: b.sustainability || { madeWith: "", highlights: [] },
            tax: b.tax || { hsnCode: "39241090", gstRate: 18, isTaxInclusive: true },
            popular: Boolean(b.popular),
            isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
            isFeatured: Boolean(b.isFeatured),
            tags: Array.isArray(b.tags) ? b.tags : [],
            metaTitle: b.metaTitle,
            metaDescription: b.metaDescription,
            metaKeywords: b.metaKeywords,
        });

        const contextsPayload = b.contexts || b.b2bPricing?.contexts || [];
        const customizationOptionsPayload = b.customizationOptions || b.b2bPricing?.customizationOptions || [];

        const createdB2bConfig = await B2BProductConfig.create({
            product: product._id,
            isEnabled: Boolean(product.b2bPricing?.isEnabled || product.b2bPrice),
            basePrice: b2bBasePrice,
            moq: Math.max(1, Number(product.b2bPricing?.moq) || Number(b.moq) || 50),
            stepQuantity: Math.max(1, Number(product.b2bPricing?.stepQuantity) || Number(b.stepQuantity) || 10),
            sampleAvailable: Boolean(product.b2bPricing?.sampleAvailable ?? true),
            samplePrice: product.b2bPricing?.samplePrice ? Number(product.b2bPricing.samplePrice) : null,
            tiers: normalizedTiers,
            customizationOptions: customizationOptionsPayload,
            contexts: contextsPayload,
            giftBoxImages: product.giftBoxImages || [],
            images: product.images || [],
        });

        const createdPopulated = await Product.findById(product._id)
            .populate("category", "name slug description")
            .lean();

        const createdB2bFormatted = formatB2BProduct(createdPopulated, true, createdB2bConfig);

        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product: {
                ...createdPopulated,
                retailPricing: {
                    originalPrice: createdPopulated.originalPrice || 0,
                    discountedPrice: createdPopulated.discountedPrice || 0,
                    b2cPrice: createdPopulated.b2cPrice || createdPopulated.discountedPrice || 0,
                    b2cMargin: createdPopulated.b2cMargin || 0,
                },
                wholesalePricing: {
                    isEnabled: Boolean(createdPopulated.b2bPricing?.isEnabled || createdPopulated.b2bPrice),
                    basePrice: createdPopulated.b2bPricing?.basePrice || createdPopulated.b2bPrice || 0,
                    moq: createdPopulated.b2bPricing?.moq || 1,
                    stepQuantity: createdPopulated.b2bPricing?.stepQuantity || 1,
                    sampleAvailable: Boolean(createdPopulated.b2bPricing?.sampleAvailable),
                    samplePrice: createdPopulated.b2bPricing?.samplePrice || null,
                    tiers: createdPopulated.b2bPricing?.tiers || [],
                },
                b2bFormatted: createdB2bFormatted,
            },
        });
    } catch (error) {
        console.error("adminCreateDashboardProduct error:", error);
        return res.status(500).json({ success: false, message: `Error creating product: ${error.message}` });
    }
};

/**
 * Admin Dashboard: Delete a product by ID or Slug
 */
export const adminDeleteDashboardProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const isObjectId = mongoose.Types.ObjectId.isValid(productId);
        const filter = isObjectId ? { _id: productId } : { slug: productId };

        const product = await Product.findOneAndDelete(filter);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        return res.status(200).json({
            success: true,
            message: `Product '${product.name}' (${product._id}) deleted successfully.`,
            deletedProductId: product._id,
        });
    } catch (error) {
        console.error("adminDeleteDashboardProduct error:", error);
        return res.status(500).json({ success: false, message: `Error deleting product: ${error.message}` });
    }
};


