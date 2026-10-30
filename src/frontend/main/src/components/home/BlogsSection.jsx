"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useBlogStore from "@/store/useBlogStore";
import { ArrowRight, Clock, Calendar, Tag, Loader2, Leaf } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Blog Card ─────────────────────────────────────────────────
function BlogCard({ blog, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group h-full"
    >
      <Link
        href={`/blogs/${blog.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl"
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <Image
            src={blog.coverImage.medium}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Reading Time Badge */}
          {blog.readingTime && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                <Clock className="h-3.5 w-3.5" />
                {blog.readingTime} min read
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Date & Tags */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(blog.createdAt)}
            </div>
            {blog.tags?.length > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Tag className="h-3.5 w-3.5" />
                  {blog.tags[0].trim()}
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-green-600">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
            {blog.excerpt}
          </p>

          {/* Read More Link */}
          <div className="flex items-center gap-2 text-sm font-semibold text-green-600 transition-all group-hover:gap-3">
            Read More
            <ArrowRight className="h-4 w-4" />
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
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      <div className="aspect-video animate-pulse bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BlogsSection() {
  const blogs = useBlogStore((s) => s.blogs);
  const loading = useBlogStore((s) => s.loading);
  const fetchBlogs = useBlogStore((s) => s.fetchBlogs);

  useEffect(() => {
    // Fetch latest published blogs
    fetchBlogs({ isPublished: true, limit: 3 });
  }, []);

  // Filter published blogs
  const publishedBlogs = blogs.filter((b) => b.isPublished).slice(0, 3);

  // Don't show section if no blogs
  if (!loading && publishedBlogs.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-gray-50 to-white py-10 sm:py-20 lg:py-24">
      {/* Background Decoration */}
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 opacity-5">
        <Leaf className="h-full w-full text-green-600" />
      </div>

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
              From Our Blog
            </span>
          </div>

          <h2
            className="mb-2 text-[26px] font-semibold leading-[1.2] text-[#15352D] sm:mb-4 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Latest Insights
          </h2>

          <p className="mx-auto max-w-2xl text-[12px] leading-[1.5] text-gray-600 sm:text-lg">
            Explore sustainable living tips, eco-friendly practices, and the
            latest trends in green innovation
          </p>
        </motion.div>

        {/* Blogs Content */}
        {loading ? (
          <>
            {/* Mobile skeleton */}
            <div className="flex flex-col gap-3 sm:hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3.5 rounded-2xl border border-gray-200 bg-white p-3">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop skeleton */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile Blog Cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {publishedBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  href={`/blogs/${blog.slug}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-xs transition-shadow active:bg-gray-50"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {blog.coverImage?.medium || blog.coverImage?.original ? (
                      <Image
                        src={blog.coverImage.medium || blog.coverImage.original}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">
                      {blog.tags?.[0]?.trim() || "Sustainability"}
                    </span>
                    <h3 className="line-clamp-2 text-[14px] font-semibold leading-[1.35] text-gray-900">
                      {blog.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{formatDate(blog.createdAt)}</span>
                      {blog.readingTime && (
                        <>
                          <span>•</span>
                          <span>{blog.readingTime} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Grid: 100% Preserved */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedBlogs.map((blog, index) => (
                <BlogCard key={blog._id} blog={blog} index={index} />
              ))}
            </div>
          </>
        )}

        {/* View All Button */}
        {!loading && publishedBlogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-center sm:mt-12"
          >
            <Link
              href="/blogs"
              className="inline-flex h-[42px] items-center gap-2 rounded-full border border-green-600 bg-transparent px-6 text-xs font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white sm:h-auto sm:border-2 sm:px-8 sm:py-4 sm:text-base"
            >
              View All Articles
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
