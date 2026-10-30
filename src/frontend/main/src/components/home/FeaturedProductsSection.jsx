"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import useCartStore from "@/store/useCartStore";
import toast from "react-hot-toast";
import { OFFICIAL_PRODUCTS } from "@/data/officialProducts";
import { ArrowRight, Leaf, ShoppingCart, Heart, Star, Loader2, Sparkles, Check } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function calculateDiscount(originalPrice, discountedPrice) {
  if (!discountedPrice || discountedPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, index }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);

  // Get first available color
  const firstColor = product.colors?.[0] || {};
  const displayImage = firstColor.images?.[0]?.card || firstColor.images?.[0]?.original || "/images/placeholder.jpg";

  // Base price and Diwali 10% + 10% special offer (20% total discount)
  const originalPrice = Number(product.originalPrice) || Number(product.discountedPrice) || 0;
  const offerPrice = Math.round(originalPrice * 0.80);

  // Check stock
  const hasStock = product.totalStock > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasStock || adding) return;
    try {
      setAdding(true);
      await addToCart({ productId: product._id, colorIndex: 0, quantity: 1, product });
      toast.success("Added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    } finally {
      setTimeout(() => setAdding(false), 600);
    }
  };

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200/90 bg-white shadow-2xs sm:shadow-sm transition-all hover:shadow-xl flex flex-col h-full">
        {/* Image Container */}
        <Link
          href={`/shop/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-gray-50/80"
        >
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex flex-col gap-1 z-10">
            {!hasStock && (
              <span className="rounded-full bg-gray-900 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white shadow-sm">
                Out of Stock
              </span>
            )}
            {hasStock && (
              <span className="rounded-full bg-green-600 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white shadow-sm">
                20% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-emerald-700 px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute right-2 top-2 sm:right-3 sm:top-3 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 backdrop-blur-xs transition-all hover:bg-gray-50"
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-5 sm:w-5 transition-colors ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>

          {/* Quick View on Hover (desktop only) */}
          <div className="hidden sm:block absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100"
            >
              <ShoppingCart className="h-4 w-4" />
              Quick Add
            </button>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-2.5 sm:p-4 flex flex-col flex-1">
          {/* Category */}
          {product.category?.name && (
            <p className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-600 truncate">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <Link href={`/shop/${product.slug}`}>
            <h3 className="mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2 text-xs sm:text-base font-semibold text-gray-900 transition-colors hover:text-green-600">
              {product.name}
            </h3>
          </Link>

          {/* Rating (if available) */}
          {product.averageRating > 0 && (
            <div className="mb-1 sm:mb-2 flex items-center gap-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                {product.averageRating.toFixed(1)}
              </span>
              <span className="text-[10px] sm:text-sm text-gray-500">
                ({product.reviewCount || product.totalReviews || 128})
              </span>
            </div>
          )}

          {/* Diwali Special Offer Tag */}
          <div className="mb-1.5 sm:mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold text-amber-900 shadow-2xs">
              <span>🪔</span>
              <span className="truncate">Diwali Special</span>
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-auto">
            <span className="text-sm sm:text-lg font-bold text-gray-900">
              {formatPrice(offerPrice)}
            </span>
            {originalPrice > offerPrice && (
              <span className="text-[11px] sm:text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Color Variants (desktop) */}
          {product.colors?.length > 0 && (
            <div className="mt-3 hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-600">Colors:</span>
              <div className="flex gap-1.5">
                {product.colors.slice(0, 4).map((color, idx) => (
                  <div
                    key={idx}
                    className="h-5 w-5 rounded-full border-2 border-gray-300"
                    style={{ background: color.hex || "#e5e7eb" }}
                    title={color.name}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="flex h-5 items-center text-xs text-gray-500">
                    +{product.colors.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile Add to Cart button matching mockup */}
          <button
            onClick={handleAddToCart}
            disabled={!hasStock || adding}
            className="mt-2.5 sm:hidden flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200/70 hover:bg-green-600 hover:text-white text-green-700 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40"
          >
            {adding ? (
              <>
                <Check className="h-3 w-3" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3 w-3" />
                <span>{hasStock ? "Add to Cart" : "Out of Stock"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────
function SkeletonCard({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function FeaturedProductsSection() {
  const products = useProductStore((s) => s.products);
  const loading = useProductStore((s) => s.loading);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  useEffect(() => {
    // Fetch featured products
    fetchProducts({ isFeatured: true, limit: 8 });
  }, []);

  // Filter featured and active products
  let featuredProducts = products.filter(
    (p) => p.isFeatured && p.isActive
  ).slice(0, 8); // Show max 8 products

  if (featuredProducts.length === 0) {
    featuredProducts = OFFICIAL_PRODUCTS.filter((p) => p.isFeatured).slice(0, 8);
  }

  return (
    <section className="relative overflow-hidden bg-white py-10 sm:py-20 lg:py-24">
      {/* Background Pattern */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #15803d 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-12 text-center">
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-green-600">
              Handpicked for You
            </span>
          </div>

          <h2
            className="mb-2 sm:mb-4 text-[26px] sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-[1.2]"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Featured Products
          </h2>

          <p className="mx-auto max-w-2xl text-xs sm:text-lg text-gray-600">
            Discover our most loved sustainable products, carefully selected for everyday living.
          </p>
        </div>

        {/* Products Grid: 2-column on mobile, sm:2, lg:3, xl:4 on desktop */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

            {/* Mobile Pagination Dots matching mockup */}
            <div className="flex justify-center items-center gap-1.5 mt-4 sm:hidden">
              <span className="h-1.5 w-4 rounded-full bg-green-600" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            </div>
          </div>
        )}

        {/* View All Button */}
        {!loading && featuredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 sm:mt-12 text-center"
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 bg-transparent px-6 sm:px-8 py-2.5 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white"
            >
              <span>View All Products</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}