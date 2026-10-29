"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import useRewardStore from "@/store/useRewardStore";
import useUserStore from "@/store/useUserStore";

export default function RewardsBadge() {
  const badgeRef = useRef(null);
  const user = useUserStore((s) => s.user);
  const balance = useRewardStore((s) => s.balance);
  const enabled = useRewardStore((s) => s.enabled);
  const fetchRewardsSummary = useRewardStore((s) => s.fetchRewardsSummary);
  const setDrawerOpen = useRewardStore((s) => s.setDrawerOpen);
  const setBadgeRef = useRewardStore((s) => s.setBadgeRef);
  const animatingPoints = useRewardStore((s) => s.animatingPoints);

  const [displayBalance, setDisplayBalance] = useState(balance);
  const [pulse, setPulse] = useState(false);

  // Expose badge DOM element for particle/coin fly destination
  useEffect(() => {
    if (badgeRef.current) {
      setBadgeRef(badgeRef.current);
    }
  }, [setBadgeRef]);

  // Fetch summary when user logs in
  useEffect(() => {
    if (user && user.accountType !== "B2B") {
      fetchRewardsSummary();
    }
  }, [user, fetchRewardsSummary]);

  // Smooth number count-up animation when balance increases
  useEffect(() => {
    if (balance === displayBalance) return;

    setPulse(true);
    const start = displayBalance;
    const end = balance;
    const duration = 800;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.round(start + (end - start) * easeProgress);

      setDisplayBalance(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayBalance(end);
        setTimeout(() => setPulse(false), 300);
      }
    };

    requestAnimationFrame(updateCount);
  }, [balance]);

  // Don't show for B2B or if disabled
  if (!enabled || (user && user.accountType === "B2B")) {
    return null;
  }

  return (
    <motion.button
      ref={badgeRef}
      id="rewards-navbar-badge"
      type="button"
      onClick={() => setDrawerOpen(true)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={pulse || animatingPoints ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.4 }}
      className="relative flex h-10 items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
      title="View GreenFibre Rewards Wallet"
    >
      {/* Golden Coin Icon */}
      <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950 shadow-xs">
        <Coins className="h-3 w-3 text-amber-950" />
        <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 text-yellow-500 animate-pulse" />
      </span>

      {/* Points Counter */}
      <div className="flex flex-col items-start leading-tight">
        <span className="font-bold text-amber-950 tracking-tight">
          {displayBalance.toLocaleString("en-IN")}{" "}
          <span className="text-[10px] font-medium text-amber-700">pts</span>
        </span>
      </div>

      {/* Subtle glowing ring on point change */}
      <AnimatePresence>
        {(pulse || animatingPoints) && (
          <motion.span
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-amber-400"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
