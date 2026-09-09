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

  // Default Hero Banner when no custom banners are uploaded in DB
  if (imageBanners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 py-20 lg:py-28 text-white mt-12 sm:mt-14">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-green-400">
                <span>🌾</span>
                <span>Bio-Composite Innovation: Rice Husk + Polymer</span>
              </div>
              <h1 
                className="text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl text-white"
                style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
              >
                Better For The Earth. <br />
                <span className="font-semibold text-green-400 italic">Stronger For Everyday Life.</span>
              </h1>
              <p className="max-w-2xl text-base sm:text-lg text-stone-300 leading-relaxed font-light">
                We upcycle discarded agricultural rice husk and blend it with durable polymers. 
                This prevents crop stubble burning, reduces virgin plastic consumption, and creates exceptionally 
                durable, heat-resistant home essentials with an authentic, organic speckled appearance.
              </p>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                <span className="rounded-full bg-stone-800/90 border border-stone-700 px-3.5 py-1 text-xs text-stone-300">
                  🌿 40%+ Virgin Plastic Saved
                </span>
                <span className="rounded-full bg-stone-800/90 border border-stone-700 px-3.5 py-1 text-xs text-stone-300">
                  🛡️ Superior Impact Strength
                </span>
                <span className="rounded-full bg-stone-800/90 border border-stone-700 px-3.5 py-1 text-xs text-stone-300">
                  ✨ Unique Speckled Texture
                </span>
                <span className="rounded-full bg-stone-800/90 border border-stone-700 px-3.5 py-1 text-xs text-stone-300">
                  🌱 100% Food-Grade Safe
                </span>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/shop"
                  className="rounded-full bg-green-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-600/30 hover:bg-green-500 transition-all transform hover:-translate-y-0.5"
                >
                  Explore Rice Husk Collection
                </Link>
                <Link
                  href="/sustainability"
                  className="rounded-full border border-stone-600 px-8 py-3.5 text-sm font-semibold text-stone-200 hover:bg-stone-800 transition-all"
                >
                  Our Green Process
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-700/60 bg-stone-800 shadow-xl group">
                    <Image
                      src="/products/soup-bowl-250-ml.jpg"
                      alt="Rice Husk Soup Bowl"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-medium text-white">Soup Bowl 250 ml</span>
                    </div>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-700/60 bg-stone-800 shadow-xl group">
                    <Image
                      src="/products/romano-planter.jpg"
                      alt="Romano Planter"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-medium text-white">Romano Planter</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-6">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-700/60 bg-stone-800 shadow-xl group">
                    <Image
                      src="/products/eco-spring-insulated-bottle.jpg"
                      alt="Eco Spring Insulated Bottle"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-medium text-white">Insulated Bottle</span>
                    </div>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-700/60 bg-stone-800 shadow-xl group">
                    <Image
                      src="/products/canister-700-ml.jpg"
                      alt="Rice Husk Canister"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs font-medium text-white">Canister 700 ml</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
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