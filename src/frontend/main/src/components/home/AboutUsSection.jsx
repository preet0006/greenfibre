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
              Sustainability, Simplified
            </h2>

            {/* Description */}
            <div className="mb-8 space-y-4 text-base leading-relaxed text-gray-600 sm:text-lg">
              <p>
                At Green Fibre, we believe that sustainable living shouldn't be
                complicated. We're on a mission to make eco-friendly choices
                accessible, affordable, and beautiful.
              </p>
              <p>
                Every product in our collection is carefully curated to reduce
                environmental impact while enhancing your daily life. From
                biodegradable essentials to reusable innovations, we're here to
                help you build a greener future, one choice at a time.
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="mb-2 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <stat.icon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
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
