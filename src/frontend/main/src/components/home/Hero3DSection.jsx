"use client";

import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Star,
  CheckCircle2,
  Compass,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Hero3DViewer from "./Hero3DViewer";

export default function Hero3DSection({
  modelUrl = process.env.NEXT_PUBLIC_HERO_3D_MODEL_URL || "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789382471/green-fibre-bottle-logo-only_q97ih2.glb",
}) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-green-50/60 via-white to-green-50/30 text-gray-900 border-b border-green-100 py-6 sm:py-8 lg:py-10">
      {/* Soft Ambient Light Green Glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-green-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

      {/* Subtle organic pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #16a34a 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* ================= LEFT COLUMN: COMPACT CLEAN EDITORIAL ================= */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">

            {/* Top Innovation Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-700 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <Leaf className="h-3.5 w-3.5 text-green-600" />
              <span>100% Crop Stubble & Rice Husk Innovation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.14]">
              From Crop Stubble to{" "}
              <span className="text-green-600">
                Sustainable Luxury
              </span>
            </h1>

            {/* Narrative Story Copy */}
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-lg">
              We give agricultural by-products a new purpose, creating thoughtfully designed tableware, bottles, and lifestyle essentials for everyday living.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/shop"
                className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-green-600/25 transition-all duration-300 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore Collection</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium uppercase tracking-wider text-gray-700 shadow-xs transition-all duration-300 hover:border-green-600 hover:text-green-700 hover:bg-green-50/50"
              >
                <Compass className="h-4 w-4 text-green-600" />
                <span>About Us</span>
              </Link>
            </div>

            {/* Product Feature Highlights Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-green-100/80 shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Leaf className="h-4 w-4" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                  Rice husk fibre body
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-green-100/80 shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                  Jute loop
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-green-100/80 shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                  Food-safe liner
                </p>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                <Leaf className="h-3.5 w-3.5 text-green-600" />
                Eco Friendly
              </span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                BPA Free
              </span>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: 3D 360° PURE BOTTLE STAGE ================= */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end">

            {/* Transparent 3D Stage shifted further right */}
            <div className="relative w-full max-w-[480px] flex items-center justify-center lg:justify-end lg:translate-x-14 xl:translate-x-24 2xl:translate-x-28">
              <Hero3DViewer
                modelSrc={modelUrl}
                title="Green Fibre 3D Eco Insulated Bottle"
              />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
