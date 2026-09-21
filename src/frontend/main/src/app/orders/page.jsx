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
  X,
  MapPin,
  Tag,
  ExternalLink,
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

// ── Customer Order Detail Modal (Popup) ──────────────────────────
function CustomerOrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const addr = order.shippingAddress || {};
  const shipping = order.shippingDetails || {};
  const totalItems = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h3
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)" }}
            >
              Order Details
            </h3>
            <p className="text-xs font-mono text-gray-500 mt-0.5">
              #{order.easebuzzOrderId || order._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Payment Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.orderStatus} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Placed on {formatDate(order.createdAt)}
            </div>
          </div>

          {/* Ordered Items List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-green-600" />
              Ordered Items ({totalItems})
            </h4>
            <div className="space-y-3">
              {(order.items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {item.colorName && (
                        <div className="flex items-center gap-1">
                          {item.colorHex && (
                            <div
                              className="h-3 w-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span className="font-medium text-gray-700">{item.colorName}</span>
                          <span>•</span>
                        </div>
                      )}
                      <span>Qty: {item.quantity}</span>
                      <span>•</span>
                      <span>@ {formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/60 to-emerald-50/40 p-4 sm:p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-green-900 mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-green-700" />
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-green-200/80 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Total Paid</span>
                <span className="text-xl text-green-700 font-extrabold">{formatPrice(order.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-green-600" />
              Delivery Address
            </h4>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs sm:text-sm text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{addr.fullName || "Customer"}</p>
              {addr.companyName && <p className="text-gray-500">{addr.companyName}</p>}
              <p>{addr.streetAddress}</p>
              {addr.landmark && <p className="text-gray-500">Landmark: {addr.landmark}</p>}
              <p className="font-medium text-gray-800">
                {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <div className="pt-2 mt-2 border-t border-gray-200/60 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                {addr.phone && <p>📞 {addr.phone}</p>}
                {addr.email && <p>✉️ {addr.email}</p>}
              </div>
            </div>
          </div>

          {/* Tracking Details (if available) */}
          {(shipping.trackingNumber || shipping.courierName || shipping.trackingUrl) && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-700" />
                Live Tracking Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {shipping.courierName && (
                  <div>
                    <span className="text-gray-500">Courier:</span>{" "}
                    <span className="font-semibold text-gray-900">{shipping.courierName}</span>
                  </div>
                )}
                {shipping.trackingNumber && (
                  <div>
                    <span className="text-gray-500">AWB Code:</span>{" "}
                    <span className="font-mono font-bold text-purple-800">{shipping.trackingNumber}</span>
                  </div>
                )}
              </div>
              {shipping.trackingUrl && (
                <a
                  href={shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Track Live on Courier Portal →
                </a>
              )}
            </div>
          )}

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-green-600" />
                Status Timeline
              </h4>
              <ol className="relative border-l-2 border-green-200 ml-2 space-y-4 pl-4 text-xs">
                {order.statusHistory.map((history, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.35rem] top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                    <p className="font-bold text-gray-900 capitalize text-sm">
                      {history.status}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(history.timestamp)}
                    </p>
                    {history.note && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        {history.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Invoice Download Button */}
          {order.invoiceUrl && (
            <div className="pt-2">
              <a
                href={order.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                Download Tax Invoice
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order, onViewDetails }) {
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
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-95 cursor-pointer shadow-sm"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
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
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      <div className="relative overflow-hidden bg-linear-to-br from-green-600 to-green-700">
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
              <OrderCard
                key={order._id}
                order={order}
                onViewDetails={setSelectedOrder}
              />
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

      {/* ── Order Detail Modal (Popup) ── */}
      <AnimatePresence>
        {selectedOrder && (
          <CustomerOrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
