"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  PackageCheck,
  CreditCard,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  Mail,
} from "lucide-react";

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "return-eligibility",
      title: "Return Eligibility",
      icon: PackageCheck,
      content: [
        {
          subtitle: "7-Day Return Window",
          text: "We accept returns within 7 days of delivery for most products. The product must be unused, in its original condition, with all tags and packaging intact.",
        },
        {
          subtitle: "Eligible Products",
          text: "Most of our eco-friendly products are eligible for returns, including sustainable home goods, garden products, and natural fibre items, provided they meet our return conditions.",
        },
        {
          subtitle: "Non-Returnable Items",
          text: "For hygiene and safety reasons, certain items cannot be returned once opened or used, including personal care products, intimate items, food items, and customized/personalized products.",
        },
      ],
    },
    {
      id: "return-conditions",
      title: "Return Conditions",
      icon: CheckCircle,
      content: [
        {
          subtitle: "Product Condition",
          text: "Products must be returned in their original, unused condition with all original tags, labels, and packaging. Items that show signs of use, damage, or missing components may not be accepted.",
        },
        {
          subtitle: "Original Packaging",
          text: "Please return items in the original Green Fibre packaging. If the original packaging is damaged, please use appropriate protective packaging to prevent damage during return shipping.",
        },
        {
          subtitle: "Proof of Purchase",
          text: "A valid order number or invoice is required for all returns. Please include your order confirmation or invoice with the return package.",
        },
      ],
    },
    {
      id: "return-process",
      title: "How to Return",
      icon: RefreshCw,
      content: [
        {
          subtitle: "Step 1: Initiate Return",
          text: "Log in to your account and go to 'My Orders'. Select the order containing the item you wish to return and click 'Return Item'. Alternatively, contact our customer support team at support@greenfibre.com.",
        },
        {
          subtitle: "Step 2: Return Approval",
          text: "Once your return request is received, our team will review it within 24 hours. If approved, you will receive return instructions and a return shipping label (if applicable) via email.",
        },
        {
          subtitle: "Step 3: Pack & Ship",
          text: "Carefully pack the item in its original packaging. Attach the return shipping label and hand over the package to the courier service. Keep the tracking number for your records.",
        },
        {
          subtitle: "Step 4: Inspection",
          text: "Once we receive your return, our team will inspect the product within 2-3 business days to ensure it meets our return conditions.",
        },
      ],
    },
    {
      id: "refund-process",
      title: "Refund Process",
      icon: CreditCard,
      content: [
        {
          subtitle: "Refund Timeline",
          text: "After successful inspection of your returned item, refunds are processed within 5-7 business days. The refund will be credited to your original payment method.",
        },
        {
          subtitle: "Refund Method",
          text: "Refunds are issued to the original payment method used during purchase. For credit/debit card payments, the refund may take an additional 5-10 business days to reflect in your account, depending on your bank.",
        },
        {
          subtitle: "Partial Refunds",
          text: "In some cases, partial refunds may be granted for items returned with minor defects, missing accessories, or slight damage. Our team will notify you before processing a partial refund.",
        },
        {
          subtitle: "Store Credit Option",
          text: "As an alternative to refunds, you may opt for store credit, which will be added to your Green Fibre account immediately after inspection. Store credit never expires.",
        },
      ],
    },
    {
      id: "return-shipping",
      title: "Return Shipping",
      icon: PackageCheck,
      content: [
        {
          subtitle: "Free Return Shipping",
          text: "We offer free return shipping for defective products, wrong items delivered, or damaged items received. In such cases, we will provide a prepaid return shipping label.",
        },
        {
          subtitle: "Customer-Paid Returns",
          text: "For returns due to change of mind or ordering the wrong item, return shipping costs are the responsibility of the customer. Please use a trackable shipping method.",
        },
        {
          subtitle: "Return Shipping Costs",
          text: "Return shipping costs for customer-initiated returns typically range from ₹50-150 depending on your location and package weight. We recommend using our partner courier services for discounted rates.",
        },
      ],
    },
    {
      id: "exchanges",
      title: "Exchanges",
      icon: RefreshCw,
      content: [
        {
          subtitle: "Product Exchanges",
          text: "We currently do not offer direct product exchanges. If you wish to exchange an item, please return it for a refund and place a new order for the desired product.",
        },
        {
          subtitle: "Size or Variant Exchanges",
          text: "For items where you need a different size or variant, we recommend placing a new order first to ensure availability, then returning the unwanted item.",
        },
        {
          subtitle: "Defective Item Replacement",
          text: "If you receive a defective item, we will send a replacement at no additional cost. Contact us within 48 hours of delivery with photos of the defect.",
        },
      ],
    },
    {
      id: "special-cases",
      title: "Special Cases",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Damaged During Delivery",
          text: "If your order arrives damaged, please contact us within 48 hours with photos of the damaged product and packaging. We will arrange a replacement or full refund without requiring a return.",
        },
        {
          subtitle: "Wrong Item Received",
          text: "If you receive the wrong item, please contact us immediately. We will arrange for the correct item to be shipped and provide a prepaid return label for the incorrect item.",
        },
        {
          subtitle: "Missing Items",
          text: "If items are missing from your order, please contact us within 48 hours of delivery. We will verify the issue and ship the missing items or issue a refund.",
        },
        {
          subtitle: "Order Cancellation",
          text: "Orders can be cancelled within 24 hours of placement if they have not been shipped. Once shipped, please follow our standard return process after receiving the items.",
        },
      ],
    },
    {
      id: "refund-exceptions",
      title: "Non-Refundable Items",
      icon: XCircle,
      content: [
        {
          text: "The following items are not eligible for returns or refunds:",
        },
        {
          subtitle: "Personal Care & Hygiene Products",
          text: "Items such as personal care products, intimate items, and hygiene-related products cannot be returned once the seal is broken or the product is used.",
        },
        {
          subtitle: "Perishable Goods",
          text: "Food items, plants, seeds, and other perishable goods are not eligible for return unless they arrive damaged or defective.",
        },
        {
          subtitle: "Customized Products",
          text: "Products that are personalized, custom-made, or made-to-order specifically for you cannot be returned unless they are defective.",
        },
        {
          subtitle: "Sale & Clearance Items",
          text: "Items purchased during final sale or clearance events marked as 'non-returnable' cannot be returned or exchanged.",
        },
        {
          subtitle: "Gift Cards",
          text: "Gift cards and e-vouchers are non-refundable and cannot be returned for cash or credit.",
        },
      ],
    },
    {
      id: "important-notes",
      title: "Important Information",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Refund Notifications",
          text: "You will receive email notifications at each stage of the return and refund process: return approval, item received, inspection complete, and refund processed.",
        },
        {
          subtitle: "Return Rejection",
          text: "If your return does not meet our conditions, we reserve the right to reject it. The item will be sent back to you, and you will be notified via email with the reason for rejection.",
        },
        {
          subtitle: "Restocking Fee",
          text: "Currently, we do not charge any restocking fees for eligible returns. However, we reserve the right to implement restocking fees in the future with prior notice.",
        },
        {
          subtitle: "Multiple Returns",
          text: "Customers with excessive return rates may be flagged for review. We reserve the right to refuse service to customers who abuse our return policy.",
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
            Refund Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Your satisfaction is our priority. Learn about our hassle-free
            return and refund process for Green Fibre products.
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
            At Green Fibre, we want you to be completely satisfied with your
            purchase. If for any reason you are not happy with your order, we
            offer a straightforward return and refund process.
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            This Refund Policy outlines the conditions, procedures, and
            timelines for returns and refunds. Please read this policy carefully
            before initiating a return.
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

        {/* Quick Reference Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 pt-12 border-t border-gray-100"
        >
          <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
            <h3
              className="text-xl font-semibold text-gray-900 mb-6"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Quick Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Return Window
                </p>
                <p className="text-sm text-gray-700">7 days from delivery</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Refund Timeline
                </p>
                <p className="text-sm text-gray-700">
                  5-7 business days after inspection
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Inspection Time
                </p>
                <p className="text-sm text-gray-700">2-3 business days</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Free Returns
                </p>
                <p className="text-sm text-gray-700">
                  For defective or wrong items
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12"
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
                  Need Help with Returns?
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  Our customer support team is here to assist you with any
                  questions about returns or refunds. Contact us and we'll guide
                  you through the process.
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
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms & Conditions", href: "/terms-and-conditions" },
              { label: "Shipping Policy", href: "/shipping-policy" },
              { label: "My Orders", href: "/orders" },
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
