"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useReviewStore from "@/store/useReviewStore";
import { Star, Quote, Loader2, Leaf, ArrowRight, User } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ review, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="group break-inside-avoid"
    >
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
        {/* Quote Icon */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
          <Quote className="h-5 w-5 text-green-600" />
        </div>

        {/* Rating Stars */}
        <div className="mb-3 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Review Text */}
        <p className="mb-4 text-sm leading-relaxed text-gray-700">
          {review.comment}
        </p>

        {/* Review Images (if any) */}
        {review.images && review.images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {review.images.slice(0, 2).map((image, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
              >
                <Image
                  src={image.thumbnail || image.original}
                  alt={`Review image ${idx + 1}`}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="150px"
                  onLoadingComplete={() => setImageLoaded(true)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Product Info (if available) */}
        {review.product && (
          <Link
            href={`/shop/${review.product.slug}`}
            className="mb-4 block rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
              Product
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-gray-900">
              {review.product.name}
            </p>
          </Link>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            {review.user?.profileImage ? (
              <Image
                src={review.user.profileImage}
                alt={review.user.full_name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <User className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {review.user?.full_name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 h-10 w-10 animate-pulse rounded-full bg-gray-200" />
      <div className="mb-3 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-4 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ReviewsSection() {
  const reviews = useReviewStore((s) => s.reviews);
  const loading = useReviewStore((s) => s.loading);
  const fetchAllReviews = useReviewStore((s) => s.fetchAllReviews);

  useEffect(() => {
    fetchAllReviews();
  }, []);

  // Filter approved reviews only
  const approvedReviews = reviews.filter((r) => r.isApproved).slice(0, 9);

  // Don't show section if no reviews
  if (!loading && approvedReviews.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      {/* Background Pattern */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2 opacity-[0.02]"
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
              Customer Stories
            </span>
          </div>

          <h2
            className="mb-4 text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            What Our Customers Say
          </h2>

          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Real experiences from people who've made the switch to sustainable
            living with Green Fibre
          </p>
        </motion.div>

        {/* Masonry Grid */}
        {loading ? (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {approvedReviews.map((review, index) => (
              <ReviewCard key={review._id} review={review} index={index} />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && approvedReviews.length > 0 && (
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
              Shop Sustainable Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
