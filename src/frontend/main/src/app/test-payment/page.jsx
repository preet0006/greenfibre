"use client";

import React, { useState } from "react";
import { loadRazorpayScript } from "@/utils/loadRazorpay";
import axios from "@/lib/axios";
import { CheckCircle2, ShieldCheck, CreditCard, ArrowRight, Loader2, Copy, Check } from "lucide-react";

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const testCredentials = {
    card: "4100 2800 0000 1007",
    expiry: "12/26",
    cvv: "123",
    upi: "test@razorpay",
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestPayment = async () => {
    try {
      setLoading(true);
      setPaymentResult(null);

      // 1. Ensure script loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Failed to load Razorpay SDK. Check your internet connection.");
        setLoading(false);
        return;
      }

      // 2. Create order on backend (amount in paise: 100 paise = ₹1.00)
      const res = await axios.post("/create-order", {
        amount: 100,
        currency: "INR",
        receipt: `test_receipt_${Date.now()}`,
        notes: {
          purpose: "Razorpay Gateway Activation Test",
        },
      });

      const orderData = res.data;
      if (!orderData?.order_id) {
        alert("Failed to create Razorpay test order from backend.");
        setLoading(false);
        return;
      }

      const keyId =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        orderData.key_id ||
        "rzp_test_TXUmsTdOI5q5Q1";

      // 3. Open Razorpay modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Green Fibre",
        description: "Gateway Activation Test Transaction (₹1.00)",
        image: "/greenfiber-logo.png",
        order_id: orderData.order_id,
        prefill: {
          name: "GreenFibre Tester",
          email: "test@razorpay.com",
          contact: "9999999999",
        },
        theme: {
          color: "#16a34a",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        handler: async function (response) {
          try {
            // 4. Verify signature on backend
            const verifyRes = await axios.post("/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentResult({
              success: verifyRes.data.success,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              message: verifyRes.data.message || "Payment verified successfully",
            });
          } catch (err) {
            setPaymentResult({
              success: false,
              message: err?.response?.data?.message || "Verification failed on server",
            });
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setLoading(false);
        alert(`Payment failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (err) {
      console.error("Test payment error:", err);
      alert(`Error initiating payment: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Razorpay Gateway Activation Test
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Make a ₹1.00 test transaction to complete Step 3 of the Razorpay onboarding wizard.
          </p>
        </div>

        {/* Credentials Box */}
        <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-200">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Razorpay Test Credentials
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Test Card:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800">{testCredentials.card}</span>
                <button
                  onClick={() => copyToClipboard(testCredentials.card.replace(/\s/g, ""), "card")}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                  title="Copy card number"
                >
                  {copiedField === "card" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">Expiry:</span>
                <span className="font-mono font-bold text-slate-800">{testCredentials.expiry}</span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500">CVV:</span>
                <span className="font-mono font-bold text-slate-800">{testCredentials.cvv}</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Test UPI:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800">{testCredentials.upi}</span>
                <button
                  onClick={() => copyToClipboard(testCredentials.upi, "upi")}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                  title="Copy UPI ID"
                >
                  {copiedField === "upi" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            id="pay-test-button"
            onClick={handleTestPayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹1.00 Test Transaction
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            ⚠️ This is in test mode with test keys. No real money will be charged.
          </p>
        </div>

        {/* Success / Result Box */}
        {paymentResult && (
          <div
            id="test-payment-success-box"
            className={`mt-6 p-5 rounded-xl border ${
              paymentResult.success
                ? "bg-green-50 border-green-200 text-green-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-base mb-2">
              {paymentResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Transaction Successful & Verified!
                </>
              ) : (
                <>⚠️ Payment Verification Failed</>
              )}
            </div>
            {paymentResult.success && (
              <div className="space-y-1 text-xs font-mono text-green-800 break-all">
                <p><strong>Payment ID:</strong> {paymentResult.payment_id}</p>
                <p><strong>Order ID:</strong> {paymentResult.order_id}</p>
                <p className="mt-2 text-sm font-sans font-semibold text-green-700">
                  🎉 You can now go to your Razorpay dashboard and click &quot;I have done the transaction&quot;!
                </p>
              </div>
            )}
            {!paymentResult.success && (
              <p className="text-sm">{paymentResult.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
