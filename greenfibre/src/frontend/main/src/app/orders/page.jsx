"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useOrderStore from "@/store/useOrderStore";
import useUserStore from "@/store/useUserStore";
import {
  Package,
  Loader2,
  ChevronRight,
  Download,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ShoppingBag,
  Filter,
  Calendar,
  Leaf,
  Eye,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const configs = {
    placed: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: Clock,
      label: "Order Placed",
    },
    processing: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: Package,
      label: "Processing",
    },
    shipped: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: Truck,
      label: "Shipped",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: CheckCircle,
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: XCircle,
      label: "Cancelled",
    },
  };

  const config = configs[status] || configs.placed;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// ── Payment status badge ──────────────────────────────────────
function PaymentBadge({ status }) {
  const isPaid = status === "paid";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-gray-900">
                {order.easebuzzOrderId}
              </h3>
              <StatusBadge status={order.orderStatus} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(order.createdAt)}
              </span>
              <span>•</span>
              <span>
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span className="font-semibold text-green-600">
                {formatPrice(order.finalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {order.invoiceUrl && (
              <a
                href={order.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                title="Download Invoice"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/orders/${order._id}`}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Items Preview */}
      <div className="p-5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-gray-700"
        >
          <span>Order Items ({order.items.length})</span>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        <AnimatePresence>
          {expanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3"
            >
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  {item.image && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {item.colorName && (
                        <>
                          {item.colorHex && (
                            <div
                              className="h-3 w-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span>{item.colorName}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="flex -space-x-2">
              {order.items.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white bg-gray-100"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
              {order.items.length > 4 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white bg-gray-200 text-xs font-bold text-gray-600">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Shipping Info (if shipped) */}
        {order.orderStatus === "shipped" &&
          order.shippingDetails?.trackingNumber && (
            <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-3">
              <p className="mb-1 text-xs font-semibold text-purple-900">
                Tracking Information
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700">
                    {order.shippingDetails.courierName || "Courier"}
                  </p>
                  <p className="font-mono text-xs font-semibold text-purple-900">
                    {order.shippingDetails.trackingNumber}
                  </p>
                </div>
                {order.shippingDetails.trackingUrl && (
                  <a
                    href={order.shippingDetails.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-purple-700"
                  >
                    Track
                  </a>
                )}
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-green-100 bg-white shadow-sm">
        <ShoppingBag className="h-9 w-9 text-green-600/25" />
      </div>
      <h2
        className="text-2xl font-semibold text-gray-900"
        style={{
          fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
        }}
      >
        No Orders Yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        You haven't placed any orders yet. Start shopping to see your orders
        here.
      </p>
      <Link
        href="/shop"
        className="mt-6 flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700"
      >
        <ShoppingBag className="h-4 w-4" />
        Start Shopping
      </Link>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);

  const myOrders = useOrderStore((s) => s.myOrders);
  const pagination = useOrderStore((s) => s.pagination);
  const loading = useOrderStore((s) => s.loading);
  const fetchMyOrders = useOrderStore((s) => s.fetchMyOrders);

  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchMyOrders({
        page: currentPage,
        limit: 10,
        status: filterStatus === "all" ? undefined : filterStatus,
      });
    }
  }, [authChecked, user, currentPage, filterStatus]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const statusFilters = [
    { value: "all", label: "All Orders" },
    { value: "placed", label: "Placed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (!authChecked || (loading && myOrders.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-3 text-sm text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-br mt-14 from-green-600 to-green-700">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-10 select-none opacity-[0.07]">
          <Leaf className="h-64 w-64 text-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-white/60">
            <Link href="/" className="hover:text-white/90 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white/90">My Orders</span>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              Order History
            </p>
            <h1
              className="mt-2 text-4xl font-semibold text-white sm:text-5xl"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              My Orders
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {/* Filters */}
        {myOrders.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4" />
              Filter:
            </div>
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  filterStatus === filter.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-green-200 hover:bg-green-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* Orders List */}
        {loading && myOrders.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : myOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(pagination.pages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  Math.abs(page - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-green-600 text-white"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (Math.abs(page - currentPage) === 2) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.pages, p + 1))
              }
              disabled={currentPage === pagination.pages}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Summary Stats */}
        {myOrders.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <FileText className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {pagination.total}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {myOrders.filter((o) => o.orderStatus === "delivered").length}
              </p>
              <p className="text-sm text-gray-600">Delivered</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <Truck className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {myOrders.filter((o) => o.orderStatus === "shipped").length}
              </p>
              <p className="text-sm text-gray-600">In Transit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
