"use client";

import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCreative, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import useBannerStore from "@/store/useBannerStore";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Play,
  Pause,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import "swiper/css";
import "swiper/css/effect-creative";
import Hero3DSection from "./Hero3DSection";

export default function ImageBannerSection() {
  const banners = useBannerStore((s) => s.banners);
  const loading = useBannerStore((s) => s.loading);
  const fetchBanners = useBannerStore((s) => s.fetchBanners);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const swiperRef = useRef(null);

  // Filter only active image banners
  const imageBanners = banners.filter(
    (b) => b.isActive && b.mediaType === "image"
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="relative h-[360px] sm:h-[460px] md:h-[540px] lg:h-[620px] w-full overflow-hidden bg-emerald-50/40">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  // Fallback Hero with 3D 360 Bottle experience when no dynamic image banners exist
  if (imageBanners.length === 0) {
    return <Hero3DSection />;
  }

  return (
    <section className="relative w-full overflow-hidden bg-stone-950">
      {/* Main Banner Carousel with Swiper Creative Effect & enhanced hero height */}
      <div className="relative h-[360px] sm:h-[460px] md:h-[540px] lg:h-[620px] max-h-[85vh] w-full">
        <Swiper
          modules={[Autoplay, EffectCreative, Navigation]}
          effect="creative"
          speed={850}
          loop={imageBanners.length > 1}
          watchSlidesProgress={true}
          autoplay={
            isAutoPlaying
              ? {
                delay: 2600,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
              : false
          }
          creativeEffect={{
            prev: {
              shadow: false,
              translate: ["-10%", 0, -1],
              scale: 1.04,
              opacity: 0,
            },
            next: {
              translate: ["100%", 0, 0],
            },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          className="h-full w-full [transform:translate3d(0,0,0)]"
        >
          {imageBanners.map((banner, index) => {
            const desktopSrc =
              banner.mediaUrl?.desktop ||
              banner.mediaUrl?.original ||
              (typeof banner.mediaUrl === "string" ? banner.mediaUrl : null) ||
              banner.imageUrl;

            const tabletSrc =
              banner.mediaUrl?.tablet || desktopSrc;

            const mobileSrc =
              banner.mediaUrl?.mobile || desktopSrc;

            return (
              <SwiperSlide key={banner._id || index}>
                <div className="relative h-full w-full overflow-hidden will-change-transform">
                  {/* Desktop Image */}
                  {desktopSrc && (
                    <div className="relative hidden h-full w-full lg:block">
                      <Image
                        src={desktopSrc}
                        alt={banner.title || "Green Fibre Banner"}
                        fill
                        priority={index === 0}
                        className="object-cover scale-[1.03] transition-transform duration-[900ms] ease-out"
                        sizes="100vw"
                      />
                    </div>
                  )}

                  {/* Tablet Image */}
                  {tabletSrc && (
                    <div className="relative hidden h-full w-full sm:block lg:hidden">
                      <Image
                        src={tabletSrc}
                        alt={banner.title || "Green Fibre Banner"}
                        fill
                        priority={index === 0}
                        className="object-cover scale-[1.03] transition-transform duration-[900ms] ease-out"
                        sizes="100vw"
                      />
                    </div>
                  )}

                  {/* Mobile Image */}
                  {mobileSrc && (
                    <div className="relative block h-full w-full sm:hidden">
                      <Image
                        src={mobileSrc}
                        alt={banner.title || "Green Fibre Banner"}
                        fill
                        priority={index === 0}
                        className="object-cover scale-[1.03] transition-transform duration-[900ms] ease-out"
                        sizes="100vw"
                      />
                    </div>
                  )}

                  {/* Cinematic Gradient Overlays */}
                  <div className="absolute inset-0 bg-stone-950/35 z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/35 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-transparent to-stone-950/20 z-10" />

                  {/* Banner Title & Category Overlay (Positioned Upper / Center) */}
                  <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20 z-20 pb-8 sm:pb-12">
                    <div className="mx-auto max-w-7xl w-full">
                      {banner.category && (
                        <Link
                          href={`/shop?category=${banner.category.slug}`}
                          className="inline-block"
                        >
                          <span className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-stone-900/75 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-stone-900/95 sm:text-sm shadow-md">
                            {banner.category.name}
                            <ChevronRightIcon className="h-4 w-4 text-emerald-400" />
                          </span>
                        </Link>
                      )}
                      {banner.title && (
                        <h2
                          className="mt-1 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white drop-shadow-xl uppercase leading-[1.04] max-w-4xl"
                          style={{
                            fontFamily:
                              "var(--font-cormorant, 'Cormorant Garamond', serif)",
                          }}
                        >
                          {banner.title}
                        </h2>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>



        {/* Auto-play Toggle (only show if multiple banners) */}
        {imageBanners.length > 1 && (
          <button
            onClick={() => {
              if (isAutoPlaying) {
                swiperRef.current?.autoplay?.stop();
                setIsAutoPlaying(false);
              } else {
                swiperRef.current?.autoplay?.start();
                setIsAutoPlaying(true);
              }
            }}
            className="absolute bottom-6 right-6 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/30 bg-stone-900/70 text-white backdrop-blur-md transition-all hover:bg-white hover:text-stone-950 hover:scale-105"
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
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {imageBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => swiperRef.current?.slideToLoop(index)}
                className={`h-2 rounded-full transition-all duration-400 ${index === activeIndex
                    ? "w-8 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
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