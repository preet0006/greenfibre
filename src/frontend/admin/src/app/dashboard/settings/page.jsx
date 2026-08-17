"use client";

import { useState, useRef } from "react";
import useUserStore from "@/store/useUserStore";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Pencil,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

// ── Password strength rules ────────────────────────────────────
const RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

function StrengthBar({ password }) {
  if (!password) return null;
  const passed = RULES.filter((r) => r.test(password)).length;
  const pct = (passed / RULES.length) * 100;
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
  return (
    <div className="space-y-1 mt-2">
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {label && (
        <p className="text-xs font-semibold" style={{ color }}>
          {label}
        </p>
      )}
    </div>
  );
}

// ── Shared field label ─────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <Label className="text-gray-600 text-[11px] tracking-widest uppercase font-semibold">
      {children}
    </Label>
  );
}

const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

// ── Section card ───────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  iconColor = "#15803d",
  iconBg = "#dcfce7",
  children,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800 leading-none">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ── Save button ────────────────────────────────────────────────
function SaveButton({ loading, saved, label = "Save Changes" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group inline-flex items-center gap-2 px-5 h-10 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
      style={{
        background: "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
      }}
    >
      <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      <span className="relative flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {label}
          </>
        )}
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { admin, loading, updateProfile, updatePassword } = useUserStore();

  // ── Profile state ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: admin?.full_name || admin?.name || "",
    phone: admin?.phone || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const fileRef = useRef(null);

  // ── Password state ─────────────────────────────────────────
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [passError, setPassError] = useState("");

  // ── Image pick ─────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Profile submit ─────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("full_name", profileForm.full_name);
    fd.append("phone", profileForm.phone);
    if (imageFile) fd.append("profile_image", imageFile);
    await updateProfile(fd);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // ── Password submit ────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError("");

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    const allRulesPassed = RULES.every((r) => r.test(passForm.newPassword));
    if (!allRulesPassed) {
      setPassError("Password does not meet all requirements.");
      return;
    }

    await updatePassword({
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    });

    setPassSaved(true);
    setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setPassSaved(false), 3000);
  };

  // ── Derived ────────────────────────────────────────────────
  const avatarSrc = imagePreview || admin?.profile_image?.original || null;
  const avatarLetter = (admin?.full_name || admin?.name || "A")
    .charAt(0)
    .toUpperCase();
  const passwordsMatch =
    passForm.newPassword &&
    passForm.confirmPassword &&
    passForm.newPassword === passForm.confirmPassword;
  const passwordsMismatch =
    passForm.confirmPassword &&
    passForm.newPassword !== passForm.confirmPassword;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page header ── */}
      <div>
        <h1
          className="text-2xl font-light text-gray-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Account Settings
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Manage your profile information and account security
        </p>
      </div>

      {/* ══════════════════════════════════════
          PROFILE SECTION
      ══════════════════════════════════════ */}
      <Section
        icon={User}
        title="Profile Information"
        description="Update your name, phone and profile picture"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Avatar picker */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {avatarSrc ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-green-100 shadow-lg">
                  <Image
                    src={avatarSrc}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #15803d, #22c55e)",
                  }}
                >
                  {avatarLetter}
                </div>
              )}
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md shadow-green-300 hover:scale-110 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                {admin?.full_name || admin?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{admin?.email}</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-emerald-600 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Change photo
              </button>
              {imageFile && (
                <p className="text-[11px] text-gray-400 mt-1 truncate max-w-40">
                  {imageFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <FieldLabel>Full Name</FieldLabel>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Your full name"
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      full_name: e.target.value,
                    })
                  }
                  required
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <FieldLabel>Phone Number</FieldLabel>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>

            {/* Email — read only */}
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel>
                Email Address{" "}
                <span className="normal-case text-gray-400 font-normal">
                  (read-only)
                </span>
              </FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                <Input
                  value={admin?.email || ""}
                  readOnly
                  className={`${inputCls} pl-11 bg-gray-100 text-gray-400 cursor-not-allowed select-none`}
                />
              </div>
              <p className="text-xs text-gray-400">
                Email cannot be changed from here.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <SaveButton
              loading={loading}
              saved={profileSaved}
              label="Update Profile"
            />
          </div>
        </form>
      </Section>

      {/* ══════════════════════════════════════
          PASSWORD SECTION
      ══════════════════════════════════════ */}
      <Section
        icon={KeyRound}
        title="Change Password"
        description="Keep your account secure with a strong password"
        iconColor="#16a34a"
        iconBg="#d1fae5"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {/* Current password */}
          <div className="space-y-1.5">
            <FieldLabel>Current Password</FieldLabel>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={passForm.currentPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, currentPassword: e.target.value })
                }
                required
                className={`${inputCls} pl-11 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New password */}
            <div className="space-y-1.5">
              <FieldLabel>New Password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Create new password"
                  value={passForm.newPassword}
                  onChange={(e) => {
                    setPassForm({ ...passForm, newPassword: e.target.value });
                    setPassError("");
                  }}
                  required
                  className={`${inputCls} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Strength bar */}
              <StrengthBar password={passForm.newPassword} />

              {/* Rules checklist */}
              {passForm.newPassword && (
                <ul className="mt-2 space-y-1">
                  {RULES.map((rule) => {
                    const ok = rule.test(passForm.newPassword);
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-green-600" : "text-gray-400"}`}
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

            {/* Confirm password */}
            <div className="space-y-1.5">
              <FieldLabel>Confirm New Password</FieldLabel>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={passForm.confirmPassword}
                  onChange={(e) => {
                    setPassForm({
                      ...passForm,
                      confirmPassword: e.target.value,
                    });
                    setPassError("");
                  }}
                  required
                  className={`${inputCls} pl-11 pr-12 ${
                    passForm.confirmPassword
                      ? passwordsMatch
                        ? "border-green-400 focus-visible:border-green-400"
                        : "border-red-300 focus-visible:border-red-400"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Match indicator */}
              {passForm.confirmPassword && (
                <p
                  className={`text-xs flex items-center gap-1.5 font-medium mt-1.5 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Passwords do not match
                    </>
                  )}
                </p>
              )}

              {/* Security tip (idle state) */}
              {!passForm.confirmPassword && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-green-50/60 border border-green-100">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 leading-relaxed">
                    Use a mix of letters, numbers and symbols for a strong
                    password.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {passError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {passError}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <SaveButton
              loading={loading}
              saved={passSaved}
              label="Update Password"
            />
          </div>
        </form>
      </Section>

      {/* ══════════════════════════════════════
          ACCOUNT INFO (read-only) 
      ══════════════════════════════════════ */}
      <Section
        icon={ShieldCheck}
        title="Account Information"
        description="Details about your admin account"
        iconColor="#0284c7"
        iconBg="#e0f2fe"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Account ID",
              value: admin?._id?.slice(-10) || "—",
              mono: true,
            },
            { label: "Role", value: admin?.role || "admin", mono: false },
            {
              label: "Verified",
              value: admin?.isVerified ? "Yes" : "No",
              mono: false,
            },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100"
            >
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                {label}
              </p>
              <p
                className={`text-sm font-semibold text-gray-700 ${mono ? "font-mono" : ""}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}