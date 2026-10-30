"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import useWishlistStore from "@/store/useWishlistStore";
import useUserStore from "@/store/useUserStore";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  LayoutGrid,
  List,
  Heart,
  Package,
  Search,
  Loader2,
  Sparkles,
  Utensils,
  Gift,
  Coffee,
  PawPrint,
  Leaf,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function discountPct(orig, disc) {
  if (!orig || !disc || orig <= disc) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// ── Variants ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ── Category Icon Renderer ─────────────────────────────────────
function CategoryIcon({ slug = "", name = "", className = "h-4 w-4" }) {
  const s = `${slug} ${name}`.toLowerCase();
  if (s.includes("bottle")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 2h8" />
        <path d="M9 2v3a2 2 0 0 1-2 2h0a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h0a2 2 0 0 1-2-2V2" />
      </svg>
    );
  }
  if (s.includes("planter") || s.includes("plant")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 10V2" />
        <path d="M12 5a3 3 0 0 0-3-3H7v3a3 3 0 0 0 3 3h2" />
        <path d="M12 7a3 3 0 0 1 3-3h2v3a3 3 0 0 1-3 3h-2" />
        <path d="M6 10h12l-1.5 11h-9L6 10z" />
      </svg>
    );
  }
  if (s.includes("storage") || s.includes("box")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="7" rx="8" ry="3" />
        <path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </svg>
    );
  }
  if (s.includes("tableware") || s.includes("dining") || s.includes("kitchen")) {
    return <Utensils className={className} />;
  }
  if (s.includes("gift")) {
    return <Gift className={className} />;
  }
  if (s.includes("drink")) {
    return <Coffee className={className} />;
  }
  if (s.includes("pet")) {
    return <PawPrint className={className} />;
  }
  return <Leaf className={className} />;
}

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard({ compact }) {
  return (
    <div className="overflow-hidden rounded-[14px] sm:rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 w-16 sm:w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-xl bg-gray-100" />
        {!compact && (
          <div className="h-3.5 w-3/4 animate-pulse rounded-xl bg-gray-100 hidden sm:block" />
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="h-5 w-20 sm:h-6 sm:w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, compact = false }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const [wishLoading, setWishLoading] = useState(false);

  // 10% regular discount + 10% more Diwali special offer (20% total discount)
  const originalPrice =
    Number(product.originalPrice) || Number(product.discountedPrice) || 0;
  const offerPrice = Math.round(originalPrice * 0.8);
  const inStock = product.totalStock > 0;
  const isWishlisted = wishlist.some(
    (item) => item._id === product._id || item.productId === product._id,
  );

  // Get first color's first image
  const imgSrc =
    product.colors?.[0]?.images?.[0]?.card ||
    product.colors?.[0]?.images?.[0]?.original;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    setWishLoading(true);
    await toggleWishlist(product._id);
    setWishLoading(false);
  };

  return (
    <motion.div variants={fadeUp} className="h-full">
      <Link
        href={`/shop/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[14px] sm:rounded-2xl border border-gray-200/90 bg-white shadow-2xs transition-all hover:shadow-md"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[#FAF7F2] sm:bg-gray-50/80 flex items-center justify-center">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
            </div>
          )}

          {/* Top Discount Badge */}
          <span className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-10 rounded-full bg-green-600 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-xs">
            20% OFF
          </span>

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <span className="rounded-full bg-white border-2 border-red-500 px-3 py-1 text-[10px] sm:text-xs font-bold text-red-500 shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            disabled={wishLoading}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-10 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border shadow-2xs transition-all hover:scale-110 disabled:opacity-50 ${
              isWishlisted
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white/95 border-gray-200/90 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isWishlisted ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-4">
          {product.category?.name && (
            <span className="mb-0.5 sm:mb-1.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              {product.category.name}
            </span>
          )}
          <h3
            className={`mb-1.5 sm:mb-2 flex-1 text-[13px] sm:text-sm font-semibold leading-[1.35] text-gray-900 ${
              compact ? "line-clamp-1" : "line-clamp-2"
            }`}
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            {product.name}
          </h3>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-1.5 sm:mb-3 flex items-center gap-1 sm:gap-1.5">
              {product.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="h-3.5 w-3.5 sm:h-5 sm:w-5 rounded-full border border-gray-200 shadow-2xs"
                  style={{ background: color.hex || "#e5e7eb" }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] sm:text-xs text-gray-500">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Diwali Special Offer Tag */}
          <div className="mb-1.5 sm:mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-900 shadow-2xs whitespace-normal leading-tight">
              <span>🏷️</span>
              <span>Diwali Special: 10% + 10% More</span>
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-[15px] sm:text-lg font-bold text-green-700 sm:text-green-600">
              {formatPrice(offerPrice)}
            </span>
            {originalPrice > offerPrice && (
              <span className="text-[11px] sm:text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Desktop Filter Sidebar (100% UNCHANGED for Desktop / Tablet) ──
function FilterSidebar({
  filters,
  onFilterChange,
  onClear,
  categories,
  isOpen,
  onClose,
}) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    setPriceRange({
      min: filters.minPrice || "",
      max: filters.maxPrice || "",
    });
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-auto lg:top-20 lg:self-start w-80 lg:w-full bg-white border-r lg:border-r-0 lg:border border-gray-200 rounded-none lg:rounded-2xl transition-all duration-300 shadow-xs overflow-y-auto lg:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header (tablet/mobile slide-out) */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 lg:hidden">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 lg:p-5 space-y-6">
          {/* Categories */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Category
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => onFilterChange({ category: "" })}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  !filters.category
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => onFilterChange({ category: cat.slug || cat._id })}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    filters.category === cat._id || filters.category === cat.slug
                      ? "bg-green-50 text-green-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Price Range
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: e.target.value })
                  }
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: e.target.value })
                  }
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Availability
            </h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock === "true"}
                onChange={(e) =>
                  onFilterChange({ inStock: e.target.checked ? "true" : "" })
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-100"
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Featured */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Collections
            </h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isFeatured === "true"}
                onChange={(e) =>
                  onFilterChange({ isFeatured: e.target.checked ? "true" : "" })
                }
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-100"
              />
              <span className="text-sm text-gray-700">Featured Products</span>
            </label>
          </div>

          {/* Clear filters */}
          <button
            onClick={onClear}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
          >
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Mobile Horizontally Scrollable Category Pills ─────────────
function MobileCategoryPills({ categories, selectedCategory, onSelectCategory }) {
  const rootCategories = useMemo(
    () => categories.filter((c) => c.isActive && !c.parentCategory),
    [categories],
  );

  return (
    <div className="relative mb-3.5 md:hidden -mx-4 px-4">
      <div className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* All Categories pill */}
        <button
          type="button"
          onClick={() => onSelectCategory("")}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all min-h-[44px] ${
            !selectedCategory
              ? "bg-[#eaf8ed] border border-green-500 text-green-700 font-semibold shadow-2xs"
              : "bg-white border border-gray-200/90 text-gray-700 hover:border-gray-300"
          }`}
        >
          <LayoutGrid
            className={`h-4 w-4 ${!selectedCategory ? "text-green-600" : "text-gray-500"}`}
          />
          <span>All Categories</span>
        </button>

        {/* Dynamic categories */}
        {rootCategories.map((cat) => {
          const isSelected =
            selectedCategory === cat._id ||
            selectedCategory === cat.slug ||
            String(selectedCategory) === String(cat._id);

          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => onSelectCategory(cat.slug || cat._id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all min-h-[44px] ${
                isSelected
                  ? "bg-[#eaf8ed] border border-green-500 text-green-700 font-semibold shadow-2xs"
                  : "bg-white border border-gray-200/90 text-gray-700 hover:border-gray-300"
              }`}
            >
              <CategoryIcon
                slug={cat.slug}
                name={cat.name}
                className={`h-4 w-4 ${isSelected ? "text-green-600" : "text-gray-600"}`}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle right fade hint with arrow */}
      <div className="pointer-events-none absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-0.5">
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 opacity-60" />
      </div>
    </div>
  );
}

// ── Mobile Compact Toolbar ────────────────────────────────────
function MobileToolbar({
  totalCount,
  sort,
  onSortChange,
  onOpenFilter,
  activeFilterCount,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="mb-4 flex min-w-0 items-center justify-between gap-1.5 sm:gap-2 md:hidden">
      {/* Product count */}
      <span className="shrink-0 text-xs font-semibold text-gray-800">
        {totalCount} {totalCount === 1 ? "product" : "products"}
      </span>

      {/* Right controls */}
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        {/* Filter Button */}
        <button
          type="button"
          onClick={onOpenFilter}
          className={`relative inline-flex items-center gap-1 rounded-xl border bg-white px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-all min-h-[36px] ${
            activeFilterCount > 0
              ? "border-green-500 text-green-700 bg-green-50/50"
              : "border-gray-200 text-gray-700 hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal className="h-3 w-3 text-gray-600 shrink-0" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-[36px] w-[90px] min-[370px]:w-[98px] sm:w-auto max-w-[120px] appearance-none truncate rounded-xl border border-gray-200 bg-white pl-2 pr-5 text-[11px] sm:text-xs font-medium text-gray-700 shadow-2xs outline-none focus:border-green-600"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="discountedPrice">Price: Low to High</option>
            <option value="-discountedPrice">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="-name">Name: Z to A</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500" />
        </div>

        {/* View Toggle */}
        <div className="flex h-[36px] items-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-green-50 text-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("compact")}
            className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg transition-colors ${
              viewMode === "compact"
                ? "bg-green-50 text-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Bottom Sheet Drawer for Filters ────────────────────
function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClear,
  categories,
  totalCount,
}) {
  const [mobilePrice, setMobilePrice] = useState({
    min: filters.minPrice || "",
    max: filters.maxPrice || "",
  });

  useEffect(() => {
    setMobilePrice({
      min: filters.minPrice || "",
      max: filters.maxPrice || "",
    });
  }, [filters.minPrice, filters.maxPrice]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs md:hidden"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] rounded-t-3xl bg-white shadow-2xl flex flex-col md:hidden"
          >
            {/* Top Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <p className="text-xs text-gray-500">
                  {totalCount} {totalCount === 1 ? "product" : "products"} available
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Category */}
              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Category
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onFilterChange({ category: "" })}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      !filters.category
                        ? "bg-green-600 text-white font-semibold shadow-xs"
                        : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories
                    .filter((c) => c.isActive && !c.parentCategory)
                    .map((cat) => {
                      const isSelected =
                        filters.category === cat._id ||
                        filters.category === cat.slug ||
                        String(filters.category) === String(cat._id);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() =>
                            onFilterChange({ category: cat.slug || cat._id })
                          }
                          className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-green-600 text-white font-semibold shadow-xs"
                              : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Price Range
                </h4>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={mobilePrice.min}
                        onChange={(e) =>
                          setMobilePrice({ ...mobilePrice, min: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 pl-7 pr-3 text-xs outline-none focus:border-green-600"
                      />
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="Max Price"
                        value={mobilePrice.max}
                        onChange={(e) =>
                          setMobilePrice({ ...mobilePrice, max: e.target.value })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 pl-7 pr-3 text-xs outline-none focus:border-green-600"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({
                        minPrice: mobilePrice.min,
                        maxPrice: mobilePrice.max,
                      });
                    }}
                    className="w-full rounded-xl bg-gray-100 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Apply Price
                  </button>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Availability
                </h4>
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={filters.inStock === "true"}
                    onChange={(e) =>
                      onFilterChange({ inStock: e.target.checked ? "true" : "" })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">In Stock Only</span>
                </label>
              </div>

              {/* Collections */}
              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Collections
                </h4>
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={filters.isFeatured === "true"}
                    onChange={(e) =>
                      onFilterChange({ isFeatured: e.target.checked ? "true" : "" })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Featured Products</span>
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 bg-white p-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setMobilePrice({ min: "", max: "" });
                  onClose();
                }}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  onFilterChange({
                    minPrice: mobilePrice.min,
                    maxPrice: mobilePrice.max,
                  });
                  onClose();
                }}
                className="flex-1 rounded-xl bg-green-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800 min-h-[44px]"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Shop Inner Component ─────────────────────────────────
function ShopPageInner({ initialProducts = [], initialPagination = null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const products = useProductStore((s) => s.products);
  const pagination = useProductStore((s) => s.pagination);
  const loading = useProductStore((s) => s.loading);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    isFeatured: searchParams.get("isFeatured") || "",
    inStock: searchParams.get("inStock") || "",
    sort: searchParams.get("sort") || "-createdAt",
    page: searchParams.get("page") || "1",
  });

  const [viewMode, setViewMode] = useState("grid"); // grid or compact
  const [showFilters, setShowFilters] = useState(false); // desktop/tablet slide-out
  const [showMobileDrawer, setShowMobileDrawer] = useState(false); // mobile bottom sheet
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch wishlist if logged in
  useEffect(() => {
    if (authChecked && user) {
      fetchWishlist();
    }
  }, [authChecked, user]);

  // Fetch products when filters change (also runs on mount, syncing store with SSR data)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const queryObject = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    );
    fetchProducts(queryObject);
    router.push(`/shop?${params.toString()}`, { scroll: false });
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: "1" }));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      isFeatured: "",
      inStock: "",
      sort: "-createdAt",
      page: "1",
    });
    setShowFilters(false);
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SSR fallback handling
  const displayProducts = products.length > 0 ? products : initialProducts;
  const displayPagination =
    pagination?.total ? pagination : initialPagination || pagination;
  const isInitialLoading = loading && initialProducts.length === 0;

  // Filter products by search query (client-side)
  const filteredProducts = searchQuery
    ? displayProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : displayProducts;

  const totalCount = displayPagination?.total ?? filteredProducts.length;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.inStock === "true") count++;
    if (filters.isFeatured === "true") count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* ── Top Banner directly after Navbar ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-2">
        <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-2xs sm:shadow-none">
          {/* Mobile adapted banner (< 768px) */}
          <div className="block md:hidden">
            <Image
              src="/banner-shop-mobile-v2.png"
              alt="Sustainable Living Essentials - Green Fibre Collection"
              width={612}
              height={282}
              priority
              className="w-full h-auto object-cover block"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          {/* Desktop & Tablet banner (>= 768px, 100% UNCHANGED) */}
          <div className="hidden md:block">
            <Image
              src="https://res.cloudinary.com/dsebrpcyz/image/upload/x_0,y_894,w_2172,h_384,c_crop/v1789466045/copy_of_chatgpt_image_sep_15_2026_03_20_44_pm_phfl27.png"
              alt="Sustainable Living Essentials - Green Fibre Collection"
              width={2172}
              height={384}
              priority
              className="w-full h-auto object-cover block brightness-[1.08] contrast-[1.02]"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8 pb-24 sm:pb-16">
        {/* Mobile categories scrollable pills (< 768px) */}
        <MobileCategoryPills
          categories={categories}
          selectedCategory={filters.category}
          onSelectCategory={(catSlugOrId) =>
            handleFilterChange({ category: catSlugOrId })
          }
        />

        {/* Mobile compact toolbar (< 768px) */}
        <MobileToolbar
          totalCount={totalCount}
          sort={filters.sort}
          onSortChange={(sort) => handleFilterChange({ sort })}
          onOpenFilter={() => setShowMobileDrawer(true)}
          activeFilterCount={activeFilterCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* ── Main Layout: Sidebar + Products ── */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
          {/* Filters Sidebar (desktop / tablet) */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
            categories={categories}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
          />

          {/* Products Column */}
          <div>
            {/* Desktop Toolbar (hidden on mobile) */}
            <div className="mb-6 hidden md:flex items-center justify-between gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              <div className="flex items-center gap-3 ml-auto">
                {/* Sort */}
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange({ sort: e.target.value })}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm font-medium outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="discountedPrice">Price: Low to High</option>
                  <option value="-discountedPrice">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="-name">Name: Z to A</option>
                </select>

                {/* View toggle */}
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "grid"
                        ? "bg-green-50 text-green-600"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "compact"
                        ? "bg-green-50 text-green-600"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading Skeletons */}
            {isInitialLoading && (
              <div
                className={`grid gap-3 sm:gap-6 ${
                  viewMode === "compact"
                    ? "grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {[...Array(viewMode === "compact" ? 10 : 6)].map((_, i) => (
                  <SkeletonCard key={i} compact={viewMode === "compact"} />
                ))}
              </div>
            )}

            {/* No products found */}
            {!isInitialLoading && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 sm:py-20 text-center">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600">
                    Try adjusting your filters or search query
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="rounded-xl bg-green-600 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 min-h-[44px]"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!isInitialLoading && filteredProducts.length > 0 && (
              <>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className={`grid gap-3 md:gap-6 ${
                      viewMode === "compact"
                        ? "grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        : "grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        compact={viewMode === "compact"}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Pagination */}
                {displayPagination?.pages > 1 && (
                  <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(displayPagination.page - 1)}
                      disabled={displayPagination.page === 1}
                      className="rounded-lg border-2 border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                    >
                      Previous
                    </button>

                    {[...Array(displayPagination.pages)].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            displayPagination.page === page
                              ? "bg-green-600 text-white shadow-sm"
                              : "border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(displayPagination.page + 1)}
                      disabled={displayPagination.page === displayPagination.pages}
                      className="rounded-lg border-2 border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer for Filters (< 768px) */}
      <MobileFilterDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        categories={categories}
        totalCount={totalCount}
      />
    </div>
  );
}

export default function ShopPageClient({
  initialProducts = [],
  initialPagination = null,
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
          <Loader2 size={24} className="text-green-600 animate-spin" />
        </div>
      }
    >
      <ShopPageInner
        initialProducts={initialProducts}
        initialPagination={initialPagination}
      />
    </Suspense>
  );
}
