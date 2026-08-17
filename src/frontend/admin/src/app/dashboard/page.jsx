"use client";

import { useEffect } from "react";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import useDashboardStore from "@/store/useDashboardStore";
import {
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Tag,
  ImageIcon,
  Video,
  Star,
  Ticket,
  Boxes,
  ShoppingCart,
  Settings,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────
const QUICK_LINKS = [
  {
    label: "Products",
    href: "/dashboard/products",
    icon: Package,
    color: "#15803d",
    bg: "#dcfce7",
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    color: "#16a34a",
    bg: "#d1fae5",
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    label: "Blog",
    href: "/dashboard/blog",
    icon: FileText,
    color: "#059669",
    bg: "#d1fae5",
  },
  {
    label: "Coupons",
    href: "/dashboard/coupons",
    icon: Ticket,
    color: "#14532d",
    bg: "#dcfce7",
  },
  {
    label: "Gallery",
    href: "/dashboard/gallery",
    icon: ImageIcon,
    color: "#0891b2",
    bg: "#cffafe",
  },
  {
    label: "Banners",
    href: "/dashboard/banners",
    icon: Tag,
    color: "#c62828",
    bg: "#ffebee",
  },
  {
    label: "Shop Video",
    href: "/dashboard/shop-video",
    icon: Video,
    color: "#1565c0",
    bg: "#e3f2fd",
  },
  {
    label: "Reviews",
    href: "/dashboard/reviews",
    icon: Star,
    color: "#f9a825",
    bg: "#fffde7",
  },
  {
    label: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    color: "#166534",
    bg: "#dcfce7",
  },
  {
    label: "Cart",
    href: "/dashboard/cart",
    icon: ShoppingCart,
    color: "#15803d",
    bg: "#d1fae5",
  },
  {
    label: "Page Settings",
    href: "/dashboard/page-settings",
    icon: Settings,
    color: "#f57c00",
    bg: "#fff3e0",
  },
];

const ORDER_STATUS_STYLE = {
  placed: {
    label: "Placed",
    color: "#7c3aed",
    bg: "#f5f3ff",
    dot: "bg-violet-500",
  },
  processing: {
    label: "Processing",
    color: "#d97706",
    bg: "#fffbeb",
    dot: "bg-amber-400",
  },
  shipped: {
    label: "Shipped",
    color: "#0284c7",
    bg: "#e0f2fe",
    dot: "bg-sky-500",
  },
  delivered: {
    label: "Delivered",
    color: "#16a34a",
    bg: "#f0fdf4",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fff1f2",
    dot: "bg-red-500",
  },
};

// ── Helpers ────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  ).getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 16) return "Good afternoon";
  if (hour >= 16 && hour < 21) return "Good evening";
  return "Good night";
}

