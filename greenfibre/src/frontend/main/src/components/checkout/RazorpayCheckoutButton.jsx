"use client";

import React, { useState } from "react";
import { loadRazorpayScript } from "@/utils/loadRazorpay";
import useOrderStore from "@/store/useOrderStore";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

/**
 * Razorpay Standard Web Checkout Button Component
 */
export default function RazorpayCheckoutButton({
  amount, // in paise (or rupees if isPaise === false)
  isPaise = true,
  currency = "INR",
  orderId = null,
  receipt = null,
  customerInfo = {},
  notes = {},
  onSuccess = null,
  onError = null,
  className = "",
  buttonText = "Pay with Razorpay",
  disabled = false,
  children = null,
}) {
  const [loading, setLoading] = useState(false);
  const createRazorpayOrder = useOrderStore((s) => s.createRazorpayOrder);
  const verifyRazorpayPayment = useOrderStore((s) => s.verifyRazorpayPayment);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Ensure Razorpay checkout script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Unable to load payment gateway. Please check your internet connection.");
        setLoading(false);
        onError?.(new Error("Razorpay SDK failed to load"));
        return;
      }

      // Convert to paise if passed in INR rupees
      const amountInPaise = isPaise ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

      if (!amountInPaise || amountInPaise < 100) {
        toast.error("Order amount must be at least ₹1.00 (100 paise).");
        setLoading(false);
        return;
      }

      // 2. Call backend to create Razorpay Order (POST /api/create-order)
      const orderRes = await createRazorpayOrder({
        amount: amountInPaise,
        currency,
        receipt,
        orderId,
        notes,
      });

      if (!orderRes || !orderRes.order_id) {
        setLoading(false);
        onError?.(new Error("Failed to create Razorpay order"));
        return;
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderRes.key_id;
      if (!keyId) {
        toast.error("Razorpay Key ID is not configured.");
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Green Fibre",
        description: "Eco-friendly Rice Husk Bio-Composite Products",
        image: "/greenfiber-logo.png",
        order_id: orderRes.order_id,
        prefill: {
          name: customerInfo.name || customerInfo.fullName || "",
          email: customerInfo.email || "",
          contact: customerInfo.phone || customerInfo.contact || "",
        },
        notes: {
          ...notes,
          orderId: orderId || "",
        },
        theme: {
          color: "#16a34a", // GreenFibre brand green
        },
        modal: {
          confirm_close: true,
          ondismiss: function () {
            setLoading(false);
            toast("Payment cancelled by user.", { icon: "ℹ️" });
            onError?.(new Error("Payment cancelled by user"));
          },
        },
        handler: async function (response) {
          try {
            toast.loading("Verifying payment...", { id: "razorpay-verify" });

            // 4. Send payment details to backend for HMAC signature verification
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.dismiss("razorpay-verify");

            if (verifyRes?.success) {
              toast.success("Payment successful!");
              onSuccess?.({
                ...response,
                orderId: verifyRes.orderId || orderId,
              });
            } else {
              toast.error(verifyRes?.message || "Payment signature verification failed");
              onError?.(new Error("Signature verification failed"));
            }
          } catch (err) {
            toast.dismiss("razorpay-verify");
            toast.error("Error during payment verification");
            onError?.(err);
          } finally {
            setLoading(false);
          }
        },
      };

      // 5. Open Razorpay payment modal
      const rzp = new window.Razorpay(options);

      // Handle payment failure event
      rzp.on("payment.failed", function (response) {
        setLoading(false);
        const reason = response.error?.description || "Payment transaction failed.";
        toast.error(`Payment failed: ${reason}`);
        onError?.(response.error);
      });

      rzp.open();
    } catch (error) {
      console.error("Razorpay handlePayment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setLoading(false);
      onError?.(error);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={disabled || loading}
      className={
        className ||
        "flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-base font-medium text-white shadow-md transition-all hover:bg-green-700 disabled:opacity-50"
      }
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing Payment...</span>
        </>
      ) : children ? (
        children
      ) : (
        <>
          <ShieldCheck className="h-5 w-5" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
