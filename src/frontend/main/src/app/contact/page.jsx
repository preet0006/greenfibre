"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useContactStore from "@/store/useContactStore";
import usePageSettingsStore from "@/store/usePageSettingsStore";
import useUserStore from "@/store/useUserStore";
import api from "@/lib/axios";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

  const submitContact = useContactStore((s) => s.submitContact);
  const actionLoading = useContactStore((s) => s.actionLoading);
  const settings = usePageSettingsStore((s) => s.settings);
  const fetchPageSettings = usePageSettingsStore((s) => s.fetchPageSettings);
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);
  const fetchUser = useUserStore((s) => s.fetchUser);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPageSettings();
  }, []);

  useEffect(() => {
    if (!authChecked) {
      fetchUser();
    }
  }, [authChecked, fetchUser]);

  useEffect(() => {
    if (!authChecked) return;

    if (user && !isProfileHydrated) {
      setFormData((prev) => ({
        ...prev,
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        message: "",
      }));
      setIsProfileHydrated(true);
      return;
    }

    if (!user && !isProfileHydrated) {
      setIsProfileHydrated(true);
    }
  }, [authChecked, user, isProfileHydrated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    const phoneOk = /^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""));

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!emailOk) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!phoneOk) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const success = await submitContact({
      type: "contact",
      ...formData,
      phone: formData.phone.replace(/\D/g, ""),
      userId: user?._id || null,
      timestamp: new Date().toISOString(),
    });

    if (success) {
      if (user && !user.phone && formData.phone.trim()) {
        try {
          await api.put(
            "/users/update-profile",
            {
              full_name: user.full_name,
              phone: formData.phone.replace(/\D/g, ""),
            },
            {
              silentToast: true,
            },
          );
          await fetchUser();
        } catch (error) {
          console.error("Unable to update user phone from contact form:", error);
        }
      }

      setSubmitted(true);
      setFormData({
        name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        message: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }
  };

  const profileLoading = !authChecked || !isProfileHydrated;
  const isLoggedIn = Boolean(user?._id);
  const isPhoneLocked = isLoggedIn && Boolean((formData.phone || "").trim());

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      details: settings.emails || [],
      href: (email) => `mailto:${email}`,
    },
    {
      icon: Phone,
      title: "Phone",
      details: settings.phoneNumbers || [],
      href: (phone) => `tel:${phone}`,
    },
    {
      icon: MapPin,
      title: "Address",
      details: settings.address ? [settings.address] : [],
      href: null,
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      details: settings.whatsappNumber ? [settings.whatsappNumber] : [],
      href: (number) => `https://wa.me/${number.replace(/\D/g, "")}`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-2 mb-6"
          >
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Get In Touch
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 mb-6 leading-tight"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            We'd Love to
            <br />
            Hear From You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Have questions about our sustainable products? Want to learn more
            about our eco-friendly initiatives? We're here to help!
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl font-semibold text-gray-900 mb-6"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Contact Information
            </h2>
            <p className="text-base text-gray-600 mb-8">
              Reach out to us through any of these channels. We typically
              respond within 24 hours.
            </p>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <info.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {info.title}
                    </h3>
                    {info.details.length > 0 ? (
                      <div className="space-y-1">
                        {info.details.map((detail, idx) =>
                          info.href ? (
                            <a
                              key={idx}
                              href={info.href(detail)}
                              target={
                                info.title === "WhatsApp" ? "_blank" : undefined
                              }
                              rel={
                                info.title === "WhatsApp"
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              className="block text-base text-gray-600 hover:text-green-600 transition-colors"
                            >
                              {detail}
                            </a>
                          ) : (
                            <p key={idx} className="text-base text-gray-600">
                              {detail}
                            </p>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not available</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Business Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Business Hours
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-gray-500">Closed</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2
                className="text-3xl font-semibold text-gray-900 mb-2"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Send Us a Message
              </h2>
              <p className="text-base text-gray-600 mb-8">
                Fill out the form below and we'll get back to you as soon as
                possible.
              </p>

              {isLoggedIn && !profileLoading && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-sm text-green-700">
                    Your account details have been automatically filled.
                  </p>
                </div>
              )}

              {/* Success Message */}
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700">
                    Thank you! Your message has been sent successfully. We'll
                    get back to you soon.
                  </p>
                </motion.div>
              )}

              {profileLoading ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-28 w-full bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                  <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={isLoggedIn}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all read-only:bg-gray-50 read-only:text-gray-500"
                    placeholder="Your name"
                    disabled={profileLoading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={isLoggedIn}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all read-only:bg-gray-50 read-only:text-gray-500"
                    placeholder="you@example.com"
                    disabled={profileLoading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    readOnly={isPhoneLocked}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all read-only:bg-gray-50 read-only:text-gray-500"
                    placeholder="+91 98765 43210"
                    disabled={profileLoading}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us how we can help you..."
                    disabled={profileLoading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* Google Map */}
        {settings.googleMapEmbedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20"
          >
            <h2
              className="text-3xl font-semibold text-gray-900 mb-8 text-center"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Visit Our Location
            </h2>
            <div
              className="rounded-3xl overflow-hidden border-2 border-gray-200 shadow-lg"
              style={{ height: 400 }}
            >
              <iframe
                src={settings.googleMapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Green Fibre Location"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
