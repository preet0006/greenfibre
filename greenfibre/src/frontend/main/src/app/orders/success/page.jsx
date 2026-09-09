"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useOrderStore from "@/store/useOrderStore";
import {
  CheckCircle,
  Package,
  Truck,
  Home,
  Receipt,
  Loader2,
  AlertCircle,
} from "lucide-react";

function OrderSuccessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyPayment = useOrderStore((s) => s.verifyPayment);
  const getSingleOrder = useOrderStore((s) => s.getSingleOrder);
  const singleOrder = useOrderStore((s) => s.singleOrder);

  const [verifying, setVerifying] = useState(true);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const run = async () => {
      // ── Path A: Backend already verified and redirected with ?order=<id> ──
      // This is the standard Easebuzz gateway flow.
      // The backend does the verification, updates DB, then redirects the
      // browser here with only the order ID. No need to re-verify.
      const preVerifiedOrderId = searchParams.get("order");
      if (preVerifiedOrderId) {
        setOrderId(preVerifiedOrderId);
        await getSingleOrder(preVerifiedOrderId);
        setVerifying(false);
        return;
      }

      // ── Path B: AJAX / legacy flow — raw payment params in URL ──
      // Only reached if someone is using the frontend-verify flow.
      const txnid = searchParams.get("txnid");
      if (!txnid) {
        // Neither an order ID nor payment params — unexpected landing
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

      const result = await verifyPayment(paymentResponse);
      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        await getSingleOrder(result.orderId);
      } else {
        setVerificationFailed(true);
      }
      setVerifying(false);
    };

    run();
  }, [searchParams]);


  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Verifying Payment...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we confirm your payment
          </p>
        </div>
      </div>
    );
  }

  if (verificationFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Verification Failed
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            We couldn't verify your payment. Please contact support if amount
            was deducted.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/orders"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              My Orders
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700"
            >
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Success Header */}
          <div className="bg-linear-to-br from-green-600 to-green-700 px-6 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>
            <h1
              className="text-3xl font-bold text-white"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Order Placed Successfully!
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Thank you for your purchase. Your order is confirmed.
            </p>
          </div>

          {/* Order Details */}
          <div className="p-6">
            {singleOrder && (
              <div className="space-y-6">
                {/* Order Info Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order Number
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-gray-900">
                        {singleOrder.easebuzzOrderId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order Total
                      </p>
                      <p className="mt-1 text-sm font-bold text-green-600">
                        ₹{singleOrder.finalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Payment Status
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          {singleOrder.paymentStatus}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order Date
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {new Date(singleOrder.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                    Order Items ({singleOrder.items.length})
                  </h2>
                  <div className="space-y-3">
                    {singleOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {item.colorHex && (
                              <div
                                className="h-4 w-4 rounded-full border-2 border-gray-200"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                            <span className="text-xs text-gray-500">
                              {item.colorName}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            ₹
                            {(item.price * item.quantity).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                    Shipping Address
                  </h2>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="font-semibold text-gray-900">
                      {singleOrder.shippingAddress.fullName}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {singleOrder.shippingAddress.streetAddress}
                      {singleOrder.shippingAddress.landmark &&
                        `, ${singleOrder.shippingAddress.landmark}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {singleOrder.shippingAddress.city},{" "}
                      {singleOrder.shippingAddress.state} -{" "}
                      {singleOrder.shippingAddress.pincode}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {singleOrder.shippingAddress.phone}
                    </p>
                  </div>
                </div>

                {/* What's Next */}
                <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-green-900">
                    <Package className="h-4 w-4" />
                    What's Next?
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-600">•</span>
                      <span>
                        You'll receive an order confirmation email shortly
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-600">•</span>
                      <span>
                        We'll send you tracking details once your order ships
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-600">•</span>
                      <span>Estimated delivery: 5-7 business days</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                href={`/orders/${orderId}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Receipt className="h-4 w-4" />
                View Order
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Truck className="h-4 w-4" />
                Track Orders
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700"
              >
                <Home className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Thank You Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600">
            Thank you for choosing{" "}
            <span className="font-semibold text-green-600">Green Fibre</span> —
            Sustainability, Simplified
          </p>
        </motion.div>
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
