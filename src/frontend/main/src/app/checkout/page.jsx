"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/useAddressStore";
import useOrderStore from "@/store/useOrderStore";
import useUserStore from "@/store/useUserStore";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  MapPin,
  Plus,
  Check,
  ChevronRight,
  Package,
  Loader2,
  AlertCircle,
  Truck,
  ShieldCheck,
  CreditCard,
  Edit,
  Tag,
  X,
  Leaf,
  Building2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

// Indian states for address form
const INDIAN_STATES = [
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
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ── Address Modal ─────────────────────────────────────────────
function AddressModal({ isOpen, onClose, onSave, editAddress = null }) {
  const [form, setForm] = useState({
    addressType: "shipping",
    fullName: "",
    companyName: "",
    streetAddress: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editAddress) {
      setForm(editAddress);
    } else {
      setForm({
        addressType: "shipping",
        fullName: "",
        companyName: "",
        streetAddress: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        isDefault: false,
      });
    }
    setErrors({});
  }, [editAddress, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      newErrors.fullName = "Full name is required (min 2 characters)";
    if (!form.streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state) newErrors.state = "State is required";
    if (!/^\d{6}$/.test(form.pincode))
      newErrors.pincode = "Valid 6-digit pincode required";
    if (!/^\d{10}$/.test(form.phone))
      newErrors.phone = "Valid 10-digit phone number required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Valid email required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editAddress ? "Edit Address" : "Add New Address"}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Address Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Address Type
                </label>
                <div className="flex gap-3">
                  {["shipping", "billing"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, addressType: type })}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold capitalize transition-all ${
                        form.addressType === type
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Company */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.fullName
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    placeholder="Company name"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.streetAddress}
                  onChange={(e) =>
                    setForm({ ...form, streetAddress: e.target.value })
                  }
                  rows={2}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.streetAddress
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                  }`}
                  placeholder="House no., Building name, Street"
                />
                {errors.streetAddress && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.streetAddress}
                  </p>
                )}
              </div>

              {/* Landmark */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(e) =>
                    setForm({ ...form, landmark: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                  placeholder="Near landmark"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.city
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.state
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-500">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({ ...form, pincode: e.target.value })
                    }
                    maxLength={6}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.pincode
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                    placeholder="123456"
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    maxLength={10}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                    placeholder="10-digit number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-green-100"
                    }`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as default {form.addressType} address
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editAddress ? (
                  "Update Address"
                ) : (
                  "Add Address"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Address card ──────────────────────────────────────────────
function AddressCard({ address, selected, onSelect, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-green-600 bg-green-50"
          : "border-gray-200 bg-white hover:border-green-200"
      }`}
      onClick={onSelect}
    >
      {/* Select indicator */}
      <div
        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
          selected
            ? "border-green-600 bg-green-600"
            : "border-gray-300 bg-white"
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      <div className="pr-8">
        {/* Type badge */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
              address.addressType === "shipping"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {address.addressType}
          </span>
          {address.isDefault && (
            <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              Default
            </span>
          )}
        </div>

        {/* Name */}
        <p className="font-semibold text-gray-900">{address.fullName}</p>

        {/* Address */}
        <p className="mt-1 text-sm text-gray-600">
          {address.streetAddress}
          {address.landmark && `, ${address.landmark}`}
        </p>
        <p className="text-sm text-gray-600">
          {address.city}, {address.state} - {address.pincode}
        </p>

        {/* Contact */}
        <p className="mt-2 text-sm font-medium text-gray-700">
          {address.phone}
        </p>
      </div>

      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-600"
      >
        <Edit className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ── Cart summary item ─────────────────────────────────────────
function CartSummaryItem({ item }) {
  const product = item.product;
  const imgSrc = product?.thumbnail || product?.image || null;

  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
          {item.quantity}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </p>
        {item.colorName && (
          <div className="mt-1 flex items-center gap-1.5">
            {item.colorHex && (
              <div
                className="h-3 w-3 rounded-full border border-gray-200"
                style={{ backgroundColor: item.colorHex }}
              />
            )}
            <span className="text-xs text-gray-500">{item.colorName}</span>
          </div>
        )}
        <p className="mt-1 text-sm font-bold text-green-600">
          {formatPrice(item.price)} × {item.quantity}
        </p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authChecked = useUserStore((s) => s.authChecked);

  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const loading = useCartStore((s) => s.loading);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const addresses = useAddressStore((s) => s.addresses);
  const fetchAddresses = useAddressStore((s) => s.fetchAddresses);
  const addressLoading = useAddressStore((s) => s.loading);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);

  const createOrder = useOrderStore((s) => s.createOrder);
  const orderLoading = useOrderStore((s) => s.actionLoading);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("online"); // online or cod
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (authChecked && !user) {
      const search =
        typeof window !== "undefined" ? window.location.search || "" : "";
      router.push(
        `/login?redirect=${encodeURIComponent(`/checkout${search}`)}`,
      );
      return;
    }
    if (user) {
      fetchCart();
      fetchAddresses();
    }
  }, [authChecked, user]);

  // Get coupon from URL params (if passed from cart page)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const coupon = params.get("coupon");
      const discount = params.get("discount");

      if (coupon && discount) {
        setAppliedCoupon({
          code: coupon,
          discountAmount: parseFloat(discount),
        });
      }
    }
  }, []);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddress(defaultAddr || addresses[0]);
    }
  }, [addresses]);

  // Check if cart is empty
  useEffect(() => {
    if (authChecked && user && !loading && items.length === 0) {
      router.push("/cart");
    }
  }, [authChecked, user, loading, items]);

  // Pricing calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const originalTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.product?.originalPrice || 0) * item.quantity,
        0,
      ),
    [items],
  );

  const productSavings = originalTotal - subtotal;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const subtotalAfterDiscount = subtotal - couponDiscount;

  // Catalog prices are charged as-is (backend/Easebuzz). Do not add GST here
  // or the UI total will disagree with the amount actually charged.
  const shippingCharges = 0; // Free shipping
  const finalTotal = subtotalAfterDiscount + shippingCharges;

  // Check stock
  const hasOutOfStock = items.some((i) => {
    const colorVariant = i.product?.colors?.[i.colorIndex];
    return !colorVariant || colorVariant.stock <= 0;
  });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }
    if (hasOutOfStock) {
      toast.error("Remove out-of-stock items before placing the order");
      return;
    }

    const orderData = {
      shippingAddress: {
        fullName: selectedAddress.fullName,
        companyName: selectedAddress.companyName,
        streetAddress: selectedAddress.streetAddress,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
        email: selectedAddress.email || user?.email || "",
      },
      couponCode: appliedCoupon?.code || undefined,
    };

    const result = await createOrder(orderData);

    if (result) {
      // Backend already called Easebuzz initiateLink and returned a ready URL.
      // Just redirect the browser there — no client-side form POST needed.
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    }
  };


  const handleSaveAddress = async (addressData) => {
    let success;
    if (editingAddress) {
      success = await updateAddress(editingAddress._id, addressData);
    } else {
      success = await addAddress(addressData);
    }

    if (success) {
      setShowAddressModal(false);
      setEditingAddress(null);
      await fetchAddresses();
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  if (!authChecked || loading || addressLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-3 text-sm text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-linear-to-br from-green-600 to-green-700">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-10 select-none opacity-[0.07]">
          <Leaf className="h-64 w-64 text-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-2 text-sm font-medium text-white/60">
            <Link href="/" className="hover:text-white/90 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/cart"
              className="hover:text-white/90 transition-colors"
            >
              Cart
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white/90">Checkout</span>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              Secure Checkout
            </p>
            <h1
              className="mt-2 text-4xl font-semibold text-white sm:text-5xl"
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', serif)",
              }}
            >
              Complete Your Order
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* ── Left — Shipping & Payment ── */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Shipping Address
                </h2>
                <button
                  onClick={handleAddNewAddress}
                  className="flex items-center gap-1 text-sm font-semibold text-green-600 transition-opacity hover:opacity-70"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
                  <MapPin className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    No addresses found
                  </p>
                  <button
                    onClick={handleAddNewAddress}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr._id}
                      address={addr}
                      selected={selectedAddress?._id === addr._id}
                      onSelect={() => setSelectedAddress(addr)}
                      onEdit={() => handleEditAddress(addr)}
                    />
                  ))}
                </div>
              )}

              {!selectedAddress && addresses.length > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Please select a shipping address
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CreditCard className="h-5 w-5 text-green-600" />
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Online Payment */}
                <div
                  onClick={() => setPaymentMethod("online")}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    paymentMethod === "online"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          paymentMethod === "online"
                            ? "border-green-600 bg-green-600"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {paymentMethod === "online" && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Pay Online (Recommended)
                        </p>
                        <p className="text-xs text-gray-500">
                          Credit/Debit Card, UPI, Net Banking
                        </p>
                      </div>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{" "}
                  <Link
                    href="/terms-and-conditions"
                    className="font-semibold text-green-600 hover:underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-green-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>
          </div>

          {/* ── Right — Order Summary ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4">
              {/* Order Items */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Order Summary ({items.length} items)
                </p>
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartSummaryItem
                      key={`${item.product?._id || item._id}-${item.colorIndex}`}
                      item={item}
                    />
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Price Details
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({items.reduce((s, i) => s + i.quantity, 0)}{" "}
                      items)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {productSavings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Product discount</span>
                      <span className="font-semibold text-green-600">
                        −{formatPrice(productSavings)}
                      </span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600">
                          −{formatPrice(couponDiscount)}
                        </span>
                        <button
                          onClick={() => setAppliedCoupon(null)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Prices are as listed; no extra GST is added at checkout.
                  </p>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        Total Amount
                      </span>
                      <div className="text-right">
                        <span
                          className="text-2xl font-bold text-green-600"
                          style={{
                            fontFamily:
                              "var(--font-cormorant, 'Cormorant Garamond', serif)",
                          }}
                        >
                          {formatPrice(finalTotal)}
                        </span>
                        {productSavings + couponDiscount > 0 && (
                          <p className="text-xs font-semibold text-green-600">
                            You save{" "}
                            {formatPrice(productSavings + couponDiscount)}!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePlaceOrder}
                  disabled={
                    !selectedAddress ||
                    !agreeTerms ||
                    hasOutOfStock ||
                    orderLoading
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Place Order & Pay
                    </>
                  )}
                </motion.button>

                {!agreeTerms && (
                  <p className="mt-2 text-center text-xs text-red-500">
                    Please agree to terms & conditions
                  </p>
                )}
                {hasOutOfStock && (
                  <p className="mt-2 text-center text-xs text-red-500">
                    Remove out-of-stock items from cart
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="space-y-2">
                {[
                  { icon: ShieldCheck, text: "100% Secure Payment" },
                  { icon: Truck, text: "Free Shipping on All Orders" },
                  { icon: Package, text: "Easy Returns & Refunds" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />
    </div>
  );
}
