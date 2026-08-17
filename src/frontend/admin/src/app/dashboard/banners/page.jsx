"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import useBannerStore from "@/store/useBannerStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import {
  Tag,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  Video,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

// ── Constants ──────────────────────────────────────────────────
const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

function FieldLabel({ children, required }) {
  return (
    <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ banner, onConfirm, onCancel, loading }) {
  if (!banner) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-red-100/60 border border-red-50 p-7 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3
            className="text-xl font-semibold text-gray-900 mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Delete Banner?
          </h3>
          <p className="text-sm text-gray-400 mb-1">
            This will permanently remove
          </p>
          <p className="text-sm font-semibold text-gray-700 mb-5">
            {banner.title || "this banner"}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2"
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

// ── Create Banner Drawer ───────────────────────────────────────
function CreateDrawer({ onClose, onSubmit, loading, categories }) {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    mediaType: "image",
    category: categories[0]?._id || "",
    customCategory: "",
    redirectLink: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    fd.append("media", file);
    onSubmit(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl shadow-green-100/60 overflow-hidden">
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
                New Banner
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload an image or video banner
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Media type toggle */}
          <div className="space-y-1.5">
            <FieldLabel required>Media Type</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {["image", "video"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, mediaType: type });
                    setFile(null);
                    setPreview(null);
                  }}
                  className={`h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all ${
                    form.mediaType === type
                      ? "border-green-400 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/40"
                  }`}
                >
                  {type === "image" ? (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Video
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* File drop zone */}
          <div className="space-y-1.5">
            <FieldLabel required>
              Upload {form.mediaType === "image" ? "Image" : "Video"}
            </FieldLabel>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
                dragOver
                  ? "border-green-400 bg-green-50"
                  : file
                    ? "border-green-300 bg-green-50/30"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50/20"
              }`}
              style={{ minHeight: "140px" }}
            >
              {preview && form.mediaType === "image" ? (
                <div className="relative w-full h-36">
                  <Image
                    src={preview}
                    alt="preview"
                    fill
                    className="object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium">
                      Click to change
                    </p>
                  </div>
                </div>
              ) : preview && form.mediaType === "video" ? (
                <video
                  src={preview}
                  className="w-full h-36 object-cover rounded-2xl"
                  controls={false}
                  muted
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-36 gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Drop {form.mediaType} here or{" "}
                      <span className="text-green-600">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {form.mediaType === "image"
                        ? "JPG, PNG, WebP"
                        : "MP4, WebM, MOV"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={form.mediaType === "image" ? "image/*" : "video/*"}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file && (
              <p className="text-xs text-gray-400 truncate">
                📎 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <FieldLabel required>Category</FieldLabel>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputCls} w-full appearance-none pr-10 cursor-pointer`}
                required
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <FieldLabel>Title</FieldLabel>
            <Input
              placeholder="e.g. Eco-Friendly Home Collection"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <FieldLabel>Subtitle</FieldLabel>
            <Input
              placeholder="e.g. Sustainable products for a greener future"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className={inputCls}
            />
          </div>

          {/* Redirect link */}
          <div className="space-y-1.5">
            <FieldLabel>Redirect Link</FieldLabel>
            <Input
              placeholder="https://..."
              value={form.redirectLink}
              onChange={(e) =>
                setForm({ ...form, redirectLink: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
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
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Banner
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner card ────────────────────────────────────────────────
function BannerCard({
  banner,
  onDelete,
  onToggle,
  onOrderUp,
  onOrderDown,
  isFirst,
  isLast,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
        banner.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
      }`}
    >
      {/* Media preview */}
      <div className="relative w-full aspect-16/6 bg-gray-100 overflow-hidden">
        {banner.mediaType === "image" ? (
          <Image
            src={banner.mediaUrl.original}
            alt={banner.title || "Banner"}
            fill
            className="object-cover"
          />
        ) : (
          <video
            src={banner.mediaUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {/* Media type */}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-black/50 text-white backdrop-blur-sm">
            {banner.mediaType === "image" ? (
              <>
                <ImageIcon className="w-3 h-3" />
                Image
              </>
            ) : (
              <>
                <Video className="w-3 h-3" />
                Video
              </>
            )}
          </span>
          {/* Category */}
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-600/80 text-white">
            {typeof banner.category === "object"
              ? banner.category?.name
              : banner.category}
          </span>
        </div>

        {/* Active/inactive badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
              banner.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-500"
            }`}
          >
            {banner.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Info + actions */}
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {banner.title || (
                <span className="text-gray-400 font-normal italic">
                  No title
                </span>
              )}
            </p>
            {banner.subtitle && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {banner.subtitle}
              </p>
            )}
          </div>

          {/* Order controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOrderUp}
              disabled={isFirst}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-500 font-mono w-5 text-center">
              {banner.order ?? 0}
            </span>
            <button
              onClick={onOrderDown}
              disabled={isLast}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          {/* Toggle active */}
          <button
            onClick={() => onToggle(banner._id)}
            className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              banner.isActive
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {banner.isActive ? (
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

          {/* Delete */}
          <button
            onClick={() => onDelete(banner)}
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
export default function BannersPage() {
  const {
    banners,
    loading,
    actionLoading,
    fetchBanners,
    createBanner,
    toggleBannerStatus,
    swapBannerOrder,
    deleteBanner,
  } = useBannerStore();

  const { categories, refetchCategories } = useCategoryStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    fetchBanners();
    refetchCategories();
  }, []);

  // ── Active categories with banners ────────────────────────
  const activeCategories = useMemo(() => {
    const cats = banners
      .map((b) =>
        typeof b.category === "object" ? b.category?.name : b.category,
      )
      .filter(Boolean);
    const unique = Array.from(new Set(cats));
    return ["All", ...unique];
  }, [banners]);

  // ── Filtered banners ──────────────────────────────────────
  const filtered =
    filterCat === "All"
      ? banners
      : banners.filter(
          (b) =>
            (typeof b.category === "object" ? b.category?.name : b.category) ===
            filterCat,
        );

  const sorted = [...filtered].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = async (fd) => {
    const ok = await createBanner(fd);
    if (ok) setShowCreate(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteBanner(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleOrderUp = (banner) => {
    const idx = sorted.findIndex((b) => b._id === banner._id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    swapBannerOrder(banner._id, prev._id);
  };

  const handleOrderDown = (banner) => {
    const idx = sorted.findIndex((b) => b._id === banner._id);
    if (idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    swapBannerOrder(banner._id, next._id);
  };

  // ── Stats ──────────────────────────────────────────────────
  const activeCount = banners.filter((b) => b.isActive).length;
  const imageCount = banners.filter((b) => b.mediaType === "image").length;
  const videoCount = banners.filter((b) => b.mediaType === "video").length;

  return (
    <>
      <DeleteModal
        banner={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {showCreate && (
        <CreateDrawer
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
          categories={categories.filter((c) => c.isActive)}
        />
      )}

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Banners
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage homepage and category banners
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchBanners()}
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
              <span className="relative">Add Banner</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Banners",
              value: banners.length,
              icon: Tag,
              color: "#15803d",
              bg: "#dcfce7",
            },
            {
              label: "Active",
              value: activeCount,
              icon: Eye,
              color: "#16a34a",
              bg: "#d1fae5",
            },
            {
              label: "Images",
              value: imageCount,
              icon: ImageIcon,
              color: "#0284c7",
              bg: "#e0f2fe",
            },
            {
              label: "Videos",
              value: videoCount,
              icon: Video,
              color: "#059669",
              bg: "#d1fae5",
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

        {/* ── Filter tabs ── */}
        {activeCategories.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </div>
            {activeCategories.map((cat) => {
              const count =
                cat === "All"
                  ? banners.length
                  : banners.filter(
                      (b) =>
                        (typeof b.category === "object"
                          ? b.category?.name
                          : b.category) === cat,
                    ).length;
              const active = filterCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? "text-white shadow-sm shadow-green-200"
                      : "text-gray-500 bg-gray-100 hover:bg-green-50 hover:text-green-600"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(135deg, #15803d, #22c55e)",
                        }
                      : {}
                  }
                >
                  {cat}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
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
            <p className="text-sm text-gray-400">Loading banners...</p>
          </div>
        ) : sorted.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
                <Tag className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {filterCat === "All"
                  ? "No banners yet"
                  : `No banners in "${filterCat}"`}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs font-semibold text-green-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add your first banner
              </button>
            </div>
          </div>
        ) : (
          /* ── Banner grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sorted.map((banner, idx) => (
              <BannerCard
                key={banner._id}
                banner={banner}
                isFirst={idx === 0}
                isLast={idx === sorted.length - 1}
                onDelete={setDeleteTarget}
                onToggle={toggleBannerStatus}
                onOrderUp={() => handleOrderUp(banner)}
                onOrderDown={() => handleOrderDown(banner)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}