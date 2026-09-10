"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginAdmin, loading } = useUserStore();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginAdmin(formData, router);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fdfb]">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-br from-[#e8f5f0] via-[#f0fdf7] to-[#dcfce7]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 60% at 30% 40%, #22c55e55 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 75% 70%, #10b98133 0%, transparent 55%)`,
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="#15803d" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div className="absolute top-16 right-16 w-32 h-32 rounded-full bg-green-200/50 blur-3xl" />
        <div className="absolute bottom-20 left-12 w-48 h-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-100/60 blur-3xl" />
        <div
          className="absolute top-0 left-0 w-40 h-40 opacity-30 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #15803d 0%, transparent 60%)",
            borderRadius: "0 0 100% 0",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
          style={{
            background: "linear-gradient(315deg, #22c55e 0%, transparent 60%)",
            borderRadius: "100% 0 0 0",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-16 max-w-lg">
          <div className="mb-10 bg-white/80 backdrop-blur-sm rounded-2xl px-10 py-7 shadow-2xl shadow-green-100/80 border border-green-100/60">
            <Image
              src="/logo.jpg"
              alt="Green Fibre"
              width={220}
              height={70}
              priority
              className="object-contain"
            />
          </div>
          <h2
            className="text-3xl mb-3 font-light text-gray-800 leading-snug"
            style={{
              fontFamily:
                "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
            }}
          >
            Sustainability,
            <br />
            <span className="italic" style={{ color: "#15803d" }}>
              Simplified.
            </span>
          </h2>
          <p className="text-sm text-gray-500 tracking-wide max-w-xs leading-relaxed">
            Your complete control center for eco-friendly products and
            sustainable living solutions.
          </p>
          <div className="mt-10 flex flex-wrap gap-2 justify-center">
            {[
              "🛍️ Products",
              "📦 Orders",
              "📊 Analytics",
              "🌱 Inventory",
              "🎟️ Coupons",
              "👥 Customers",
            ].map((item) => (
              <span
                key={item}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white/80 border border-green-100 text-gray-600 shadow-sm font-medium hover:border-green-300 transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 text-xs text-green-300 tracking-widest uppercase">
          © {new Date().getFullYear()} Green Fibre
        </p>
      </div>

      {/* ── Right login panel ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 bg-white relative">
        <div
          className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, #15803d, transparent 70%)",
          }}
        />

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="bg-gray-50 rounded-xl px-8 py-4 border border-gray-100 shadow-sm">
              <Image
                src="/logo.jpg"
                alt="Green Fibre"
                width={160}
                height={50}
                priority
                className="object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md shadow-green-200"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs tracking-widest text-gray-400 uppercase font-medium">
                Admin Portal
              </span>
            </div>
            <h1
              className="text-4xl font-light text-gray-900 mb-1.5"
              style={{
                fontFamily:
                  "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
              }}
            >
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your credentials to access the panel
            </p>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className="h-px flex-1 bg-linear-to-r from-transparent to-green-100" />
            <Sparkles className="w-3.5 h-3.5 text-green-300" />
            <div className="h-px flex-1 bg-linear-to-l from-transparent to-green-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${focused === "email" ? "text-green-600" : "text-gray-400"}`}
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@greenfibre.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  required
                  className="h-12 pl-11 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-green-600 hover:text-emerald-600 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${focused === "password" ? "text-green-600" : "text-gray-400"}`}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  required
                  className="h-12 pl-11 pr-12 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors duration-200 p-0.5 rounded"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group w-full h-12 rounded-xl text-white text-sm font-semibold tracking-wide relative overflow-hidden shadow-lg shadow-green-200 transition-all duration-300 hover:shadow-green-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
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
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Admin Panel"
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-400 tracking-wide">
                SSL Secured Connection
              </span>
            </div>
            <p className="text-xs text-gray-300">
              © {new Date().getFullYear()} Green Fibre · All rights reserved
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}