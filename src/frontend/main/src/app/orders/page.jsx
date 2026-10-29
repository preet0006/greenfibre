"use client";

import React, { useEffect, useState, useRef, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  Check,
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

// ── Recent Pending Helper ────────────────────────────────────
function isRecentPending(order) {
  if (!order || order.paymentStatus !== "pending") return false;
  const createdTime = new Date(order.createdAt).getTime();
  if (isNaN(createdTime)) return false;
  return Date.now() - createdTime < 30 * 60 * 1000;
}

// ── Header Status & Payment Pills ─────────────────────────────
function OrderStatusPill({ status }) {
  const s = (status || "").toLowerCase();
  let bg = "bg-[#fef3c7]";
  let text = "text-[#92400e]";
  let label = "Processing";

  if (s === "pending") {
    bg = "bg-[#fef3c7]";
    text = "text-[#92400e]";
    label = "Pending";
  } else if (s === "processing" || s === "placed") {
    bg = "bg-[#fef3c7]";
    text = "text-[#92400e]";
    label = "Processing";
  } else if (s === "shipped") {
    bg = "bg-[#f3e8ff]";
    text = "text-[#6b21a8]";
    label = "Shipped";
  } else if (s === "delivered") {
    bg = "bg-[#dcfce7]";
    text = "text-[#166534]";
    label = "Delivered";
  } else if (s === "cancelled") {
    bg = "bg-[#fee2e2]";
    text = "text-[#991b1b]";
    label = "Cancelled";
  } else {
    label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "Processing";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}

function OrderPaymentPill({ status }) {
  const s = (status || "").toLowerCase();
  const isPaid = s === "paid";
  const isFailed = s === "failed";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid
          ? "bg-[#dcfce7] text-[#166534]"
          : isFailed
            ? "bg-[#fee2e2] text-[#991b1b]"
            : "bg-[#fef3c7] text-[#92400e]"
        }`}
    >
      {isPaid ? "Paid" : isFailed ? "Payment Failed" : "Unpaid"}
    </span>
  );
}

// ── Sanitize Activity Note (Never show raw Razorpay/Easebuzz payment IDs) ──
function sanitizeActivityNote(note, statusTitle) {
  if (!note) {
    const s = (statusTitle || "").toLowerCase();
    if (s.includes("processing") || s.includes("paid")) return "Payment verified via Razorpay";
    if (s.includes("pending")) return "Order created";
    if (s.includes("shipped")) return "Order dispatched with courier";
    if (s.includes("delivered")) return "Package delivered to customer";
    return "Status updated";
  }

  // Strip raw payment IDs (pay_xxx, order_xxx, txn_xxx, hashes)
  let clean = note
    .replace(/\s*\([^)]*Payment ID:[^)]*\)/gi, "")
    .replace(/\b(pay|order|txn|txnid|hash)[_:][a-zA-Z0-9_-]+/gi, "")
    .replace(/\b[0-9a-f]{24,}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!clean || clean.length < 3 || /^[:\-\s]+$/.test(clean)) {
    const s = (statusTitle || "").toLowerCase();
    if (s.includes("processing") || s.includes("paid")) return "Payment verified via Razorpay";
    if (s.includes("pending")) return "Order created";
    if (s.includes("shipped")) return "Order dispatched with courier";
    if (s.includes("delivered")) return "Package delivered to customer";
    return "Status updated";
  }

  return clean;
}

// ── Status Stepper Configuration ──────────────────────────────
const STEP_CONFIG = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

function getStepIndex(status, paymentStatus) {
  const s = (status || "").toLowerCase();
  if (s === "delivered" || s === "return_delivered" || s === "rto_delivered") return 3;
  if (s === "shipped" || s.startsWith("return_") || s.startsWith("rto_")) return 2;
  if (s === "processing" || s === "placed" || paymentStatus === "paid") return 1;
  return 0; // pending
}

function OrderStepper({ order, currentStepIndex }) {
  const history = order.statusHistory || order.timeline || [];

  const getStepDate = (stepKey, stepIdx) => {
    // Only show dates for completed and current steps
    if (stepIdx > currentStepIndex) return null;

    const match = history.find((h) =>
      (h.status || "").toLowerCase().includes(stepKey)
    );
    const dateVal = match?.timestamp || match?.date || (order.date || order.createdAt);
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="px-4 py-6 sm:px-14 sm:py-7">
      <div className="flex items-start">
        {STEP_CONFIG.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const dateText = getStepDate(step.key, idx);
          const StepIcon = step.icon;

          return (
            <Fragment key={step.key}>
              {/* Step Column (Circle + Label + Date) */}
              <div className="flex flex-col items-center shrink-0 w-16 sm:w-24 text-center">
                {/* Circle */}
                {isCompleted ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-xs">
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </div>
                ) : isCurrent ? (
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#16a34a] bg-white ring-4 ring-[#dcfce7] shadow-xs">
                    <StepIcon className="h-4 w-4 text-[#16a34a]" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16a34a]"></span>
                    </span>
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#e5e7eb] bg-[#f9fafb] text-gray-400">
                    <StepIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}

                {/* Step Label */}
                <p
                  className={`mt-2 text-[11px] sm:text-xs leading-tight ${isCurrent
                      ? "font-bold text-[#16a34a]"
                      : isCompleted
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-500"
                    }`}
                >
                  {step.label}
                </p>

                {/* Step Subtext/Date */}
                <p className="hidden sm:block text-[11px] text-gray-500 mt-1 leading-tight">
                  {isCurrent ? (
                    <span>{dateText ? `${dateText} • ` : ""}Current</span>
                  ) : isCompleted ? (
                    <span>{dateText}</span>
                  ) : (
                    <span className="text-gray-400">Upcoming</span>
                  )}
                </p>
              </div>

              {/* Connector Line between step columns */}
              {idx < STEP_CONFIG.length - 1 && (
                <div className="flex-1 pt-[15px] px-1 sm:px-2">
                  <div
                    className={`h-[2px] w-full transition-colors ${idx < currentStepIndex ? "bg-[#16a34a]" : "bg-[#d1d5db]"
                      }`}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Redesigned Order Card (Accordion with Self-Contained State) ──
function OrderCard({ order }) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize order properties
  const orderId =
    order.orderNumber || order.id || order.easebuzzOrderId || order.razorpayOrderId || order._id || "";
  const statusRaw = order.status || order.orderStatus || "Pending";
  const paymentStatus = (order.paymentStatus || "pending").toLowerCase();
  const orderDate = order.date || order.createdAt;
  const finalAmount = order.total ?? order.finalAmount ?? order.totalAmount ?? 0;
  const subtotalAmount = order.totalAmount ?? order.subtotal ?? finalAmount;
  const discountAmount = order.discountAmount || 0;

  // Normalized items
  const items = (order.items || []).map((item, idx) => ({
    id: item.id || item._id || idx,
    name: item.name || "Product",
    color: item.color || item.colorName || "",
    qty: item.qty ?? item.quantity ?? 1,
    price: item.price ?? 0,
    image: item.image || "",
  }));
  const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);
  const productCount = items.length;

  // Normalized shipping address
  const addr = order.address || order.shippingAddress || {};
  const addressName = addr.name || addr.fullName || "Customer";
  const addressLine = [
    addr.line1 || addr.streetAddress,
    addr.city,
    addr.state
      ? `${addr.state}${addr.pincode ? ` - ${addr.pincode}` : ""}`
      : addr.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const addressPhone = addr.phone || "";
  const addressEmail = addr.email || "";

  // Normalized shipping & tracking
  const shipping = order.shipping || {};
  const courierName = shipping.courierName || order.courierName || order.courier || "";
  const trackingNumber =
    shipping.trackingNumber ||
    order.trackingNumber ||
    order.awb ||
    order.trackingId ||
    "";
  const trackingUrl = shipping.trackingUrl || order.trackingUrl || "";

  // Normalized timeline
  let timeline = (order.timeline || order.statusHistory || []).map((entry) => ({
    status: entry.status || "Update",
    date: entry.date || entry.timestamp,
    note: sanitizeActivityNote(entry.note, entry.status || "Update"),
  }));
  timeline.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (timeline.length === 0) {
    const norm = statusRaw.toLowerCase();
    const createdDate = orderDate || new Date();
    if (norm === "delivered") {
      timeline.push({ status: "Delivered", date: createdDate, note: "Package delivered to customer" });
      timeline.push({ status: "Shipped", date: createdDate, note: "Order dispatched with courier" });
      timeline.push({ status: "Processing", date: createdDate, note: "Payment verified via Razorpay" });
      timeline.push({ status: "Pending", date: createdDate, note: "Order created" });
    } else if (norm === "shipped") {
      timeline.push({ status: "Shipped", date: createdDate, note: "Order dispatched with courier" });
      timeline.push({ status: "Processing", date: createdDate, note: "Payment verified via Razorpay" });
      timeline.push({ status: "Pending", date: createdDate, note: "Order created" });
    } else if (norm === "processing" || paymentStatus === "paid") {
      timeline.push({ status: "Processing", date: createdDate, note: "Payment verified via Razorpay" });
      timeline.push({ status: "Pending", date: createdDate, note: "Order created" });
    } else {
      timeline.push({ status: "Pending", date: createdDate, note: "Order created" });
    }
  }

  const currentStepIndex = getStepIndex(statusRaw, paymentStatus);

  // Format order date for header
  const headerDateStr = orderDate
    ? new Date(orderDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-xs transition-shadow hover:shadow-md"
    >
      {/* 1. HEADER (bg #f9fafb, padding 20px 28px, bottom border) */}
      <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left Side */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className="font-bold text-base sm:text-lg text-gray-900 tracking-tight font-mono">
                {orderId}
              </span>
              <OrderStatusPill status={statusRaw} />
              <OrderPaymentPill status={paymentStatus} />
              {paymentStatus === "pending" && isRecentPending(order) && (
                <span className="text-xs font-medium text-amber-700 italic flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600 inline" />
                  Confirming payment…
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              <span>{headerDateStr}</span>
              <span>•</span>
              <span>
                {totalUnits} {totalUnits === 1 ? "item" : "items"} · {productCount} {productCount === 1 ? "product" : "products"}
              </span>
              <span>•</span>
              <span className="font-bold text-[#15803d]">
                {formatPrice(finalAmount)}
              </span>
            </div>
          </div>

          {/* Right Side Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls={`order-details-${orderId}`}
            className="min-h-[44px] rounded-full bg-[#15803d] hover:bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>{isOpen ? "Hide Details" : "View Details"}</span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="h-4 w-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. STATUS STEPPER (always visible, under the header) */}
      <OrderStepper order={order} currentStepIndex={currentStepIndex} />

      {/* 3. EXPANDED DETAILS (shown only when open, smooth height transition) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`order-details-${orderId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-5 sm:p-7 pt-4 sm:pt-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column (flex 1.25) */}
                <div className="flex-[1.25] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    ORDERED ITEMS ({totalUnits})
                  </h4>

                  {/* Product Cards */}
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-2xl border border-gray-100 bg-[#f9fafb] p-3.5 sm:p-4 flex items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.color ? `${item.color} • ` : ""}Qty: {item.qty} • @ {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm sm:text-base text-gray-900">
                            {formatPrice(item.price * item.qty)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Summary Box */}
                  <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 sm:p-5 space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(subtotalAmount)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm text-[#15803d]">
                        <span>Coupon / Savings Discount</span>
                        <span className="font-semibold">
                          -{formatPrice(discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-[#bbf7d0]" />

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-gray-900">
                        Total Paid
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-[#15803d]">
                        {formatPrice(finalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column (flex 1) */}
                <div className="flex-1 space-y-6">
                  {/* Live Courier & Tracking (if available) */}
                  {(courierName || trackingNumber || trackingUrl) && (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4 sm:p-5 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-purple-700" />
                        Live Courier & Tracking
                      </h4>
                      <div className="text-xs text-purple-900 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {courierName && (
                          <span>
                            Courier: <strong className="font-semibold text-purple-950">{courierName}</strong>
                          </span>
                        )}
                        {trackingNumber && (
                          <span>
                            AWB / Tracking #: <strong className="font-semibold text-purple-950">{trackingNumber}</strong>
                          </span>
                        )}
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
                          >
                            Track on Courier Site <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      DELIVERY ADDRESS
                    </h4>
                    <div className="rounded-2xl border border-gray-100 bg-[#f9fafb] p-4 sm:p-5 text-xs sm:text-sm text-gray-700 space-y-1.5">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        {addressName}
                      </p>
                      <p className="text-gray-600">
                        {addressLine || "Address on file"}
                      </p>

                      {(addressPhone || addressEmail) && (
                        <>
                          <div className="border-t border-gray-200/80 my-2.5 pt-2" />
                          <div className="space-y-1 text-xs text-gray-600">
                            {addressPhone && <p>{addressPhone}</p>}
                            {addressEmail && <p>{addressEmail}</p>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      ACTIVITY
                    </h4>
                    <div className="space-y-3">
                      {timeline.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#16a34a]" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900">
                              {act.status}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {act.note}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Download (if available) */}
                  {order.invoiceUrl && (
                    <div className="pt-1">
                      <a
                        href={order.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Tax Invoice
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const initialized = useOrderStore((s) => s.initialized);
  const fetchError = useOrderStore((s) => s.fetchError);
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

  // Background auto-refetch for recent pending orders (<30m old)
  // Polls every 5s, up to 12 times (60s total), stopping early when none remain
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      pollCountRef.current = 0;
      return;
    }

    const hasRecentPending = (myOrders || []).some(isRecentPending);

    if (!hasRecentPending) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      pollCountRef.current = 0;
      return;
    }

    if (pollIntervalRef.current) {
      return;
    }

    pollCountRef.current = 0;
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 12) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        return;
      }

      await fetchMyOrders(
        {
          page: currentPage,
          limit: 10,
          status: filterStatus === "all" ? undefined : filterStatus,
        },
        { silent: true }
      );
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, myOrders, currentPage, filterStatus]);

  const statusFilters = [
    { value: "all", label: "All Orders" },
    { value: "placed", label: "Placed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (!authChecked || (user && !initialized)) {
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
        {/* Filters — always shown after first load so user can switch away from a zero-result filter */}
        {initialized && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4" />
              Filter:
            </div>
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterStatus === filter.value
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
        {fetchError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-semibold text-red-700">{fetchError}</p>
            <button
              onClick={() => fetchMyOrders({ page: currentPage, limit: 10, status: filterStatus === "all" ? undefined : filterStatus })}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : myOrders.length === 0 && filterStatus !== "all" ? (
          // Filter returned zero results — keep filter bar visible, offer escape hatch
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
              <Filter className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-700">No orders match this filter</p>
            <p className="mt-1 text-sm text-gray-500">Try a different status or view all your orders.</p>
            <button
              onClick={() => setFilterStatus("all")}
              className="mt-5 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              Show all orders
            </button>
          </motion.div>
        ) : myOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
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
                      className={`h-10 w-10 rounded-xl text-sm font-semibold transition-all ${currentPage === page
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
