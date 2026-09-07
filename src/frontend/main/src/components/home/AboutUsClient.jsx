"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  Heart,
  Users,
  Target,
  Award,
  TrendingUp,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Leaf,
      title: "100% Sustainable",
      description:
        "Every product we offer is carefully selected to minimize environmental impact and promote sustainable living.",
    },
    {
      icon: Heart,
      title: "Ethically Sourced",
      description:
        "We partner with suppliers who share our commitment to fair trade, ethical labor practices, and environmental responsibility.",
    },
    {
      icon: Users,
      title: "Community Focused",
      description:
        "We believe in building a community of conscious consumers who care about the planet and future generations.",
    },
    {
      icon: Award,
      title: "Quality First",
      description:
        "Sustainability never compromises quality. We ensure every product meets our high standards for durability and performance.",
    },
  ];

  const milestones = [
    {
      year: "2020",
      title: "The Beginning",
      description:
        "Green Fibre was founded with a simple mission: make sustainable living accessible to everyone.",
    },
    {
      year: "2021",
      title: "Growing Impact",
      description:
        "Reached 10,000+ customers and planted our first 50,000 trees through our reforestation program.",
    },
    {
      year: "2022",
      title: "Carbon Neutral",
      description:
        "Achieved carbon-neutral operations across our entire supply chain and delivery network.",
    },
    {
      year: "2023",
      title: "Expansion",
      description:
        "Expanded our product line to 500+ eco-friendly items and launched our zero-waste initiative.",
    },
    {
      year: "2024",
      title: "Community of 100k+",
      description:
        "Built a thriving community of conscious consumers making sustainable choices every day.",
    },
  ];

  const stats = [
    { number: "100k+", label: "Happy Customers" },
    { number: "500+", label: "Eco Products" },
    { number: "250k+", label: "Trees Planted" },
    { number: "100%", label: "Carbon Neutral" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-green-50 to-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-6">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Our Story
                </span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Engineering Green Products
                <br />
                From Rice Husk
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Green Fibre is a green material innovation brand. We blend agricultural rice husk 
                with recyclable polymers to replace virgin plastic, prevent stubble burning, and craft stronger, 
                high-durability everyday essentials for modern homes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Shop Sustainable
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-green-600 hover:text-green-600 transition-colors"
                >
                  Get in Touch
                </Link>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-96 lg:h-125 rounded-3xl overflow-hidden shadow-xl"
            >
              {/* Replace with your actual hero image */}
              {/* <div className="absolute inset-0 bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center">
                <div className="text-center">
                  <Leaf className="w-20 h-20 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Hero Image</p>
                  <p className="text-sm text-gray-500">1200x1000px</p>
                </div>
              </div> */}
              {/* Uncomment when you have the image */}
              <Image
                src="/about-1.jpg"
                alt="Green Fibre - Sustainable Living"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-y border-gray-100 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p
                  className="text-4xl sm:text-5xl font-semibold text-green-600 mb-2"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  {stat.number}
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Our Story Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-96 lg:h-125 rounded-3xl overflow-hidden shadow-xl order-2 lg:order-1"
          >
            {/* Replace with your actual story image */}
            {/* <div className="absolute inset-0 bg-linear-to-br from-green-50 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <Heart className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Story Image</p>
                <p className="text-sm text-gray-500">1200x1000px</p>
              </div>
            </div> */}
            {/* Uncomment when you have the image */}
            <Image
              src="/about-2.png"
              alt="Our Story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <h2
              className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-6"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Story
            </h2>

            <div className="space-y-4 text-base text-gray-700 leading-relaxed">
              <p>
                Green Fibre was founded to solve a critical environmental dilemma: every harvest season, 
                millions of metric tons of agricultural rice husk (the outer hull of rice grains) are burned 
                in fields as farm waste, generating toxic smoke and severe air pollution. At the same time, 
                our landfills are choked with non-biodegradable virgin plastics.
              </p>

              <p>
                We asked a simple question: <em>Why treat agricultural biomass as waste when it can replace plastic?</em>
              </p>

              <p>
                By engineering an advanced compounding process, we blend pulverized rice husk fibers with durable, 
                recyclable polymers. The resulting bio-composite delivers the best of both worlds: it significantly 
                reduces virgin petroleum plastics, prevents crop burning, and creates homeware, planters, drinkware, 
                and containers with higher structural rigidity, superior drop resistance, and an authentic natural speckled texture.
              </p>

              <p>
                We are not a clothing or textile brand. We are an eco-materials company crafting long-lasting, 
                food-safe, and sustainable lifestyle essentials that make daily green living effortless and beautiful.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Our Values Section */}
      <div className="bg-linear-to-b from-green-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from product selection to
              customer service.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <value.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Mission Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-6">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Our Mission
              </span>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-6"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Making Sustainability
              <br />
              Accessible to All
            </h2>

            <div className="space-y-4 text-base text-gray-700 leading-relaxed">
              <p>
                Our mission is simple yet ambitious: make sustainable living the
                default choice, not the alternative. We believe everyone
                deserves access to products that are good for them and good for
                the planet.
              </p>

              <p>
                We're committed to breaking down the barriers—cost, convenience,
                and awareness—that prevent people from making eco-friendly
                choices. Through education, innovation, and community building,
                we're creating a world where sustainability is accessible,
                affordable, and aspirational.
              </p>

              <div className="bg-green-50 rounded-2xl p-6 border border-green-100 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Our Commitment
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 shrink-0" />
                    <span>Plant one tree for every order placed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 shrink-0" />
                    <span>Use 100% recyclable and biodegradable packaging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 shrink-0" />
                    <span>Maintain carbon-neutral operations and delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 shrink-0" />
                    <span>
                      Partner only with ethical and sustainable suppliers
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-96 lg:h-125 rounded-3xl overflow-hidden shadow-xl"
          >
            {/* Replace with your actual mission image */}
            {/* <div className="absolute inset-0 bg-linear-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-center">
                <Target className="w-20 h-20 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Mission Image</p>
                <p className="text-sm text-gray-500">1200x1000px</p>
              </div>
            </div> */}
            {/* Uncomment when you have the image */}
            <Image
              src="/about-3.jpg"
              alt="Our Mission"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-linear-to-b from-white to-green-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From a small startup to a thriving sustainable marketplace.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-200 -translate-x-1/2" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative grid grid-cols-1 lg:grid-cols-2 gap-8 ${
                    index % 2 === 0 ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`${
                      index % 2 === 0
                        ? "lg:text-right lg:pr-12"
                        : "lg:pl-12 lg:col-start-2"
                    }`}
                  >
                    <div
                      className={`inline-block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${
                        index % 2 === 0 ? "lg:ml-auto" : ""
                      }`}
                    >
                      <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 mb-4">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-bold text-green-700">
                          {milestone.year}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="hidden lg:block absolute left-1/2 top-8 w-4 h-4 bg-green-600 rounded-full -translate-x-1/2 ring-4 ring-white" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            Join Our Sustainable Journey
          </h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
            Be part of a growing community making a positive impact on the
            planet, one sustainable choice at a time.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
