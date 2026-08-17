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
export default function LoginPage() {
  const router = useRouter();

  const login = useUserStore((s) => s.login);
  const loading = useUserStore((s) => s.loading);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};

    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email";
    }

    if (!form.password) {
      e.password = "Password is required";
    } else if (form.password.length < 6) {
      e.password = "Minimum 6 characters";
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

    const result = await login(form, router);

    if (result?.code === "EMAIL_NOT_VERIFIED") {
      setErrors({
        form:
          result.message ||
          "Please verify your email before logging in.",
        unverifiedEmail: result.email || form.email,
      });
    }
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
              <h1
                className="text-5xl font-semibold leading-tight text-gray-900 mb-6"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                Welcome to
                <br />
                Green Fibre
              </h1>

              <p className="text-lg leading-relaxed text-gray-600">
                Your destination for eco-friendly products and sustainable
                living. Join thousands of conscious consumers making a positive
                impact on our planet.
              </p>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div>
                  <p
                    className="text-3xl font-semibold text-green-600"
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', serif)",
                    }}
                  >
                    100k+
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Happy Customers</p>
                </div>
                <div>
                  <p
                    className="text-3xl font-semibold text-green-600"
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', serif)",
                    }}
                  >
                    500+
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Eco Products</p>
                </div>
                <div>
                  <p
                    className="text-3xl font-semibold text-green-600"
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', serif)",
                    }}
                  >
                    100%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Sustainable</p>
                </div>
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
                Sign In
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Welcome back! Sign in to your account to continue.
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              variants={fadeUp}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {errors.form && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-medium">{errors.form}</p>
                  {errors.unverifiedEmail && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/verify-email?email=${encodeURIComponent(errors.unverifiedEmail)}`}
                        className="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Verify Email
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await useUserStore
                            .getState()
                            .resendOtp(errors.unverifiedEmail);
                          if (ok) {
                            router.push(
                              `/verify-email?email=${encodeURIComponent(errors.unverifiedEmail)}`,
                            );
                          }
                        }}
                        className="inline-flex items-center rounded-lg border border-green-600 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                  )}
                </div>
              )}

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

              <Field label="Password" error={errors.password}>
                <Input
                  icon={Lock}
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => upd("password", e.target.value)}
                  error={errors.password}
                  autoComplete="current-password"
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

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
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
                  New to Green Fibre?
                </span>
              </div>
            </motion.div>

            {/* Register */}
            <motion.div variants={fadeUp} className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-green-600 hover:text-green-600 transition-all"
              >
                Create Account
              </Link>
            </motion.div>

            {/* Mobile Stats */}
            <motion.div
              variants={fadeUp}
              className="mt-12 grid grid-cols-3 gap-4 lg:hidden"
            >
              <div className="text-center">
                <p
                  className="text-2xl font-semibold text-green-600"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  100k+
                </p>
                <p className="text-xs text-gray-600 mt-1">Customers</p>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-semibold text-green-600"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  500+
                </p>
                <p className="text-xs text-gray-600 mt-1">Products</p>
              </div>
              <div className="text-center">
                <p
                  className="text-2xl font-semibold text-green-600"
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', serif)",
                  }}
                >
                  100%
                </p>
                <p className="text-xs text-gray-600 mt-1">Sustainable</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
