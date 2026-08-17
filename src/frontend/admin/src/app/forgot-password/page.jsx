"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, loading } = useUserStore();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) {
      setSent(true);
      // Navigate to reset page with email in query
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fdfb] p-6 relative overflow-hidden">
      {/* Background decorations */}
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
            id="dots2"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="#15803d" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots2)" />
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

      {/* Card */}
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

        {/* Panel */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-green-100/60 border border-green-50 p-8">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to login
          </Link>

          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-200"
            style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            <Send className="w-5 h-5 text-white" />
          </div>

          <h1
            className="text-3xl font-light text-gray-900 mb-1"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
            }}
          >
            Forgot Password?
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            No worries. Enter your admin email and we&apos;ll send a 6-digit OTP
            to reset your password.
          </p>

          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center py-6 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                <svg
                  className="w-7 h-7 text-white"
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
              <p className="text-gray-800 font-medium mb-1">OTP Sent!</p>
              <p className="text-gray-400 text-sm">
                Redirecting to reset page...
              </p>
              <Loader2 className="mt-4 w-4 h-4 animate-spin text-green-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${focused ? "text-green-600" : "text-gray-400"}`}
                  />
                  <Input
                    type="email"
                    placeholder="admin@greenfibre.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    className="h-12 pl-11 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full h-12 rounded-xl text-white text-sm font-semibold tracking-wide relative overflow-hidden shadow-lg shadow-green-200 transition-all duration-300 hover:shadow-green-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
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
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reset OTP
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