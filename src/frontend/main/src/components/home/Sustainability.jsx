"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  TreePine,
  Recycle,
  Droplet,
  Wind,
  Package,
  Heart,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function SustainabilityPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const impactMetrics = [
    {
      icon: TreePine,
      number: "250,000+",
      label: "Trees Planted",
      description: "One tree planted for every order",
      color: "green",
    },
    {
      icon: Recycle,
      number: "100%",
      label: "Recyclable Packaging",
      description: "Zero plastic, all biodegradable",
      color: "green",
    },
    {
      icon: Wind,
      number: "Carbon Neutral",
      label: "Operations",
      description: "Net-zero carbon emissions",
      color: "green",
    },
    {
      icon: Droplet,
      number: "50M+",
      label: "Liters Water Saved",
      description: "Through sustainable products",
      color: "green",
    },
  ];

  const initiatives = [
    {
      icon: TreePine,
      title: "Reforestation Program",
      description:
        "For every order placed, we plant one tree in partnership with environmental organizations across India. Our goal is to plant 1 million trees by 2025.",
      impact: "250,000 trees planted since 2020",
      image: "sus-1.jpg",
    },
    {
      icon: Package,
      title: "Zero-Waste Packaging",
      description:
        "All our packaging is made from 100% recycled and biodegradable materials. We've eliminated plastic completely and use plant-based inks for printing.",
      impact: "500+ tons of plastic avoided",
      image: "sus-2.jpg",
    },
    {
      icon: Wind,
      title: "Carbon-Neutral Delivery",
      description:
        "We partner with eco-conscious courier services and offset 100% of carbon emissions from shipping through verified carbon credit programs.",
      impact: "10,000 tons CO₂ offset annually",
      image: "sus-3.jpg",
    },
    {
      icon: Droplet,
      title: "Water Conservation",
      description:
        "Our products are sourced from manufacturers using water-efficient processes. We prioritize suppliers who implement water recycling systems.",
      impact: "50M+ liters of water saved",
      image: "sus-4.avif",
    },
    {
      icon: Recycle,
      title: "Circular Economy",
      description:
        "We encourage product returns for recycling and upcycling. Items that can't be resold are broken down and repurposed responsibly.",
      impact: "95% waste diversion rate",
      image: "sus-5.avif",
    },
  ];

  const certifications = [
    { name: "Carbon Neutral Certified", icon: Wind },
    { name: "Plastic Free", icon: Recycle },
    { name: "Ethical Trade", icon: Heart },
    { name: "100% Sustainable", icon: Leaf },
  ];

  const commitments = [
    "Source 100% of products from sustainable and ethical suppliers",
    "Maintain carbon-neutral operations across our entire supply chain",
    "Use only biodegradable and recyclable packaging materials",
    "Plant one tree for every order placed on our platform",
    "Achieve zero-waste operations by 2025",
    "Support local communities through fair trade partnerships",
    "Educate 100,000 people about sustainable living by 2025",
    "Offset 100% of shipping emissions through verified programs",
  ];

  const goals2025 = [
    {
      icon: TreePine,
      title: "1 Million Trees",
      description: "Plant 1 million trees across India",
      progress: 25,
    },
    {
      icon: Package,
      title: "Zero Waste",
      description: "Achieve 100% zero-waste operations",
      progress: 75,
    },
    {
      icon: Users,
      title: "1M Community",
      description: "Build a community of 1 million eco-warriors",
      progress: 10,
    },
    {
      icon: Zap,
      title: "Renewable Energy",
      description: "Power operations with 100% renewable energy",
      progress: 60,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-green-50 to-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-6"
            >
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Our Impact
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Building a Greener Future,
              <br />
              One Order at a Time
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8"
            >
              Sustainability isn't just a buzzword for us—it's our core mission.
              From carbon-neutral delivery to reforestation programs, we're
              committed to making a positive impact on our planet.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Shop Sustainable
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <metric.icon className="w-8 h-8 text-green-600" />
                </div>
                <p
                  className="text-3xl sm:text-4xl font-semibold text-green-600 mb-2"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  {metric.number}
                </p>
                <p className="text-base font-semibold text-gray-900 mb-1">
                  {metric.label}
                </p>
                <p className="text-sm text-gray-600">{metric.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Initiatives Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Our Sustainability Initiatives
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive programs driving real environmental impact.
          </p>
        </motion.div>

        <div className="space-y-20">
          {initiatives.map((initiative, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <initiative.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3
                  className="text-2xl font-semibold text-gray-900 mb-4"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  {initiative.title}
                </h3>
                <p className="text-base text-gray-700 leading-relaxed mb-6">
                  {initiative.description}
                </p>
                <div className="inline-flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {initiative.impact}
                  </span>
                </div>
              </div>

              {/* Image */}
              <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                <div className="relative h-80 lg:h-96 rounded-3xl overflow-hidden shadow-lg">
                  {/* Replace with your actual initiative images */}
                  {/* <div className="absolute inset-0 bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <div className="text-center">
                      <initiative.icon className="w-20 h-20 text-green-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        {initiative.title} Image
                      </p>
                      <p className="text-sm text-gray-500">1000x800px</p>
                    </div>
                  </div> */}
                  {/* Uncomment when you have images */}
                  <Image
                    src={`/${initiative.image}`}
                    alt={initiative.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-linear-to-b from-white to-green-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Certifications
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Verified commitments to sustainability and ethical practices.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {cert.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Commitments */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-96 lg:h-125 rounded-3xl overflow-hidden shadow-xl"
          >
            {/* Replace with your actual commitment image */}
            {/* <div className="absolute inset-0 bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-center">
                <Target className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Commitments Image</p>
                <p className="text-sm text-gray-500">1200x1000px</p>
              </div>
            </div> */}
            {/* Uncomment when you have the image */}
            <Image
              src="/sus-6.jpg"
              alt="Our Commitments"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-6"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Commitments
            </h2>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              We hold ourselves accountable to the highest standards of
              environmental and social responsibility. These are the promises we
              make to our planet and community.
            </p>
            <div className="space-y-3">
              {commitments.map((commitment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{commitment}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2025 Goals */}
      {/* <div className="bg-linear-to-b from-green-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              2025 Goals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ambitious targets driving us toward a more sustainable future.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {goals2025.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <goal.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-green-600">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${goal.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-linear-to-r from-green-500 to-green-600 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div> */}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="bg-linear-to-br from-green-600 to-green-700 rounded-3xl p-12 text-center text-white shadow-xl">
          <Leaf className="w-16 h-16 mx-auto mb-6 text-green-200" />
          <h2
            className="text-3xl sm:text-4xl font-semibold mb-4"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Make a Difference Today
          </h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
            Every purchase you make contributes to a greener planet. Join
            thousands of eco-conscious consumers making sustainable choices.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors"
          >
            Start Shopping Sustainably
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
