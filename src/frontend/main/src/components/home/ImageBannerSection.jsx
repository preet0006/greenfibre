"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useBannerStore from "@/store/useBannerStore";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";

export default function ImageBannerSection() {
  const banners = useBannerStore((s) => s.banners);
  const loading = useBannerStore((s) => s.loading);
  const fetchBanners = useBannerStore((s) => s.fetchBanners);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev

  // Filter only active image banners (exclude videos for this section)
  const imageBanners = banners.filter(
    (b) => b.isActive && b.mediaType === "image"
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || imageBanners.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % imageBanners.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, imageBanners.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % imageBanners.length);
    setIsAutoPlaying(false); // Stop auto-play on manual interaction
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? imageBanners.length - 1 : prev - 1
    );
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative h-75 w-full overflow-hidden bg-gray-100 sm:h-100 lg:h-150">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  // No banners available
  if (imageBanners.length === 0) {
    return null; // Don't show section if no banners
  }

  const currentBanner = imageBanners[currentIndex];

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <section className="relative w-full overflow-hidden bg-gray-100">
      {/* Main Banner Carousel */}
      <div className="relative h-75 mt-14 w-full sm:h-100 lg:h-150">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-0"
          >
            {/* Desktop Image */}
            <div className="relative hidden h-full w-full lg:block">
              <Image
                src={currentBanner.mediaUrl.desktop}
                alt={currentBanner.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>

            {/* Tablet Image */}
            <div className="relative hidden h-full w-full sm:block lg:hidden">
              <Image
                src={currentBanner.mediaUrl.tablet}
                alt={currentBanner.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>

            {/* Mobile Image */}
            <div className="relative block h-full w-full sm:hidden">
              <Image
                src={currentBanner.mediaUrl.mobile}
                alt={currentBanner.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>

            {/* Gradient Overlay (optional) */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

            {/* Banner Title & Category (if you want to show) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
              <div className="mx-auto max-w-7xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentBanner.category && (
                    <Link
                      href={`/shop?category=${currentBanner.category.slug}`}
                      className="inline-block"
                    >
                      <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:text-sm">
                        {currentBanner.category.name}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Link>
                  )}
                  <h2
                    className="mt-2 text-3xl font-semibold text-white drop-shadow-lg sm:text-4xl lg:text-5xl"
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', serif)",
                    }}
                  >
                    {currentBanner.title}
                  </h2>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (only show if multiple banners) */}
        {imageBanners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:h-12 sm:w-12 lg:left-8"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:h-12 sm:w-12 lg:right-8"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Auto-play Toggle (only show if multiple banners) */}
        {imageBanners.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:bottom-8 sm:right-8"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Dot Indicators (only show if multiple banners) */}
        {imageBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-8">
            {imageBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}