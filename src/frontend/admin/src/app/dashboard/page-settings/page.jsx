"use client";

import { useEffect, useState } from "react";
import usePageSettingsStore from "@/store/usePageSettingsStore";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Globe,
  Save,
  Plus,
  X,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Link,
  MessageCircle,
  Hash,
  Map,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Section wrapper card ──────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  iconColor = "#15803d",
  iconBg = "#dcfce7",
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
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
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <Label className="text-gray-600 text-[11px] tracking-widest uppercase font-semibold">
      {children}
    </Label>
  );
}

// ── Input class shorthand ─────────────────────────────────────
const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

// ── Tag list (phones / emails) ────────────────────────────────
function TagList({
  items,
  onAdd,
  onRemove,
  placeholder,
  type = "text",
  validate,
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    if (validate) {
      const err = validate(val);
      if (err) {
        setError(err);
        return;
      }
    }
    if (items.includes(val)) {
      setError("Already added");
      return;
    }
    onAdd(val);
    setInput("");
    setError("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type={type}
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={handleKey}
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-0.5 shrink-0"
          style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-50 text-green-700 border border-green-100"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-green-400 hover:text-green-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Social link row ───────────────────────────────────────────
function SocialRow({
  icon: Icon,
  label,
  platform,
  value,
  onChange,
  color,
  placeholder,
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(platform, e.target.value)}
          className={`${inputCls} pl-11`}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PageSettingsPage() {
  const {
    settings,
    loading,
    updating,
    fetchPageSettings,
    updatePageSettings,
    setField,
    setSocialLink,
    addPhoneNumber,
    removePhoneNumber,
    addEmail,
    removeEmail,
  } = usePageSettingsStore();

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPageSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await updatePageSettings(settings);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  console.log("Current settings:", settings);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
          style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
        >
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-light text-gray-900"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Page Settings
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your store&apos;s contact info, social links and footer
            content
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchPageSettings()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="submit"
            disabled={updating}
            className="group inline-flex items-center gap-2 px-5 h-9 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
            }}
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center gap-2">
              {updating ? (
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
                  Save Settings
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* ── Saved toast banner ── */}
      {saved && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Settings saved successfully!
        </div>
      )}

      {/* ── Two-column layout on lg ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT column ── */}
        <div className="space-y-6">
          {/* Company Info */}
          <Section
            icon={Building2}
            title="Company Information"
            description="Basic business details"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Company Name</FieldLabel>
                <Input
                  placeholder="e.g. Green Fibre"
                  value={settings.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>GST Number</FieldLabel>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={settings.gstNumber}
                    onChange={(e) => setField("gstNumber", e.target.value)}
                    className={`${inputCls} pl-11 font-mono tracking-wider`}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section
            icon={Phone}
            title="Contact Details"
            description="Phone numbers and email addresses"
            iconColor="#16a34a"
            iconBg="#d1fae5"
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <FieldLabel>Phone Numbers</FieldLabel>
                <TagList
                  items={settings.phoneNumbers}
                  onAdd={addPhoneNumber}
                  onRemove={removePhoneNumber}
                  placeholder="Enter 10-digit number"
                  type="tel"
                  validate={(v) =>
                    !/^\d{10}$/.test(v) ? "Enter a valid 10-digit number" : ""
                  }
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>WhatsApp Number</FieldLabel>
                <div className="relative">
                  <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
                  <Input
                    placeholder="e.g. 9876543210"
                    type="tel"
                    value={settings.whatsappNumber}
                    onChange={(e) => setField("whatsappNumber", e.target.value)}
                    className={`${inputCls} pl-11`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Email Addresses</FieldLabel>
                <TagList
                  items={settings.emails}
                  onAdd={addEmail}
                  onRemove={removeEmail}
                  placeholder="Enter email address"
                  type="email"
                  validate={(v) =>
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                      ? "Enter a valid email"
                      : ""
                  }
                />
              </div>
            </div>
          </Section>

          {/* Address */}
          <Section
            icon={MapPin}
            title="Address"
            description="Physical store address"
            iconColor="#0284c7"
            iconBg="#e0f2fe"
          >
            <div className="space-y-1.5">
              <FieldLabel>Full Address</FieldLabel>
              <textarea
                placeholder="Enter your complete store address..."
                value={settings.address}
                onChange={(e) => setField("address", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500 transition-all hover:border-green-300"
              />
            </div>
          </Section>
        </div>

        {/* ── RIGHT column ── */}
        <div className="space-y-6">
          {/* Social Links */}
          <Section
            icon={Globe}
            title="Social Media Links"
            description="Connect your brand profiles"
            iconColor="#059669"
            iconBg="#d1fae5"
          >
            <div className="space-y-4">
              <SocialRow
                icon={Instagram}
                label="Instagram"
                platform="instagram"
                value={settings.socialLinks?.instagram || ""}
                onChange={setSocialLink}
                color="#e1306c"
                placeholder="https://instagram.com/greenfibre"
              />
              <SocialRow
                icon={Facebook}
                label="Facebook"
                platform="facebook"
                value={settings.socialLinks?.facebook || ""}
                onChange={setSocialLink}
                color="#1877f2"
                placeholder="https://facebook.com/greenfibre"
              />
              <SocialRow
                icon={Twitter}
                label="Twitter / X"
                platform="twitter"
                value={settings.socialLinks?.twitter || ""}
                onChange={setSocialLink}
                color="#1da1f2"
                placeholder="https://twitter.com/greenfibre"
              />
              <SocialRow
                icon={Youtube}
                label="YouTube"
                platform="youtube"
                value={settings.socialLinks?.youtube || ""}
                onChange={setSocialLink}
                color="#ff0000"
                placeholder="https://youtube.com/@greenfibre"
              />
              <SocialRow
                icon={Linkedin}
                label="LinkedIn"
                platform="linkedin"
                value={settings.socialLinks?.linkedin || ""}
                onChange={setSocialLink}
                color="#0a66c2"
                placeholder="https://linkedin.com/company/greenfibre"
              />
              <SocialRow
                icon={Link}
                label="Pinterest"
                platform="pinterest"
                value={settings.socialLinks?.pinterest || ""}
                onChange={setSocialLink}
                color="#e60023"
                placeholder="https://pinterest.com/greenfibre"
              />
            </div>
          </Section>

          {/* Footer */}
          <Section
            icon={FileText}
            title="Footer Content"
            description="Text shown in website footer"
            iconColor="#f57c00"
            iconBg="#fff3e0"
          >
            <div className="space-y-1.5">
              <FieldLabel>Footer Description</FieldLabel>
              <textarea
                placeholder="A short description of your brand for the footer..."
                value={settings.footerDescription}
                onChange={(e) => setField("footerDescription", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500 transition-all hover:border-green-300"
              />
              <p className="text-xs text-gray-400 text-right">
                {settings.footerDescription?.length || 0} chars
              </p>
            </div>
          </Section>

          {/* Google Map */}
          <Section
            icon={Map}
            title="Google Maps Embed"
            description="Paste your Google Maps iframe src URL"
            iconColor="#166534"
            iconBg="#dcfce7"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Embed URL</FieldLabel>
                <Input
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  value={settings.googleMapEmbedUrl}
                  onChange={(e) =>
                    setField("googleMapEmbedUrl", e.target.value)
                  }
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Go to Google Maps → Share → Embed a map → copy the{" "}
                  <code className="bg-gray-100 px-1 rounded text-green-600">
                    src
                  </code>{" "}
                  URL only.
                </p>
              </div>

              {/* Live preview */}
              {settings.googleMapEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <iframe
                    src={settings.googleMapEmbedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store location"
                  />
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Sticky bottom save bar (mobile) ── */}
      <div className="sticky bottom-0 left-0 right-0 sm:hidden bg-white/80 backdrop-blur-md border-t border-green-50 px-5 py-3 -mx-5 -mb-5 shadow-lg shadow-green-50">
        <button
          type="submit"
          disabled={updating}
          className="group w-full h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
          }}
        >
          <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <span className="relative flex items-center justify-center gap-2">
            {updating ? (
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
                Save All Settings
              </>
            )}
          </span>
        </button>
      </div>
    </form>
  );
}