"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  Package,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

export default function ShippingPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      id: "shipping-areas",
      title: "Shipping Areas",
      icon: MapPin,
      content: [
        {
          text: "We currently offer shipping across all major cities and towns in India. Our eco-friendly packaging and carbon-neutral delivery options ensure your products reach you while minimizing environmental impact.",
        },
        {
          subtitle: "Delivery Coverage",
          text: "We deliver to most pin codes across India. During checkout, you can verify if we deliver to your location by entering your pin code. If your area is not serviceable, we will notify you immediately.",
        },
        {
          subtitle: "International Shipping",
          text: "Currently, we only ship within India. We are working on expanding our services internationally. Sign up for our newsletter to be notified when international shipping becomes available.",
        },
      ],
    },
    {
      id: "processing-time",
      title: "Order Processing Time",
      icon: Clock,
      content: [
        {
          subtitle: "Standard Processing",
          text: "All orders are processed within 1-2 business days (Monday to Saturday, excluding public holidays). Orders placed after 3 PM will be processed the next business day.",
        },
        {
          subtitle: "Order Confirmation",
          text: "You will receive an email confirmation once your order is placed. A second email with tracking information will be sent once your order ships from our warehouse.",
        },
        {
          subtitle: "Bulk Orders",
          text: "For bulk orders (10+ items), processing may take 3-5 business days. Our team will contact you with a specific timeline after your order is placed.",
        },
      ],
    },
    {
      id: "delivery-time",
      title: "Delivery Timeframes",
      icon: Truck,
      content: [
        {
          subtitle: "Metro Cities",
          text: "Delivery to major metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune) typically takes 3-5 business days from the date of shipment.",
        },
        {
          subtitle: "Tier 2 Cities",
          text: "Delivery to tier 2 cities and state capitals usually takes 5-7 business days from the date of shipment.",
        },
        {
          subtitle: "Remote Areas",
          text: "Delivery to remote or rural areas may take 7-10 business days. Additional time may be required for areas with limited courier access.",
        },
        {
          subtitle: "Note on Delivery Times",
          text: "Delivery times are estimates and not guaranteed. Actual delivery may vary based on courier availability, weather conditions, festivals, and other unforeseen circumstances.",
        },
      ],
    },
    {
      id: "shipping-charges",
      title: "Shipping Charges",
      icon: IndianRupee,
      content: [
        {
          subtitle: "Free Shipping",
          text: "We offer FREE shipping on all orders above ₹999. This is our commitment to making sustainable products accessible to everyone across India.",
        },
        {
          subtitle: "Standard Shipping",
          text: "For orders below ₹999, a flat shipping fee of ₹99 applies. Shipping charges are calculated automatically at checkout based on your delivery location and order value.",
        },
        {
          subtitle: "Express Shipping",
          text: "Express shipping (1-3 days delivery) is available for select locations at an additional cost of ₹199. This option will be displayed during checkout if available for your pin code.",
        },
        {
          subtitle: "Promotional Offers",
          text: "We occasionally run free shipping promotions. Follow us on social media or subscribe to our newsletter to stay updated on special offers.",
        },
      ],
    },
    {
      id: "tracking",
      title: "Order Tracking",
      icon: Package,
      content: [
        {
          subtitle: "Tracking Information",
          text: "Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order status in real-time using this tracking number on our website or the courier's website.",
        },
        {
          subtitle: "Order Status Updates",
          text: "You will receive regular updates about your order status via email and SMS at key milestones: Order Confirmed, Shipped, Out for Delivery, and Delivered.",
        },
        {
          subtitle: "Track Your Order",
          text: "To track your order, log in to your account and visit the 'My Orders' section, or click the tracking link provided in your shipment confirmation email.",
        },
      ],
    },
    {
      id: "packaging",
      title: "Eco-Friendly Packaging",
      icon: CheckCircle,
      content: [
        {
          subtitle: "Sustainable Materials",
          text: "All our products are packed using 100% recyclable and biodegradable materials. We use minimal packaging to reduce waste while ensuring your products arrive safely.",
        },
        {
          subtitle: "Carbon Neutral Delivery",
          text: "We partner with eco-conscious courier services and offset carbon emissions from delivery. Every shipment contributes to our reforestation initiatives.",
        },
        {
          subtitle: "Reusable Packaging",
          text: "We encourage customers to reuse our packaging materials. Our boxes and bags are designed to be durable and suitable for multiple uses.",
        },
      ],
    },
    {
      id: "delivery-issues",
      title: "Delivery Issues",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Failed Delivery Attempts",
          text: "If delivery fails due to incorrect address or recipient unavailability, the courier will make up to 3 delivery attempts. Please ensure someone is available to receive the package.",
        },
        {
          subtitle: "Address Changes",
          text: "Address changes are only possible before the order is shipped. Once shipped, we cannot modify the delivery address. Please contact us immediately if you need to change your address.",
        },
        {
          subtitle: "Damaged or Lost Packages",
          text: "If your package arrives damaged or is lost in transit, please contact us within 48 hours with photos (if damaged). We will arrange a replacement or full refund.",
        },
        {
          subtitle: "Non-Delivery",
          text: "If you have not received your order within the estimated delivery time, please check your tracking status. If the tracking shows 'Delivered' but you haven't received it, contact us immediately.",
        },
      ],
    },
    {
      id: "special-notes",
      title: "Important Notes",
      icon: AlertCircle,
      content: [
        {
          subtitle: "Holidays & Peak Seasons",
          text: "During festivals, holidays, and sale periods, delivery times may be longer than usual due to high order volumes. We appreciate your patience during these times.",
        },
        {
          subtitle: "Undeliverable Areas",
          text: "Some remote locations may not be serviceable by our courier partners. If your pin code is not serviceable, we will inform you at checkout or contact you after order placement.",
        },
        {
          subtitle: "Signature Required",
          text: "For security purposes, a signature may be required upon delivery for orders above ₹5,000. Please ensure someone is available to sign for the package.",
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
            <Truck className="w-8 h-8 text-green-600" />
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
            Shipping Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Delivering sustainable products to your doorstep with eco-friendly
            packaging and carbon-neutral shipping.
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
            At Green Fibre, we are committed to delivering your eco-friendly
            products safely and sustainably. Our shipping policy is designed to
            be transparent, reliable, and environmentally responsible.
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            We partner with trusted courier services to ensure timely delivery
            across India while maintaining our commitment to sustainability
            through eco-friendly packaging and carbon-neutral shipping
            practices.
          </p>
        </motion.div>

        {/* Shipping Sections */}
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
                  Free Shipping
                </p>
                <p className="text-sm text-gray-700">Orders above ₹999</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Processing Time
                </p>
                <p className="text-sm text-gray-700">1-2 business days</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Metro Cities Delivery
                </p>
                <p className="text-sm text-gray-700">3-5 business days</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Standard Shipping Fee
                </p>
                <p className="text-sm text-gray-700">₹99 (orders below ₹999)</p>
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
                  Shipping Questions?
                </h3>
                <p className="text-base text-gray-700 mb-4">
                  If you have any questions about shipping or need help tracking
                  your order, our customer support team is here to help.
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
              { label: "Refund Policy", href: "/refund-policy" },
              { label: "Track Your Order", href: "/orders" },
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
