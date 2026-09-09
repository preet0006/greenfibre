"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useCartStore from "@/store/useCartStore";
import useUserStore from "@/store/useUserStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import useCouponStore from "@/store/useCouponStore";
import useProductStore from "@/store/useProductStore";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Search,
  Package,
  LogOut,
  Settings,
  Heart,
  Tag,
  Truck,
  Leaf,
  Recycle,
  Loader2,
} from "lucide-react";

// ── Variants ──────────────────────────────────────────────────
const mobileMenuV = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } },
};
const dropdownV = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.14 } },
};
const megaV = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

// ── Marquee item ──────────────────────────────────────────────
function MarqueeItem({ icon: Icon, text, accent }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-10">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-2.5 w-2.5 text-white" />
      </span>
      <span className="text-xs font-medium tracking-wide text-white">
        {text}
      </span>
      {accent && (
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
          {accent}
        </span>
      )}
    </span>
  );
}

// ── Top marquee banner ────────────────────────────────────────
function MarqueeBanner({ coupons }) {
  const items = useMemo(() => {
    const base = [
      { icon: Truck, text: "Free shipping on all orders" },
      { icon: Leaf, text: "100% Sustainable Products" },
      { icon: Recycle, text: "Carbon Neutral Delivery" },
    ];
    coupons
      .filter(
        (c) =>
          c.isActive && (!c.expiryDate || new Date(c.expiryDate) > new Date()),
      )
      .forEach((c) => {
        base.push({
          icon: Tag,
          text:
            c.discountType === "percentage"
              ? `Use code for ${c.discountValue}% off`
              : `Use code for ₹${c.discountValue} off`,
          accent: c.code,
        });
      });
    return base;
  }, [coupons]);

  const doubled = [...items, ...items, ...items, ...items, ...items];
  const duration = items.length * 5;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 36,
        background: "linear-gradient(90deg, #15803d, #16a34a, #15803d)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
        style={{
          background: "linear-gradient(to right, #15803d, transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
        style={{ background: "linear-gradient(to left, #15803d, transparent)" }}
      />
      <motion.div
        className="flex h-full items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <MarqueeItem
            key={i}
            icon={item.icon}
            text={item.text}
            accent={item.accent}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ── Category mega-menu ────────────────────────────────────────
function MegaMenu({ categories, onClose }) {
  const roots = categories.filter((c) => c.isActive && !c.parentCategory);
  const getSubs = (id) =>
    categories.filter(
      (c) =>
        c.isActive && (c.parentCategory === id || c.parentCategory?._id === id),
    );

  if (!roots.length) return null;

  return (
    <motion.div
      variants={megaV}
      initial="hidden"
      animate="show"
      exit="exit"
      className="absolute left-1/2 top-full z-50 mt-px -translate-x-1/2 overflow-hidden rounded-b-2xl border border-t-0 border-gray-200 bg-white shadow-xl shadow-green-100/20"
      style={{ width: "min(680px, 90vw)" }}
      onMouseLeave={onClose}
    >
      <div
        className={`grid gap-px p-5 ${roots.length <= 2 ? "grid-cols-2" : roots.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
      >
        {roots.map((root) => {
          const subs = getSubs(root._id);
          return (
            <div key={root._id}>
              <Link
                href={`/shop?category=${root.slug || root._id}`}
                onClick={onClose}
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-green-50"
              >
                {root.image && (
                  <div className="h-15 w-15 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                      src={root.image.original}
                      alt={root.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <span
                  className="text-md font-semibold text-gray-900"
                  style={{
                    fontFamily:
                      "var(--font-cormorant,'Cormorant Garamond',serif)",
                  }}
                >
                  {root.name}
                </span>
              </Link>
              {subs.length > 0 && (
                <ul className="space-y-0.5 px-3 pb-1">
                  {subs.map((sub) => (
                    <li key={sub._id}>
                      <Link
                        href={`/shop?category=${root.slug || root._id}&subCategory=${sub.slug || sub._id}`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-1.5 text-md text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
        <Link
          href="/shop"
          onClick={onClose}
          className="text-sm font-semibold text-green-600 transition-colors hover:text-green-700"
        >
          Browse All Products →
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const userRef = useRef(null);
  const catRef = useRef(null);
  const searchRef = useRef(null);

  // ── Store selectors ──
  const cartCount = useCartStore((s) => s.getCartCount());
  const fetchCart = useCartStore((s) => s.fetchCart);
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);
  const logout = useUserStore((s) => s.logout);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const coupons = useCouponStore((s) => s.coupons);
  const fetchCoupons = useCouponStore((s) => s.fetchCoupons);

  const searchProducts = useProductStore((s) => s.searchProducts);
  const clearSearchResults = useProductStore((s) => s.clearSearchResults);
  const searchResults = useProductStore((s) => s.searchResults);
  const searchLoading = useProductStore((s) => s.searchLoading);

  useEffect(() => {
    fetchUser();
    fetchCategories();
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchCart();
  }, [authChecked, user]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQ("");
    clearSearchResults();
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    const q = searchQ.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setCatOpen(false);
    closeSearch();
  }, [pathname]);

  useEffect(() => {
    const fn = (e) => {
      if (userRef.current && !userRef.current.contains(e.target))
        setUserOpen(false);
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        closeSearch();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const q = searchQ.trim();
      if (q.length >= 2) {
        searchProducts(q, { limit: 5 });
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQ, searchProducts, clearSearchResults]);

  const activeCoupons = useMemo(
    () =>
      coupons.filter(
        (c) =>
          c.isActive && (!c.expiryDate || new Date(c.expiryDate) > new Date()),
      ),
    [coupons],
  );

  return (
    <>
      {/* ── Top green accent line ── */}
      <div
        className="fixed top-0 left-0 right-0 z-70 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #15803d 20%, #16a34a 40%, #22c55e 50%, #16a34a 60%, #15803d 80%, transparent 100%)",
        }}
      />

      {/* ── Marquee banner ── */}
      <div className="fixed left-0 right-0 z-60" style={{ top: 4 }}>
        <MarqueeBanner coupons={coupons} />
      </div>

      {/* ── Main navbar ── */}
      <header
        className={`fixed left-0 right-0 z-70 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-sm border-b border-gray-100"
            : "bg-white/95 backdrop-blur-sm"
        }`}
        style={{ top: 40 }}
      >
        <div className="mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center">
            <div className="relative h-16 w-32 sm:h-18 sm:w-36 md:h-22 md:w-22">
              <Image
                src="/logo-main.png" // Update with your actual logo
                alt="Green Fibre"
                fill
                priority
                className="object-contain object-left"
                sizes="160px"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Shop + mega menu */}
            <div className="relative" ref={catRef}>
              <button
                onMouseEnter={() => setCatOpen(true)}
                onClick={() => setCatOpen(!catOpen)}
                className={`flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/shop")
                    ? "bg-green-50 text-green-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                }`}
              >
                Shop
                <motion.span
                  animate={{ rotate: catOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
              <AnimatePresence>
                {catOpen && (
                  <MegaMenu
                    categories={categories}
                    onClose={() => setCatOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {[
              { label: "About", href: "/about" },
              { label: "Sustainability", href: "/sustainability" },
              { label: "Blogs", href: "/blogs" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-green-50 text-green-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => {
                  if (searchOpen) {
                    closeSearch();
                  } else {
                    setSearchOpen(true);
                    setSearchQ("");
                    clearSearchResults();
                  }
                }}
                aria-label={searchOpen ? "Close search" : "Open search"}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  searchOpen
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-green-600"
                }`}
              >
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <X className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="s"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <Search className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    variants={dropdownV}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute right-[-110] top-full z-50 mt-2 w-90 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                  >
                    {/* Search Input */}
                    <form
                      onSubmit={handleSearch}
                      className="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
                    >
                      <Search className="h-4 w-4 shrink-0 text-gray-400" />

                      <input
                        autoFocus
                        placeholder="Search sustainable products..."
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
                      />

                      {searchQ && (
                        <button
                          type="submit"
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          Search
                        </button>
                      )}
                    </form>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto">
                      {searchQ.trim().length > 0 &&
                        searchQ.trim().length < 2 && (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500">
                              Type at least 2 characters to search
                            </p>
                          </div>
                        )}

                      {searchLoading && searchQ.trim().length >= 2 && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        </div>
                      )}

                      {!searchLoading &&
                        searchQ.trim().length >= 2 &&
                        searchResults.length === 0 && (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-500">
                              No products found
                            </p>
                          </div>
                        )}

                      {!searchLoading &&
                        searchQ.trim().length >= 2 &&
                        searchResults.length > 0 &&
                        searchResults.slice(0, 5).map((product) => {
                          const image =
                            product.colors?.[0]?.images?.[0]?.thumbnail ||
                            product.colors?.[0]?.images?.[0]?.card ||
                            product.colors?.[0]?.images?.[0]?.original;

                          return (
                            <Link
                              key={product._id}
                              href={`/shop/${product.slug}`}
                              onClick={closeSearch}
                              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-green-50"
                            >
                              {/* Image */}
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                {image && (
                                  <Image
                                    src={image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {product.name}
                                </p>

                                {product.category?.name && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {product.category.name}
                                  </p>
                                )}

                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-sm font-bold text-green-600">
                                    ₹{product.discountedPrice}
                                  </span>

                                  {product.originalPrice >
                                    product.discountedPrice && (
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>

                    {/* Footer */}
                    {searchQ.trim().length >= 2 && searchResults.length > 0 && (
                      <div className="border-t border-gray-100 p-3">
                        <button
                          type="button"
                          onClick={handleSearch}
                          className="w-full rounded-xl bg-green-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          View All Results
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50 hover:text-green-600"
            >
              <ShoppingCart className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* User — desktop */}
            {user ? (
              <div className="relative hidden md:block" ref={userRef}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-all hover:border-green-600 hover:text-green-600"
                >
                  {user?.profile_image?.original ? (
                    <Image
                      src={user.profile_image?.original}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                      {user?.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-20 truncate">
                    {user?.full_name?.split(" ")[0]}
                  </span>
                  <motion.span
                    animate={{ rotate: userOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      variants={dropdownV}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Signed in as
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {user?.full_name}
                        </p>
                      </div>
                      {[
                        { icon: Package, label: "My Orders", href: "/orders" },
                        { icon: Heart, label: "Wishlist", href: "/wishlist" },
                        { icon: Settings, label: "Account", href: "/account" },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-600"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => {
                            setUserOpen(false);
                            logout(router);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 shrink-0" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition-all hover:bg-green-700 md:flex"
              >
                <User className="h-4 w-4" /> Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50 hover:text-green-600 md:hidden"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="m"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuV}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-x-4 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl md:hidden"
            style={{
              top: window.innerWidth < 768 ? 123 : 112,
            }}
          >
            {/* Inline search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
            >
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                placeholder="Search products…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />
              {searchQ.trim() && (
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Go
                </button>
              )}
            </form>

            {/* Nav links */}
            <div className="space-y-1 px-3 py-4">
              {[
                { label: "Shop", href: "/shop" },
                { label: "About", href: "/about" },
                { label: "Sustainability", href: "/sustainability" },
                { label: "Blogs", href: "/blogs" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={href}
                    className={`flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive(href)
                        ? "bg-green-50 text-green-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Active coupons */}
            {/* {activeCoupons.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Active Offers
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeCoupons.map((c) => (
                    <span
                      key={c._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                    >
                      <Tag className="h-3 w-3 shrink-0" />
                      {c.code}
                      <span className="font-medium text-green-600">
                        {c.discountType === "percentage"
                          ? `${c.discountValue}% off`
                          : `₹${c.discountValue} off`}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )} */}

            {/* Auth */}
            <div className="border-t border-gray-100 px-3 pb-3 pt-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    {user?.profile_image?.original ? (
                      <Image
                        src={user.profile_image?.original}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                        {user?.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {user?.full_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  {[
                    { icon: Package, label: "My Orders", href: "/orders" },
                    { icon: Heart, label: "Wishlist", href: "/wishlist" },
                    { icon: Settings, label: "Account", href: "/account" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                      {label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout(router);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 shrink-0" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  <User className="h-4 w-4" /> Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
