"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCategoryStore } from "@/store/useCategoryStore";
import { ArrowRight, Leaf, ChevronRight } from "lucide-react";

// ── Category Card ─────────────────────────────────────────────
function CategoryCard({ category, index }) {
  const imgSrc =
    category.firstProductImage ||
    (typeof category.image === "string"
      ? category.image
      : category.image?.large ||
        category.image?.original ||
        category.image?.medium ||
        category.image?.thumbnail);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="shrink-0 sm:shrink"
    >
      {/* Mobile Card (compact 110px pill matching mockup) */}
      <Link
        href={`/shop?category=${category.slug}`}
        className="sm:hidden group relative block w-[110px] aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-2xs border border-gray-150 snap-start"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="110px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Leaf className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {/* Bottom Bar matching mockup */}
        <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between rounded-xl bg-black/60 backdrop-blur-xs px-2 py-1 text-white">
          <span className="truncate text-[11px] font-semibold leading-tight pr-1">
            {category.name}
          </span>
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white text-gray-900">
            <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </Link>

      {/* Desktop Card (100% UNCHANGED) */}
      <Link
        href={`/shop?category=${category.slug}`}
        className="hidden sm:block group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={category.name}
              fill
              priority={index < 4}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Leaf className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent transition-opacity group-hover:opacity-90" />

          {/* Featured Badge */}
          {category.isFeatured && (
            <div className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
              Featured
            </div>
          )}

          {/* Category Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3
              className="mb-1 text-2xl font-semibold text-white drop-shadow-lg transition-transform group-hover:translate-x-1 sm:text-3xl"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              {category.name}
            </h3>
            {category.productCount > 0 && (
              <p className="text-xs font-semibold text-green-300 mb-1">
                {category.productCount} {category.productCount === 1 ? "Product" : "Products"}
              </p>
            )}
            {category.description && (
              <p className="line-clamp-2 text-xs text-white/90">
                {category.description}
              </p>
            )}
          </div>

          {/* Hover Arrow */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 translate-x-10 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-600 shadow-lg">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Shop Now
            </span>
            <ChevronRight className="h-4 w-4 text-green-600 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
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
      className="overflow-hidden rounded-2xl bg-white shadow-sm"
    >
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="p-4">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ShopByCategorySection() {
  const categories = useCategoryStore((s) => s.categories);
  const loading = useCategoryStore((s) => s.loading);
  const refetchCategories = useCategoryStore((s) => s.refetchCategories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    refetchCategories();
  }, []);

  const displayCategories = categories.filter(
    (cat) => cat.isActive && (cat.productCount === undefined || cat.productCount > 0)
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-10 sm:py-20 lg:py-24">
      {/* Background Decoration */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #15803d 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-12 text-center"
        >
          <div className="mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
            <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-green-600">
              Explore Our Collection
            </span>
          </div>

          <h2
            className="mb-2 sm:mb-4 text-[26px] sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-[1.2]"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Shop by Category
          </h2>

          <p className="mx-auto max-w-2xl text-xs sm:text-lg text-gray-600">
            Discover sustainable essentials thoughtfully crafted for every corner of your home.
          </p>
        </motion.div>

        {/* Categories Grid / Mobile Scroll */}
        {loading ? (
          <div className="flex gap-2.5 overflow-x-auto pb-2 sm:grid sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {displayCategories.map((category, index) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  index={index}
                />
              ))}
            </div>

            {/* Mobile Scroll Indicator Dots */}
            <div className="flex justify-center items-center gap-1.5 mt-3 sm:hidden">
              <span className="h-1.5 w-4 rounded-full bg-green-600" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            </div>
          </div>
        )}

        {/* View All Button */}
        {!loading && displayCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 bg-transparent px-8 py-3 font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white"
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
