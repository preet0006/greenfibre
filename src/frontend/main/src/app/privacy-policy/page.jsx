"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Bell,
  Mail,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: FileText,
      content: [
        {
          subtitle: "Personal Information",
          text: "We collect information you provide directly to us, including your name, email address, phone number, shipping address, billing address, and payment information when you make a purchase or create an account.",
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect certain information about your device and how you interact with our website, including your IP address, browser type, pages visited, and the time and date of your visits.",
        },
        {
          subtitle: "Cookies and Tracking",
          text: "We use cookies and similar tracking technologies to enhance your experience, analyze site traffic, and understand user behavior. You can control cookie settings through your browser preferences.",
        },
      ],
    },
    {
      id: "use-of-information",
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        {
          subtitle: "Order Processing",
          text: "We use your information to process and fulfill your orders, communicate with you about your purchases, and provide customer support.",
        },
        {
          subtitle: "Service Improvement",
          text: "Your data helps us improve our products, services, and website functionality. We analyze usage patterns to enhance user experience and develop new features.",
        },
        {
          subtitle: "Marketing Communications",
          text: "With your consent, we may send you promotional emails about new products, special offers, and sustainability initiatives. You can opt out at any time.",
        },
      ],
    },
    {
      id: "data-protection",
      title: "Data Protection & Security",
      icon: Lock,
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. All payment information is encrypted using SSL technology.",
        },
        {
          subtitle: "Data Storage",
          text: "Your data is stored on secure servers with restricted access. We retain your information only for as long as necessary to fulfill the purposes outlined in this policy.",
        },
        {
          subtitle: "Third-Party Services",
          text: "We work with trusted third-party service providers for payment processing, shipping, and analytics. These providers are contractually obligated to protect your data.",
        },
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights & Choices",
      icon: Shield,
      content: [
        {
          subtitle: "Access & Correction",
          text: "You have the right to access, update, or correct your personal information at any time through your account settings or by contacting us.",
        },
        {
          subtitle: "Data Deletion",
          text: "You may request deletion of your personal information, subject to certain legal obligations. We will respond to such requests within 30 days.",
        },
        {
          subtitle: "Marketing Opt-Out",
          text: "You can unsubscribe from marketing emails by clicking the unsubscribe link in any promotional email or updating your preferences in your account.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookie Policy",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Types of Cookies",
          text: "We use essential cookies for site functionality, performance cookies to analyze site usage, and marketing cookies to deliver relevant advertisements.",
        },
        {
          subtitle: "Managing Cookies",
          text: "You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect website functionality.",
        },
      ],
    },
    {
      id: "updates",
      title: "Policy Updates",
      icon: Bell,
      content: [
        {
          subtitle: "Changes to This Policy",
          text: "We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes via email or website notice.",
        },
        {
          subtitle: "Effective Date",
          text: "This policy is effective as of January 1, 2025. Your continued use of our services after any changes constitutes acceptance of the updated policy.",
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
            <Shield className="w-8 h-8 text-green-600" />
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
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information.
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
            At Green Fibre, we are committed to protecting your privacy and
            ensuring the security of your personal information. This Privacy
            Policy describes how we collect, use, disclose, and safeguard your
            information when you visit our website or make a purchase from us.
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            By using our services, you agree to the collection and use of
            information in accordance with this policy. If you do not agree with
            our policies and practices, please do not use our services.
          </p>
        </motion.div>

        {/* Policy Sections */}
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
                  Questions About Privacy?
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  If you have any questions or concerns about our Privacy Policy
                  or how we handle your data, please don't hesitate to contact
                  us.
                </p>
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
              { label: "Terms & Conditions", href: "/terms-and-conditions" },
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
      </div>
    </div>
  );
}
