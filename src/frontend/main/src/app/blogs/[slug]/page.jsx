"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useBlogStore from "@/store/useBlogStore";
import {
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  Share2,
  Loader2,
  User,
} from "lucide-react";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const singleBlog = useBlogStore((s) => s.singleBlog);
  const loading = useBlogStore((s) => s.loading);
  const fetchSingleBlog = useBlogStore((s) => s.fetchSingleBlog);
  const clearSingleBlog = useBlogStore((s) => s.clearSingleBlog);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      fetchSingleBlog(slug);
    }

    return () => {
      clearSingleBlog();
    };
  }, [slug]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: singleBlog?.title,
          text: singleBlog?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  // Not found state
  if (!loading && !singleBlog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Cover Image */}
      <div className="relative bg-gray-900">
        {/* Cover Image */}
        <div className="relative h-96 md:h-125 lg:h-150">
          {singleBlog?.coverImage?.large || singleBlog?.coverImage?.original ? (
            <Image
              src={
                singleBlog.coverImage.large || singleBlog.coverImage.original
              }
              alt={singleBlog.title}
              fill
              priority
              className="object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-green-600 to-green-800 opacity-60" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Blogs</span>
              </Link>
            </motion.div>

            {/* Tags */}
            {singleBlog?.tags && singleBlog.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-wrap gap-2 mb-4"
              >
                {singleBlog.tags.slice(0, 4).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/90 backdrop-blur-sm text-white rounded-full text-xs font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.trim()}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-4 leading-tight"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              {singleBlog?.title}
            </motion.h1>

            {/* Excerpt */}
            {singleBlog?.excerpt && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg text-white/90 mb-6 max-w-3xl"
              >
                {singleBlog.excerpt}
              </motion.p>
            )}

            {/* Meta Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-6 text-sm text-white/70"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(singleBlog?.createdAt)}</span>
              </div>
              {singleBlog?.readingTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{singleBlog.readingTime} min read</span>
                </div>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 hover:text-white transition-colors ml-auto"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="
    prose prose-lg max-w-none

    prose-headings:font-cormorant
    prose-headings:font-semibold
    prose-headings:text-gray-900

    prose-h1:text-5xl
    prose-h1:mb-8
    prose-h1:mt-10

    prose-h2:text-3xl
    prose-h2:mt-12
    prose-h2:mb-5
    prose-h2:border-b
    prose-h2:border-gray-200
    prose-h2:pb-2

    prose-h3:text-2xl
    prose-h3:mt-8
    prose-h3:mb-4

    prose-p:text-gray-700
    prose-p:leading-8
    prose-p:mb-6

    prose-a:text-green-600
    prose-a:no-underline
    hover:prose-a:underline

    prose-strong:text-gray-900
    prose-strong:font-semibold

    prose-ul:list-disc
    prose-ul:pl-6
    prose-ul:my-6

    prose-ol:list-decimal
    prose-ol:pl-6
    prose-ol:my-6

    prose-li:marker:text-green-600
    prose-li:mb-2

    prose-blockquote:border-l-4
    prose-blockquote:border-green-600
    prose-blockquote:pl-6
    prose-blockquote:italic
    prose-blockquote:text-gray-700

    prose-code:text-green-600
    prose-code:bg-green-50
    prose-code:px-2
    prose-code:py-1
    prose-code:rounded
    prose-code:text-sm

    prose-pre:bg-gray-900
    prose-pre:text-gray-100
    prose-pre:p-4
    prose-pre:rounded-xl
    prose-pre:overflow-x-auto

    prose-img:rounded-2xl
    prose-img:shadow-lg
    prose-img:my-8

    prose-hr:border-gray-200
    prose-hr:my-12
  "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="scroll-mt-24" {...props} />
              ),

              h2: ({ node, ...props }) => (
                <h2 className="scroll-mt-24" {...props} />
              ),

              h3: ({ node, ...props }) => (
                <h3 className="scroll-mt-24" {...props} />
              ),

              a: ({ node, ...props }) => (
                <a target="_blank" rel="noopener noreferrer" {...props} />
              ),

              code: ({ node, inline, className, children, ...props }) => {
                return inline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {singleBlog?.content || ""}
          </ReactMarkdown>
        </motion.div>

        {/* Additional Images */}
        {singleBlog?.images && singleBlog.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {singleBlog.images.map((img, idx) => (
              <div
                key={idx}
                className="relative h-64 rounded-2xl overflow-hidden shadow-lg"
              >
                <Image
                  src={img.original}
                  alt={`${singleBlog.title} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </motion.div>
        )}

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 pt-8 border-t border-gray-200"
        >
          <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100">
            <h3
              className="text-2xl font-semibold text-gray-900 mb-3"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Enjoyed this article?
            </h3>
            <p className="text-gray-600 mb-6">
              Share it with friends who care about sustainability!
            </p>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Article
            </button>
          </div>
        </motion.div>

        {/* Back to Blogs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>
        </motion.div>
      </article>
    </div>
  );
}
