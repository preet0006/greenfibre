"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useOrderStore from "@/store/useOrderStore";
import {
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  Home,
  Receipt,
  Loader2,
  AlertCircle,
  Coins,
  Sparkles,
} from "lucide-react";
import CoinBurstAnimation from "@/components/rewards/CoinBurstAnimation";

function OrderSuccessPageInner() {
  const searchParams = useSearchParams();
  const verifyPayment = useOrderStore((s) => s.verifyPayment);
  const singleOrder = useOrderStore((s) => s.singleOrder);

  const [verifying, setVerifying] = useState(true);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    const run = async () => {
      // ── Path A: Direct order ID in URL (standard gateway redirect or internal navigation) ──
      const preVerifiedOrderId =
        searchParams.get("order") ||
        searchParams.get("order_id") ||
        searchParams.get("orderNumber");

      if (preVerifiedOrderId) {
        setOrderId(preVerifiedOrderId);
        try {
          await useOrderStore.getState().getSingleOrder(preVerifiedOrderId);
        } catch (e) {
          console.warn("Could not fetch single order details:", e);
        }
        setVerifying(false);
        return;
      }

      // ── Path B: Legacy Easebuzz raw payment params in URL ──
      const txnid = searchParams.get("txnid");
      if (!txnid) {
        setVerificationFailed(true);
        setVerifying(false);
        return;
      }

      const paymentResponse = {
        txnid,
        status: searchParams.get("status"),
        hash: searchParams.get("hash"),
        amount: searchParams.get("amount"),
        firstname: searchParams.get("firstname"),
        email: searchParams.get("email"),
        productinfo: searchParams.get("productinfo"),
        easepayid: searchParams.get("easepayid"),
        phone: searchParams.get("phone"),
        udf1: searchParams.get("udf1"),
        udf2: searchParams.get("udf2"),
      };

      try {
        const result = await verifyPayment(paymentResponse);
        if (result?.success && (result?.orderId || result?.orderNumber)) {
          const targetId = result.orderNumber || result.orderId;
          setOrderId(targetId);
          await useOrderStore.getState().getSingleOrder(targetId);
        } else {
          setVerificationFailed(true);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setVerificationFailed(true);
      }
      setVerifying(false);
    };

    run();
  }, [searchParams, verifyPayment]);

  const displayOrderNumber =
    singleOrder?.orderNumber ||
    singleOrder?.easebuzzOrderId ||
    (orderId?.startsWith("GF-") ? orderId : null) ||
    singleOrder?._id ||
    orderId ||
    "";

  const handleCopy = async () => {
    if (!displayOrderNumber) return;
    try {
      await navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FDF8F4] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 shadow-sm">
            <Loader2 className="h-7 w-7 animate-spin text-green-700" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Confirming Payment...
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Fetching order details, please wait a moment
          </p>
        </div>
      </div>
    );
  }

  if (verificationFailed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FDF8F4] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Payment Verification Issue
          </h1>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            We couldn&apos;t automatically verify this payment session. If your account was debited, your order is secure and will appear in your orders history shortly.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/orders"
              className="flex-1 rounded-xl bg-[#15803d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#166534] transition-colors"
            >
              Check My Orders
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const orderDateStr = singleOrder?.createdAt
    ? new Date(singleOrder.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const finalAmountFormatted = singleOrder?.finalAmount != null
    ? `₹${Number(singleOrder.finalAmount).toLocaleString("en-IN")}`
    : "—";

  const paymentStatus = (singleOrder?.paymentStatus || "paid").toLowerCase();
  const items = singleOrder?.items || [];

  return (
    <div className="bg-[#FDF8F4] pt-3 sm:pt-5 pb-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-[660px] mx-auto">
        {/* Celebration Coin Burst */}
        {singleOrder?.rewardPointsEarned > 0 && (
          <CoinBurstAnimation
            pointsEarned={singleOrder.rewardPointsEarned}
            orderId={displayOrderNumber || singleOrder?._id}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-xl"
        >
          {/* ── 1. Compact Hero Header ── */}
          <div className="bg-gradient-to-br from-[#15803d] via-[#16a34a] to-[#15803d] px-5 py-4 sm:py-5 text-center text-white relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto mb-1.5 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white shadow-md"
            >
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-[#15803d]" />
            </motion.div>
            <h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              style={{
                fontFamily: "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              }}
            >
              Order Placed Successfully!
            </h1>
            <p className="mt-0.5 text-xs text-white/90 font-medium">
              Thank you for your purchase. Your order is confirmed.
            </p>
          </div>

          {/* ── 2. Compact Body ── */}
          <div className="p-4 sm:p-5 space-y-3.5">
            {/* 2x2 Details Grid */}
            <div className="rounded-2xl border border-gray-100 bg-[#f9fafb] p-3.5 sm:p-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Order Number with copy button */}
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order Number
                  </p>
                  {displayOrderNumber ? (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 tracking-tight truncate max-w-[170px] sm:max-w-[220px]">
                        {displayOrderNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        title={copied ? "Copied!" : "Copy Order Number"}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 h-5 w-28 bg-gray-200 animate-pulse rounded" />
                  )}
                </div>

                {/* 2. Order Total */}
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order Total
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#15803d]">
                    {finalAmountFormatted}
                  </p>
                </div>

                {/* 3. Payment Status */}
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Payment Status
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      ✓ {paymentStatus === "paid" ? "Paid" : paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 4. Order Date */}
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Order Date
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-medium text-gray-800">
                    {orderDateStr}
                  </p>
                </div>
              </div>
            </div>

            {/* Reward Points Banner immediately below without scrolling */}
            {singleOrder?.rewardPointsEarned > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 via-yellow-50 to-emerald-50 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-950 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      +{singleOrder.rewardPointsEarned} Reward Points Credited
                    </span>
                  </div>
                </div>
                <Link
                  href="/rewards"
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-[11px] font-bold text-white transition-colors"
                >
                  View Wallet
                </Link>
              </div>
            )}

            {/* Main Action Buttons (One Row) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/orders"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <Receipt className="h-4 w-4 text-gray-500" />
                View Order
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] px-3 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
              >
                <Home className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>

            {/* Collapsible Order Items (keeps card compact by default) */}
            {items.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowItems((prev) => !prev)}
                  className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Order Items ({items.length})
                  </span>
                  {showItems ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                <AnimatePresence>
                  {showItems && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2 max-h-44 overflow-y-auto pr-1 pt-2"
                    >
                      {items.map((item, idx) => (
                        <div
                          key={item.id || item._id || idx}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-100 bg-[#f9fafb] text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                <Image
                                  src={item.image}
                                  alt={item.name || "Product"}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 truncate">
                              <p className="font-semibold text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Qty: {item.quantity} {item.colorName ? `• ${item.colorName}` : ""}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 shrink-0">
                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Subtle Brand Tagline */}
        <p className="mt-4 text-center text-xs text-gray-500">
          Thank you for choosing{" "}
          <span className="font-semibold text-[#15803d]">Green Fibre</span> — Sustainability, Simplified
        </p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
          <Loader2 size={24} className="text-green-600 animate-spin" />
        </div>
      }
    >
      <OrderSuccessPageInner />
    </Suspense>
  );
}
