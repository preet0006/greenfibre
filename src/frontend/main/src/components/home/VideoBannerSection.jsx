"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import useBannerStore from "@/store/useBannerStore";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";

export default function VideoBannerSection() {
  const banners = useBannerStore((s) => s.banners);
  const loading = useBannerStore((s) => s.loading);
  const fetchBanners = useBannerStore((s) => s.fetchBanners);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);

  // Filter only active video banners
  const videoBanners = banners.filter(
    (b) => b.isActive && b.mediaType === "video",
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch((err) => {
        console.log("Autoplay prevented:", err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, currentIndex]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [currentIndex]);

  // Auto-advance to next video when current ends
  const handleVideoEnd = () => {
    if (videoBanners.length > 1) {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % videoBanners.length);
      setProgress(0);
    } else {
      // Loop single video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % videoBanners.length);
    setProgress(0);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? videoBanners.length - 1 : prev - 1,
    );
    setProgress(0);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="relative h-75 w-full overflow-hidden bg-gray-100 sm:h-100 lg:h-150">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  // No video banners
  if (videoBanners.length === 0) {
    return null;
  }

  const currentBanner = videoBanners[currentIndex];

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
    <section className="relative w-full overflow-hidden bg-gray-900">
      {/* Video Carousel */}
      <div className="relative h-75 w-full sm:h-100 lg:h-150">
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
            {/* Video Element */}
            <video
              ref={videoRef}
              src={currentBanner.mediaUrl}
              className="h-full w-full object-cover"
              muted={isMuted}
              playsInline
              loop={videoBanners.length === 1} // Only loop if single video
              onEnded={handleVideoEnd}
              preload="metadata"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

            {/* Banner Title & Category */}
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
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                        </span>
                        {currentBanner.category.name}
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

        {/* Navigation Arrows (only if multiple videos) */}
        {videoBanners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:h-12 sm:w-12 lg:left-8"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:h-12 sm:w-12 lg:right-8"
              aria-label="Next video"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Video Controls */}
        <div className="absolute bottom-20 right-6 z-10 flex gap-2 sm:bottom-24 sm:right-8 lg:bottom-28">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/20">
          <motion.div
            className="h-full bg-green-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Dot Indicators (only if multiple videos) */}
        {videoBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-8">
            {videoBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to video ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
