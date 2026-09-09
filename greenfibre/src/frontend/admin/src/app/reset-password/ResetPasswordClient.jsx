"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Password rule checker
const rules = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "number", label: "One number (0–9)", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

function PasswordStrengthBar({ password }) {
  const passed = rules.filter((r) => r.test(password)).length;
  const pct = (passed / rules.length) * 100;
  const color =
    passed <= 1
      ? "#ef4444"
      : passed <= 2
        ? "#f97316"
        : passed <= 3
          ? "#eab308"
          : passed <= 4
            ? "#84cc16"
            : "#22c55e";
  const label =
    passed === 0
      ? ""
      : passed <= 1
        ? "Very weak"
        : passed <= 2
          ? "Weak"
          : passed <= 3
            ? "Fair"
            : passed <= 4
              ? "Strong"
              : "Very strong";

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-xs font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const { resetPassword, loading } = useUserStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef([]);

  // Auto-focus first OTP box
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  // ── OTP handlers ──────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  // ── Validation ────────────────────────────────────────────
  const otpComplete = otp.join("").length === 6;
  const passwordValid = rules.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPass && confirmPass !== "";
  const canSubmit = otpComplete && passwordValid && passwordsMatch;

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await resetPassword({
      email: emailParam,
      otp: otp.join(""),
      newPassword,
    });
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fdfb] p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-[#e8f5f0] via-[#f8fdfb] to-[#dcfce7]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 60% at 20% 30%, #22c55e44 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, #10b98122 0%, transparent 55%)`,
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dotsr"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="#15803d" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotsr)" />
      </svg>
      <div
        className="absolute top-0 left-0 w-56 h-56 opacity-20 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #15803d 0%, transparent 60%)",
          borderRadius: "0 0 100% 0",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-40 h-40 opacity-15 pointer-events-none"
        style={{
          background: "linear-gradient(315deg, #22c55e 0%, transparent 60%)",
          borderRadius: "100% 0 0 0",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-xl shadow-green-100/80 border border-green-100/60">
            <Image
              src="/logo.jpg"
              alt="Green Fibre"
              width={180}
              height={56}
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-green-100/60 border border-green-50 p-8">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back
          </Link>

          {/* Icon + heading */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-200"
            style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1
            className="text-3xl font-light text-gray-900 mb-1"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
            }}
          >
            Reset Password
          </h1>
          <p className="text-gray-400 text-sm mb-2 leading-relaxed">
            Enter the 6-digit OTP sent to{" "}
            {emailParam && (
              <span className="font-medium text-green-600">{emailParam}</span>
            )}
          </p>

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-800 font-semibold text-lg mb-1">
                Password Reset!
              </p>
              <p className="text-gray-400 text-sm">Redirecting to login...</p>
              <Loader2 className="mt-4 w-4 h-4 animate-spin text-green-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* ── OTP boxes ── */}
              <div className="space-y-2">
                <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                  6-Digit OTP
                </Label>
                <div
                  className="flex gap-2.5 justify-between"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`
                        w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-gray-50
                        outline-none transition-all duration-200 select-none
                        ${
                          digit
                            ? "border-green-500 bg-green-50/50 text-green-700"
                            : "border-gray-200 text-gray-800 hover:border-green-200"
                        }
                        focus:border-green-600 focus:bg-green-50/60 focus:ring-2 focus:ring-green-300/30
                      `}
                    />
                  ))}
                </div>
                {otpComplete && (
                  <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OTP entered
                  </p>
                )}
              </div>

              {/* ── New Password ── */}
              <div className="space-y-1.5">
                <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${focusedField === "new" ? "text-green-600" : "text-gray-400"}`}
                  />
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocusedField("new")}
                    onBlur={() => setFocusedField("")}
                    required
                    className="h-12 pl-11 pr-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200 p-0.5 rounded"
                    tabIndex={-1}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Strength bar */}
                <PasswordStrengthBar password={newPassword} />

                {/* Rules checklist */}
                {newPassword && (
                  <ul className="mt-2 space-y-1">
                    {rules.map((rule) => {
                      const ok = rule.test(newPassword);
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-2 text-xs transition-colors duration-200 ${ok ? "text-green-600" : "text-gray-400"}`}
                        >
                          {ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                          )}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* ── Confirm Password ── */}
              <div className="space-y-1.5">
                <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${focusedField === "confirm" ? "text-green-600" : "text-gray-400"}`}
                  />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField("")}
                    required
                    className={`h-12 pl-11 pr-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30
                      ${
                        confirmPass
                          ? passwordsMatch
                            ? "border-green-400 focus-visible:border-green-400"
                            : "border-red-300 focus-visible:border-red-400"
                          : "focus-visible:border-green-500"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200 p-0.5 rounded"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPass && (
                  <p
                    className={`text-xs flex items-center gap-1 font-medium mt-1 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Passwords do not
                        match
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* ── Submit ── */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="group w-full h-12 rounded-xl text-white text-sm font-semibold tracking-wide relative overflow-hidden shadow-lg shadow-green-200 transition-all duration-300 hover:shadow-green-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
                  }}
                >
                  <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-5">
          © {new Date().getFullYear()} Green Fibre · All rights reserved
        </p>
      </div>
    </div>
  );
}