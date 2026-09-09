"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {useCategoryStore} from "@/store/useCategoryStore";
import { OFFICIAL_CATEGORIES } from "@/data/officialProducts";
import { ArrowRight, Loader2, Leaf, ChevronRight } from "lucide-react";

// ── Category Card ─────────────────────────────────────────────
function CategoryCard({ category, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        href={`/shop?category=${category.slug}`}
        className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={category.image?.large || category.image?.original || "/products/soup-bowl-250-ml.jpg"}
            alt={category.name}
            fill
            priority={index === 0}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

          {/* Featured Badge */}
          {category.isFeatured && (
            <div className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
              Featured
            </div>
          )}

          {/* Category Name Overlay */}
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
            {category.description && (
              <p className="line-clamp-2 text-sm text-white/90">
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

        {/* Bottom Section (optional - remove if you want image-only cards) */}
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
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    fetchCategories();
  }, []);

  const activeCategories = categories.filter((cat) => cat.isActive);
  const displayCategories = activeCategories.length > 0 ? activeCategories : OFFICIAL_CATEGORIES;

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white to-gray-50 py-16 sm:py-20 lg:py-24">
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
          className="mb-12 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              Explore Our Collection
            </span>
          </div>

          <h2
            className="mb-4 text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Shop by Category
          </h2>

          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Discover sustainable products thoughtfully curated for every aspect
            of your eco-conscious lifestyle
          </p>
        </motion.div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayCategories.map((category, index) => (
              <CategoryCard
                key={category._id}
                category={category}
                index={index}
              />
            ))}
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
