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
  modelUrl = process.env.NEXT_PUBLIC_HERO_3D_MODEL_URL || "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789734715/bottle_xg3utw.glb",
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
        {/* ================= MOBILE HERO (matches mockup) ================= */}
        <div className="lg:hidden space-y-4">
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Left Content Column */}
            <div className="col-span-7 space-y-2.5 text-left pr-1">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                <Leaf className="h-3 w-3 text-green-600 shrink-0" />
                <span className="truncate">Natural Materials, Brighter Tomorrow</span>
              </div>

              {/* Main Headline */}
              <h1
                className="text-[26px] xs:text-[28px] font-bold tracking-tight text-gray-900 leading-[1.15]"
                style={{
                  fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                From Crop Stubble to{" "}
                <span className="text-green-600 block">Sustainable Luxury</span>
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-[11px] leading-relaxed font-normal line-clamp-3">
                Eco-luxury home essentials crafted from crop residues — turning agricultural waste into beautiful, durable products for a cleaner, greener planet.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-green-700 transition-colors"
                >
                  <span>Shop Our Collection</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-gray-700 shadow-2xs hover:bg-green-50/50 transition-colors"
                >
                  <Compass className="h-3 w-3 text-green-600" />
                  <span>Learn More</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Bottle */}
            <div className="col-span-5 relative flex items-center justify-center overflow-hidden">
              <Hero3DViewer
                modelSrc={modelUrl}
                title="Green Fibre 3D Eco Insulated Bottle"
              />
            </div>
          </div>

          {/* Benefit icons in a compact horizontal row */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-green-200/70 bg-white/90 p-2.5 shadow-2xs text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-800">
              <Leaf className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>Eco-friendly</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-800 border-x border-gray-100 px-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>Durable</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-800">
              <Sparkles className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>Sustainable</span>
            </div>
          </div>
        </div>

        {/* ================= DESKTOP HERO (100% UNCHANGED) ================= */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">

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
