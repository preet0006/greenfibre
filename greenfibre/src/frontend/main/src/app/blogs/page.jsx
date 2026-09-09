"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useBlogStore from "@/store/useBlogStore";
import {
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react";

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const blogs = useBlogStore((s) => s.blogs);
  const loading = useBlogStore((s) => s.loading);
  const fetchBlogs = useBlogStore((s) => s.fetchBlogs);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlogs();
  }, []);

  // Extract all unique tags from blogs
  const allTags = blogs
    .filter((blog) => blog.isPublished)
    .flatMap((blog) => blog.tags || [])
    .filter((tag) => tag.trim())
    .reduce((acc, tag) => {
      const trimmed = tag.trim().toLowerCase();
      if (!acc.includes(trimmed)) acc.push(trimmed);
      return acc;
    }, []);

  // Filter blogs based on search and tag
  const filteredBlogs = blogs
    .filter((blog) => blog.isPublished)
    .filter((blog) => {
      const matchesSearch =
        searchQuery === "" ||
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === "" ||
        blog.tags?.some((tag) => tag.trim().toLowerCase() === selectedTag);

      return matchesSearch && matchesTag;
    });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
              Stories of Sustainability
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600 mb-8"
            >
              Discover insights, tips, and inspiration for living a more
              sustainable, eco-friendly lifestyle.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Tags Filter */}
        {allTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700">
                Filter by:
              </span>
              <button
                onClick={() => setSelectedTag("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === ""
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {allTags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        )}

        {/* No Results */}
        {!loading && filteredBlogs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-gray-600 mb-4">
              {searchQuery || selectedTag
                ? "No articles found matching your criteria."
                : "No articles available at the moment."}
            </p>
            {(searchQuery || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag("");
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Blog Grid */}
        {!loading && filteredBlogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, index) => (
              <motion.article
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative h-56 bg-gray-100 overflow-hidden">
                    {blog.coverImage?.medium || blog.coverImage?.original ? (
                      <Image
                        src={blog.coverImage.medium || blog.coverImage.original}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center">
                        <Tag className="w-12 h-12 text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      {blog.readingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{blog.readingTime} min read</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2
                      className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors"
                      style={{
                        fontFamily:
                          "var(--font-cormorant, 'Cormorant Garamond', serif)",
                      }}
                    >
                      {blog.title}
                    </h2>

                    {/* Excerpt */}
                    {blog.excerpt && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More Link */}
                    <div className="flex items-center gap-2 text-green-600 font-medium text-sm group-hover:gap-3 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredBlogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center text-sm text-gray-600"
          >
            Showing {filteredBlogs.length}{" "}
            {filteredBlogs.length === 1 ? "article" : "articles"}
            {(searchQuery || selectedTag) && " matching your criteria"}
          </motion.div>
        )}
      </div>
    </div>
  );
}
