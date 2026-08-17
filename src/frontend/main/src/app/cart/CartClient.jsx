"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/useCartStore";
import useCouponStore from "@/store/useCouponStore";
import useProductStore from "@/store/useProductStore";
import useUserStore from "@/store/useUserStore";
import {
  ShoppingCart,
  Trash2,
  Tag,
  ChevronRight,
  ArrowRight,
  Package,
  Loader2,
  Check,
  X,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Leaf,
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
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

// ── Empty cart ────────────────────────────────────────────────
function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 py-24 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl border border-green-100 bg-white shadow-sm"
      >
        <ShoppingCart className="h-9 w-9 text-green-600/25" />
      </motion.div>
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Your cart is empty
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
          Add eco-friendly products to your cart to see them here. Start your
          sustainable journey today.
        </p>
      </div>
      <Link
        href="/shop"
        className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
      >
        Browse Products <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

// ── Not logged in ─────────────────────────────────────────────
function NotLoggedIn() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 py-24 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-green-100 bg-white shadow-sm">
        <ShoppingCart className="h-9 w-9 text-green-600/25" />
      </div>
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Sign in to view your cart
        </h2>
        <p className="mt-2 max-w-xs text-sm text-gray-600">
          Sign in to access your saved cart and continue shopping.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
        >
          Create Account
        </Link>
      </div>
    </motion.div>
  );
}

