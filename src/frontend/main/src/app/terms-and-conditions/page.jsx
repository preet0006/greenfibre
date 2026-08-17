"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  ShoppingBag,
  RefreshCw,
  CreditCard,
  Shield,
  Scale,
  AlertTriangle,
  Mail,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileCheck,
      content: [
        {
          text: "By accessing and using Green Fibre's website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.",
        },
        {
          text: "These terms apply to all visitors, users, and others who access or use our services. We reserve the right to update, change, or replace any part of these Terms and Conditions at any time.",
        },
      ],
    },
    {
      id: "products",
      title: "Products & Pricing",
      icon: ShoppingBag,
      content: [
        {
          subtitle: "Product Information",
          text: "We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions, colors, or other content are accurate, complete, reliable, current, or error-free.",
        },
        {
          subtitle: "Pricing",
          text: "All prices are listed in Indian Rupees (INR) and are subject to change without notice. We reserve the right to modify or discontinue products at any time without liability.",
        },
        {
          subtitle: "Product Availability",
          text: "We make every effort to ensure products shown on our website are available. However, we cannot guarantee availability of all products at all times. If a product becomes unavailable after your order, we will notify you promptly.",
        },
      ],
    },
    {
      id: "orders",
      title: "Orders & Payment",
      icon: CreditCard,
      content: [
        {
          subtitle: "Order Acceptance",
          text: "All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including suspected fraud, unauthorized transactions, or product unavailability.",
        },
        {
          subtitle: "Payment Processing",
          text: "Payment must be received in full before order processing. We accept major credit cards, debit cards, UPI, and other payment methods as displayed during checkout. All transactions are processed securely through our payment gateway.",
        },
        {
          subtitle: "Order Confirmation",
          text: "You will receive an email confirmation once your order is successfully placed. This confirmation does not signify our acceptance of your order, nor does it constitute a confirmation of our offer to sell.",
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping & Delivery",
      icon: RefreshCw,
      content: [
        {
          subtitle: "Shipping Areas",
          text: "We currently ship across India. Delivery times vary based on your location and product availability. Estimated delivery dates are provided at checkout.",
        },
        {
          subtitle: "Shipping Charges",
          text: "Shipping charges, if applicable, will be calculated and displayed during checkout. We may offer free shipping promotions from time to time, subject to terms and conditions.",
        },
        {
          subtitle: "Delivery",
          text: "We are not responsible for delays caused by shipping carriers or circumstances beyond our control. Risk of loss and title for items pass to you upon delivery to the carrier.",
        },
      ],
    },
    {
      id: "returns",
      title: "Returns & Refunds",
      icon: RefreshCw,
      content: [
        {
          subtitle: "Return Policy",
          text: "We accept returns within 7 days of delivery for eligible products in their original condition with tags attached. Certain products may not be eligible for return due to hygiene or safety reasons.",
        },
        {
          subtitle: "Refund Process",
          text: "Once we receive and inspect your returned item, we will process your refund within 5-7 business days. Refunds will be issued to the original payment method.",
        },
        {
          subtitle: "Return Shipping",
          text: "Return shipping costs are the responsibility of the customer unless the return is due to our error or a defective product.",
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: Shield,
      content: [
        {
          subtitle: "Copyright & Trademarks",
          text: "All content on this website, including text, graphics, logos, images, and software, is the property of Green Fibre or its content suppliers and is protected by international copyright and trademark laws.",
        },
        {
          subtitle: "Limited License",
          text: "You are granted a limited, non-exclusive, non-transferable license to access and use our website for personal, non-commercial purposes. You may not reproduce, distribute, modify, or create derivative works from our content without written permission.",
        },
      ],
    },
    {
      id: "user-conduct",
      title: "User Conduct",
      icon: Scale,
      content: [
        {
          subtitle: "Prohibited Activities",
          text: "You agree not to use our services for any unlawful purpose or in any way that could damage, disable, or impair our services. This includes unauthorized access, data scraping, or transmitting harmful code.",
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.",
        },
      ],
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Disclaimer of Warranties",
          text: "Our services are provided 'as is' without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, error-free, or secure.",
        },
        {
          subtitle: "Limitation of Damages",
          text: "To the maximum extent permitted by law, Green Fibre shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.",
        },
        {
          subtitle: "Maximum Liability",
          text: "Our total liability for any claims arising from these terms or your use of our services shall not exceed the amount you paid for products or services in the twelve months preceding the claim.",
        },
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law & Disputes",
      icon: Scale,
      content: [
        {
          subtitle: "Jurisdiction",
          text: "These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in [Your City], India.",
        },
        {
          subtitle: "Dispute Resolution",
          text: "We encourage you to contact us first to resolve any disputes. If we cannot resolve the matter informally, any legal action must be commenced within one year of the claim arising.",
        },
      ],
    },
    {
      id: "modifications",
      title: "Modifications to Terms",
      icon: FileCheck,
      content: [
        {
          text: "We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after changes constitutes acceptance of the modified terms.",
        },
        {
          text: "We recommend reviewing these terms periodically to stay informed of any updates. Material changes will be communicated via email or website notice.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-6"
          >
            <FileCheck className="w-8 h-8 text-green-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-4"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Terms & Conditions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Please read these terms carefully before using our services. These
            terms govern your use of Green Fibre's website and services.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-sm text-gray-500"
          >
            Last updated: January 1, 2025
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16 pb-12 border-b border-gray-100"
        >
          <p className="text-base text-gray-700 leading-relaxed mb-4">
            Welcome to Green Fibre. These Terms and Conditions outline the rules
            and regulations for the use of our website and the purchase of our
            eco-friendly products.
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            By accessing this website and making purchases, we assume you accept
            these terms and conditions. Do not continue to use Green Fibre if
            you do not agree to all of the terms and conditions stated on this
            page.
          </p>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-16">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              id={section.id}
              className="scroll-mt-24"
            >
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 shrink-0">
                  <section.icon className="w-6 h-6 text-green-600" />
                </div>
                <h2
                  className="text-2xl font-semibold text-gray-900"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  {section.title}
                </h2>
              </div>

              {/* Section Content */}
              <div className="space-y-6 pl-16">
                {section.content.map((item, i) => (
                  <div key={i}>
                    {item.subtitle && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.subtitle}
                      </h3>
                    )}
                    <p className="text-base text-gray-700 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 pt-12 border-t border-gray-100"
        >
          <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 shrink-0">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3
                  className="text-xl font-semibold text-gray-900 mb-2"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  Questions About Our Terms?
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  If you have any questions or concerns about these Terms and
                  Conditions, please contact our customer support team.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:support@greenfibre.com"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    support@greenfibre.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-100"
        >
          <p className="text-sm text-gray-500 mb-4">Related Policies:</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Shipping Policy", href: "/shipping-policy" },
              { label: "Refund Policy", href: "/refund-policy" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </motion.div>

        {/* Acknowledgment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-100"
        >
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Acknowledgment:</strong> By
              using Green Fibre's services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and Conditions.
              These terms constitute a legally binding agreement between you and
              Green Fibre.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