function formatCurrency(n) {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(d) {
  if (!d) return "";
  const secs = Math.floor((Date.now() - new Date(d)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Skeleton ───────────────────────────────────────────────────
function Sk({ className }) {
  return (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  up,
  icon: Icon,
  color,
  bg,
  loading,
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200"
          style={{ background: bg }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {loading ? (
          <Sk className="w-14 h-6" />
        ) : change !== undefined ? (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
              up ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
            }`}
          >
            {up ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {up ? "+" : ""}
            {change}%
          </span>
        ) : null}
      </div>
      {loading ? (
        <>
          <Sk className="w-24 h-7 mb-2" />
          <Sk className="w-20 h-4" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 leading-none mb-1">
            {value}
          </p>
          <p className="text-xs text-gray-400 font-medium">{label}</p>
        </>
      )}
    </div>
  );
}

// ── Order status breakdown ─────────────────────────────────────
function OrderBreakdown({ byStatus, total, loading }) {
  if (loading) {
    return (
      <div className="space-y-3 pt-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Sk className="w-2 h-2 rounded-full" />
            <Sk className="flex-1 h-3" />
            <Sk className="w-7 h-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-1">
      {Object.entries(ORDER_STATUS_STYLE).map(([status, s]) => {
        const count = byStatus?.[status] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={status} className="flex items-center gap-3">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <p className="text-xs text-gray-600 font-medium w-20 shrink-0">
              {s.label}
            </p>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: s.color }}
              />
            </div>
            <span className="text-xs font-bold text-gray-700 w-6 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { admin } = useUserStore();
  const { stats, recentOrders, loading, fetchDashboardStats } =
    useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const STAT_CARDS = [
    {
      label: "Total Revenue",
      value: loading ? "—" : formatCurrency(stats?.revenue?.total ?? 0),
      change: stats?.revenue?.change,
      up: stats?.revenue?.up,
      icon: IndianRupee,
      color: "#15803d",
      bg: "#dcfce7",
    },
    {
      label: "Total Orders",
      value: loading
        ? "—"
        : (stats?.orders?.total ?? 0).toLocaleString("en-IN"),
      change: stats?.orders?.change,
      up: stats?.orders?.up,
      icon: ShoppingBag,
      color: "#16a34a",
      bg: "#d1fae5",
    },
    {
      label: "Total Users",
      value: loading ? "—" : (stats?.users?.total ?? 0).toLocaleString("en-IN"),
      change: stats?.users?.change,
      up: stats?.users?.up,
      icon: Users,
      color: "#0284c7",
      bg: "#e0f2fe",
    },
    {
      label: "Active Products",
      value: loading
        ? "—"
        : (stats?.products?.total ?? 0).toLocaleString("en-IN"),
      icon: Package,
      color: "#059669",
      bg: "#d1fae5",
    },
  ];

  return (
    <div className="space-y-7">
      {/* ── Welcome banner ── */}
      <div
        className="relative rounded-3xl overflow-hidden px-7 py-6 md:px-10 md:py-8"
        style={{
          background:
            "linear-gradient(135deg, #14532d 0%, #15803d 45%, #16a34a 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #22c55e, transparent)",
            transform: "translate(30%,-30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #4ade80, transparent)",
            transform: "translateY(40%)",
          }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none">
          <defs>
            <pattern
              id="wdots"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wdots)" />
        </svg>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-green-200 text-xs font-medium tracking-widest uppercase">
              Admin Panel
            </span>
            <h2
              className="text-2xl md:text-3xl font-light text-white mt-1 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {getGreeting()},{" "}
              <span>{admin?.full_name || "Admin"}</span>
            </h2>
            <p className="text-green-200 text-sm">
              Here&apos;s what&apos;s happening at Green Fibre today.
            </p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 self-start sm:self-auto"
          >
            View Orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Recent Orders
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest 8 orders</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-semibold text-green-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                  <Sk className="w-8 h-8 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="w-28 h-3.5" />
                    <Sk className="w-36 h-3" />
                  </div>
                  <Sk className="w-16 h-5 hidden sm:block" />
                  <Sk className="w-20 h-6" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <ShoppingBag className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => {
                const s =
                  ORDER_STATUS_STYLE[order.orderStatus] ||
                  ORDER_STATUS_STYLE.placed;
                const userName = order.user?.full_name || "Unknown";
                return (
                  <div
                    key={order._id}
                    className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: "#dcfce7", color: "#15803d" }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-none font-mono">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {userName}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block shrink-0">
                      <p className="text-sm font-bold text-gray-800">
                        ₹{order.finalAmount?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1.5"
                      style={{ color: s.color, background: s.bg }}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`}
                      />
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Order breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                Orders by Status
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {loading ? "—" : `${stats?.orders?.total ?? 0} total`}
              </p>
            </div>
            <div className="px-5 py-4">
              <OrderBreakdown
                byStatus={stats?.orders?.byStatus}
                total={stats?.orders?.total ?? 0}
                loading={loading}
              />
            </div>
          </div>

          {/* Quick access */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                Quick Access
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Jump to any module</p>
            </div>
            <div className="p-3.5 grid grid-cols-3 gap-2">
              {QUICK_LINKS.map(({ label, href, icon: Icon, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:scale-105 transition-all duration-200 group"
                  style={{ background: bg + "88" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ background: bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}