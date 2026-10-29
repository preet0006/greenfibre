"use client";

import { useMemo } from "react";
import { Tag, Coins, ShieldCheck, CheckCircle2 } from "lucide-react";
import useRewardStore from "@/store/useRewardStore";

export default function CheckoutBreakdown({
  originalTotal = 0,
  subtotal = 0,
  productSavings = 0,
  couponDiscount = 0,
  rewardDiscount = 0,
  finalTotal = 0,
  appliedCoupon = null,
  pointsRedeemed = 0,
}) {
  const config = useRewardStore((s) => s.config);

  // Total savings across direct discount + coupon + reward points
  const totalSavings = useMemo(() => {
    return Math.max(0, productSavings + couponDiscount + rewardDiscount);
  }, [productSavings, couponDiscount, rewardDiscount]);

  // Points that will be earned on this order
  const pointsToEarn = useMemo(() => {
    if (!finalTotal || finalTotal <= 0) return 0;
    return Math.floor((finalTotal * (config?.earn_percent || 2.5)) / 100);
  }, [finalTotal, config]);

  return (
    <div className="space-y-4">
      {/* 20% Formula Value Badge Banner */}
      {totalSavings > 0 && (
        <div className="rounded-xl bg-green-600 p-3.5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Budget Savings
            </span>
            <span className="font-extrabold text-sm text-amber-200">
              Save ₹{Math.round(totalSavings).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* Itemized Line Items */}
      <div className="space-y-2 text-xs">
        {/* MRP Total */}
        {originalTotal > subtotal && (
          <div className="flex justify-between text-gray-500">
            <span>Total MRP</span>
            <span className="line-through">₹{Math.round(originalTotal).toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* 15% Direct Discount */}
        {productSavings > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              15% Direct Catalog Discount
            </span>
            <span>-₹{Math.round(productSavings).toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Catalog Subtotal */}
        <div className="flex justify-between text-gray-700 font-medium pt-1">
          <span>Catalog Item Total</span>
          <span>₹{Math.round(subtotal).toLocaleString("en-IN")}</span>
        </div>

        {/* Coupon Discount */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-amber-700 font-medium">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-amber-600" />
              Coupon ({appliedCoupon?.code || "Promo"})
            </span>
            <span>-₹{Math.round(couponDiscount).toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Reward Points Discount */}
        {rewardDiscount > 0 && (
          <div className="flex justify-between text-emerald-800 font-medium">
            <span className="flex items-center gap-1.5">
              <Coins className="h-3 w-3 text-amber-500" />
              Reward Points ({pointsRedeemed} pts)
            </span>
            <span className="font-bold">-₹{Math.round(rewardDiscount).toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between text-gray-600">
          <span>Shipping & Handling</span>
          <span className="font-semibold text-emerald-700 uppercase text-[11px]">Free</span>
        </div>

        {/* Earn teaser */}
        <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-amber-500" />
            Reward points earned on this order
          </span>
          <span className="font-bold text-amber-700">+{pointsToEarn} pts</span>
        </div>
      </div>
    </div>
  );
}
