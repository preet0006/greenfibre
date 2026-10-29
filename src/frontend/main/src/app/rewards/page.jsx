"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Coins,
  Sparkles,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  HelpCircle,
  Gift,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import useRewardStore from "@/store/useRewardStore";
import useUserStore from "@/store/useUserStore";

export default function RewardsHubPage() {
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);
  const balance = useRewardStore((s) => s.balance);
  const history = useRewardStore((s) => s.history);
  const config = useRewardStore((s) => s.config);
  const loading = useRewardStore((s) => s.loading);
  const fetchRewardsSummary = useRewardStore((s) => s.fetchRewardsSummary);

  const [filter, setFilter] = useState("all"); // 'all' | 'earn' | 'redeem'
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (user && user.accountType !== "B2B") {
      fetchRewardsSummary();
    }
  }, [user, fetchRewardsSummary]);

  // Statistics
  const stats = useMemo(() => {
    let lifetimeEarned = 0;
    let lifetimeRedeemed = 0;

    (history || []).forEach((h) => {
      if (h.type === "EARN" || (h.type === "ADJUST" && h.points > 0)) {
        lifetimeEarned += h.points;
      } else if (h.type === "REDEEM") {
        lifetimeRedeemed += h.points;
      }
    });

    return {
      lifetimeEarned,
      lifetimeRedeemed,
    };
  }, [history]);

  // Filtered ledger
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (filter === "earn") {
      return history.filter(
        (h) => h.type === "EARN" || h.type === "REVERSE_REDEEM" || (h.type === "ADJUST" && h.points > 0)
      );
    }
    if (filter === "redeem") {
      return history.filter(
        (h) => h.type === "REDEEM" || h.type === "REVERSE_EARN" || (h.type === "ADJUST" && h.points < 0)
      );
    }
    return history;
  }, [history, filter]);

  const faqs = [
    {
      q: "How do I earn GreenFibre Reward Points?",
      a: "You earn 2.5% of your paid item total back in reward points on every completed order. Points are credited immediately upon payment confirmation.",
    },
    {
      q: "How do I redeem my points?",
      a: "From your 2nd order onwards, you'll see a toggle switch at checkout to redeem your points. 1 point = ₹1 discount (up to 2.5% of your cart value).",
    },
    {
      q: "Do GreenFibre points expire?",
      a: "Currently, GreenFibre points have no expiry date! You can accumulate and redeem them whenever you shop.",
    },
    {
      q: "What happens if I cancel an order or return items?",
      a: "If an order is cancelled or refunded, any points you spent on it are restored to your balance, and any points earned on it are reversed automatically.",
    },
    {
      q: "Can B2B wholesale buyers earn reward points?",
      a: "Reward points are designed for retail B2C customers. B2B enterprise buyers enjoy custom wholesale volume pricing and GST credit invoices instead.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20 pt-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-8 sm:p-10 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" /> GreenFibre Customer Rewards
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Your Reward Points Hub
              </h1>
              <p className="max-w-md text-sm text-emerald-100/90 leading-relaxed">
                Earn 2.5% points back on every sustainable order. Redeem them like cash (1 pt = ₹1) on all future purchases.
              </p>
            </div>

            {/* Current Balance Box */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md text-center md:text-right shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Available Balance
              </p>
              <div className="mt-2 flex items-baseline justify-center md:justify-end gap-2">
                <span className="text-5xl font-black tracking-tight text-white">
                  {balance.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-bold uppercase text-emerald-300">pts</span>
              </div>
              <p className="mt-1 text-xs font-medium text-emerald-200">
                Worth ₹{(balance * (config?.point_value || 1)).toLocaleString("en-IN")} on your next order
              </p>
              <div className="mt-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-green-700 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" /> Shop & Earn Points
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-300">Conversion Rate</p>
              <p className="mt-1 text-base font-bold text-white">1 Point = ₹1.00</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-300">Lifetime Points Earned</p>
              <p className="mt-1 text-base font-bold text-white">
                +{stats.lifetimeEarned.toLocaleString("en-IN")} pts
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] uppercase tracking-wider text-emerald-300">Lifetime Points Redeemed</p>
              <p className="mt-1 text-base font-bold text-white">
                {stats.lifetimeRedeemed.toLocaleString("en-IN")} pts
              </p>
            </div>
          </div>
        </div>

        {/* The 20% Formula Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                The GreenFibre 20% Value Formula
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                How your 20% total discount budget is delivered to you
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Triple Layer Savings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm">
                15%
              </div>
              <h3 className="text-sm font-bold text-gray-900">Direct Price Discount</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pre-discounted on every single catalog product. You get this instantly without entering any coupons.
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-gradient-to-b from-green-50/50 to-white p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white font-black text-sm">
                2.5%
              </div>
              <h3 className="text-sm font-bold text-gray-900">First-Order Welcome Coupon</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Use code <strong className="text-green-900 font-mono">FIRSTORDER</strong> on checkout for an extra 2.5% off on your introductory order.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-5 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm">
                2.5%
              </div>
              <h3 className="text-sm font-bold text-gray-900">Reward Points in Wallet</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                2.5% of your paid item total is credited right back into your points wallet to spend like cash on your 2nd purchase onward.
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Transaction History */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <p className="text-xs text-gray-500 mt-1">Complete audit log of all point movements</p>
            </div>

            {/* Filter buttons */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  filter === "all" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Movements
              </button>
              <button
                type="button"
                onClick={() => setFilter("earn")}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  filter === "earn" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Earned (+)
              </button>
              <button
                type="button"
                onClick={() => setFilter("redeem")}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  filter === "redeem" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Redeemed (-)
              </button>
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Points</th>
                    <th className="pb-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.map((item) => {
                    const isCredit =
                      item.type === "EARN" ||
                      item.type === "REVERSE_REDEEM" ||
                      (item.type === "ADJUST" && item.points > 0);

                    return (
                      <tr key={item.id || item._id} className="hover:bg-gray-50/50">
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold uppercase text-[10px] ${
                              isCredit
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isCredit ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="py-4 text-gray-800 font-medium">
                          {item.reason || `${item.type} on order`}
                        </td>
                        <td className="py-4 text-gray-500">
                          {new Date(item.created_at || item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          className={`py-4 text-right font-bold text-sm ${
                            isCredit ? "text-emerald-700" : "text-gray-900"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {item.points} pts
                        </td>
                        <td className="py-4 text-right font-medium text-gray-500">
                          {item.balance_after != null ? `${item.balance_after} pts` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Clock className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-700">No transaction records found</p>
              <p className="mt-1 text-xs text-gray-500">
                When you make purchases or redeem points, your ledger history will be logged here.
              </p>
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed pr-6">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
