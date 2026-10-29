"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Coins,
  Sparkles,
  ArrowRight,
  Gift,
  CheckCircle2,
  Copy,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Percent,
} from "lucide-react";
import Link from "next/link";
import useRewardStore from "@/store/useRewardStore";
import useUserStore from "@/store/useUserStore";
import toast from "react-hot-toast";

export default function RewardsDrawer() {
  const drawerOpen = useRewardStore((s) => s.drawerOpen);
  const setDrawerOpen = useRewardStore((s) => s.setDrawerOpen);
  const balance = useRewardStore((s) => s.balance);
  const history = useRewardStore((s) => s.history);
  const config = useRewardStore((s) => s.config);
  const hasCompletedFirstOrder = useRewardStore((s) => s.hasCompletedFirstOrder);
  const firstOrderCoupon = useRewardStore((s) => s.firstOrderCoupon);
  const fetchRewardsSummary = useRewardStore((s) => s.fetchRewardsSummary);
  const user = useUserStore((s) => s.user);

  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      fetchRewardsSummary();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, setDrawerOpen, fetchRewardsSummary]);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Coupon ${code} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const pointValueInRupees = (balance * (config?.point_value || 1)).toLocaleString("en-IN");

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Slide-over panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Coins className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">GreenFibre Rewards</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Golden Points Balance Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 text-white shadow-lg">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-emerald-500/30 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
                    <Sparkles className="h-3 w-3" /> Available Balance
                  </span>
                  <span className="text-xs text-emerald-200">1 Point = ₹1.00</span>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {balance.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                      Points
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-100">
                    Worth <span className="font-bold text-white">₹{pointValueInRupees}</span> discount on your orders
                  </p>
                </div>

                <div className="relative z-10 mt-5 border-t border-white/10 pt-3 flex items-center justify-between text-xs text-emerald-200">
                  <span>Earn 2.5% back on every purchase</span>
                  <span className="font-semibold text-white">Max 2.5% cart redeem</span>
                </div>
              </div>

              {/* First Order Coupon Card (if eligible) */}
              {!hasCompletedFirstOrder && (
                <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-xs">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-900">
                          First Order Welcome Gift
                        </span>
                        <span className="rounded-full bg-green-200/80 px-2 py-0.5 text-[10px] font-bold text-green-900">
                          2.5% OFF
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-green-900/80">
                        Use coupon code for an instant 2.5% discount on your first order.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-md border border-green-300 text-green-950">
                          {firstOrderCoupon?.code || "FIRSTORDER"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCoupon(firstOrderCoupon?.code || "FIRSTORDER")}
                          className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* The 20% Value Breakdown explainer */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    The 20% Value Formula
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                    Budget Distribution
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-xl bg-white p-2.5 border border-gray-200/60 shadow-2xs">
                    <span className="text-base font-extrabold text-emerald-700">15%</span>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-600">Direct Price Discount</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-gray-200/60 shadow-2xs">
                    <span className="text-base font-extrabold text-amber-600">2.5%</span>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-600">First-Order Coupon</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-gray-200/60 shadow-2xs">
                    <span className="text-base font-extrabold text-blue-600">2.5%</span>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-600">Points Back into Wallet</p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                  Earn points automatically on completed orders. Redeem them like cash at checkout starting from your 2nd purchase!
                </p>
              </div>

              {/* Points History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Recent Activity
                  </h3>
                  <Link
                    href="/rewards"
                    onClick={() => setDrawerOpen(false)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {history && history.length > 0 ? (
                  <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-2xs overflow-hidden">
                    {history.slice(0, 5).map((entry) => {
                      const isCredit =
                        entry.type === "EARN" ||
                        entry.type === "REVERSE_REDEEM" ||
                        (entry.type === "ADJUST" && entry.points > 0);

                      return (
                        <div key={entry.id || entry._id} className="flex items-center justify-between p-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                isCredit
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                {entry.reason || entry.type}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(entry.created_at || entry.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isCredit ? "text-emerald-700" : "text-gray-900"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {entry.points} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                    <Clock className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-xs font-semibold text-gray-700">No activity yet</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Points credited after your first order payment will show up here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <Link
                href="/rewards"
                onClick={() => setDrawerOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Go to Rewards Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
