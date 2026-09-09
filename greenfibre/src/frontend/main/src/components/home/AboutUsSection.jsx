"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Heart, Users, Award } from "lucide-react";

export default function AboutUsSection() {
  const stats = [
    {
      icon: Users,
      value: "10K+",
      label: "Happy Customers",
    },
    {
      icon: Leaf,
      value: "100+",
      label: "Eco Products",
    },
    {
      icon: Award,
      value: "5 Years",
      label: "Experience",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      {/* Background Pattern */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #15803d 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Main Image */}
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-gray-100 shadow-2xl">
              <Image
                src="/home-about.jpg" // Replace with your actual image
                alt="Green Fibre - Sustainable Living"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="absolute -bottom-6 -right-6 rounded-2xl border border-green-100 bg-white p-6 shadow-xl sm:-bottom-8 sm:-right-8"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Heart className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-sm text-gray-600">Sustainable</p>
                </div>
              </div>
            </motion.div>

           
          </motion.div>

          {/* Right - Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Label */}
            <div className="mb-4 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-green-600">
                About Us
              </span>
            </div>

            {/* Heading */}
            <h2
              className="mb-6 text-4xl font-semibold text-gray-900 sm:text-5xl lg:text-6xl"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              The Science of Rice Husk Bio-Composites
            </h2>

            {/* Description */}
            <div className="mb-8 space-y-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              <p>
                <strong className="text-gray-900 font-semibold">GreenFibre is not an apparel or clothing brand.</strong> We are a pioneering green manufacturing brand dedicated to solving two urgent environmental crises: agricultural crop stubble burning and single-use plastic waste.
              </p>
              <p>
                By blending <strong className="text-gray-900 font-semibold">agricultural rice husk</strong> — the protective outer shell of rice grains that is traditionally burned — with recyclable polymers, we engineer a reinforced bio-composite material.
              </p>
              <p>
                The outcome is extraordinary: <span className="text-green-700 font-medium">up to 40%+ reduction in virgin plastic</span>, significantly enhanced structural rigidity, higher impact strength, and a naturally warm, organic speckled texture that makes every tableware and home item look and feel premium.
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">40%+</p>
                <p className="text-xs text-gray-600 sm:text-sm">Virgin Plastic Saved</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">2x</p>
                <p className="text-xs text-gray-600 sm:text-sm">Higher Durability</p>
              </div>
              <div className="text-center">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">100%</p>
                <p className="text-xs text-gray-600 sm:text-sm">Food-Grade & BPA Free</p>
              </div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl"
              >
                Learn More About Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
