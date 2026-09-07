"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useUserStore from "@/store/useUserStore";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
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

export default function ForgotPasswordPage() {
  const router = useRouter();

  const forgotPassword = useUserStore((s) => s.forgotPassword);
  const loading = useUserStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      return "Email address is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();

    if (err) {
      setError(err);
      return;
    }

    setError("");

    const success = await forgotPassword(email, router);

    if (success) {
      setSent(true);
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
                  style={{ width: "auto", height: "auto" }}
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
                Forgot Your
                <br />
                Password?
              </h1>

              <p className="text-lg leading-relaxed text-gray-600">
                No worries! Enter your email address and we'll send you a secure
                reset code to help you regain access to your Green Fibre
                account.
              </p>

              {/* Benefits */}
              <div className="mt-12 space-y-4">
                {[
                  "Secure password reset process",
                  "Reset code sent instantly",
                  "Your account stays protected",
                  "Quick and easy recovery",
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
                style={{ width: "auto", height: "auto" }}
              />
            </motion.div>

            {/* Back to Login */}
            <motion.div variants={fadeUp} className="mb-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </motion.div>

            <AnimatePresence mode="wait">
              {sent ? (
                // ── Success State ──
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </motion.div>

                  <h2
                    className="text-3xl font-semibold text-gray-900 mb-4"
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', serif)",
                    }}
                  >
                    Check Your Email
                  </h2>

                  <p className="text-gray-600 mb-2">
                    We've sent a password reset code to
                  </p>
                  <p className="text-green-600 font-semibold mb-8">{email}</p>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8">
                    <p className="text-sm text-gray-600">
                      Check your inbox and spam folder. The code will expire in
                      15 minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href={`/reset-password?email=${encodeURIComponent(email)}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all"
                    >
                      Enter Reset Code
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => {
                        setSent(false);
                        setEmail("");
                      }}
                      className="w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-green-600 hover:text-green-600 transition-all"
                    >
                      Try Different Email
                    </button>
                  </div>
                </motion.div>
              ) : (
                // ── Form State ──
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Heading */}
                  <motion.div variants={fadeUp} className="mb-8">
                    <h2
                      className="text-4xl font-semibold text-gray-900"
                      style={{
                        fontFamily:
                          "var(--font-cormorant, 'Cormorant Garamond', serif)",
                      }}
                    >
                      Reset Password
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      Enter your email and we'll send you a reset code.
                    </p>
                  </motion.div>

                  {/* Form */}
                  <motion.form
                    variants={fadeUp}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>

                      <div
                        className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all duration-200 ${
                          error
                            ? "border-red-300 ring-2 ring-red-100"
                            : "border-gray-200 hover:border-gray-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100"
                        }`}
                      >
                        <Mail className="h-5 w-5 text-gray-400" />

                        <input
                          type="email"
                          autoFocus
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        />
                      </div>

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

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          Send Reset Code
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.form>

                  {/* Links */}
                  <motion.div
                    variants={fadeUp}
                    className="mt-8 space-y-2 text-center text-sm"
                  >
                    <p className="text-gray-600">
                      Remember your password?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                      >
                        Sign In
                      </Link>
                    </p>
                    <p className="text-gray-600">
                      Don't have an account?{" "}
                      <Link
                        href="/register"
                        className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                      >
                        Create Account
                      </Link>
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
