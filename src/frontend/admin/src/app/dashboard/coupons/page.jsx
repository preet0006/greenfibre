"use client";

import { useEffect, useState, useMemo } from "react";
import useCouponStore from "@/store/useCouponStore";
import {
  Ticket,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  Calendar,
  Users,
  Percent,
  IndianRupee,
  Tag,
  Hash,
  Infinity,
  Clock,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Helpers ────────────────────────────────────────────────────
const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

function FL({ children, required }) {
  return (
    <Label className="text-gray-600 text-[11px] tracking-widest uppercase font-semibold">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpired(d) {
  return d && new Date(d) < new Date();
}

function daysLeft(d) {
  if (!d) return null;
  const diff = new Date(d) - new Date();
  if (diff < 0) return -1;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Copy-to-clipboard hook ─────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return { copied, copy };
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ coupon, onConfirm, onCancel, loading }) {
  if (!coupon) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-red-100/60 border border-red-50 p-7 w-full max-w-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Coupon?
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete
            </p>
            <p className="font-mono font-bold text-lg tracking-widest text-gray-800">
              {coupon.code}
            </p>
            {coupon.usedCount > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                This coupon has been used {coupon.usedCount} time
                {coupon.usedCount > 1 ? "s" : ""}.
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Coupon Drawer ───────────────────────────────────────
function CreateDrawer({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    expiryDate: "",
    usageLimit: "0", // 0 = unlimited
    perUserLimit: "1",
  });
  const [errors, setErrors] = useState({});

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Code is required";
    if (!form.discountValue) e.discountValue = "Discount value is required";
    if (
      form.discountType === "percentage" &&
      (Number(form.discountValue) < 1 || Number(form.discountValue) > 100)
    )
      e.discountValue = "Must be between 1 and 100";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    if (new Date(form.expiryDate) < new Date())
      e.expiryDate = "Date must be in the future";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      expiryDate: form.expiryDate,
      usageLimit: Number(form.usageLimit) || 0,
      perUserLimit: Number(form.perUserLimit) || 1,
    };
    if (form.maxDiscountAmount)
      payload.maxDiscountAmount = Number(form.maxDiscountAmount);
    onSubmit(payload);
  };

  // Suggested code generator
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    upd("code", code);
  };

  // Tomorrow min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                New Coupon
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a discount coupon code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          {/* Code */}
          <div className="space-y-1.5">
            <FL required>Coupon Code</FL>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => upd("code", e.target.value.toUpperCase())}
                  className={`${inputCls} pl-11 font-mono tracking-widest uppercase ${errors.code ? "border-red-300" : ""}`}
                />
              </div>
              <button
                type="button"
                onClick={generateCode}
                className="h-11 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code}</p>
            )}
          </div>

          {/* Discount type */}
          <div className="space-y-1.5">
            <FL required>Discount Type</FL>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "percentage", label: "Percentage", icon: Percent },
                { value: "fixed", label: "Fixed (₹)", icon: IndianRupee },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => upd("discountType", value)}
                  className={`h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all ${
                    form.discountType === value
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount value */}
          <div className="space-y-1.5">
            <FL required>
              Discount Value{" "}
              <span className="normal-case font-normal text-gray-400">
                {form.discountType === "percentage" ? "(1–100%)" : "(₹ amount)"}
              </span>
            </FL>
            <div className="relative">
              {form.discountType === "percentage" ? (
                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              ) : (
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              )}
              <Input
                type="number"
                min="1"
                max={form.discountType === "percentage" ? "100" : undefined}
                placeholder={
                  form.discountType === "percentage" ? "e.g. 20" : "e.g. 150"
                }
                value={form.discountValue}
                onChange={(e) => upd("discountValue", e.target.value)}
                className={`${inputCls} pl-11 ${errors.discountValue ? "border-red-300" : ""}`}
              />
            </div>
            {errors.discountValue && (
              <p className="text-xs text-red-500">{errors.discountValue}</p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Min order + max discount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FL>Min Order (₹)</FL>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minOrderAmount}
                  onChange={(e) => upd("minOrderAmount", e.target.value)}
                  className={`${inputCls} pl-9 text-sm`}
                />
              </div>
            </div>
            {form.discountType === "percentage" && (
              <div className="space-y-1.5">
                <FL>Max Discount (₹)</FL>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="No cap"
                    value={form.maxDiscountAmount}
                    onChange={(e) => upd("maxDiscountAmount", e.target.value)}
                    className={`${inputCls} pl-9 text-sm`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Expiry date */}
          <div className="space-y-1.5">
            <FL required>Expiry Date</FL>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                min={minDate}
                value={form.expiryDate}
                onChange={(e) => upd("expiryDate", e.target.value)}
                className={`${inputCls} pl-11 ${errors.expiryDate ? "border-red-300" : ""}`}
              />
            </div>
            {errors.expiryDate && (
              <p className="text-xs text-red-500">{errors.expiryDate}</p>
            )}
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FL>
                Usage Limit{" "}
                <span className="normal-case font-normal text-gray-400">
                  (0 = ∞)
                </span>
              </FL>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.usageLimit}
                onChange={(e) => upd("usageLimit", e.target.value)}
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400">Total uses allowed</p>
            </div>
            <div className="space-y-1.5">
              <FL>Per User Limit</FL>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={form.perUserLimit}
                onChange={(e) => upd("perUserLimit", e.target.value)}
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400">Uses per customer</p>
            </div>
          </div>

          {/* Live preview */}
          {form.code && form.discountValue && (
            <div className="p-4 rounded-2xl border border-green-100 bg-linear-to-br from-green-50 to-emerald-50">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">
                Preview
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-green-200 shadow-sm">
                  <Ticket className="w-4 h-4 text-green-600" />
                  <span className="font-mono font-bold text-green-700 tracking-widest text-sm">
                    {form.code || "CODE"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {form.discountType === "percentage"
                      ? `${form.discountValue}% off`
                      : `₹${form.discountValue} off`}
                    {form.maxDiscountAmount &&
                    form.discountType === "percentage"
                      ? ` (max ₹${form.maxDiscountAmount})`
                      : ""}
                  </p>
                  {form.minOrderAmount && Number(form.minOrderAmount) > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Min order: ₹{form.minOrderAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="group w-full h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-lg shadow-green-200 transition-all duration-300 hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
            }}
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Create Coupon
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Coupon card ────────────────────────────────────────────────
function CouponCard({ coupon, onDelete, onToggle }) {
  const { copied, copy } = useCopy();
  const expired = isExpired(coupon.expiryDate);
  const days = daysLeft(coupon.expiryDate);
  const usagePct =
    coupon.usageLimit > 0
      ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
      : null;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        !coupon.isActive || expired
          ? "border-gray-100 opacity-70"
          : "border-gray-100"
      }`}
    >
      {/* Top stripe */}
      <div
        className="h-1 w-full"
        style={{
          background:
            coupon.isActive && !expired
              ? "linear-gradient(90deg, #15803d, #22c55e)"
              : "#e5e7eb",
        }}
      />

      <div className="p-5">
        {/* Code row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => copy(coupon.code)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-all"
            >
              <span className="font-mono font-bold tracking-widest text-sm text-gray-800 group-hover:text-green-700 transition-colors">
                {coupon.code}
              </span>
              {copied === coupon.code ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 shrink-0 transition-colors" />
              )}
            </button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-1.5">
            {expired && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-100 text-red-600">
                Expired
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                coupon.isActive && !expired
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {coupon.isActive && !expired ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Discount info */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            {coupon.discountType === "percentage" ? (
              <>
                <Percent className="w-3.5 h-3.5" />
                {coupon.discountValue}% off
              </>
            ) : (
              <>
                <IndianRupee className="w-3.5 h-3.5" />₹{coupon.discountValue}{" "}
                off
              </>
            )}
          </div>
          {coupon.maxDiscountAmount && coupon.discountType === "percentage" && (
            <span className="text-[11px] text-gray-400 font-medium">
              max ₹{coupon.maxDiscountAmount}
            </span>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          {[
            {
              icon: IndianRupee,
              label: "Min Order",
              value:
                coupon.minOrderAmount > 0
                  ? `₹${coupon.minOrderAmount}`
                  : "No minimum",
            },
            {
              icon: Calendar,
              label: "Expires",
              value: formatDate(coupon.expiryDate),
              extra:
                !expired && days <= 7 && days >= 0 ? (
                  <span className="text-[10px] font-bold text-amber-600 ml-1">
                    {days}d left
                  </span>
                ) : null,
            },
            {
              icon: coupon.usageLimit === 0 ? Infinity : Tag,
              label: "Total Uses",
              value:
                coupon.usageLimit === 0
                  ? "Unlimited"
                  : `${coupon.usedCount} / ${coupon.usageLimit}`,
            },
            {
              icon: Users,
              label: "Per User",
              value: `${coupon.perUserLimit} use${coupon.perUserLimit > 1 ? "s" : ""}`,
            },
          ].map(({ icon: Icon, label, value, extra }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xs font-semibold text-gray-700 flex items-center flex-wrap">
                  {value}
                  {extra}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Usage progress bar (only when there's a usage limit) */}
        {usagePct !== null && (
          <div className="mb-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                Usage
              </p>
              <p className="text-[10px] font-bold text-gray-600">{usagePct}%</p>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePct}%`,
                  background:
                    usagePct >= 90
                      ? "#ef4444"
                      : usagePct >= 70
                        ? "#f97316"
                        : "linear-gradient(90deg, #15803d, #22c55e)",
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-gray-50">
          <button
            onClick={() => onToggle(coupon._id)}
            className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              coupon.isActive
                ? "text-green-700 bg-green-50 hover:bg-green-100"
                : "text-gray-600 bg-gray-100 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {coupon.isActive ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Active
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Inactive
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(coupon)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function CouponsPage() {
  const {
    coupons,
    loading,
    actionLoading,
    fetchCoupons,
    createCoupon,
    toggleCouponStatus,
    deleteCoupon,
  } = useCouponStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ── Filtered ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...coupons];
    if (filterStatus === "Active")
      list = list.filter((c) => c.isActive && !isExpired(c.expiryDate));
    if (filterStatus === "Inactive") list = list.filter((c) => !c.isActive);
    if (filterStatus === "Expired")
      list = list.filter((c) => isExpired(c.expiryDate));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.code.toLowerCase().includes(q));
    return list;
  }, [coupons, filterStatus, search]);

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = async (data) => {
    const ok = await createCoupon(data);
    if (ok) setShowCreate(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteCoupon(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Stats ──────────────────────────────────────────────────
  const activeCount = coupons.filter(
    (c) => c.isActive && !isExpired(c.expiryDate),
  ).length;
  const expiredCount = coupons.filter((c) => isExpired(c.expiryDate)).length;
  const totalUses = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
  const expiringCount = coupons.filter((c) => {
    const d = daysLeft(c.expiryDate);
    return d !== null && d >= 0 && d <= 7 && c.isActive;
  }).length;

  return (
    <>
      <DeleteModal
        coupon={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {showCreate && (
        <CreateDrawer
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Coupons
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Create and manage discount coupon codes
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchCoupons()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="group inline-flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Plus className="w-4 h-4 relative" />
              <span className="relative">New Coupon</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Coupons",
              value: coupons.length,
              icon: Ticket,
              color: "#15803d",
              bg: "#dcfce7",
            },
            {
              label: "Active",
              value: activeCount,
              icon: CheckCircle2,
              color: "#16a34a",
              bg: "#d1fae5",
            },
            {
              label: "Expired",
              value: expiredCount,
              icon: Clock,
              color: "#f57c00",
              bg: "#fff3e0",
            },
            {
              label: "Total Uses",
              value: totalUses,
              icon: Users,
              color: "#0284c7",
              bg: "#e0f2fe",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Expiring soon warning */}
        {expiringCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              <span className="font-bold">{expiringCount}</span> coupon
              {expiringCount > 1 ? "s" : ""} expiring within 7 days.
            </p>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by code..."
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm font-mono shadow-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all uppercase"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:ml-auto">
            {["All", "Active", "Inactive", "Expired"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === s
                    ? "text-white shadow-sm"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                }`}
                style={
                  filterStatus === s
                    ? {
                        background: "linear-gradient(135deg, #15803d, #22c55e)",
                      }
                    : {}
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        {coupons.length > 0 && (
          <p className="text-xs text-gray-400 font-medium -mt-2">
            Showing{" "}
            <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
            of {coupons.length} coupons
          </p>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Loading coupons...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <Ticket className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search || filterStatus !== "All"
                ? "No coupons match your filters"
                : "No coupons yet"}
            </p>
            {search || filterStatus !== "All" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first coupon
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((coupon) => (
              <CouponCard
                key={coupon._id}
                coupon={coupon}
                onDelete={setDeleteTarget}
                onToggle={toggleCouponStatus}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}