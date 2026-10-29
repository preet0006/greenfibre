"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import useRewardStore from "@/store/useRewardStore";

export default function CoinBurstAnimation({
  pointsEarned = 0,
  newBalance = null,
  orderId = "",
}) {
  const triggerCoinAnimation = useRewardStore((s) => s.triggerCoinAnimation);
  const clearCoinAnimation = useRewardStore((s) => s.clearCoinAnimation);
  const setBalance = useRewardStore((s) => s.setBalance);
  const fetchRewardsSummary = useRewardStore((s) => s.fetchRewardsSummary);

  const storageKey = orderId ? `reward_anim_${orderId}` : null;

  // Check if animation has already completed for this order
  const isAlreadyPlayed = useCallback(() => {
    if (typeof window === "undefined" || !storageKey) return false;
    try {
      return sessionStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }, [storageKey]);

  // Phase: 'idle' | 'burst' | 'flying' | 'done'
  const [phase, setPhase] = useState(() => {
    if (!pointsEarned || pointsEarned <= 0) return "done";
    if (typeof window !== "undefined" && storageKey) {
      try {
        if (sessionStorage.getItem(storageKey) === "true") return "done";
      } catch {}
    }
    return "idle";
  });

  const [destCoords, setDestCoords] = useState({ x: 0, y: 0 });
  const timersRef = useRef([]);

  // Generate 10 gold coin particles with deterministic scatter angles
  const particles = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * Math.PI * 2 + ((i % 2 === 0 ? 1 : -1) * 0.15);
      const distance = 58 + (i % 4) * 14;
      return {
        id: i,
        burstX: Math.cos(angle) * distance,
        burstY: Math.sin(angle) * distance,
        spreadX: ((i % 5) - 2) * 12,
        delay: i * 0.035,
        scale: 0.85 + (i % 3) * 0.15,
      };
    });
  }, []);

  // Compute destination coordinates (towards the reward points card below, or down the page)
  const computeDestination = useCallback(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };

    // 1. Target the on-page "Reward Points Credited" card below
    const targetCard = document.getElementById("reward-points-card");
    if (targetCard) {
      const rect = targetCard.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: rect.left + Math.min(rect.width / 2, 70),
          y: rect.top + rect.height / 2,
        };
      }
    }

    // 2. Fallback: Target the navbar RewardsBadge
    const navbarBadge = document.getElementById("rewards-navbar-badge");
    if (navbarBadge) {
      const rect = navbarBadge.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    // 3. Fallback: Stream downward into page
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + 250,
    };
  }, []);

  const finish = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    setPhase("done");

    if (storageKey && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, "true");
      } catch {}
    }

    if (newBalance != null) setBalance(newBalance);
    fetchRewardsSummary();
    clearCoinAnimation();
  }, [storageKey, newBalance, setBalance, fetchRewardsSummary, clearCoinAnimation]);

  useEffect(() => {
    if (!pointsEarned || pointsEarned <= 0 || isAlreadyPlayed()) {
      return;
    }

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const t = setTimeout(finish, 0);
      timersRef.current.push(t);
      return;
    }

    // Clear any pending timers before scheduling fresh ones
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    // Phase 1: Burst outwards around celebration banner
    const t0 = setTimeout(() => {
      setDestCoords(computeDestination());
      setPhase("burst");
    }, 30);

    // Phase 2: Stream smoothly downwards into the reward points wallet card
    const t1 = setTimeout(() => {
      setDestCoords(computeDestination());
      setPhase("flying");
      triggerCoinAnimation(pointsEarned);
    }, 600);

    // Phase 3: Complete animation, mark played, and unmount completely
    const t2 = setTimeout(() => {
      finish();
    }, 1550);

    // Hard fallback safety: guarantee dismissal even if transitions hiccup
    const tSafety = setTimeout(() => {
      finish();
    }, 2400);

    timersRef.current = [t0, t1, t2, tSafety];

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [pointsEarned, orderId, isAlreadyPlayed, computeDestination, triggerCoinAnimation, finish]);

  // If not in active phases, render nothing
  if (!pointsEarned || pointsEarned <= 0 || phase === "idle" || phase === "done") {
    return null;
  }

  const isFlying = phase === "flying";
  const screenCenterX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const screenCenterY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

  // Target delta relative to viewport center
  const targetDeltaX = (destCoords.x || screenCenterX) - screenCenterX;
  const targetDeltaY = (destCoords.y || screenCenterY + 200) - screenCenterY;

  return (
    <div
      onClick={finish}
      className="fixed inset-0 pointer-events-none z-[120] flex items-center justify-center"
      title="Click to dismiss"
    >
      <AnimatePresence>
        {/* Floating Celebration Toast Banner */}
        <motion.div
          key="reward-toast"
          initial={{ opacity: 0, scale: 0.6, y: 15 }}
          animate={
            isFlying
              ? { opacity: 0, scale: 0.9, y: 35 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            duration: isFlying ? 0.45 : 0.35,
            ease: "easeOut",
          }}
          className="relative pointer-events-auto cursor-pointer flex items-center gap-2.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-6 py-3 text-white shadow-2xl hover:scale-105 transition-transform"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-amber-600 shadow-xs">
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-tight">
              +{pointsEarned} Reward Points Earned!
            </span>
            <Sparkles className="h-4 w-4 text-yellow-200 animate-spin" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Gold Coin Particles streaming down into the wallet card */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={
            isFlying
              ? {
                  x: targetDeltaX + p.spreadX,
                  y: targetDeltaY,
                  scale: 0.2,
                  opacity: [1, 0.8, 0],
                }
              : {
                  x: p.burstX,
                  y: p.burstY,
                  scale: p.scale,
                  opacity: 1,
                }
          }
          transition={
            isFlying
              ? {
                  duration: 0.65,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: p.delay,
                }
              : {
                  duration: 0.4,
                  ease: "easeOut",
                }
          }
          className="absolute flex h-7 w-7 items-center justify-center rounded-full border-2 border-yellow-200 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 shadow-lg text-amber-950 font-black text-[11px]"
        >
          🪙
        </motion.div>
      ))}
    </div>
  );
}
