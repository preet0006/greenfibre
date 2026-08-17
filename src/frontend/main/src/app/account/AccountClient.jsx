"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useUserStore from "@/store/useUserStore";
import useAddressStore from "@/store/useAddressStore";
import {
  User,
  MapPin,
  Lock,
  Trash2,
  ChevronRight,
  Camera,
  Loader2,
  Check,
  Plus,
  Pencil,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Home,
  Briefcase,
  Phone,
  Mail,
  Star,
  LogOut,
} from "lucide-react";

// ── Variants ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, scale: 0.95 },
};

// ── Shared Components ─────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
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

function Input({ error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 ${
        error
          ? "border-red-300 ring-2 ring-red-100"
          : focused
            ? "border-green-600 ring-2 ring-green-100"
            : "border-gray-200 hover:border-gray-300"
      }`}
      {...props}
    />
  );
}

function Select({ error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`h-11 w-full appearance-none rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition-all ${
        error
          ? "border-red-300"
          : focused
            ? "border-green-600 ring-2 ring-green-100"
            : "border-gray-200 hover:border-gray-300"
      }`}
      {...props}
    >
      {children}
    </select>
  );
}

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "password", label: "Password", icon: Lock },
  { key: "danger", label: "Danger Zone", icon: Trash2 },
];

// ─────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const updateProfile = useUserStore((s) => s.updateProfile);
  const loading = useUserStore((s) => s.loading);

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone || "",
  });
  const [preview, setPreview] = useState(user?.profile_image?.original || null);
  const [imgFile, setImgFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleImg = (file) => {
    if (!file?.type.startsWith("image/")) return;
    setImgFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Name is required";
    if (form.phone_number && !/^\d{10}$/.test(form.phone_number))
      e.phone_number = "Enter a valid 10-digit number";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const fd = new FormData();
    fd.append("full_name", form.full_name.trim());
    if (form.phone_number) fd.append("phone_number", form.phone_number.trim());
    if (imgFile) fd.append("profile_image", imgFile);
    await updateProfile(fd);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Profile Information
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Update your name, phone and profile picture.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-400">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow-sm transition-all hover:bg-green-700"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImg(e.target.files?.[0])}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-xs font-medium text-green-600 hover:text-green-700"
            >
              Change photo
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required error={errors.full_name}>
            <Input
              value={form.full_name}
              onChange={(e) => upd("full_name", e.target.value)}
              error={errors.full_name}
              autoComplete="name"
            />
          </Field>
          <Field label="Email Address">
            <Input
              value={user?.email || ""}
              disabled
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 outline-none cursor-not-allowed"
            />
          </Field>
          <Field label="Phone Number" error={errors.phone_number}>
            <Input
              value={form.phone_number}
              onChange={(e) =>
                upd(
                  "phone_number",
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              error={errors.phone_number}
              placeholder="10-digit number"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>

      {/* Account info */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Account Details
        </p>
        <div className="space-y-2">
          {[
            {
              label: "Account Type",
              value: user?.role === "admin" ? "Administrator" : "Customer",
            },
            { label: "Verified", value: user?.isVerified ? "Yes" : "Pending" },
            {
              label: "Member Since",
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADDRESS FORM MODAL
// ─────────────────────────────────────────────────────────────
function AddressForm({ initial, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    addressType: initial?.addressType || "shipping",
    fullName: initial?.fullName || "",
    companyName: initial?.companyName || "",
    streetAddress: initial?.streetAddress || "",
    landmark: initial?.landmark || "",
    city: initial?.city || "",
    state: initial?.state || "",
    pincode: initial?.pincode || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    isDefault: initial?.isDefault || false,
  });
  const [errors, setErrors] = useState({});

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.streetAddress.trim()) e.streetAddress = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state) e.state = "Required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "6-digit pincode required";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "10-digit number required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 pt-36">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit="exit"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3
            className="text-lg font-semibold text-gray-900"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            {initial ? "Edit Address" : "Add New Address"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <Field label="Address Type">
              <div className="grid grid-cols-2 gap-2">
                {["shipping", "billing"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => upd("addressType", t)}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                      form.addressType === t
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t === "shipping" ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name" required error={errors.fullName}>
                <Input
                  value={form.fullName}
                  onChange={(e) => upd("fullName", e.target.value)}
                  error={errors.fullName}
                />
              </Field>
              <Field label="Company (optional)">
                <Input
                  value={form.companyName}
                  onChange={(e) => upd("companyName", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Street Address" required error={errors.streetAddress}>
              <Input
                value={form.streetAddress}
                onChange={(e) => upd("streetAddress", e.target.value)}
                error={errors.streetAddress}
                placeholder="House no., street, area"
              />
            </Field>

            <Field label="Landmark">
              <Input
                value={form.landmark}
                onChange={(e) => upd("landmark", e.target.value)}
                placeholder="Near..."
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" required error={errors.city}>
                <Input
                  value={form.city}
                  onChange={(e) => upd("city", e.target.value)}
                  error={errors.city}
                />
              </Field>
              <Field label="State" required error={errors.state}>
                <Select
                  value={form.state}
                  onChange={(e) => upd("state", e.target.value)}
                  error={errors.state}
                >
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Pincode" required error={errors.pincode}>
                <Input
                  value={form.pincode}
                  onChange={(e) =>
                    upd(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  error={errors.pincode}
                  placeholder="6-digit pincode"
                />
              </Field>
              <Field label="Phone" required error={errors.phone}>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    upd("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  error={errors.phone}
                  placeholder="10-digit number"
                />
              </Field>
            </div>

            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => upd("email", e.target.value)}
                error={errors.email}
              />
            </Field>

            {/* Default toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Set as default
                </p>
                <p className="text-xs text-gray-500">
                  Use as default {form.addressType} address
                </p>
              </div>
              <button
                type="button"
                onClick={() => upd("isDefault", !form.isDefault)}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.isDefault ? "bg-green-600" : "bg-gray-200"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initial ? (
                  "Update Address"
                ) : (
                  "Add Address"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADDRESSES TAB
// ─────────────────────────────────────────────────────────────
function AddressesTab() {
  const addresses = useAddressStore((s) => s.addresses);
  const loading = useAddressStore((s) => s.loading);
  const actionLoading = useAddressStore((s) => s.actionLoading);
  const fetchAddresses = useAddressStore((s) => s.fetchAddresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const deleteAddress = useAddressStore((s) => s.deleteAddress);
  const setDefaultAddress = useAddressStore((s) => s.setDefaultAddress);

  const [showForm, setShowForm] = useState(false);
  const [editAddr, setEditAddr] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (data) => {
    let ok;
    if (editAddr) {
      ok = await updateAddress(editAddr._id, data);
    } else {
      ok = await addAddress(data);
    }
    if (ok) {
      setShowForm(false);
      setEditAddr(null);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await deleteAddress(id);
    setDeleting(null);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-gray-900"
            style={{
              fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
            }}
          >
            Saved Addresses
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your shipping and billing addresses.
          </p>
        </div>
        <button
          onClick={() => {
            setEditAddr(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
        >
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 space-y-2"
            >
              <div className="h-4 w-32 rounded-full bg-gray-200" />
              <div className="h-3 w-full rounded-full bg-gray-100" />
              <div className="h-3 w-3/4 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white py-14 text-center">
          <MapPin className="h-12 w-12 text-gray-300" />
          <div>
            <p className="font-semibold text-gray-900">No addresses saved</p>
            <p className="mt-1 text-sm text-gray-600">
              Add a shipping address to speed up checkout.
            </p>
          </div>
          <button
            onClick={() => {
              setEditAddr(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-all hover:bg-green-100"
          >
            <Plus className="h-4 w-4" /> Add your first address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`relative rounded-xl border bg-white p-5 transition-all ${addr.isDefault ? "border-green-600 shadow-md" : "border-gray-200 shadow-sm"}`}
            >
              {/* Type + default badge */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      addr.addressType === "shipping"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {addr.addressType === "shipping" ? (
                      <Home className="h-3 w-3" />
                    ) : (
                      <Briefcase className="h-3 w-3" />
                    )}
                    {addr.addressType.charAt(0).toUpperCase() +
                      addr.addressType.slice(1)}
                  </span>
                  {addr.isDefault && (
                    <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      <Star className="h-3 w-3 fill-green-700" /> Default
                    </span>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!addr.isDefault && (
                    <button
                      onClick={() =>
                        setDefaultAddress(addr._id, addr.addressType)
                      }
                      className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditAddr(addr);
                      setShowForm(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    disabled={deleting === addr._id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    {deleting === addr._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Address details */}
              <p className="text-sm font-semibold text-gray-900">
                {addr.fullName}
              </p>
              {addr.companyName && (
                <p className="text-xs text-gray-500">{addr.companyName}</p>
              )}
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                {addr.streetAddress}
                {addr.landmark ? `, ${addr.landmark}` : ""}
                <br />
                {addr.city}, {addr.state} – {addr.pincode}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {addr.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {addr.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <AddressForm
            initial={editAddr}
            onClose={() => {
              setShowForm(false);
              setEditAddr(null);
            }}
            onSave={handleSave}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// PASSWORD TAB
// ─────────────────────────────────────────────────────────────
function PasswordTab() {
  const updatePassword = useUserStore((s) => s.updatePassword);
  const loading = useUserStore((s) => s.loading);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({ curr: false, new: false, cf: false });
  const [saved, setSaved] = useState(false);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Current password required";
    if (!form.newPassword) e.newPassword = "New password required";
    else if (form.newPassword.length < 6)
      e.newPassword = "Minimum 6 characters";
    if (!form.confirm) e.confirm = "Please confirm your new password";
    else if (form.confirm !== form.newPassword)
      e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await updatePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setForm({ currentPassword: "", newPassword: "", confirm: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const PwInput = ({ field, label, required, placeholder }) => (
    <Field label={label} required={required} error={errors[field]}>
      <div
        className={`flex h-11 items-center gap-3 rounded-xl border bg-white px-4 transition-all ${
          errors[field]
            ? "border-red-300 ring-2 ring-red-100"
            : "border-gray-200 hover:border-gray-300 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100"
        }`}
      >
        <Lock className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type={
            show[
              field === "currentPassword"
                ? "curr"
                : field === "newPassword"
                  ? "new"
                  : "cf"
            ]
              ? "text"
              : "password"
          }
          value={form[field]}
          onChange={(e) => upd(field, e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={() =>
            setShow((s) => ({
              ...s,
              [field === "currentPassword"
                ? "curr"
                : field === "newPassword"
                  ? "new"
                  : "cf"]:
                !s[
                  field === "currentPassword"
                    ? "curr"
                    : field === "newPassword"
                      ? "new"
                      : "cf"
                ],
            }))
          }
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          {show[
            field === "currentPassword"
              ? "curr"
              : field === "newPassword"
                ? "new"
                : "cf"
          ] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </Field>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Change Password
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Keep your account secure with a strong password.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <PwInput
          field="currentPassword"
          label="Current Password"
          required
          placeholder="Enter current password"
        />
        <PwInput
          field="newPassword"
          label="New Password"
          required
          placeholder="Create a new password"
        />
        <PwInput
          field="confirm"
          label="Confirm Password"
          required
          placeholder="Re-enter new password"
        />

        <AnimatePresence>
          {form.confirm && form.newPassword && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs font-medium flex items-center gap-1.5 ${form.confirm === form.newPassword ? "text-green-600" : "text-red-600"}`}
            >
              {form.confirm === form.newPassword ? (
                <>
                  <Check className="h-3 w-3" />
                  Passwords match
                </>
              ) : (
                <>
                  <X className="h-3 w-3" />
                  Passwords do not match
                </>
              )}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Updated!
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// DANGER ZONE TAB
// ─────────────────────────────────────────────────────────────
function DangerTab({ user }) {
  const deleteAccount = useUserStore((s) => s.deleteAccount);
  const logout = useUserStore((s) => s.logout);
  const loading = useUserStore((s) => s.loading);
  const router = useRouter();

  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    await deleteAccount(router);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          style={{
            fontFamily: "var(--font-cormorant, 'Cormorant Garamond', serif)",
          }}
        >
          Danger Zone
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Irreversible actions — proceed with caution.
        </p>
      </div>

      {/* Sign out */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Sign out of all devices
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              Log out from your current session.
            </p>
          </div>
          <button
            onClick={() => logout(router)}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">Delete Account</p>
            <p className="mt-0.5 text-xs text-red-600">
              Permanently delete your account and all associated data including
              orders, addresses, and reviews. This action cannot be undone.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {!showConfirm ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4" /> Delete My Account
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-sm font-semibold text-red-700">
                Type <strong>DELETE</strong> to confirm
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="h-10 w-full max-w-xs rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 placeholder:font-normal placeholder:text-red-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                  className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || loading}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {loading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (authChecked && !user) router.push("/login");
  }, [authChecked, user]);

  if (!authChecked || !user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-linear-to-b from-green-50 to-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">My Account</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-green-600 bg-green-50 flex items-center justify-center text-xl font-semibold text-green-700">
              {user.profile_image?.original ? (
                <img
                  src={user.profile_image.original}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.full_name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div>
              <h1
                className="text-3xl sm:text-4xl font-semibold text-gray-900"
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', serif)",
                }}
              >
                {user.full_name}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar tabs */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                const isDanger = key === "danger";
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-all border-b border-gray-100 last:border-b-0 ${
                      isActive
                        ? isDanger
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                        : isDanger
                          ? "text-red-500/70 hover:bg-red-50/50"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </nav>

            {/* Quick links */}
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {[
                { label: "My Orders", href: "/orders", icon: "📦" },
                { label: "Wishlist", href: "/wishlist", icon: "❤️" },
                { label: "My Cart", href: "/cart", icon: "🛒" },
              ].map(({ label, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors last:border-b-0 hover:bg-gray-50"
                >
                  <span>{icon}</span> {label}
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </aside>

          {/* Tab content */}
          <main>
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <ProfileTab key="profile" user={user} />
              )}
              {activeTab === "addresses" && <AddressesTab key="addresses" />}
              {activeTab === "password" && <PasswordTab key="password" />}
              {activeTab === "danger" && <DangerTab key="danger" user={user} />}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
