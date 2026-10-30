"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useReviewStore from "@/store/useReviewStore";
import { Star, Quote, Leaf, ArrowRight, User } from "lucide-react";

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
      viewport={{ once: true, margin: "50px" }}
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

  const [activeIdx, setActiveIdx] = useState(0);
  const mobileSliderRef = useRef(null);

  useEffect(() => {
    fetchAllReviews();
  }, []);

  // Filter approved reviews only
  const approvedReviews = reviews.filter((r) => r.isApproved).slice(0, 9);

  const handleMobileScroll = () => {
    if (!mobileSliderRef.current) return;
    const { scrollLeft, clientWidth } = mobileSliderRef.current;
    if (clientWidth === 0) return;
    const newIdx = Math.round(scrollLeft / clientWidth);
    if (newIdx !== activeIdx && newIdx >= 0 && newIdx < approvedReviews.length) {
      setActiveIdx(newIdx);
    }
  };

  const scrollToReview = (idx) => {
    if (!mobileSliderRef.current) return;
    const width = mobileSliderRef.current.clientWidth;
    mobileSliderRef.current.scrollTo({
      left: idx * width,
      behavior: "smooth",
    });
    setActiveIdx(idx);
  };

  // Don't show section if no reviews
  if (!loading && approvedReviews.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-white py-10 sm:py-20 lg:py-24">
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
          className="mb-8 text-center sm:mb-12"
        >
          <div className="mb-2 flex items-center justify-center gap-1.5 sm:mb-3 sm:gap-2">
            <Leaf className="h-3.5 w-3.5 text-green-600 sm:h-5 sm:w-5" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600 sm:text-xs">
              Customer Stories
            </span>
          </div>

          <h2
            className="mb-2 text-[26px] font-semibold leading-[1.2] text-[#15352D] sm:mb-4 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            What Our Customers Say
          </h2>

          <p className="mx-auto max-w-2xl text-[12px] leading-[1.5] text-gray-600 sm:text-lg">
            Real experiences from people who&apos;ve made the switch to sustainable
            living with Green Fibre
          </p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <>
            <div className="sm:hidden">
              <SkeletonCard />
            </div>
            <div className="hidden sm:block sm:columns-2 lg:columns-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile View: 1 Card at a time carousel */}
            <div className="sm:hidden">
              <div
                ref={mobileSliderRef}
                onScroll={handleMobileScroll}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none gap-4 pb-1"
              >
                {approvedReviews.map((review, idx) => (
                  <div key={review._id || idx} className="w-full shrink-0 snap-center">
                    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
                      {/* Rating Stars */}
                      <div className="mb-3 flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (review.rating || 5)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="mb-4 text-[13px] leading-[1.6] text-gray-700">
                        &ldquo;{review.comment}&rdquo;
                      </p>

                      {/* User Info */}
                      <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          {review.user?.profileImage ? (
                            <Image
                              src={review.user.profileImage}
                              alt={review.user.full_name || "Customer"}
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                            {review.user?.full_name || "Verified Customer"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Verified Customer
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots pagination */}
              {approvedReviews.length > 1 && (
                <div className="mt-4 flex justify-center gap-1.5">
                  {approvedReviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToReview(idx)}
                      aria-label={`Go to review ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeIdx === idx ? "w-5 bg-[#15803d]" : "w-1.5 bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop View: Preserved Masonry */}
            <div className="hidden sm:block sm:columns-2 lg:columns-3 sm:gap-6">
              {approvedReviews.map((review, index) => (
                <ReviewCard key={review._id} review={review} index={index} />
              ))}
            </div>
          </>
        )}

        {/* View All Button */}
        {!loading && approvedReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-center sm:mt-12"
          >
            <Link
              href="/shop"
              className="inline-flex h-[42px] items-center gap-2 rounded-full border border-green-600 bg-transparent px-6 text-xs font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white sm:h-auto sm:border-2 sm:px-8 sm:py-4 sm:text-base"
            >
              Shop Sustainable Products
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
