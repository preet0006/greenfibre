"use client";

import { useEffect, useState, useMemo } from "react";
import useCartStore from "@/store/useCartStore";
import Image from "next/image";
import {
  ShoppingCart,
  Loader2,
  Search,
  X,
  RefreshCw,
  Package,
  IndianRupee,
  Tag,
  Hash,
  Clock,
  ChevronDown,
  ChevronUp,
  Palette,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(d) {
  if (!d) return "";
  const secs = Math.floor((Date.now() - new Date(d)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Expandable cart row ────────────────────────────────────────
function CartRow({ cart, index }) {
  const [expanded, setExpanded] = useState(false);
  const user = cart.user || {};
  const userName = user.full_name || "Unknown User";
  const userInitial = userName.charAt(0).toUpperCase();
  const itemCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
        expanded
          ? "border-green-200 shadow-green-100/60"
          : "border-gray-100 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* ── Summary row ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-xs font-bold text-gray-300 w-5 shrink-0 text-center">
          {index + 1}
        </span>

        {user.profile_image ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-green-100 shrink-0">
            <Image
              src={user.profile_image}
              alt={userName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "#dcfce7", color: "#15803d" }}
          >
            {userInitial}
          </div>
        )}

        {/* User info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {userName}
          </p>
          <p className="text-xs text-gray-400 truncate">{user.email || "—"}</p>
        </div>

        {/* Products count */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50">
            <Package className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">
              {cart.items?.length || 0}
            </p>
            <p className="text-[10px] text-gray-400">items</p>
          </div>
        </div>

        {/* Qty */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50">
            <Hash className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">{itemCount}</p>
            <p className="text-[10px] text-gray-400">qty</p>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50">
            <IndianRupee className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">
              ₹{cart.totalAmount?.toLocaleString("en-IN") || 0}
            </p>
            <p className="text-[10px] text-gray-400">total</p>
          </div>
        </div>

        {/* Updated time */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-gray-400 shrink-0 min-w-17.5 justify-end">
          <Clock className="w-3 h-3" />
          {timeAgo(cart.updatedAt)}
        </div>

        {/* Chevron */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* ── Expanded items ── */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Cart Items ({cart.items?.length || 0})
          </p>
          <div className="space-y-2.5">
            {cart.items?.map((item, i) => {
              const product = item.product || {};
              const name = product.name || "Unknown Product";
              const img = product.thumbnail || product.image || null;
              const price = item.price;
              const subtotal = price * item.quantity;
              const stockWarning =
                item.availableStock !== undefined &&
                item.quantity > item.availableStock;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    stockWarning
                      ? "bg-amber-50 border-amber-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  {img ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <Image
                        src={img}
                        alt={name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {/* Color badge */}
                      {item.colorName && (
                        <div className="flex items-center gap-1.5">
                          {item.colorHex && (
                            <div
                              className="w-4 h-4 rounded-md border-2 border-gray-200"
                              style={{ background: item.colorHex }}
                            />
                          )}
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-green-100 text-green-700">
                            {item.colorName}
                          </span>
                        </div>
                      )}
                      <span className="text-[11px] text-gray-400 font-medium">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        @ ₹{price?.toLocaleString("en-IN")} each
                      </span>
                      {stockWarning && (
                        <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low stock ({item.availableStock} left)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">
                      ₹{subtotal?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-gray-400">subtotal</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last updated: {formatDate(cart.updatedAt)}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">
                Cart Total:
              </span>
              <span className="text-sm font-bold text-gray-900">
                ₹{cart.totalAmount?.toLocaleString("en-IN") || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function CartPage() {
  const { allCarts, loading, fetchAllCarts } = useCartStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAllCarts();
  }, []);

  // ── Filtered ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCarts;
    return allCarts.filter(
      (c) =>
        c.user?.full_name?.toLowerCase().includes(q) ||
        c.user?.email?.toLowerCase().includes(q),
    );
  }, [allCarts, search]);

  // ── Stats ──────────────────────────────────────────────────
  const totalItems = allCarts.reduce(
    (s, c) => s + (c.items?.reduce((sum, item) => sum + item.quantity, 0) || 0),
    0,
  );
  const totalValue = allCarts.reduce((s, c) => s + (c.totalAmount || 0), 0);
  const avgCartValue = allCarts.length
    ? Math.round(totalValue / allCarts.length)
    : 0;
  const totalCartItems = allCarts.reduce(
    (s, c) => s + (c.items?.length || 0),
    0,
  );

  // Count low stock warnings
  const lowStockCount = allCarts.reduce((count, cart) => {
    return (
      count +
      (cart.items?.filter(
        (item) =>
          item.availableStock !== undefined &&
          item.quantity > item.availableStock,
      ).length || 0)
    );
  }, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-light text-gray-900"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Cart Overview
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            View what customers have added to their carts
          </p>
        </div>
        <button
          onClick={() => fetchAllCarts()}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Stats ── */}
      {!loading && allCarts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Active Carts",
              value: allCarts.length,
              icon: ShoppingCart,
              color: "#15803d",
              bg: "#dcfce7",
            },
            {
              label: "Total Items",
              value: totalItems,
              icon: Hash,
              color: "#0284c7",
              bg: "#e0f2fe",
            },
            {
              label: "Total Value",
              value: `₹${totalValue.toLocaleString("en-IN")}`,
              icon: IndianRupee,
              color: "#16a34a",
              bg: "#d1fae5",
            },
            {
              label: "Avg Cart Value",
              value: `₹${avgCartValue.toLocaleString("en-IN")}`,
              icon: Tag,
              color: "#059669",
              bg: "#d1fae5",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-none">
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low stock warning */}
      {!loading && lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            <span className="font-bold">{lowStockCount}</span> cart item
            {lowStockCount > 1 ? "s have" : " has"} quantity exceeding available
            stock
          </p>
        </div>
      )}

      {/* ── Search ── */}
      {!loading && allCarts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium sm:ml-auto">
            Showing{" "}
            <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
            of {allCarts.length} carts
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
            style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Loading carts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
            <ShoppingCart className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {search ? "No carts match your search" : "No active carts found"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden sm:flex items-center gap-4 px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-5 text-center">#</span>
            <span className="w-10" />
            <span className="flex-1">Customer</span>
            <span className="w-20 text-center hidden sm:block">Items</span>
            <span className="w-16 text-center hidden md:block">Qty</span>
            <span className="w-24 text-right">Value</span>
            <span className="w-20 text-right hidden lg:block">Updated</span>
            <span className="w-7" />
          </div>

          <div className="space-y-3">
            {filtered.map((cart, i) => (
              <CartRow key={cart._id} cart={cart} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}