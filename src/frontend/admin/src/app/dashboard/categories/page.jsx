"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useCategoryStore } from "@/store/useCategoryStore";
import Image from "next/image";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Pencil,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  EyeOff,
  Hash,
  ImageIcon,
  Upload,
  Tag,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

function FL({ children, required }) {
  return (
    <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

// ── Image drop zone ───────────────────────────────────────────
function ImageDrop({ preview, onPick, label = "Drop or click to upload" }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  const pick = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    onPick(f);
  };

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
          drag
            ? "border-green-500/60 bg-green-50"
            : preview
              ? "border-green-200"
              : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
        }`}
      >
        {preview ? (
          <div className="relative h-36 w-full">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <p className="text-xs font-semibold text-white">
                Click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Upload className="h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP</p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all ${
          checked
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {checked ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" /> Yes
          </>
        ) : (
          <>
            <XCircle className="h-3.5 w-3.5" /> No
          </>
        )}
      </button>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────
function DeleteModal({ category, onConfirm, onCancel, loading }) {
  if (!category) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-red-100/60 border border-red-50 p-7 w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          {category.image?.original && (
            <div className="h-12 w-20 overflow-hidden rounded-xl border border-gray-200">
              <Image
                src={category.image.original}
                alt=""
                width={80}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Category?
            </h3>
            <p className="text-sm font-semibold text-gray-700">
              {category.name}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white shadow-md shadow-red-200 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category form drawer ──────────────────────────────────────
function CategoryDrawer({
  category: initial,
  categories,
  onClose,
  onSubmit,
  loading,
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    parentCategory: initial?.parentCategory ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    isFeatured: initial?.isFeatured ?? false,
    isActive: initial?.isActive ?? true,
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    metaKeywords: Array.isArray(initial?.metaKeywords)
      ? initial.metaKeywords.join(", ")
      : "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.image.original ?? null);
  const [errors, setErrors] = useState({});

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const data = {
      ...form,
      metaKeywords: form.metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      image: imageFile || undefined,
    };
    if (!data.parentCategory) data.parentCategory = "";
    onSubmit(data);
  };

  const parentOptions = categories.filter(
    (c) =>
      !initial || (c._id !== initial._id && c.parentCategory !== initial._id),
  );

  const slugPreview = form.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              {isEdit ? (
                <Pencil className="h-4 w-4 text-white" />
              ) : (
                <Plus className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {isEdit ? "Edit Category" : "New Category"}
              </h3>
              <p className="mt-0.5 text-xs text-gray-400">
                {isEdit
                  ? `Editing: "${initial.name}"`
                  : "Add a new product category"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div className="space-y-1.5">
            <FL required>Category Name</FL>
            <Input
              placeholder="e.g. Eco-Friendly Home Products"
              value={form.name}
              onChange={(e) => upd("name", e.target.value)}
              className={`${inputCls} ${errors.name ? "border-red-300" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
            {form.name && (
              <p className="text-[11px] text-gray-400">
                Slug:{" "}
                <span className="font-mono text-green-600">{slugPreview}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <FL>Description</FL>
            <textarea
              rows={3}
              placeholder="Short category description..."
              value={form.description}
              onChange={(e) => upd("description", e.target.value)}
              className={`${inputCls} w-full resize-none px-4 py-3`}
            />
          </div>

          {/* Parent + Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FL>Parent Category</FL>
              <div className="relative">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.parentCategory}
                  onChange={(e) => upd("parentCategory", e.target.value)}
                  className={`${inputCls} appearance-none pl-11 pr-8`}
                >
                  <option value="">None (Root)</option>
                  {parentOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FL>Display Order</FL>
              <div className="relative">
                <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.displayOrder}
                  onChange={(e) => upd("displayOrder", Number(e.target.value))}
                  className={`${inputCls} pl-11`}
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <FL>
              Category Image{" "}
              {isEdit && (
                <span className="normal-case font-normal text-gray-400">
                  (leave empty to keep current)
                </span>
              )}
            </FL>
            <ImageDrop
              preview={imagePreview}
              onPick={(f) => {
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              }}
            />
            {imageFile && (
              <p className="flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {imageFile.name}
              </p>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle
              checked={form.isActive}
              onChange={(v) => upd("isActive", v)}
              label="Active"
              sub={form.isActive ? "Visible in store" : "Hidden from store"}
            />
            <Toggle
              checked={form.isFeatured}
              onChange={(v) => upd("isFeatured", v)}
              label="Featured"
              sub={
                form.isFeatured ? "Shown in featured section" : "Not featured"
              }
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* SEO */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              SEO Settings
            </p>

            <div className="space-y-1.5">
              <FL>
                Meta Title{" "}
                <span className="normal-case font-normal text-gray-400">
                  (max 70)
                </span>
              </FL>
              <Input
                placeholder="SEO title"
                value={form.metaTitle}
                maxLength={70}
                onChange={(e) => upd("metaTitle", e.target.value)}
                className={inputCls}
              />
              <p
                className={`text-right text-xs font-medium ${form.metaTitle.length > 60 ? "text-amber-600" : "text-gray-400"}`}
              >
                {form.metaTitle.length}/70
              </p>
            </div>

            <div className="space-y-1.5">
              <FL>
                Meta Description{" "}
                <span className="normal-case font-normal text-gray-400">
                  (max 160)
                </span>
              </FL>
              <textarea
                rows={2}
                placeholder="Brief description for search engines..."
                value={form.metaDescription}
                maxLength={160}
                onChange={(e) => upd("metaDescription", e.target.value)}
                className={`${inputCls} w-full resize-none px-4 py-3`}
              />
              <p
                className={`text-right text-xs font-medium ${form.metaDescription.length > 140 ? "text-amber-600" : "text-gray-400"}`}
              >
                {form.metaDescription.length}/160
              </p>
            </div>

            <div className="space-y-1.5">
              <FL>
                Meta Keywords{" "}
                <span className="normal-case font-normal text-gray-400">
                  (comma separated)
                </span>
              </FL>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="eco-friendly, sustainable, green products"
                  value={form.metaKeywords}
                  onChange={(e) => upd("metaKeywords", e.target.value)}
                  className={`${inputCls} pl-11`}
                />
              </div>
              {form.metaKeywords && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.metaKeywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean)
                    .map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                      >
                        <Hash className="mr-0.5 inline h-2.5 w-2.5" />
                        {k}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="group relative w-full h-11 overflow-hidden rounded-xl text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
            }}
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isEdit ? "Update Category" : "Create Category"}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────
function CategoryCard({ category, allCategories, onEdit, onDelete, onToggle }) {
  const parent = allCategories.find((c) => c._id === category.parentCategory);

  return (
    <div
      className={`group overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        category.isActive
          ? "border-gray-100 bg-white"
          : "border-gray-100 bg-gray-50 opacity-70"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {category.image.original ? (
          <Image
            src={category.image.original}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1 items-end">
          <span
            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
              category.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {category.isActive ? "Active" : "Inactive"}
          </span>
          {category.isFeatured && (
            <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Featured
            </span>
          )}
        </div>
        {/* Display order */}
        <div className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-[10px] font-bold text-gray-600">
          {category.displayOrder}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug text-gray-800">
            {category.name}
          </h3>
        </div>

        {parent && (
          <p className="mb-1.5 flex items-center gap-1 text-[11px] text-gray-400">
            <Layers className="h-3 w-3 shrink-0" /> {parent.name}
          </p>
        )}

        {category.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {category.description}
          </p>
        )}

        {/* Slug */}
        {category.slug && (
          <p className="mb-3 truncate font-mono text-[11px] text-gray-400">
            /{category.slug}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 border-t border-gray-100 pt-3">
          <button
            onClick={() => onEdit(category)}
            className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-xl border border-green-200 bg-green-50 text-xs font-bold text-green-700 transition-all hover:bg-green-100"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onToggle(category._id)}
            className={`flex flex-1 items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-bold transition-all ${
              category.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {category.isActive ? (
              <>
                <Eye className="h-3.5 w-3.5" /> Active
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Inactive
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(category)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function CategoriesPage() {
  const {
    categories,
    loading,
    actionLoading,
    refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  } = useCategoryStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    refetchCategories();
  }, []);

  const filtered = useMemo(() => {
    let list = [...categories];
    if (filterStatus === "Active") list = list.filter((c) => c.isActive);
    if (filterStatus === "Inactive") list = list.filter((c) => !c.isActive);
    if (filterStatus === "Featured") list = list.filter((c) => c.isFeatured);
    if (filterStatus === "Root") list = list.filter((c) => !c.parentCategory);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q),
      );
    return list;
  }, [categories, filterStatus, search]);

  const handleCreate = async (data) => {
    const ok = await createCategory(data);
    if (ok) setShowCreate(false);
    refetchCategories();
  };

  const handleUpdate = async (data) => {
    if (!editCategory) return;
    await updateCategory(editCategory._id, data);
    setEditCategory(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteCategory(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const featuredCount = categories.filter((c) => c.isFeatured).length;
  const rootCount = categories.filter((c) => !c.parentCategory).length;
  const subCount = categories.filter((c) => !!c.parentCategory).length;

  return (
    <>
      <DeleteModal
        category={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {showCreate && (
        <CategoryDrawer
          category={null}
          categories={categories}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
        />
      )}
      {editCategory && (
        <CategoryDrawer
          category={editCategory}
          categories={categories}
          onClose={() => setEditCategory(null)}
          onSubmit={handleUpdate}
          loading={actionLoading}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Categories
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              Manage product categories and subcategories
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetchCategories()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                setEditCategory(null);
                setShowCreate(true);
              }}
              className="group inline-flex items-center gap-2 rounded-xl px-4 h-9 text-sm font-bold text-white shadow-md shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-0.5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Plus className="h-4 w-4 relative" />
              <span className="relative">New Category</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total",
              value: categories.length,
              icon: LayoutGrid,
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
              label: "Featured",
              value: featuredCount,
              icon: Star,
              color: "#f59e0b",
              bg: "#fef3c7",
            },
            {
              label: "Root",
              value: rootCount,
              icon: Layers,
              color: "#0284c7",
              bg: "#e0f2fe",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: bg }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {value}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:ml-auto">
            {["All", "Active", "Inactive", "Featured", "Root"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
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
        {categories.length > 0 && (
          <p className="text-xs font-medium text-gray-400">
            Showing{" "}
            <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
            of {categories.length} categories
            {subCount > 0 && (
              <span className="ml-2 text-gray-400">
                · {rootCount} root · {subCount} sub
              </span>
            )}
          </p>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
            <p className="text-sm text-gray-400">Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white shadow-sm py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <LayoutGrid className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search || filterStatus !== "All"
                ? "No categories match your filters"
                : "No categories yet"}
            </p>
            {search || filterStatus !== "All" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                }}
                className="text-xs font-bold text-green-600 hover:text-emerald-600 transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-emerald-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Create your first category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((cat) => (
              <CategoryCard
                key={cat._id}
                category={cat}
                allCategories={categories}
                onEdit={(c) => {
                  setShowCreate(false);
                  setEditCategory(c);
                }}
                onDelete={setDeleteTarget}
                onToggle={toggleCategoryStatus}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
