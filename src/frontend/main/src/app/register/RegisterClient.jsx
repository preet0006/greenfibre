"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useUserStore from "@/store/useUserStore";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Leaf,
  User as UserIcon,
  Phone,
} from "lucide-react";

// ── Animations ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ── Field ─────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {children}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
function Input({ icon: Icon, right, error, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all duration-200 ${
        error
          ? "border-red-300 ring-2 ring-red-100"
          : focused
            ? "border-green-600 ring-2 ring-green-100"
            : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {Icon && (
        <Icon
          className={`h-5 w-5 transition-colors ${
            focused ? "text-green-600" : "text-gray-400"
          }`}
        />
      )}

      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        {...props}
      />

      {right}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const register = useUserStore((s) => s.register);
  const loading = useUserStore((s) => s.loading);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.full_name.trim()) {
      e.full_name = "Full name is required";
    } else if (form.full_name.trim().length < 2) {
      e.full_name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email";
    }

    if (!form.phone_number.trim()) {
      e.phone_number = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(form.phone_number.replace(/\s/g, ""))) {
      e.phone_number = "Enter a valid 10-digit phone number";
    }

    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 6) {
      e.password = "Minimum 6 characters";
    }

    if (!form.confirmPassword) {
      e.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const success = await register(
      {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone_number.trim(),
        password: form.password,
      },
      router,
    );

    // register() already redirects to /verify-email — do not override
    if (!success) return;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ── Left Panel ───────────────────────────── */}
        <div className="relative hidden overflow-hidden bg-linear-to-br from-green-50 to-green-100 lg:flex">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

          <div className="relative z-10 flex flex-1 flex-col gap-10 p-12 lg:p-16">
            {/* Logo */}
            <Link href="/" className="w-fit">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <Image
                  src="/greenfiber-logo.png"
                  alt="Green Fibre"
                  width={160}
                  height={60}
                  className="object-contain"
                />
              </div>
            </Link>

            {/* Content */}
            <div className="max-w-lg">
              {/* <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 mb-6 shadow-sm border border-gray-200">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Sustainability, Simplified
                </span>
              </div> */}

              <h1
                className="text-5xl font-semibold leading-tight text-gray-900 mb-6"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Join the Green
                <br />
                Revolution
              </h1>

              <p className="text-lg leading-relaxed text-gray-600">
                Create your account and start your journey towards sustainable
                living. Access exclusive eco-friendly products and be part of a
                community that cares for our planet.
              </p>

              {/* Benefits */}
              <div className="mt-12 space-y-4">
                {[
                  "Access to 100+ sustainable products",
                  "Exclusive member discounts and offers",
                  "Track your environmental impact",
                  "Join a community of conscious consumers",
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────── */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <motion.div
              variants={fadeUp}
              className="mb-10 flex justify-center lg:hidden"
            >
              <Image
                src="/greenfiber-logo.png"
                alt="Green Fibre"
                width={160}
                height={60}
                className="object-contain"
              />
            </motion.div>

            {/* Heading */}
            <motion.div variants={fadeUp} className="mb-8">
              <h2
                className="text-4xl font-semibold text-gray-900"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Create Account
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Join Green Fibre and start shopping sustainably today.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Field label="Full Name" error={errors.full_name}>
                <Input
                  icon={UserIcon}
                  type="text"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(e) => upd("full_name", e.target.value)}
                  error={errors.full_name}
                  autoComplete="name"
                />
              </Field>

              <Field label="Email Address" error={errors.email}>
                <Input
                  icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => upd("email", e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                />
              </Field>

              <Field label="Phone Number" error={errors.phone_number}>
                <Input
                  icon={Phone}
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone_number}
                  onChange={(e) => upd("phone_number", e.target.value)}
                  error={errors.phone_number}
                  autoComplete="tel"
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <Input
                  icon={Lock}
                  type={showPw ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => upd("password", e.target.value)}
                  error={errors.password}
                  autoComplete="new-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="text-gray-400 transition-colors hover:text-green-600"
                    >
                      {showPw ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
              </Field>

              <Field label="Confirm Password" error={errors.confirmPassword}>
                <Input
                  icon={Lock}
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => upd("confirmPassword", e.target.value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="text-gray-400 transition-colors hover:text-green-600"
                    >
                      {showConfirmPw ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
              </Field>

              {/* Terms */}
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms-and-conditions"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Privacy Policy
                </Link>
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>

            {/* Divider */}
            <motion.div variants={fadeUp} className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </motion.div>

            {/* Sign In */}
            <motion.div variants={fadeUp} className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-green-600 hover:text-green-600 transition-all"
              >
                Sign In Instead
              </Link>
            </motion.div>

            {/* Mobile Benefits */}
            <motion.div variants={fadeUp} className="mt-12 lg:hidden">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-4">
                Why Join Green Fibre?
              </p>
              <div className="space-y-3">
                {[
                  "500+ sustainable products",
                  "Exclusive member discounts",
                  "Track environmental impact",
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
