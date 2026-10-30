"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import useReviewStore from "@/store/useReviewStore";
import useCartStore from "@/store/useCartStore";
import useWishlistStore from "@/store/useWishlistStore";
import useUserStore from "@/store/useUserStore";
import useOrderStore from "@/store/useOrderStore";
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  Star,
  Package,
  Truck,
  ShieldCheck,
  RefreshCw,
  Check,
  X,
  Loader2,
  Camera,
  Send,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function discountPct(orig, disc) {
  if (!orig || !disc || orig <= disc) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// ── Variants ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = { show: { transition: { staggerChildren: 0.1 } } };

// ── Star Rating Display ───────────────────────────────────────
function StarRating({ rating, size = "sm" }) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ── Product Description with Mobile Read More ────────────────
function ProductDescription({ description }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const text = description || "";
  const isLong = text.length > 140;

  return (
    <div>
      <p
        className={`text-sm leading-[1.6] text-gray-600 ${
          !isExpanded ? "line-clamp-3 sm:line-clamp-none" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-xs font-semibold text-green-700 hover:text-green-800 underline underline-offset-2 sm:hidden"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ review }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const comment = review.comment || "";
  const isLong = comment.length > 130;

  return (
    <div className="border-b border-gray-100 py-6 last:border-b-0">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {review.user?.profile_image ? (
            <img
              src={review.user.profile_image}
              alt={review.user.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-500">
              {review.user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {review.user?.full_name || "Anonymous"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Comment */}
          {comment && (
            <div className="mb-3">
              <p
                className={`text-sm leading-relaxed text-gray-700 ${
                  !isExpanded ? "line-clamp-3 sm:line-clamp-none" : ""
                }`}
              >
                {comment}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 text-xs font-semibold text-green-700 hover:text-green-800 underline underline-offset-2 sm:hidden"
                >
                  {isExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(showAllImages ? review.images : review.images.slice(0, 3)).map(
                (img, idx) => (
                  <div
                    key={idx}
                    className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={img.thumbnail || img.original}
                      alt={`Review ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ),
              )}
              {review.images.length > 3 && !showAllImages && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  +{review.images.length - 3} more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review Form ───────────────────────────────────────────────
function ReviewForm({ productId, onSuccess }) {
  const user = useUserStore((s) => s.user);
  const createReview = useReviewStore((s) => s.createReview);
  const loading = useReviewStore((s) => s.actionLoading);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const handleImages = (files) => {
    const newImages = Array.from(files).slice(0, 5 - images.length);
    setImages([...images, ...newImages]);
    setPreviews([...previews, ...newImages.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      return;
    }

    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("rating", rating);
    if (comment) fd.append("comment", comment);
    images.forEach((img) => fd.append("images", img));

    const success = await createReview(fd);
    if (success) {
      setRating(0);
      setComment("");
      setImages([]);
      setPreviews([]);
      onSuccess?.();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50/70 p-6 text-center">
        <p className="font-semibold text-gray-900 text-sm">Sign in to write a review</p>
        <p className="mt-1 max-w-xs text-xs text-gray-500">
          Share your feedback and experience with verified buyers.
        </p>
        <Link
          href="/login"
          className="mt-3.5 inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-green-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your thoughts about this product..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base sm:text-sm outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>

      {/* Images */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Photos (Optional)
        </label>
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative h-20 w-20">
              <img
                src={preview}
                alt={`Preview ${idx + 1}`}
                className="h-full w-full rounded-lg border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-green-600 hover:bg-green-50 hover:text-green-600"
            >
              <Camera className="h-5 w-5" />
              <span className="mt-1 text-xs">Add</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImages(e.target.files)}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          You can upload up to 5 photos
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!rating || loading}
        className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Review
          </>
        )}
      </button>

      <p className="text-xs text-gray-500">
        Your review will be published after approval
      </p>
    </form>
  );
}

// ── Related Product Card ──────────────────────────────────────
function RelatedProductCard({ product }) {
  const originalPrice = Number(product.originalPrice) || Number(product.discountedPrice) || 0;
  const offerPrice = Math.round(originalPrice * 0.80);
  const imgSrc =
    product.mainImage ||
    product.colors?.[0]?.images?.[0]?.card ||
    product.colors?.[0]?.images?.[0]?.original;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block overflow-hidden rounded-[14px] sm:rounded-xl border border-gray-200 bg-white shadow-2xs transition-all hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50/80 flex items-center justify-center">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {/* Top Discount Badge */}
        <div className="absolute left-2 top-2 z-10">
          <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            20% OFF
          </span>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <p className="mb-0.5 sm:mb-1 text-[11px] sm:text-xs text-gray-500 truncate">{product.category?.name}</p>
        <h4 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h4>

        {/* Diwali Special Offer Tag */}
        <div className="mb-1.5 sm:mb-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-amber-900 shadow-2xs">
            <span>🪔</span>
            <span>Diwali Special</span>
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base font-bold text-green-600">
            {formatPrice(offerPrice)}
          </span>
          {originalPrice > offerPrice && (
            <span className="text-[11px] sm:text-xs text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ProductDetailClient({ slug, initialProduct }) {
  const router = useRouter();

  const singleProduct = useProductStore((s) => s.singleProduct);
  const relatedProducts = useProductStore((s) => s.relatedProducts);
  const loading = useProductStore((s) => s.loading);
  const fetchSingleProduct = useProductStore((s) => s.fetchSingleProduct);
  const fetchRelatedProducts = useProductStore((s) => s.fetchRelatedProducts);
  const clearSingleProduct = useProductStore((s) => s.clearSingleProduct);

  const reviews = useReviewStore((s) => s.reviews);
  const fetchProductReviews = useReviewStore((s) => s.fetchProductReviews);
  const clearReviews = useReviewStore((s) => s.clearReviews);

  const user = useUserStore((s) => s.user);
  const myOrders = useOrderStore((s) => s.myOrders);
  const fetchMyOrders = useOrderStore((s) => s.fetchMyOrders);
  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addToCart);
  const cartLoading = useCartStore((s) => s.loading);

  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishLoading, setWishLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Swipe navigation for mobile gallery
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const diffX = touchStartX.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0 && selectedImage < images.length - 1) {
          setSelectedImage((prev) => prev + 1);
        } else if (diffX < 0 && selectedImage > 0) {
          setSelectedImage((prev) => prev - 1);
        }
      }
    }
  };

  // Fetch product (keeps store in sync / picks up live updates after SSR paint)
  useEffect(() => {
    if (slug) {
      fetchSingleProduct(slug);
      fetchRelatedProducts(slug);
    }
    return () => {
      clearSingleProduct();
    };
  }, [slug]);

  // Fetch my orders silently if user is logged in to verify purchase history
  useEffect(() => {
    if (user && fetchMyOrders) {
      fetchMyOrders({ limit: 50 }, { silent: true });
    }
  }, [user]);

  // Fetch reviews when product loaded
  useEffect(() => {
    const productId = singleProduct?._id || initialProduct?._id;
    if (productId) {
      fetchProductReviews(productId);
    }
    return () => clearReviews();
  }, [singleProduct?._id, initialProduct?._id]);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedColor(0);
    setSelectedImage(0);
    setQuantity(1);
  }, [singleProduct?._id, initialProduct?._id]);

  // Use SSR data immediately; once the client store fetch resolves, it takes over
  const product = singleProduct || initialProduct;
  const isLoading = loading && !initialProduct;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-gray-900">
          Product not found
        </h1>
        <p className="max-w-md text-sm text-gray-600">
          This product may have been removed or the link is incorrect.
        </p>
        <Link
          href="/shop"
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const origPrice = Number(product.originalPrice) || 0;
  const discPrice = Number(product.discountedPrice) || 0;
  const hasDiscount = discPrice > 0 && origPrice > discPrice;
  const currentPrice = hasDiscount
    ? discPrice
    : (discPrice > 0 ? discPrice : (origPrice || Number(product.b2cPrice) || Number(product.price) || 0));
  const pct = hasDiscount ? discountPct(origPrice, discPrice) : 0;

  const currentColor = product.colors?.[selectedColor];
  const images = currentColor?.images || [];
  const currentStock = currentColor?.stock !== undefined
    ? Number(currentColor.stock)
    : Number(product.stockQuantity ?? product.totalStock ?? 0);
  const inStock = currentStock > 0;
  const isWishlisted = wishlist.some(
    (item) => item._id === product._id || item.productId === product._id,
  );
  const isVerifiedBuyer = Boolean(
    user &&
    myOrders?.some((order) =>
      order.items?.some(
        (item) =>
          (item.product?._id || item.product || item.productId) === product._id
      )
    )
  );

  const handleAddToCart = async () => {
    if (!inStock) return;

    await addToCart({
      productId: product._id,
      colorIndex: selectedColor,
      quantity,
      product: {
        ...product,
        price: currentPrice,
        discountedPrice: discPrice > 0 ? discPrice : currentPrice,
        originalPrice: origPrice > 0 ? origPrice : currentPrice,
      },
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = async () => {
    if (!inStock) return;
    await addToCart({
      productId: product._id,
      colorIndex: selectedColor,
      quantity,
      product: {
        ...product,
        price: currentPrice,
        discountedPrice: discPrice > 0 ? discPrice : currentPrice,
        originalPrice: origPrice > 0 ? origPrice : currentPrice,
      },
    });
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  const handleWishlist = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setWishLoading(true);
    await toggleWishlist(product._id);
    setWishLoading(false);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Product Details Main Section */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-2 items-start">
          {/* Images Section: Thumbnails on Left (desktop), Main Image on Top + Thumbnails Below (mobile) */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-col md:flex-row items-start gap-3 md:gap-4 lg:sticky lg:top-36"
          >
            {/* Thumbnails (desktop: left vertical column; mobile: bottom horizontal row) */}
            {images.length > 1 && (
              <div className="order-2 md:order-1 flex md:flex-col gap-2 sm:gap-2.5 overflow-x-auto md:overflow-y-auto no-scrollbar max-h-[500px] w-full md:w-auto shrink-0 pb-1 md:pb-0 scroll-smooth">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    onMouseEnter={() => setSelectedImage(idx)}
                    className={`relative h-15 w-15 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                      selectedImage === idx
                        ? "border-green-600 ring-2 ring-green-100 scale-102 shadow-xs"
                        : "border-gray-200 hover:border-green-400 opacity-75 hover:opacity-100"
                    }`}
                    title={`View Image ${idx + 1}`}
                  >
                    <img
                      src={img.thumbnail || img.card || img.original}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Viewport */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="order-1 md:order-2 relative aspect-square w-full flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 shadow-xs flex items-center justify-center select-none"
            >
              {images[selectedImage] ? (
                <img
                  src={
                    images[selectedImage].original || images[selectedImage].card
                  }
                  alt={product.name}
                  className="h-full w-full object-contain transition-all duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}

              {/* Discount Tag */}
              {pct > 0 && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-rose-600 px-2.5 sm:px-3 py-1 text-xs font-extrabold text-white shadow-md">
                  {pct}% OFF
                </span>
              )}

              {/* Floating Wishlist Button on Mobile (matches mockup) */}
              <button
                type="button"
                onClick={handleWishlist}
                disabled={wishLoading}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-gray-200/80 shadow-sm transition-all hover:scale-105 active:scale-95 md:hidden ${
                  isWishlisted
                    ? "text-red-600"
                    : "text-gray-600 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </motion.div>

          {/* Info & Action Column */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4 sm:space-y-5"
          >
            {/* Category, Title & Rating */}
            <div>
              {product.category && (
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  {product.category.name}
                </p>
              )}
              <h1
                className="mt-1 text-[26px] sm:text-3xl lg:text-4xl font-semibold text-gray-900 leading-[1.2] sm:leading-tight"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                {product.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                {product.reviewCount > 0 ? (
                  <>
                    <StarRating rating={product.averageRating || 0} size="sm" />
                    <span className="text-xs font-semibold text-gray-600">
                      {Number(product.averageRating).toFixed(1)} ({product.reviewCount}{" "}
                      {product.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <>
                    <StarRating rating={0} size="sm" />
                    <span className="text-xs font-medium text-gray-500">No reviews yet</span>
                  </>
                )}
                <span className="text-gray-300">•</span>
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 inline-block shrink-0" />
                    <span>in Stock</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-extrabold text-green-800">
                      {currentStock} available
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Out of Stock</span>
                  </span>
                )}
              </div>
            </div>

            {/* Special Offer Tag */}
            {pct > 0 && (
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900 shadow-2xs">
                  <span>🏷️</span>
                  <span>Special Offer: {pct}% OFF</span>
                </span>
              </div>
            )}

            {/* Price Row */}
            <div className="flex items-baseline gap-2.5 sm:gap-3 rounded-2xl bg-gray-50/80 border border-gray-150 p-3 sm:p-3.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-green-700">
                {formatPrice(currentPrice)}
              </span>
              {pct > 0 && (
                <>
                  <span className="text-sm sm:text-lg text-gray-400 line-through font-medium">
                    {formatPrice(origPrice)}
                  </span>
                  <span className="rounded-md bg-green-100 text-green-800 px-2 py-0.5 text-xs font-bold">
                    Save {pct}%
                  </span>
                </>
              )}
              <span className="ml-auto text-[11px] sm:text-xs text-gray-400">
                Inclusive of all taxes
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <ProductDescription description={product.description} />
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    Selected Color:{" "}
                    <span className="font-bold text-gray-900">
                      {currentColor?.name || "Natural"}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {currentStock > 0 ? (
                      <>
                        Stock: <span className="font-bold text-green-700">{currentStock}</span> units
                      </>
                    ) : (
                      <span className="font-bold text-rose-600">Out of Stock</span>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color, idx) => {
                    const colorStock = Number(color.stock ?? 0);
                    const isColorInStock = colorStock > 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedColor(idx);
                          setSelectedImage(0);
                        }}
                        className={`group relative flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 transition-all cursor-pointer ${
                          selectedColor === idx
                            ? "border-green-600 bg-green-50/80 ring-2 ring-green-100"
                            : isColorInStock
                            ? "border-gray-200 hover:border-gray-300 bg-white"
                            : "border-gray-200 bg-gray-50/70 opacity-60 hover:opacity-90"
                        }`}
                      >
                        <div
                          className="h-5 w-5 rounded-full border border-gray-300 shadow-2xs flex-shrink-0"
                          style={{ background: color.hex || "#e5e7eb" }}
                        />
                        <span
                          className={`text-xs font-bold ${
                            selectedColor === idx
                              ? "text-green-800"
                              : isColorInStock
                              ? "text-gray-700"
                              : "text-gray-400"
                          }`}
                        >
                          {color.name}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            selectedColor === idx
                              ? "text-green-700"
                              : isColorInStock
                              ? "text-gray-500"
                              : "text-rose-500"
                          }`}
                        >
                          ({colorStock})
                        </span>
                        {selectedColor === idx && (
                          <Check className="h-3.5 w-3.5 text-green-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Dual Action Buttons (Add to Cart & Buy Now) */}
            <div className="space-y-2.5 sm:space-y-3 pt-2">
              {inStock && currentStock <= 10 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                  <span>⚡</span>
                  <span>Only <strong className="font-extrabold text-amber-900">{currentStock}</strong> left in stock — order soon</span>
                </div>
              )}
              {!inStock && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800">
                  <span>✕</span>
                  <span>Currently out of stock in this option</span>
                </div>
              )}

              {/* Mobile Purchase Controls (< 768px): Row 1 (Stepper + Add to Cart), Row 2 (Full-width Buy Now) */}
              <div className="flex flex-col gap-2.5 md:hidden">
                <div className="flex items-center gap-2.5">
                  {/* Quantity Stepper */}
                  <div className="flex h-11 items-center justify-between rounded-xl border border-gray-300 bg-white px-2 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!inStock || quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">
                      {inStock ? quantity : 0}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          Math.min(currentStock || 1, quantity + 1),
                        )
                      }
                      disabled={!inStock || quantity >= currentStock}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={cartLoading || !inStock}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-all hover:bg-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cartLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : addedToCart ? (
                      <>
                        <Check className="h-4 w-4" />
                        Added to Cart!
                      </>
                    ) : !inStock ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>

                {/* Full-width Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={cartLoading || !inStock}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border-2 border-green-700 bg-white px-5 text-sm font-bold text-green-800 transition-all hover:bg-green-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!inStock ? "Unavailable" : "Buy Now"}
                </button>
              </div>

              {/* Desktop / Tablet Purchase Layout (>= 768px, 100% UNCHANGED) */}
              <div className="hidden md:flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-center rounded-xl border border-gray-300 bg-white px-2 py-1.5 shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock || quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-gray-900">
                    {inStock ? quantity : 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        Math.min(currentStock || 1, quantity + 1),
                      )
                    }
                    disabled={!inStock || quantity >= currentStock}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading || !inStock}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-green-700/20 transition-all hover:bg-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : addedToCart ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Cart!
                    </>
                  ) : !inStock ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </button>

                {/* Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={cartLoading || !inStock}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-green-700 bg-white px-5 py-3.5 text-sm font-bold text-green-800 transition-all hover:bg-green-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!inStock ? "Unavailable" : "Buy Now"}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={wishLoading}
                  title={isWishlisted ? "Saved" : "Save to Wishlist"}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
                    isWishlisted
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2">
              {[
                { icon: Truck, text: "Free Delivery" },
                { icon: RefreshCw, text: "Easy Returns" },
                { icon: ShieldCheck, text: "100% Food Safe" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-xl border border-gray-150 bg-gray-50/70 p-2 sm:p-2.5"
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-700 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 truncate">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features & Material Info */}
        {(Object.keys(product.features || {}).length > 0 ||
          Object.keys(product.materialInfo || {}).length > 0) && (
          <div className="mt-16">
            <h2
              className="mb-8 text-3xl font-semibold text-gray-900"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Product Details
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Features */}
              {Object.keys(product.features || {}).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Features
                  </h3>
                  <dl className="space-y-3">
                    {Object.entries(product.features).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                      >
                        <dt className="min-w-30 text-sm font-medium text-gray-500">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </dt>
                        <dd className="flex-1 text-sm text-gray-900">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Material Info */}
              {Object.keys(product.materialInfo || {}).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    Material Information
                  </h3>
                  <dl className="space-y-3">
                    {Object.entries(product.materialInfo).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                        >
                          <dt className="min-w-30 text-sm font-medium text-gray-500">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </dt>
                          <dd className="flex-1 text-sm text-gray-900">
                            {value}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-10 sm:mt-16 lg:mt-20">
          <h2
            className="mb-4 sm:mb-6 text-[22px] sm:text-2xl lg:text-3xl font-semibold text-gray-900"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Customer Reviews & Feedback
          </h2>

          <div className="grid gap-6 lg:grid-cols-2 items-stretch">
            {/* Reviews List Box (Left) */}
            <div className="flex h-full min-h-0 sm:min-h-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Verified Reviews ({reviews.length})
                </h3>
                {reviews.length > 0 && product.averageRating > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <StarRating rating={product.averageRating} size="sm" />
                    <span>{Number(product.averageRating).toFixed(1)} / 5</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50/70 py-6 px-4 text-center">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 text-green-700 mb-2">
                      <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-green-600 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">No reviews yet</p>
                    <p className="mt-1 text-xs text-gray-500 max-w-xs">
                      Be the first verified buyer to review this product
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Review Form Box (Right) */}
            <div className="flex h-full min-h-0 sm:min-h-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Write a Review
                </h3>
                {isVerifiedBuyer && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                    Verified Buyer
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <ReviewForm
                  productId={product._id}
                  onSuccess={() => fetchProductReviews(product._id)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16 lg:mt-20">
            <h2
              className="mb-4 sm:mb-8 text-[22px] sm:text-2xl lg:text-3xl font-semibold text-gray-900"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              You May Also Like
            </h2>
            <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <RelatedProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}