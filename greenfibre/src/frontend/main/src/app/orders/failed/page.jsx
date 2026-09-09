"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  XCircle,
  AlertTriangle,
  Home,
  ShoppingCart,
  Phone,
  Mail,
  RefreshCw,
  Loader2,
} from "lucide-react";

function OrderFailedPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [paymentDetails, setPaymentDetails] = useState({
    orderId: "",
    txnid: "",
    amount: "",
    firstname: "",
    email: "",
    error: "",
  });

  useEffect(() => {
    // Resolve a human-readable error message from the reason code
    const reasonMessages = {
      hash_mismatch: "Payment response validation failed. Please contact support.",
      amount_mismatch: "Payment amount mismatch detected. Please contact support.",
      order_not_found: "Order could not be found. Please contact support.",
      missing_params: "Incomplete payment response received.",
      server_error: "A server error occurred. Please try again.",
      cancelled: "Payment was cancelled.",
      usercancel: "Payment was cancelled by you.",
      failure: "Payment was declined by your bank or payment provider.",
    };

    const reason = searchParams.get("reason") || searchParams.get("error") || "";
    const errorMessage =
      reasonMessages[reason] ||
      (reason ? reason.replace(/_/g, " ") : "Payment was not successful");

    setPaymentDetails({
      orderId: searchParams.get("order") || "",
      txnid: searchParams.get("txnid") || "",
      amount: searchParams.get("amount") || "",
      firstname: searchParams.get("firstname") || "",
      email: searchParams.get("email") || "",
      error: errorMessage,
    });
  }, [searchParams]);


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Error Header */}
          <div className="bg-linear-to-br from-red-600 to-red-700 px-6 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <XCircle className="h-12 w-12 text-red-600" />
            </motion.div>
            <h1
              className="text-3xl font-bold text-white"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Payment Failed
            </h1>
            <p className="mt-2 text-sm text-white/80">
              We couldn't process your payment
            </p>
          </div>

          {/* Error Details */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Error Message */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">
                      What happened?
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                      {paymentDetails.error}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details (if available) */}
              {(paymentDetails.txnid || paymentDetails.orderId) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Transaction Details
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentDetails.txnid && (
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-gray-900">
                          {paymentDetails.txnid}
                        </p>
                      </div>
                    )}
                    {paymentDetails.orderId && !paymentDetails.txnid && (
                      <div>
                        <p className="text-xs text-gray-500">Order Reference</p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-gray-900">
                          {paymentDetails.orderId}
                        </p>
                      </div>
                    )}
                    {paymentDetails.amount && (
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="mt-0.5 text-sm font-medium text-gray-900">
                          ₹
                          {parseFloat(paymentDetails.amount).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Common Reasons */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  Common reasons for payment failure:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>Insufficient balance in your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>Incorrect card details or CVV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>Card limit exceeded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>Bank server temporarily down</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-gray-400">•</span>
                    <span>Session timeout during payment</span>
                  </li>
                </ul>
              </div>

              {/* What to do next */}
              <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                <h3 className="mb-3 text-sm font-bold text-green-900">
                  What should you do?
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">1.</span>
                    <span>Check your bank account/card balance and limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">2.</span>
                    <span>
                      Try again with the same or different payment method
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">3.</span>
                    <span>
                      If money was debited, it will be refunded within 5-7
                      business days
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-600">4.</span>
                    <span>
                      Contact your bank or our support team for assistance
                    </span>
                  </li>
                </ul>
              </div>

              {/* Support Contact */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  Need help?
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="tel:+911234567890"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-green-200 hover:bg-green-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Call us</p>
                      <p className="text-sm font-semibold text-gray-900">
                        +91 123 456 7890
                      </p>
                    </div>
                  </a>
                  <a
                    href="mailto:support@greenfibre.com"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-green-200 hover:bg-green-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email us</p>
                      <p className="text-sm font-semibold text-gray-900">
                        support@greenfibre.com
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Cart
                </Link>
                <button
                  onClick={() => router.back()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600 transition-opacity hover:opacity-70"
              >
                <Home className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Reassurance Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl border border-gray-200 bg-white p-4 text-center"
        >
          <p className="text-sm text-gray-600">
            🔒 Your payment information is secure. No charges were made to your
            account.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF8F4] flex items-center justify-center">
          <Loader2 size={24} className="text-green-600 animate-spin" />
        </div>
      }
    >
      <OrderFailedPageInner />
    </Suspense>
  );
}