// ── Cart item row ─────────────────────────────────────────────
function CartItem({ item }) {
  const updateCartItem = useCartStore((s) => s.updateCartItem);
  const removeCartItem = useCartStore((s) => s.removeCartItem);

  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const product = item.product;
  
  // Backend provides thumbnail and image fields for cart items
  // Priority: thumbnail > image > color variant images
  let imgSrc = product?.thumbnail || product?.image;
  
  // Fallback to color variant images if needed
  if (!imgSrc) {
    const colorVariant = product?.colors?.[item.colorIndex];
    const colorImages = colorVariant?.images;
    
    if (colorImages && colorImages.length > 0) {
      const firstImage = colorImages[0];
      if (typeof firstImage === 'string') {
        imgSrc = firstImage;
      } else {
        imgSrc = firstImage.card || firstImage.original || firstImage.medium;
      }
    }
  }
  
  // Final fallback
  imgSrc = imgSrc || product?.mainImage || null;
  
  const colorVariant = product?.colors?.[item.colorIndex];
  const inStock = colorVariant?.stock > 0;
  const pct = discountPct(product?.originalPrice, product?.discountedPrice);
  const lineTotal = (item.price || 0) * item.quantity;

  const handleQty = async (delta) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    
    // Check stock limit
    if (colorVariant && next > colorVariant.stock) {
      return;
    }
    
    setUpdating(true);
    await updateCartItem({ 
      productId: product._id, 
      colorIndex: item.colorIndex,
      quantity: next 
    });
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await removeCartItem(product._id, item.colorIndex);
    // no setRemoving(false) — item will exit
  };

  return (
    <motion.div
      variants={fadeUp}
      layout
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        transition: { duration: 0.25 },
      }}
      className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Image */}
      <Link
        href={`/shop/${product?.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:h-24 sm:w-24"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
        {pct > 0 && (
          <div className="absolute left-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {pct}% OFF
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0 gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product?.category?.name && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-0.5">
                {product.category.name}
              </p>
            )}
            <Link href={`/shop/${product?.slug}`}>
              <h3 className="text-sm font-semibold leading-snug text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                {product?.name}
              </h3>
            </Link>
            
            {/* Color variant */}
            {item.colorName && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {item.colorHex && (
                  <div
                    className="h-4 w-4 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
                <span className="text-xs font-medium text-gray-500">
                  {item.colorName}
                </span>
              </div>
            )}
            
            {/* Price per unit */}
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-green-600">
                {formatPrice(item.price)}
              </span>
              {pct > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product?.originalPrice)}
                </span>
              )}
            </div>
            
            {/* Stock status */}
            {!inStock && (
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                <AlertCircle className="h-3 w-3 shrink-0" /> Out of stock
              </div>
            )}
            {inStock && colorVariant && colorVariant.stock <= 5 && (
              <p className="mt-1 text-xs font-medium text-amber-600">
                Only {colorVariant.stock} left in stock
              </p>
            )}
          </div>

          {/* Remove */}
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Qty + line total */}
        <div className="flex items-center justify-between gap-3">
          {/* Qty stepper */}
          <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <button
              onClick={() => handleQty(-1)}
              disabled={updating || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-8 text-center text-sm font-bold text-gray-900">
              {updating ? (
                <Loader2 className="h-3 w-3 animate-spin mx-auto text-green-600" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => handleQty(1)}
              disabled={updating || !inStock || (colorVariant && item.quantity >= colorVariant.stock)}
              className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Line total */}
          <span className="text-sm font-bold text-green-600">
            {formatPrice(lineTotal)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Coupon input ──────────────────────────────────────────────
function CouponInput({ subtotal, onApply, onRemove, applied }) {
  const validateCoupon = useCouponStore((s) => s.validateCoupon);
  const actionLoading = useCouponStore((s) => s.actionLoading);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a coupon code");
      return;
    }
    setError("");

    const result = await validateCoupon({
      code: trimmed,
      orderAmount: subtotal,
    });
    if (!result) {
      setError("Invalid or expired coupon");
      return;
    }
    onApply({ code: trimmed, ...result });
    setCode("");
  };

  if (applied) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-700">
              {applied.code}
            </p>
            <p className="text-xs text-green-600">
              {applied.discountAmount
                ? `${formatPrice(applied.discountAmount)} discount applied`
                : "Coupon applied"}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-xl text-green-600 transition-colors hover:bg-green-100"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div
          className={`flex flex-1 items-center gap-2 rounded-xl border bg-white px-3 transition-all ${error ? "border-red-300" : "border-gray-200 hover:border-green-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100"}`}
        >
          <Tag className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="Enter coupon code"
            className="h-10 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleApply}
          disabled={actionLoading}
          className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </motion.button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs font-medium text-red-500"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Related product mini-card ─────────────────────────────────
function MiniProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const pct = discountPct(product.originalPrice, product.discountedPrice);
  const inStock = product.totalStock > 0;
  
  // Handle both string and object image formats
  let imgSrc = null;
  if (product.mainImage) {
    imgSrc = product.mainImage;
  } else if (product.colors?.[0]?.images?.[0]) {
    const firstImage = product.colors[0].images[0];
    if (typeof firstImage === 'string') {
      imgSrc = firstImage;
    } else {
      imgSrc = firstImage.card || firstImage.original || firstImage.medium;
    }
  }
  imgSrc = imgSrc || product.thumbnail || product.image || null;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    setLoading(true);
    await addToCart({
      productId: product._id,
      colorIndex: 0,
      quantity: 1,
      product,
    });
    setLoading(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-green-200 hover:shadow-md"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-gray-300" />
          </div>
        )}
        {pct > 0 && (
          <span className="absolute left-1 top-1 rounded bg-green-600 text-[8px] font-bold text-white px-1">
            {pct}%
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900">
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-bold text-green-600">
          {formatPrice(product.discountedPrice)}
        </p>
      </div>
      <button
        onClick={handleAdd}
        disabled={!inStock || loading}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all ${
          added
            ? "border-green-200 bg-green-50 text-green-600"
            : inStock
              ? "border-gray-200 bg-white text-gray-500 hover:bg-green-600 hover:border-green-600 hover:text-white"
              : "border-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : added ? (
          <Check className="h-3 w-3" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </button>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function UserCartPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const loading = useCartStore((s) => s.loading);
  const clearCart = useCartStore((s) => s.clearCart);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const [coupon, setCoupon] = useState(null); // { code, discountAmount, finalAmount }
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    if (!authChecked) return;
    fetchCart();
    if (!products.length) fetchProducts({});
  }, [authChecked, user]);

  // Pricing calculations
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0,
      ),
    [items],
  );
  
  const originalTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.product?.originalPrice || 0) * item.quantity,
        0,
      ),
    [items],
  );
  
  const productSavings = originalTotal - subtotal;
  const couponDiscount = coupon?.discountAmount || 0;
  const finalTotal = coupon?.finalAmount ?? subtotal - couponDiscount;

  const handleClearCart = async () => {
    setClearLoading(true);
    await clearCart();
    setClearLoading(false);
    setCoupon(null);
  };

  const handleCheckout = () => {
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }
    const qs = coupon?.code
      ? `?coupon=${encodeURIComponent(coupon.code)}&discount=${coupon.discountAmount || 0}`
      : "";
    router.push(`/checkout${qs}`);
  };

  // Related: products not already in cart
  const cartProductIds = new Set(items.map((i) => i.product?._id));
  const suggested = products
    .filter((p) => !cartProductIds.has(p._id) && p.totalStock > 0 && p.isActive)
    .slice(0, 6);

  const hasOutOfStock = items.some((i) => {
    const colorVariant = i.product?.colors?.[i.colorIndex];
    return !colorVariant || colorVariant.stock <= 0;
  });

  const showCart = authChecked;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-linear-to-br from-green-600 to-green-700">
        {/* Decorative pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        
        {/* Decorative leaf */}
        <div className="pointer-events-none absolute -right-10 -top-10 select-none opacity-[0.07]">
          <Leaf className="h-64 w-64 text-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-white/60">
            <Link href="/" className="hover:text-white/90 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white/90">Cart</span>
          </div>
          
          {/* Title */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Shopping Cart
              </p>
              <h1
                className="mt-2 text-4xl font-semibold text-white sm:text-5xl"
                style={{
                  fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                My Cart
              </h1>
            </div>
            {user && !loading && items.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <ShoppingCart className="h-4 w-4 text-white/80" />
                <span className="text-sm font-bold text-white">
                  {items.reduce((s, i) => s + i.quantity, 0)} item
                  {items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {!user && items.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p>
              You&apos;re shopping as a guest. Sign in at checkout to place your
              order — your cart is saved on this device.
            </p>
            <Link
              href="/login?redirect=/cart"
              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Loading */}
        {showCart && loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="h-20 w-20 animate-pulse rounded-xl bg-gray-100 sm:h-24 sm:w-24" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-4 w-full animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded-xl bg-gray-100" />
                  <div className="flex justify-between pt-2">
                    <div className="h-8 w-24 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty cart */}
        {showCart && !loading && items.length === 0 && <EmptyCart />}

        {/* Cart content */}
        {showCart && !loading && items.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* ── Left — cart items ── */}
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">
                  {items.length} product{items.length !== 1 ? "s" : ""} in your
                  cart
                </p>
                <button
                  onClick={handleClearCart}
                  disabled={clearLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                >
                  {clearLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Clear cart
                </button>
              </div>

              {/* Out-of-stock warning */}
              <AnimatePresence>
                {hasOutOfStock && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    Some items are out of stock and cannot be ordered.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Items list */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {items.map((item) => (
                    <CartItem key={`${item.product?._id}-${item.colorIndex}`} item={item} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Continue shopping */}
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-green-600 transition-opacity hover:opacity-70"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Continue
                Shopping
              </Link>

              {/* ── Suggested products ── */}
              {suggested.length > 0 && (
                <div className="mt-8 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      You might also like
                    </p>
                    <h3
                      className="mt-1 text-xl font-semibold text-gray-900"
                      style={{
                        fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                      }}
                    >
                      Complete Your Order
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {suggested.map((p) => (
                      <MiniProductCard key={p._id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right — order summary ── */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Coupon */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <Tag className="h-3.5 w-3.5" /> Coupon Code
                </p>
                <CouponInput
                  subtotal={subtotal}
                  applied={coupon}
                  onApply={(data) => setCoupon(data)}
                  onRemove={() => setCoupon(null)}
                />
              </div>

              {/* Price breakdown */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Order Summary
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({items.reduce((s, i) => s + i.quantity, 0)}{" "}
                      items)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {productSavings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Product discount</span>
                      <span className="font-semibold text-green-600">
                        −{formatPrice(productSavings)}
                      </span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">
                        Coupon ({coupon.code})
                      </span>
                      <span className="font-semibold text-green-600">
                        −{formatPrice(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        Total
                      </span>
                      <div className="text-right">
                        <span
                          className="text-2xl font-bold text-green-600"
                          style={{
                            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                          }}
                        >
                          {formatPrice(finalTotal)}
                        </span>
                        {productSavings + couponDiscount > 0 && (
                          <p className="text-xs font-semibold text-green-600">
                            You save{" "}
                            {formatPrice(productSavings + couponDiscount)}!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  disabled={hasOutOfStock}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {hasOutOfStock
                    ? "Remove out-of-stock items first"
                    : user
                      ? "Proceed to Checkout"
                      : "Sign in to Checkout"}
                </motion.button>

                {hasOutOfStock && (
                  <p className="mt-2 text-center text-xs text-red-500">
                    Remove out-of-stock items to checkout
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="space-y-2">
                {[
                  { icon: Truck, text: "Free delivery on all orders" },
                  { icon: RotateCcw, text: "Easy 10-day returns" },
                  { icon: ShieldCheck, text: "Secure & encrypted checkout" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}