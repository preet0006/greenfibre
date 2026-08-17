"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useProductStore from "@/store/useProductStore";
import useReviewStore from "@/store/useReviewStore";
import useCartStore from "@/store/useCartStore";
import useWishlistStore from "@/store/useWishlistStore";
import useUserStore from "@/store/useUserStore";
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

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ review }) {
  const [showAllImages, setShowAllImages] = useState(false);

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
          {review.comment && (
            <p className="mb-3 text-sm leading-relaxed text-gray-700">
              {review.comment}
            </p>
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
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="mb-3 text-gray-700">Sign in to write a review</p>
        <Link
          href="/login"
          className="inline-flex rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
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
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
  const pct = discountPct(product.originalPrice, product.discountedPrice);
  const imgSrc =
    product.mainImage ||
    product.colors?.[0]?.images?.[0]?.card ||
    product.colors?.[0]?.images?.[0]?.original;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
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
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {pct}% OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs text-gray-500">{product.category?.name}</p>
        <h4 className="mb-2 text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-green-600">
            {formatPrice(product.discountedPrice)}
          </span>
          {pct > 0 && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

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
  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addToCart);
  const cartLoading = useCartStore((s) => s.loading);

  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishLoading, setWishLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product
  useEffect(() => {
    if (slug) {
      fetchSingleProduct(slug);
      fetchRelatedProducts(slug);
    }
    return () => {
      clearSingleProduct();
    };
  }, [slug]);

  // Fetch reviews when product loaded
  useEffect(() => {
    if (singleProduct?._id) {
      fetchProductReviews(singleProduct._id);
    }
    return () => clearReviews();
  }, [singleProduct?._id]);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedColor(0);
    setSelectedImage(0);
    setQuantity(1);
  }, [singleProduct?._id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!singleProduct) {
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

  const product = singleProduct;
  const pct = discountPct(product.originalPrice, product.discountedPrice);
  const currentColor = product.colors?.[selectedColor];
  const images = currentColor?.images || [];
  const inStock = currentColor?.stock > 0;
  const isWishlisted = wishlist.some(
    (item) => item._id === product._id || item.productId === product._id,
  );

  const handleAddToCart = async () => {
    if (!inStock) return;

    await addToCart({
      productId: product._id,
      colorIndex: selectedColor,
      quantity,
      product,
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
      product,
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
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50 mt-14">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/shop"
              className="hover:text-green-600 transition-colors"
            >
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link
                  href={`/shop?category=${product.category._id}`}
                  className="hover:text-green-600 transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium line-clamp-1">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              {images[selectedImage] ? (
                <img
                  src={
                    images[selectedImage].original || images[selectedImage].card
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === idx
                        ? "border-green-600 ring-2 ring-green-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
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
          </motion.div>

          {/* Info */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Category & Name */}
            <div>
              {product.category && (
                <p className="mb-2 text-sm font-medium text-green-600">
                  {product.category.name}
                </p>
              )}
              <h1
                className="text-4xl font-semibold text-gray-900"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.averageRating || 0} size="md" />
              <span className="text-sm text-gray-600">
                {product.averageRating || 0} ({product.reviewCount || 0}{" "}
                {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(product.discountedPrice)}
              </span>
              {pct > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">
                    {pct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Description
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Color: {currentColor?.name}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedColor(idx);
                        setSelectedImage(0);
                      }}
                      className={`group relative flex items-center gap-2 rounded-xl border-2 px-4 py-2 transition-all ${
                        selectedColor === idx
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="h-6 w-6 rounded-full border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          selectedColor === idx
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {color.name}
                      </span>
                      {selectedColor === idx && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {inStock && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Quantity
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-200 text-gray-700 transition-colors hover:border-gray-300"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-lg font-semibold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(currentColor?.stock || 1, quantity + 1),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-200 text-gray-700 transition-colors hover:border-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cartLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!inStock || cartLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-600 bg-white px-6 py-4 text-base font-semibold text-green-700 transition-all hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Buy Now
              </button>

              <button
                onClick={handleWishlist}
                disabled={wishLoading}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 shadow-sm transition-all disabled:opacity-50 ${
                  isWishlisted
                    ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`h-6 w-6 ${isWishlisted ? "fill-current" : ""}`}
                />
              </button>
            </div>

            {/* Features */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Truck, text: "Free Shipping" },
                { icon: RefreshCw, text: "Easy Returns" },
                { icon: ShieldCheck, text: "Secure Checkout" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <Icon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
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
        <div className="mt-20">
          <h2
            className="mb-8 text-3xl font-semibold text-gray-900"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Customer Reviews
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Reviews List */}
            <div>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">No reviews yet</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Be the first to review this product
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Write a Review
                </h3>
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
          <div className="mt-20">
            <h2
              className="mb-8 text-3xl font-semibold text-gray-900"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              You May Also Like
            </h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
