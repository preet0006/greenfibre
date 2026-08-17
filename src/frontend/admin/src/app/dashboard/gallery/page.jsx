"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import useGalleryStore from "@/store/useGalleryStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import Image from "next/image";
import {
  ImageIcon,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Upload,
  Eye,
  Search,
  Filter,
  Grid3x3,
  LayoutGrid,
  Tag,
  FileText,
  CheckCircle2,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Helpers ────────────────────────────────────────────────────
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
function DeleteModal({ item, onConfirm, onCancel, loading }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-red-100/60 border border-red-50 p-7 w-full max-w-sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          {/* Tiny preview */}
          {item.image && (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <Image
                src={item.image.original}
                alt={item.title || "Gallery item"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Image?
            </h3>
            <p className="text-sm text-gray-400">
              {item.title || "This gallery item"} will be permanently removed
              from Cloudinary.
            </p>
          </div>
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

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({ item, onClose }) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={item.image.original}
            alt={item.title || ""}
            width={900}
            height={600}
            className="w-full object-contain max-h-[75vh]"
          />
        </div>
        {(item.title || item.caption || item.category) && (
          <div className="mt-3 px-1 flex items-start justify-between gap-3">
            <div>
              {item.title && (
                <p className="text-white font-semibold text-sm">{item.title}</p>
              )}
              {item.caption && (
                <p className="text-gray-400 text-xs mt-0.5">{item.caption}</p>
              )}
            </div>
            {item.category && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/30 text-green-200 shrink-0">
                {item.category}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upload Drawer ──────────────────────────────────────────────
function UploadDrawer({ onClose, onSubmit, loading, categories }) {
  const [form, setForm] = useState({ title: "", caption: "", category: "" });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [
      ...prev,
      ...valid.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeFile = (i) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!files.length) return;
    const fd = new FormData();
    if (form.title) fd.append("title", form.title);
    if (form.caption) fd.append("caption", form.caption);
    if (form.category) fd.append("category", form.category);
    files.forEach((f) => fd.append("images", f));
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
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Upload Images
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Add multiple images at once
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

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Drop zone */}
          <div className="space-y-1.5">
            <FieldLabel required>Images</FieldLabel>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                dragOver
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 hover:border-green-300 hover:bg-green-50/20"
              }`}
            >
              {previews.length > 0 ? (
                <div className="p-3 grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Add more tile */}
                  <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-green-300 transition-colors">
                    <Plus className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Drop images here or{" "}
                      <span className="text-green-600">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      JPG, PNG, WebP — multiple files supported
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            {files.length > 0 && (
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {files.length} image{files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <FieldLabel>Title</FieldLabel>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="e.g. Sustainable Home Collection"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>

          {/* Category - Dropdown from store */}
          <div className="space-y-1.5">
            <FieldLabel>Category</FieldLabel>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputCls} pl-11 pr-8 appearance-none`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <FieldLabel>
              Caption{" "}
              <span className="normal-case text-gray-400 font-normal">
                (max 300 chars)
              </span>
            </FieldLabel>
            <textarea
              placeholder="A short caption for these images..."
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500 transition-all hover:border-green-300"
            />
            <p className="text-xs text-gray-400 text-right">
              {form.caption.length}/300
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !files.length}
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
                  Upload{" "}
                  {files.length > 0
                    ? `${files.length} Image${files.length > 1 ? "s" : ""}`
                    : "Images"}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gallery item card ──────────────────────────────────────────
function GalleryCard({
  item,
  onDelete,
  onToggle,
  onOrderUp,
  onOrderDown,
  onPreview,
  isFirst,
  isLast,
}) {
  return (
    <div
      className={`group bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        item.isActive ? "border-gray-100" : "border-gray-100 opacity-55"
      }`}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onPreview(item)}
      >
        <Image
          src={item.image.original}
          alt={item.title || "Gallery"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              item.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-500"
            }`}
          >
            {item.isActive ? "Active" : "Off"}
          </span>
        </div>

        {/* Category badge */}
        {item.category && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-600/80 text-white backdrop-blur-sm">
              {item.category}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            {item.title ? (
              <p className="text-xs font-semibold text-gray-800 truncate">
                {item.title}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No title</p>
            )}
            {item.caption && (
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                {item.caption}
              </p>
            )}
          </div>

          {/* Order controls */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={onOrderUp}
              disabled={isFirst}
              className="w-5 h-5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-gray-400 font-mono text-center">
              {item.order}
            </span>
            <button
              onClick={onOrderDown}
              disabled={isLast}
              className="w-5 h-5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggle(item._id)}
            className={`flex-1 h-7 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold transition-all ${
              item.isActive
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {item.isActive ? (
              <>
                <ToggleRight className="w-3.5 h-3.5" />
                Active
              </>
            ) : (
              <>
                <ToggleLeft className="w-3.5 h-3.5" />
                Off
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(item)}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function GalleryPage() {
  const {
    gallery,
    loading,
    actionLoading,
    fetchGallery,
    createGalleryItems,
    toggleGalleryStatus,
    updateGalleryOrder,
    deleteGalleryItem,
  } = useGalleryStore();

  const { categories, refetchCategories } = useCategoryStore();

  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [gridSize, setGridSize] = useState("md"); // sm | md | lg

  useEffect(() => {
    fetchGallery();
    refetchCategories();
  }, []);

  // ── Active categories with images ──────────────────────────
  const activeCategories = useMemo(() => {
    const cats = gallery.map((g) => g.category).filter(Boolean);
    const unique = Array.from(new Set(cats));
    return ["All", ...unique];
  }, [gallery]);

  // ── Filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (filterCat !== "All")
      list = list.filter((g) => g.category === filterCat);
    if (filterStatus === "Active") list = list.filter((g) => g.isActive);
    if (filterStatus === "Hidden") list = list.filter((g) => !g.isActive);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (g) =>
          g.title?.toLowerCase().includes(q) ||
          g.caption?.toLowerCase().includes(q) ||
          g.category?.toLowerCase().includes(q),
      );
    return list;
  }, [gallery, filterCat, filterStatus, search]);

  // ── Handlers ──────────────────────────────────────────────
  const handleUpload = async (fd) => {
    const ok = await createGalleryItems(fd);
    if (ok) setShowUpload(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteGalleryItem(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleOrderUp = (item) => {
    const sorted = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((g) => g._id === item._id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    updateGalleryOrder(item._id, prev.order ?? idx - 1);
    updateGalleryOrder(prev._id, item.order ?? idx);
  };

  const handleOrderDown = (item) => {
    const sorted = [...gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((g) => g._id === item._id);
    if (idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    updateGalleryOrder(item._id, next.order ?? idx + 1);
    updateGalleryOrder(next._id, item.order ?? idx);
  };

  // ── Grid cols class ────────────────────────────────────────
  const gridCols = {
    sm: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
    md: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    lg: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const activeCount = gallery.filter((g) => g.isActive).length;
  const hiddenCount = gallery.filter((g) => !g.isActive).length;

  return (
    <>
      <DeleteModal
        item={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {showUpload && (
        <UploadDrawer
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
          loading={actionLoading}
          categories={categories.filter((c) => c.isActive)}
        />
      )}
      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Gallery
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your product and brand photo gallery
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchGallery()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="group inline-flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Plus className="w-4 h-4 relative" />
              <span className="relative">Upload Images</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total Images",
              value: gallery.length,
              icon: ImageIcon,
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
              label: "Hidden",
              value: hiddenCount,
              icon: EyeOff,
              color: "#f57c00",
              bg: "#fff3e0",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
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

        {/* ── Toolbar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search by title, caption or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-gray-50 border-gray-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all"
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

            {/* Status filter */}
            <div className="flex items-center gap-1.5 sm:ml-auto">
              {["All", "Active", "Hidden"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === s
                      ? "text-white shadow-sm"
                      : "text-gray-500 bg-gray-100 hover:bg-green-50 hover:text-green-600"
                  }`}
                  style={
                    filterStatus === s
                      ? {
                          background:
                            "linear-gradient(135deg, #15803d, #22c55e)",
                        }
                      : {}
                  }
                >
                  {s}
                </button>
              ))}

              {/* Grid size toggles */}
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
                <button
                  onClick={() => setGridSize("md")}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${gridSize === "md" ? "bg-green-100 text-green-600" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setGridSize("sm")}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${gridSize === "sm" ? "bg-green-100 text-green-600" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category filter pills */}
          {activeCategories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {activeCategories.map((cat) => {
                const count =
                  cat === "All"
                    ? gallery.length
                    : gallery.filter((g) => g.category === cat).length;
                const active = filterCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? "text-white shadow-sm"
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
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400 font-medium -mt-2">
          Showing{" "}
          <span className="font-bold text-gray-700">{filtered.length}</span> of{" "}
          {gallery.length} images
        </p>

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              <Loader2 className="w-5 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Loading gallery...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search || filterCat !== "All" || filterStatus !== "All"
                ? "No images match your filters"
                : "No gallery images yet"}
            </p>
            {search || filterCat !== "All" || filterStatus !== "All" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterCat("All");
                  setFilterStatus("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Upload first image
              </button>
            )}
          </div>
        ) : (
          /* ── Grid ── */
          <div className={`grid gap-4 ${gridCols[gridSize]}`}>
            {filtered.map((item, idx) => (
              <GalleryCard
                key={item._id}
                item={item}
                isFirst={idx === 0}
                isLast={idx === filtered.length - 1}
                onDelete={setDeleteTarget}
                onToggle={toggleGalleryStatus}
                onOrderUp={() => handleOrderUp(item)}
                onOrderDown={() => handleOrderDown(item)}
                onPreview={setLightbox}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}