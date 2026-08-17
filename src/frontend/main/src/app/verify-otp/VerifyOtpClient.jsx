"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
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

const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const verifyOtp = useUserStore((s) => s.verifyOtp);
  const resendOtp = useUserStore((s) => s.resendOtp);
  const loading = useUserStore((s) => s.loading);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef([]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const t = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [countdown]);

  // Auto focus
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Require email in URL
  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Input handler
  const handleChange = useCallback(
    (idx, value) => {
      const digit = value.replace(/\D/g, "").slice(-1);

      setError("");

      const next = [...otp];
      next[idx] = digit;

      setOtp(next);

      if (digit && idx < OTP_LENGTH - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    },
    [otp],
  );

  // Paste
  const handlePaste = useCallback((e) => {
    e.preventDefault();

    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!text) return;

    const next = Array(OTP_LENGTH).fill("");

    text.split("").forEach((d, i) => {
      next[i] = d;
    });

    setOtp(next);

    const lastIdx = Math.min(text.length, OTP_LENGTH - 1);

    inputRefs.current[lastIdx]?.focus();
  }, []);

  // Keyboard
  const handleKeyDown = useCallback(
    (idx, e) => {
      if (e.key === "Backspace" && !otp[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }

      if (e.key === "ArrowLeft" && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }

      if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    },
    [otp],
  );

  // Submit
  const handleSubmit = async (e) => {
    e?.preventDefault();

    const code = otp.join("");

    if (code.length < OTP_LENGTH) {
      setError("Please enter all 6 digits");

      const firstEmpty = otp.findIndex((d) => !d);

      inputRefs.current[firstEmpty]?.focus();

      return;
    }

    const result = await verifyOtp({ email, otp: code }, router);

    if (result?.success) {
      // store already redirects home
      return;
    }

    setError(result?.message || "Invalid OTP. Please try again.");
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  // Auto submit
  useEffect(() => {
    if (otp.every((d) => d !== "")) {
      handleSubmit();
    }
  }, [otp]);

  // Resend
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setResent(false);

    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");

    await resendOtp(email);

    setResending(false);
    setResent(true);

    setCountdown(RESEND_SECONDS);

    inputRefs.current[0]?.focus();

    setTimeout(() => setResent(false), 3000);
  };

  // Masked email
  const maskedEmail = email
    ? email.replace(
        /^(.{2})(.*)(@.*)$/,
        (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c,
      )
    : "your email";

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
                Verify Your
                <br />
                Email Address
              </h1>

              <p className="text-lg leading-relaxed text-gray-600">
                We've sent a secure 6-digit verification code to your email.
                Please enter it below to complete your registration and start
                your sustainable shopping journey.
              </p>

              {/* Benefits */}
              <div className="mt-12 space-y-4">
                {[
                  "Secure one-time verification",
                  "Protects your account",
                  "Quick email verification",
                  "Complete in seconds",
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

            {/* Back */}
            <motion.div variants={fadeUp} className="mb-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Registration
              </Link>
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
                Check Your Email
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Code sent to{" "}
                <span className="font-semibold text-green-600">
                  {maskedEmail}
                </span>
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
                  Verification Code
                </label>

                {/* OTP */}
                <div className="flex items-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`h-12 w-full rounded-xl border-2 bg-white text-center text-xl font-semibold outline-none transition-all ${
                        digit
                          ? "border-green-600 bg-green-50 text-green-700"
                          : error
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      }`}
                    />
                  ))}
                </div>

                {/* Error */}
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

                {/* Success */}
                <AnimatePresence>
                  {resent && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs font-medium text-green-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      New code sent successfully
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || otp.every((d) => !d)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Verify Email
                  </>
                )}
              </button>
            </motion.form>

            {/* Resend */}
            <motion.div variants={fadeUp} className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>

              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend in{" "}
                  <span className="font-semibold text-green-600">
                    {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                    {String(countdown % 60).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${resending ? "animate-spin" : ""}`}
                  />
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              )}
            </motion.div>

            {/* Footer */}
            <motion.p
              variants={fadeUp}
              className="mt-6 text-center text-sm text-gray-600"
            >
              Wrong email?{" "}
              <Link
                href="/register"
                className="font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                Go back to registration
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
