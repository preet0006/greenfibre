"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Sparkles,
  Gift,
  Check,
  Percent,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import useRewardStore from "@/store/useRewardStore";
import useUserStore from "@/store/useUserStore";

export default function RedeemToggle({
  cartTotal = 0,
  pointsToRedeem = 0,
  onPointsChange,
  appliedCoupon,
  onApplyFirstOrderCoupon,
}) {
  const user = useUserStore((s) => s.user);
  const balance = useRewardStore((s) => s.balance);
  const config = useRewardStore((s) => s.config);
  const hasCompletedFirstOrder = useRewardStore((s) => s.hasCompletedFirstOrder);
  const firstOrderCoupon = useRewardStore((s) => s.firstOrderCoupon);
  const previewRedemption = useRewardStore((s) => s.previewRedemption);
  const enabled = useRewardStore((s) => s.enabled);

  const [useRewards, setUseRewards] = useState(pointsToRedeem > 0);
  const [allowedPoints, setAllowedPoints] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [calculating, setCalculating] = useState(false);

  // Maximum allowed by business rule (2.5% of cart, capped by balance)
  const maxCap = useMemo(() => {
    if (!cartTotal || cartTotal <= 0) return 0;
    const percentCap = Math.floor((cartTotal * (config?.max_redeem_percent || 2.5)) / 100);
    return Math.min(percentCap, balance);
  }, [cartTotal, config, balance]);

  // Expected points earned on this order (2.5% of cart total)
  const estimatedEarn = useMemo(() => {
    if (!cartTotal || cartTotal <= 0) return 0;
    return Math.floor((cartTotal * (config?.earn_percent || 2.5)) / 100);
  }, [cartTotal, config]);

  // When toggle is turned on/off
  const handleToggle = async (checked) => {
    setUseRewards(checked);
    if (!checked) {
      setAllowedPoints(0);
      setDiscountAmount(0);
      onPointsChange(0);
      return;
    }

    // Default to max allowed
    if (maxCap > 0) {
      setCalculating(true);
      const preview = await previewRedemption(cartTotal, maxCap);
      setCalculating(false);

      if (preview && preview.allowed > 0) {
        setAllowedPoints(preview.allowed);
        setDiscountAmount(preview.discountAmount);
        onPointsChange(preview.allowed);
      } else {
        setAllowedPoints(maxCap);
        setDiscountAmount(maxCap * (config?.point_value || 1));
        onPointsChange(maxCap);
      }
    }
  };

  // Keep in sync if cartTotal changes while enabled
  useEffect(() => {
    if (useRewards && maxCap > 0) {
      const target = Math.min(pointsToRedeem || maxCap, maxCap);
      setAllowedPoints(target);
      setDiscountAmount(target * (config?.point_value || 1));
      onPointsChange(target);
    } else if (useRewards && maxCap === 0) {
      setUseRewards(false);
      onPointsChange(0);
    }
  }, [cartTotal, maxCap]);

  if (!enabled || (user && user.accountType === "B2B")) {
    return null;
  }

  // ── First Order Flow ──────────────────────────────────────────
  if (!hasCompletedFirstOrder) {
    const isFirstCouponApplied =
      appliedCoupon?.code?.toUpperCase() ===
      (firstOrderCoupon?.code || "FIRSTORDER").toUpperCase();

    return (
      <div className="overflow-hidden rounded-2xl border border-green-200/90 bg-gradient-to-br from-green-50/70 via-white to-green-50/40 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-xs">
            <Gift className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-green-900">
                Welcome to GreenFibre
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                First Order Benefits
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-700 leading-relaxed">
              You are receiving <span className="font-semibold text-green-700">15% Direct Discount</span>.
              Use coupon{" "}
              <span className="font-mono font-bold text-green-900">
                {firstOrderCoupon?.code || "FIRSTORDER"}
              </span>{" "}
              for an extra <span className="font-bold text-green-800">2.5% OFF</span>!
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!isFirstCouponApplied ? (
                <button
                  type="button"
                  onClick={() =>
                    onApplyFirstOrderCoupon &&
                    onApplyFirstOrderCoupon(firstOrderCoupon?.code || "FIRSTORDER")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-green-700 active:scale-95"
                >
                  <Percent className="h-3 w-3" /> Apply {firstOrderCoupon?.code || "FIRSTORDER"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Coupon Applied
                </span>
              )}

              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-green-600" />
                You'll earn ~{estimatedEarn} pts back on this purchase!
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Returning Customer (2nd Order Onward) Flow ─────────────────
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-xs">
            <Coins className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                Redeem GreenFibre Reward Points
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                1 pt = ₹1
              </span>
            </div>

            <p className="mt-0.5 text-xs text-gray-600">
              Available balance:{" "}
              <span className="font-bold text-amber-900">
                {balance.toLocaleString("en-IN")} pts
              </span>{" "}
              (Max {maxCap} pts redeemable on this order)
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        {balance > 0 && maxCap > 0 ? (
          <label className="relative inline-flex cursor-pointer items-center shrink-0">
            <input
              type="checkbox"
              id="redeem-reward-toggle"
              checked={useRewards}
              onChange={(e) => handleToggle(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden" />
          </label>
        ) : (
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
            {balance === 0 ? "0 pts available" : "Cart limit reached"}
          </span>
        )}
      </div>

      {/* Redemption active feedback */}
      <AnimatePresence>
        {useRewards && discountAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Redeeming <strong className="text-gray-900">{allowedPoints} points</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-700 text-sm">
                -₹{discountAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Earn back teaser for next order */}
      <div className="mt-3 pt-2 text-[11px] text-gray-500 flex items-center justify-between border-t border-gray-100">
        <span className="flex items-center gap-1 text-gray-600">
          <Sparkles className="h-3 w-3 text-amber-500" />
          You will earn ~{estimatedEarn} points back after payment
        </span>
        <span className="font-medium text-emerald-700">2.5% Cashback</span>
      </div>
    </div>
  );
}
