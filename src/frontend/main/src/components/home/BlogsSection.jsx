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
      viewport={{ once: true, margin: "-50px" }}
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
    <section className="relative overflow-hidden bg-linear-to-b from-gray-50 to-white py-16 sm:py-20 lg:py-24">
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
          className="mb-12 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              From Our Blog
            </span>
          </div>

          <h2
            className="mb-4 text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Latest Insights
          </h2>

          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Explore sustainable living tips, eco-friendly practices, and the
            latest trends in green innovation
          </p>
        </motion.div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {publishedBlogs.map((blog, index) => (
              <BlogCard key={blog._id} blog={blog} index={index} />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && publishedBlogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 bg-transparent px-8 py-4 font-semibold text-green-600 transition-all hover:bg-green-600 hover:text-white"
            >
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
