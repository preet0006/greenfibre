import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Banner } from "../models/banner.model.js";

// ─────────────────────────────────────────────────────────────
// CONSTANTS — tweak without touching logic
// ─────────────────────────────────────────────────────────────
const BEST_SELLER_STOCK_THRESHOLD = 20; // total stock < this → best seller
const NEW_ARRIVAL_DAYS = 30;            // uploaded within last N days
const SECTION_LIMIT = 10;              // max products per section
const CARD_FIELDS = {                   // lean projection for product cards
    _id: 1,
    name: 1,
    slug: 1,
    originalPrice: 1,
    discountedPrice: 1,
    averageRating: 1,
    reviewCount: 1,
    tags: 1,
    colors: 1,      // needed for first image / color options
    createdAt: 1,
};

// ─────────────────────────────────────────────────────────────
// HELPER: transform a raw product (from .lean()) into a card
// ─────────────────────────────────────────────────────────────
const toCard = (p) => {
    const obj = { ...p };

    // Thumbnail = first image of first color
    const firstColor = obj.colors?.[0];
    obj.thumbnail = firstColor?.images?.[0] ?? null;

    // Per-color options with thumbnail for swatch display
    obj.colorOptions = (obj.colors || []).map((c) => ({
        name: c.name,
        hex: c.hex ?? null,
        thumbnail: c.images?.[0] ?? null,
        stock: c.stock ?? 0,
    }));

    // Total stock across variants
    obj.totalStock =
        obj.totalStock ??
        (obj.colors || []).reduce((s, c) => s + (c.stock || 0), 0);

    // Bandwidth saving — remove raw colors array
    delete obj.colors;

    // Discount % for badge display
    if (obj.originalPrice && obj.discountedPrice) {
        obj.discountPercent = Math.round(
            ((obj.originalPrice - obj.discountedPrice) / obj.originalPrice) * 100
        );
    }

    return obj;
};

// ─────────────────────────────────────────────────────────────
// GET /api/mobile/homepage
//
// Returns everything the mobile home screen needs in ONE request:
//   • banners
//   • categories (top-level)
//   • sections.giftProducts   → tagged "gift"
//   • sections.bestSellers    → tagged "bestSeller" OR low stock heuristic
//   • sections.newArrivals    → tagged "newArrival" OR uploaded ≤ 30 days ago
//
// All 5 DB queries run in parallel via Promise.all.
// ─────────────────────────────────────────────────────────────
export const getMobileHomepage = async (_req, res) => {
    try {
        const newArrivalCutoff = new Date();
        newArrivalCutoff.setDate(newArrivalCutoff.getDate() - NEW_ARRIVAL_DAYS);

        // ── Fire all queries in parallel ──────────────────────
        const [banners, categories, giftProducts, bestSellers, newArrivals] =
            await Promise.all([

                // 1. Active banners sorted by display order
                Banner.find({ isActive: true })
                    .sort({ order: 1 })
                    .select("title subtitle mediaType mediaUrl category")
                    .populate("category", "name slug")
                    .lean(),

                // 2. Top-level active categories
                Category.find({ isActive: true, parentCategory: null })
                    .sort({ displayOrder: 1 })
                    .select("name slug image isFeatured displayOrder")
                    .lean(),

                // 3. Gift section
                Product.find({ isActive: true, tags: "gift" })
                    .sort({ createdAt: -1 })
                    .limit(SECTION_LIMIT)
                    .select(CARD_FIELDS)
                    .lean(),

                // 4. Best sellers — explicit tag OR low stock (aggregation)
                Product.aggregate([
                    { $match: { isActive: true } },
                    {
                        // Compute totalStock in the pipeline
                        $addFields: {
                            totalStock: { $sum: "$colors.stock" },
                        },
                    },
                    {
                        $match: {
                            $or: [
                                { tags: "bestSeller" },
                                {
                                    totalStock: {
                                        $gt: 0,
                                        $lt: BEST_SELLER_STOCK_THRESHOLD,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        // Explicit tag → priority 0, heuristic → priority 1
                        $addFields: {
                            _sortPriority: {
                                $cond: [{ $in: ["bestSeller", "$tags"] }, 0, 1],
                            },
                        },
                    },
                    { $sort: { _sortPriority: 1, totalStock: 1 } },
                    { $limit: SECTION_LIMIT },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            slug: 1,
                            originalPrice: 1,
                            discountedPrice: 1,
                            averageRating: 1,
                            reviewCount: 1,
                            tags: 1,
                            colors: 1,
                            totalStock: 1,
                            createdAt: 1,
                        },
                    },
                ]),

                // 5. New arrivals — explicit tag OR recent upload
                Product.find({
                    isActive: true,
                    $or: [
                        { tags: "newArrival" },
                        { createdAt: { $gte: newArrivalCutoff } },
                    ],
                })
                    .sort({ createdAt: -1 })
                    .limit(SECTION_LIMIT)
                    .select(CARD_FIELDS)
                    .lean(),
            ]);

        // ── Build response ────────────────────────────────────
        return res.status(200).json({
            success: true,
            data: {
                banners,
                categories,
                sections: {
                    giftProducts: giftProducts.map(toCard),
                    bestSellers: bestSellers.map(toCard),
                    newArrivals: newArrivals.map(toCard),
                },
            },
            meta: {
                bestSellerThreshold: BEST_SELLER_STOCK_THRESHOLD,
                newArrivalDays: NEW_ARRIVAL_DAYS,
                fetchedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[mobile] getMobileHomepage:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load homepage data",
        });
    }
};
