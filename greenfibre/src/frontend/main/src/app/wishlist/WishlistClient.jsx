"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useWishlistStore from "@/store/useWishlistStore";
import useUserStore from "@/store/useUserStore";
import useCartStore from "@/store/useCartStore";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  ArrowRight,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function discountPct(orig, disc) {
  if (!orig || !disc || orig <= disc) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// ── Variants ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-square animate-pulse bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="h-4 w-3/4 animate-pulse rounded-xl bg-gray-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ── Wishlist product card ─────────────────────────────────────
function WishlistCard({ product }) {
  const router = useRouter();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addToCart);
  const user = useUserStore((s) => s.user);

  const [removing, setRemoving] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const pct = discountPct(product.originalPrice, product.discountedPrice);
  const inStock =
    product.colors?.some((color) => color.stock > 0) || product.totalStock > 0;
  const imgSrc =
    product.mainImage ||
    product.colors?.[0]?.images?.[0]?.card ||
    product.colors?.[0]?.images?.[0]?.original;

  const handleRemove = async (e) => {
    e.preventDefault();
    setRemoving(true);
    await toggleWishlist(product._id);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!inStock) return;
    setCartLoading(true);
   await addToCart({
     productId: product._id,
     colorIndex: 0, // ✅ First color variant
     quantity: 1,
   });
    setCartLoading(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  return (
    <motion.div
      variants={fadeUp}
      layout
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.22 } }}
    >
      <Link
        href={`/shop/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Discount badge */}
          {pct > 0 && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              {pct}% OFF
            </span>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <span className="rounded-full bg-white border-2 border-red-500 px-4 py-1.5 text-xs font-bold text-red-500 shadow-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 text-red-500 shadow-sm transition-all hover:bg-red-50 hover:border-red-200 hover:scale-110 disabled:opacity-50"
            title="Remove from wishlist"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          {product.category?.name && (
            <span className="mb-1.5 text-xs font-medium text-gray-500">
              {product.category.name}
            </span>
          )}
          <h3 className="mb-2 flex-1 text-sm font-semibold leading-snug text-gray-900 line-clamp-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(product.discountedPrice)}
            </span>
            {pct > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || cartLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              inStock
                ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            {cartLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding...
              </>
            ) : addedToCart ? (
              <>
                <Check className="h-4 w-4" /> Added!
              </>
            ) : inStock ? (
              <>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </>
            ) : (
              "Out of Stock"
            )}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-24 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 border-2 border-green-100"
      >
        <Heart className="h-12 w-12 text-green-600" />
      </motion.div>
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900 mb-2"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Your Wishlist is Empty
        </h2>
        <p className="max-w-md text-gray-600">
          Save products you love by clicking the heart icon. They'll appear here
          for easy access anytime.
        </p>
      </div>
      <Link
        href="/shop"
        className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
      >
        Browse Products <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

// ── Not logged in state ───────────────────────────────────────
function NotLoggedIn() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-24 text-center"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 border-2 border-green-100">
        <Heart className="h-12 w-12 text-green-600" />
      </div>
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900 mb-2"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Sign In to View Your Wishlist
        </h2>
        <p className="max-w-md text-gray-600">
          Create an account or sign in to save and access your favorite
          sustainable products.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-green-600 hover:text-green-600"
        >
          Create Account
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function WishlistPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);
  const wishlist = useWishlistStore((s) => s.wishlist);
  const loading = useWishlistStore((s) => s.loading);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    if (authChecked && user) fetchWishlist();
  }, [authChecked, user]);

  const products = wishlist.filter((item) => item.name);

  const totalSavings = products.reduce((acc, p) => {
    return acc + Math.max(0, (p.originalPrice || 0) - (p.discountedPrice || 0));
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Wishlist</span>
          </div>

          {/* Header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-2"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                My Wishlist
              </h1>
              <p className="text-gray-600">
                {user && products.length > 0
                  ? `${products.length} saved ${products.length === 1 ? "item" : "items"}`
                  : "Your favorite sustainable products"}
              </p>
            </div>

            {user && !loading && products.length > 0 && totalSavings > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-4 py-2.5">
                <Heart className="h-5 w-5 text-green-600 fill-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Save up to ₹{totalSavings.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Not logged in */}
        {authChecked && !user && <NotLoggedIn />}

        {/* Loading skeletons */}
        {user && loading && (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty wishlist */}
        {user && !loading && products.length === 0 && <EmptyWishlist />}

        {/* Products grid */}
        {user && !loading && products.length > 0 && (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              >
                {products.map((product) => (
                  <WishlistCard key={product._id} product={product} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center"
            >
              <p className="text-gray-600">
                Looking for more sustainable products?
              </p>
              <Link
                href="/shop"
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
              >
                Continue Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
