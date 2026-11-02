"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RefreshCw,
  PackageCheck,
  AlertCircle,
  XCircle,
  Truck,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  HelpCircle,
  Store,
} from "lucide-react";

export default function ReplacementPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "when-to-request",
      title: "When can you request a replacement?",
      icon: PackageCheck,
      content: [
        {
          subtitle: "Eligible Product Issues",
          text: "At Green Fibre, we offer replacements for eligible products received damaged, defective or incorrect. You may request a replacement if:",
          bullets: [
            "Your product arrived damaged or broken.",
            "Your product has a manufacturing defect.",
            "You received a different product, size or colour from what you ordered.",
            "Parts or accessories included in your order are missing.",
          ],
        },
        {
          subtitle: "Missing Items Resolution",
          text: "For missing items, we will investigate and arrange to supply the missing item or provide another remedy required by law.",
        },
      ],
    },
    {
      id: "request-window",
      title: "Replacement request window",
      icon: RefreshCw,
      content: [
        {
          subtitle: "7-Day Standard Window",
          text: "Please submit your replacement request within 7 days of delivery. For visible delivery damage, wrong items or missing items, please contact us preferably within 48 hours so we can investigate promptly.",
        },
        {
          subtitle: "Statutory & Warranty Protection",
          text: "These reporting windows do not limit any statutory rights or applicable warranty coverage.",
        },
      ],
    },
    {
      id: "what-is-not-covered",
      title: "What is not covered?",
      icon: XCircle,
      content: [
        {
          subtitle: "Exclusions",
          text: "Our standard replacement policy does not cover:",
          bullets: [
            "Change of mind or personal preference.",
            "Selecting the wrong size, colour or product when the correct ordered item was delivered.",
            "Damage caused after delivery by misuse, accidental breakage or failure to follow care instructions.",
            "Normal wear and tear.",
          ],
        },
        {
          subtitle: "Customized & Personalized Products",
          text: "Customized products are not eligible for change-of-mind returns or exchanges. Claims for defects, delivery damage or incorrect fulfilment remain eligible for review.",
        },
      ],
    },
    {
      id: "how-to-request",
      title: "How to request a replacement",
      icon: CheckCircle2,
      content: [
        {
          subtitle: "Step-by-Step Instructions",
          text: "Please do not send products back without receiving instructions from our team. Follow these steps:",
          steps: [
            "Email info@greenfibre.org with your order number, contact details and a description of the issue.",
            "Attach clear photographs of the product, affected area and packaging, where available. An unboxing video can help, but is not mandatory.",
            "Our team will review the request and provide the next steps.",
            "If approved, we will arrange collection where needed and confirm replacement availability and the expected dispatch timeline.",
          ],
        },
      ],
    },
    {
      id: "collection-inspection",
      title: "Product collection and inspection",
      icon: Truck,
      content: [
        {
          subtitle: "Inspection Process",
          text: "We may request the affected product for inspection or replacement processing. This collection is part of the replacement process and does not create a general change-of-mind return option.",
        },
        {
          subtitle: "Packaging & Inspection Condition",
          text: "Retain the product, accessories and original packaging where reasonably possible. If the packaging arrived damaged, use suitable protective packaging as instructed. Opening the product to inspect it does not, by itself, invalidate a defect claim.",
        },
      ],
    },
    {
      id: "shipping-charges",
      title: "Replacement shipping charges",
      icon: ShieldCheck,
      content: [
        {
          subtitle: "Zero Cost for Approved Replacements",
          text: "Green Fibre will cover approved collection and replacement delivery charges where the issue is a manufacturing defect, delivery damage or an incorrect item supplied by us.",
        },
      ],
    },
    {
      id: "availability",
      title: "Replacement availability",
      icon: HelpCircle,
      content: [
        {
          subtitle: "Exact Match or Agreed Resolution",
          text: "Approved replacements will normally be for the same product and variant, subject to availability. If the same item is unavailable, we will contact you to discuss the available resolution. We will not substitute another product or issue store credit without your agreement. Refunds will be provided where required by applicable law.",
        },
      ],
    },
    {
      id: "refunds-consumer-rights",
      title: "Refunds and consumer rights",
      icon: AlertCircle,
      content: [
        {
          subtitle: "No Discretionary Change-of-Mind Refunds",
          text: "We do not provide discretionary refunds for change of mind or personal preference.",
        },
        {
          subtitle: "Protection Under Applicable Law",
          text: "Nothing in this policy excludes or restricts your rights under applicable consumer protection law, including any right to return goods or receive a refund where legally required. Replacement is not compulsory where the law entitles you to another remedy.",
        },
      ],
    },
    {
      id: "marketplaces",
      title: "Orders placed through marketplaces",
      icon: Store,
      content: [
        {
          subtitle: "Third-Party Marketplaces",
          text: "For purchases made through Amazon, Flipkart or another marketplace, please initiate your request through that platform. The applicable marketplace process and consumer rights will govern those purchases.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-6"
          >
            <RefreshCw className="w-8 h-8 text-green-600" />
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
            Replacement Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm font-medium text-green-700 tracking-wider uppercase mb-6"
          >
            Last updated: November 2, 2026
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto max-w-3xl rounded-2xl border border-green-200 bg-white p-6 shadow-xs text-left"
          >
            <p className="text-base text-gray-800 leading-relaxed font-medium mb-3">
              At Green Fibre, we offer replacements for eligible products received damaged, defective or incorrect.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We do not offer change-of-mind returns, refunds or exchanges. Our standard resolution for eligible product issues is replacement, subject to your rights under applicable consumer law.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                id={section.id}
                className="scroll-mt-24 border-b border-gray-100 pb-10 last:border-b-0"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-700 shrink-0">
                    <Icon className="w-5 h-5" />
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
                <div className="space-y-5 sm:pl-14">
                  {section.content.map((item, i) => (
                    <div key={i} className="space-y-2.5">
                      {item.subtitle && (
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.subtitle}
                        </h3>
                      )}
                      {item.text && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {item.text}
                        </p>
                      )}

                      {/* Bullet points */}
                      {Array.isArray(item.bullets) && item.bullets.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
                          {item.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Numbered steps */}
                      {Array.isArray(item.steps) && item.steps.length > 0 && (
                        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                          {item.steps.map((step, sIdx) => (
                            <li key={sIdx} className="leading-relaxed font-medium">
                              <span className="font-normal">{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Contact Us Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 rounded-2xl bg-green-50/70 p-6 sm:p-8 border border-green-150"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3
                className="text-2xl font-semibold text-gray-900 mb-2"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Contact Us
              </h3>
              <p className="text-sm text-gray-700 max-w-xl leading-relaxed">
                Need help with a damaged, defective or incorrect order? Contact our customer support team with your order number.
              </p>
            </div>

            <div className="space-y-2.5 shrink-0 text-sm">
              <a
                href="mailto:info@greenfibre.org"
                className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@greenfibre.org
              </a>
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Phone className="w-4 h-4 text-green-700" />
                <span>+91 92173 28777 / +91 92179 88874</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Related Policy Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500"
        >
          <span>Related Policies:</span>
          <div className="flex flex-wrap gap-4 font-medium text-gray-700">
            <Link href="/privacy-policy" className="hover:text-green-600 transition-colors">
              Privacy Policy →
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-green-600 transition-colors">
              Terms & Conditions →
            </Link>
            <Link href="/shipping-policy" className="hover:text-green-600 transition-colors">
              Shipping Policy →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

