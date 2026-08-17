"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import { ArrowRight, Leaf, ShoppingCart, Heart, Star, Loader2 } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function calculateDiscount(originalPrice, discountedPrice) {
  if (!discountedPrice || discountedPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, index }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Get first available color
  const firstColor = product.colors?.[0] || {};
  const displayImage = firstColor.images?.[0]?.card || firstColor.images?.[0]?.original || "/images/placeholder.jpg";

  // Get price from product level (not color level)
  const originalPrice = product.originalPrice || 0;
  const discountedPrice = product.discountedPrice || null;
  const finalPrice = discountedPrice || originalPrice;
  const discountPercent = calculateDiscount(originalPrice, discountedPrice);

  // Check stock
  const hasStock = product.totalStock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl">
        {/* Image Container */}
        <Link
          href={`/shop/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-gray-100"
        >
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {!hasStock && (
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                Out of Stock
              </span>
            )}
            {hasStock && discountPercent > 0 && (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                {discountPercent}% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
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
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-all hover:bg-gray-50"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isWishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
              }`}
            />
          </button>

          {/* Quick View on Hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-linear-to-t from-black/60 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100">
              <ShoppingCart className="h-4 w-4" />
              Quick Add
            </button>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category?.name && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-green-600">
              {product.name}
            </h3>
          </Link>

          {/* Rating (if available) */}
          {product.averageRating > 0 && (
            <div className="mb-2 flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-900">
                {product.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({product.reviewCount || product.totalReviews})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(finalPrice)}
            </span>
            {discountedPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Color Variants */}
          {product.colors?.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-600">Colors:</span>
              <div className="flex gap-1.5">
                {product.colors.slice(0, 4).map((color, idx) => (
                  <div
                    key={idx}
                    className="h-5 w-5 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.hex }}
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
        </div>
      </div>
    </motion.div>
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
  const featuredProducts = products.filter(
    (p) => p.isFeatured && p.isActive
  ).slice(0, 8); // Show max 8 products

  // Don't show section if no featured products
  if (!loading && featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              Handpicked for You
            </span>
          </div>

          <h2
            className="mb-4 text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Featured Products
          </h2>

          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Discover our most loved sustainable products, carefully selected for quality, design, and environmental impact
          </p>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && featuredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 bg-transparent px-8 py-4 font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}