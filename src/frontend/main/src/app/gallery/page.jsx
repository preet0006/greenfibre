"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import useGalleryStore from "@/store/useGalleryStore";
import {
  Loader2,
  Search,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const gallery = useGalleryStore((s) => s.gallery);
  const loading = useGalleryStore((s) => s.loading);
  const fetchGallery = useGalleryStore((s) => s.fetchGallery);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchGallery();
  }, []);

  // Filter active gallery items
  const filteredGallery = useMemo(() => {
    return gallery
      .filter((item) => item.isActive)
      .filter((item) => {
        if (!searchQuery) return true;

        return item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [gallery, searchQuery]);

  const openLightbox = (index) => {
    setSelectedImage(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "unset";
  };

  const showPrev = () => {
    setSelectedImage((prev) =>
      prev === 0 ? filteredGallery.length - 1 : prev - 1,
    );
  };

  const showNext = () => {
    setSelectedImage((prev) =>
      prev === filteredGallery.length - 1 ? 0 : prev + 1,
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage === null) return;

      if (e.key === "Escape") {
        closeLightbox();
      }

      if (e.key === "ArrowLeft") {
        showPrev();
      }

      if (e.key === "ArrowRight") {
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage, filteredGallery.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Sustainable Gallery
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 mb-8"
            >
              Explore moments, products, and collections inspired by sustainable
              living and eco-conscious craftsmanship.
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                placeholder="Search gallery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGallery.length === 0 && (
          <div className="text-center py-20">
            <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />

            <p className="text-lg text-gray-600 mb-4">
              {searchQuery
                ? "No images found matching your search."
                : "Gallery is currently empty."}
            </p>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Masonry Grid */}
        {!loading && filteredGallery.length > 0 && (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredGallery.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.05, 0.5),
                  }}
                  className="break-inside-avoid"
                >
                  <button
                    onClick={() => openLightbox(index)}
                    className="group relative overflow-hidden rounded-2xl bg-gray-100 w-full shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <Image
                      src={item.image?.medium || item.image?.original}
                      alt={item.title || "Gallery image"}
                      width={600}
                      height={800}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Title */}
                    {item.title && (
                      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm font-medium text-white drop-shadow-lg">
                          {item.title}
                        </p>
                      </div>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 text-center text-sm text-gray-500"
            >
              Showing {filteredGallery.length}{" "}
              {filteredGallery.length === 1 ? "image" : "images"}
            </motion.div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage !== null && filteredGallery[selectedImage] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-10"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-101 bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 text-white hover:bg-white/20 transition-all"
            aria-label="Close"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Navigation - Previous */}
          {filteredGallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              className="absolute left-2 sm:left-4 md:left-8 z-101 bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 text-white hover:bg-white/20 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-6xl w-full mt-35"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <Image
                src={
                  filteredGallery[selectedImage].image?.large ||
                  filteredGallery[selectedImage].image?.original
                }
                alt={filteredGallery[selectedImage].title || "Gallery image"}
                width={1600}
                height={1200}
                className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
                priority
              />
            </motion.div>

            {/* Caption */}
            {filteredGallery[selectedImage].title && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 text-center"
              >
                <p className="text-white text-base sm:text-lg font-medium">
                  {filteredGallery[selectedImage].title}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {selectedImage + 1} / {filteredGallery.length}
                </p>
              </motion.div>
            )}
          </div>

          {/* Navigation - Next */}
          {filteredGallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              className="absolute right-2 sm:right-4 md:right-8 z-101 bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 text-white hover:bg-white/20 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
