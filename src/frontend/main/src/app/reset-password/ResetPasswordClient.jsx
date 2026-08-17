"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
  X as XIcon,
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

const OTP_LENGTH = 6;

// ── Shared Input ──────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const resetPassword = useUserStore((s) => s.resetPassword);
  const loading = useUserStore((s) => s.loading);

  // OTP
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // Password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [errors, setErrors] = useState({});

  // Focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // OTP Change
  const handleOtpChange = useCallback(
    (idx, value) => {
      const digit = value.replace(/\D/g, "").slice(-1);

      setErrors((e) => ({ ...e, otp: "" }));

      const next = [...otp];
      next[idx] = digit;
      setOtp(next);

      if (digit && idx < OTP_LENGTH - 1) {
        inputRefs.current[idx + 1]?.focus();
      }
    },
    [otp],
  );

  // Keyboard
  const handleOtpKeyDown = useCallback(
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
    setErrors((e) => ({ ...e, otp: "" }));
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  // Validation
  const validate = () => {
    const e = {};
    const code = otp.join("");

    if (code.length < OTP_LENGTH) {
      e.otp = "Enter all 6 digits";
    }

    if (!password) {
      e.password = "New password is required";
    } else if (password.length < 6) {
      e.password = "Minimum 6 characters";
    }

    if (!confirm) {
      e.confirm = "Please confirm password";
    } else if (confirm !== password) {
      e.confirm = "Passwords do not match";
    }

    return e;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const success = await resetPassword(
      {
        email,
        otp: otp.join(""),
        password,
      },
      router,
    );

    if (success) {
      router.push("/login");
    }
  };

  // Masked Email
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
                Create Your
                <br />
                New Password
              </h1>

              <p className="text-lg leading-relaxed text-gray-600">
                Enter the verification code sent to your email and create a
                strong new password to secure your Green Fibre account.
              </p>

              {/* Benefits */}
              <div className="mt-12 space-y-4">
                {[
                  "Secure password reset process",
                  "Strong encryption protection",
                  "Account recovery in minutes",
                  "Your data stays protected",
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
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
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
                Reset Password
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
              {/* OTP */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>

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
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`h-12 w-full rounded-xl border-2 bg-white text-center text-xl font-semibold outline-none transition-all ${
                        digit
                          ? "border-green-600 bg-green-50 text-green-700"
                          : errors.otp
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {errors.otp && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-red-600"
                    >
                      {errors.otp}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <Field label="New Password" error={errors.password}>
                <Input
                  icon={Lock}
                  type={showPw ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((er) => ({ ...er, password: "" }));
                  }}
                  error={errors.password}
                  autoComplete="new-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="text-gray-400 hover:text-green-600"
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

              {/* Confirm */}
              <Field label="Confirm Password" error={errors.confirm}>
                <Input
                  icon={Lock}
                  type={showCf ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setErrors((er) => ({ ...er, confirm: "" }));
                  }}
                  error={errors.confirm}
                  autoComplete="new-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowCf(!showCf)}
                      className="text-gray-400 hover:text-green-600"
                    >
                      {showCf ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                />

                {/* Match indicator */}
                <AnimatePresence>
                  {confirm && password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        confirm === password ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {confirm === password ? (
                        <>
                          <Check className="h-3 w-3" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <XIcon className="h-3 w-3" />
                          Passwords do not match
                        </>
                      )}
                    </motion.p>
                  )}
                </AnimatePresence>
              </Field>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Reset Password
                  </>
                )}
              </button>
            </motion.form>

            {/* Footer Links */}
            <motion.div
              variants={fadeUp}
              className="mt-8 space-y-2 text-center text-sm"
            >
              <p className="text-gray-600">
                Didn't receive the code?{" "}
                <Link
                  href="/forgot-password"
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  Resend Code
                </Link>
              </p>
              <p className="text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
