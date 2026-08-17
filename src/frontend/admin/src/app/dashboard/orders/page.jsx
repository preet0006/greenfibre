"use client";

import { useEffect, useState, useMemo } from "react";
import useOrderStore from "@/store/useOrderStore";
import Image from "next/image";
import {
  Package,
  Loader2,
  Search,
  X,
  RefreshCw,
  IndianRupee,
  Clock,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  Tag,
  FileText,
  ExternalLink,
  Copy,
  Calendar,
  Hash,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Filter,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Status configurations ──────────────────────────────────────
const ORDER_STATUS = {
  placed: {
    label: "Placed",
    color: "#0284c7",
    bg: "#e0f2fe",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: Clock,
  },
  shipped: {
    label: "Shipped",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "#16a34a",
    bg: "#d1fae5",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: XCircle,
  },
};

const PAYMENT_STATUS = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" },
  paid: { label: "Paid", color: "#16a34a", bg: "#d1fae5" },
  failed: { label: "Failed", color: "#ef4444", bg: "#fee2e2" },
};

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

// ── Order Detail Modal ─────────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const user = order.user || {};
  const addr = order.shippingAddress || {};
  const shipping = order.shippingDetails || {};
  const statusConfig = ORDER_STATUS[order.orderStatus] || ORDER_STATUS.placed;
  const paymentConfig =
    PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-green-100/60 border border-green-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h3
              className="text-xl font-semibold text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Order Details
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Order #{order.easebuzzOrderId || order._id?.slice(-8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status & Payment Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                Order Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: statusConfig.bg }}
                >
                  <statusConfig.icon
                    className="w-4 h-4"
                    style={{ color: statusConfig.color }}
                  />
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: statusConfig.color }}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                Payment Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: paymentConfig.bg }}
                >
                  <CreditCard
                    className="w-4 h-4"
                    style={{ color: paymentConfig.color }}
                  />
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: paymentConfig.color }}
                >
                  {paymentConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Subtotal
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{order.totalAmount?.toLocaleString("en-IN")}
                </p>
              </div>
              {order.discountAmount > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Discount
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    -₹{order.discountAmount?.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Final Amount
                </p>
                <p className="text-xl font-bold text-green-700">
                  ₹{order.finalAmount?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            {order.couponCode && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Coupon:{" "}
                  <span className="font-bold text-green-700">
                    {order.couponCode}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Customer Information
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user.full_name || addr.fullName || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user.email || addr.email || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user.phone || addr.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Shipping Address
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <p className="font-semibold">{addr.fullName}</p>
              {addr.companyName && (
                <p className="flex items-center gap-1.5 text-gray-500">
                  <Building2 className="w-3.5 h-3.5" />
                  {addr.companyName}
                </p>
              )}
              <p>{addr.streetAddress}</p>
              {addr.landmark && (
                <p className="text-gray-500">{addr.landmark}</p>
              )}
              <p>
                {addr.city}, {addr.state} - {addr.pincode}
              </p>
            </div>
          </div>

          {/* Shipping Details */}
          {shipping.trackingNumber && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-purple-50/30">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Shipping Information
              </p>
              <div className="space-y-2">
                {shipping.courierName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Courier</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {shipping.courierName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tracking Number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-gray-800">
                      {shipping.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(shipping.trackingNumber)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
                {shipping.trackingUrl && (
                  <a
                    href={shipping.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors mt-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Track Shipment
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="border border-gray-100 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Order Items ({order.items?.length || 0})
            </p>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  {item.image ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      <span className="text-xs text-gray-400">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-xs text-gray-400">
                        @ ₹{item.price?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">
                      ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-5">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Status History
              </p>
              <div className="space-y-3">
                {order.statusHistory.map((history, i) => {
                  const config =
                    ORDER_STATUS[history.status] || ORDER_STATUS.placed;
                  return (
                    <div key={i} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: config.bg }}
                      >
                        <config.icon
                          className="w-4 h-4"
                          style={{ color: config.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {config.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(history.timestamp)}
                        </p>
                        {history.note && (
                          <p className="text-xs text-gray-500 mt-1">
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancellation */}
          {order.orderStatus === "cancelled" && order.cancellationReason && (
            <div className="border border-red-100 rounded-2xl p-5 bg-red-50">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Cancellation Reason
              </p>
              <p className="text-sm text-red-700">{order.cancellationReason}</p>
              {order.cancelledAt && (
                <p className="text-xs text-red-500 mt-2">
                  Cancelled on {formatDate(order.cancelledAt)}
                </p>
              )}
            </div>
          )}

          {/* Invoice */}
          {order.invoiceUrl && (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order Row ──────────────────────────────────────────────────
function OrderRow({ order, index, onViewDetails }) {
  const user = order.user || {};
  const userName =
    user.full_name || order.shippingAddress?.fullName || "Unknown";
  const userInitial = userName.charAt(0).toUpperCase();
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const statusConfig = ORDER_STATUS[order.orderStatus] || ORDER_STATUS.placed;
  const paymentConfig =
    PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-4 px-5 py-4">
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
          <p className="text-xs text-gray-400 truncate">
            #{order.easebuzzOrderId || order._id?.slice(-8)}
          </p>
        </div>

        {/* Items count */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50">
            <Package className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">
              {order.items?.length || 0}
            </p>
            <p className="text-[10px] text-gray-400">items</p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-50">
            <IndianRupee className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">
              ₹{order.finalAmount?.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-gray-400">total</p>
          </div>
        </div>

        {/* Status */}
        <div className="hidden md:block shrink-0">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: statusConfig.bg, color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Payment */}
        <div className="hidden lg:block shrink-0">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: paymentConfig.bg, color: paymentConfig.color }}
          >
            {paymentConfig.label}
          </span>
        </div>

        {/* Date */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-gray-400 shrink-0 min-w-20 justify-end">
          <Clock className="w-3 h-3" />
          {timeAgo(order.createdAt)}
        </div>

        {/* View button */}
        <button
          onClick={() => onViewDetails(order)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 transition-colors shrink-0"
          title="View Details"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function OrdersPage() {
  const { orders, loading, fetchAllOrders } = useOrderStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // ── Filtered ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...orders];

    if (filterStatus !== "All") {
      list = list.filter((o) => o.orderStatus === filterStatus);
    }

    if (filterPayment !== "All") {
      list = list.filter((o) => o.paymentStatus === filterPayment);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.user?.full_name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q) ||
          o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
          o.easebuzzOrderId?.toLowerCase().includes(q) ||
          o._id?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [orders, filterStatus, filterPayment, search]);

  // ── Stats ──────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => {
    if (o.paymentStatus === "paid" && o.orderStatus !== "cancelled") {
      return s + (o.finalAmount || 0);
    }
    return s;
  }, 0);

  const avgOrderValue = orders.length
    ? Math.round(totalRevenue / orders.length)
    : 0;

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "placed" || o.orderStatus === "processing",
  ).length;

  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === "delivered",
  ).length;

  const hasFilters =
    search || filterStatus !== "All" || filterPayment !== "All";

  return (
    <>
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Orders
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage and track customer orders
            </p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all self-start sm:self-auto"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Stats ── */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Total Orders",
                value: orders.length,
                icon: Package,
                color: "#15803d",
                bg: "#dcfce7",
              },
              {
                label: "Pending",
                value: pendingOrders,
                icon: Clock,
                color: "#f59e0b",
                bg: "#fef3c7",
              },
              {
                label: "Delivered",
                value: deliveredOrders,
                icon: CheckCircle2,
                color: "#16a34a",
                bg: "#d1fae5",
              },
              {
                label: "Total Revenue",
                value: `₹${totalRevenue.toLocaleString("en-IN")}`,
                icon: TrendingUp,
                color: "#059669",
                bg: "#d1fae5",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  if (label === "Pending") {
                    setFilterStatus("All");
                    // Show placed + processing
                  } else if (label === "Delivered") {
                    setFilterStatus("delivered");
                  }
                }}
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

        {/* ── Toolbar ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search by name, email, order ID..."
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

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              {/* Order status filter */}
              <div className="flex items-center gap-1.5">
                {[
                  "All",
                  "placed",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((s) => {
                  const config = s === "All" ? null : ORDER_STATUS[s];
                  const active = filterStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        active
                          ? "text-white shadow-sm"
                          : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                      }`}
                      style={
                        active && config
                          ? { background: config.color }
                          : active
                            ? {
                                background:
                                  "linear-gradient(135deg, #15803d, #22c55e)",
                              }
                            : {}
                      }
                    >
                      {config?.label || s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mr-1">
              <CreditCard className="w-3.5 h-3.5" />
              Payment:
            </span>
            {["All", "pending", "paid", "failed"].map((s) => {
              const config = s === "All" ? null : PAYMENT_STATUS[s];
              const active = filterPayment === s;
              const count =
                s === "All"
                  ? orders.length
                  : orders.filter((o) => o.paymentStatus === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilterPayment(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    active
                      ? "text-white shadow-sm"
                      : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                  }`}
                  style={
                    active && config
                      ? { background: config.color }
                      : active
                        ? {
                            background:
                              "linear-gradient(135deg, #15803d, #22c55e)",
                          }
                        : {}
                  }
                >
                  {config?.label || s}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result count + clear */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between -mt-2">
            <p className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
              of {orders.length} orders
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                  setFilterPayment("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <Package className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {hasFilters ? "No orders match your filters" : "No orders yet"}
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                  setFilterPayment("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
              >
                Clear filters
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
              <span className="w-24 text-right">Amount</span>
              <span className="w-20 text-center hidden md:block">Status</span>
              <span className="w-20 text-center hidden lg:block">Payment</span>
              <span className="w-20 text-right hidden xl:block">Date</span>
              <span className="w-8" />
            </div>

            <div className="space-y-3">
              {filtered.map((order, i) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  index={i}
                  onViewDetails={setSelectedOrder}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}