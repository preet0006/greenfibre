"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import {useCategoryStore} from "@/store/useCategoryStore";
import useWishlistStore from "@/store/useWishlistStore";
import useUserStore from "@/store/useUserStore";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid3x3,
  LayoutGrid,
  Heart,
  Package,
  Search,
  ChevronRight,
  Loader2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
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

// ── Skeleton Card ─────────────────────────────────────────────
function SkeletonCard({ compact }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-xl bg-gray-100" />
        {!compact && (
          <div className="h-4 w-3/4 animate-pulse rounded-xl bg-gray-100" />
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
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

  const pct = discountPct(product.originalPrice, product.discountedPrice);
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
    if (!user) {
      router.push("/login");
      return;
    }
    setWishLoading(true);
    await toggleWishlist(product._id);
    setWishLoading(false);
  };

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/shop/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Discount badge */}
          {pct > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              {pct}% OFF
            </span>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <span className="rounded-full bg-white border-2 border-red-500 px-4 py-1.5 text-xs font-bold text-red-500 shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            disabled={wishLoading}
            className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm border shadow-sm transition-all hover:scale-110 disabled:opacity-50 ${
              isWishlisted
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white/95 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          {product.category?.name && (
            <span className="mb-1.5 text-xs font-medium text-gray-500">
              {product.category.name}
            </span>
          )}
          <h3
            className={`mb-2 flex-1 text-sm font-semibold leading-snug text-gray-900 ${compact ? "line-clamp-1" : "line-clamp-2"}`}
          >
            {product.name}
          </h3>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5">
              {product.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="h-5 w-5 rounded-full border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(product.discountedPrice)}
            </span>
            {pct > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────
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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen lg:h-auto lg:top-24 w-80 lg:w-full bg-white border-r lg:border-r-0 lg:border border-gray-200 rounded-none lg:rounded-xl overflow-y-auto transition-transform lg:transition-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header (mobile) */}
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
                  onClick={() => onFilterChange({ category: cat._id })}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    filters.category === cat._id
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

// ── Main Component ────────────────────────────────────────────
function ShopPageInner() {
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
  const [showFilters, setShowFilters] = useState(false);
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

  // Fetch products when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    // Pass an object — store spreads into axios params
    const queryObject = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    );
    fetchProducts(queryObject);
    router.push(`/shop?${params.toString()}`, { scroll: false });
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: "1" });
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
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter products by search query (client-side)
  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  const activeCategory = categories.find(
    (c) =>
      c._id === filters.category ||
      c.slug === filters.category ||
      String(c._id) === String(filters.category),
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Shop</span>
            {activeCategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">
                  {activeCategory.name}
                </span>
              </>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1
                className="text-4xl sm:text-5xl font-semibold text-gray-900"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                {activeCategory ? activeCategory.name : "All Products"}
              </h1>
              <p className="mt-2 text-gray-600">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"} available
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Filters Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
            categories={categories}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
          />

          {/* Products Grid */}
          <div>
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between gap-4">
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

            {/* Loading */}
            {loading && (
              <div
                className={`grid gap-6 ${
                  viewMode === "compact"
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {[...Array(viewMode === "compact" ? 10 : 6)].map((_, i) => (
                  <SkeletonCard key={i} compact={viewMode === "compact"} />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Try adjusting your filters or search query
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Products */}
            {!loading && filteredProducts.length > 0 && (
              <>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className={`grid gap-6 ${
                      viewMode === "compact"
                        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
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
                {pagination.pages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="rounded-lg border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {[...Array(pagination.pages)].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`h-10 w-10 rounded-lg text-sm font-semibold transition-all ${
                            pagination.page === page
                              ? "bg-green-600 text-white shadow-sm"
                              : "border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="rounded-lg border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
          <Loader2 size={24} className="text-green-600 animate-spin" />
        </div>
      }
    >
      <ShopPageInner />
    </Suspense>
  );
}
