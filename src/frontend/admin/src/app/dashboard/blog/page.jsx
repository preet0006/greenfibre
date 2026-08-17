"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import useBlogStore from "@/store/useBlogStore";
import Image from "next/image";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Pencil,
  Clock,
  Tag,
  ImageIcon,
  Upload,
  CheckCircle2,
  Globe,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Eye,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Shared ─────────────────────────────────────────────────────
const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300";

const textareaCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500 transition-all hover:border-green-300";

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

// ── Collapsible section inside drawer ─────────────────────────
function CollapseSection({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50/60 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: iconBg }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <span className="text-[11px] font-bold text-gray-700 tracking-widest uppercase">
            {title}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-5 pt-3 space-y-4">{children}</div>}
    </div>
  );
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ blog, onConfirm, onCancel, loading }) {
  if (!blog) return null;
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
          {blog.coverImage && (
            <div className="w-20 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <Image
                src={blog.coverImage}
                alt=""
                width={80}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Blog Post?
            </h3>
            <p className="text-sm font-semibold text-gray-700 line-clamp-2">
              {blog.title}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Cover image and all media will be deleted from Cloudinary.
            </p>
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

// ── Blog Form Drawer ───────────────────────────────────────────
function BlogDrawer({ blog: initialBlog, onClose, onSubmit, loading }) {
  const isEdit = !!initialBlog;

  const [form, setForm] = useState({
    title: initialBlog?.title ?? "",
    excerpt: initialBlog?.excerpt ?? "",
    content: initialBlog?.content ?? "",
    tags: Array.isArray(initialBlog?.tags) ? initialBlog.tags.join(", ") : "",
    isPublished: initialBlog?.isPublished ?? false,
    metaTitle: initialBlog?.metaTitle ?? "",
    metaDescription: initialBlog?.metaDescription ?? "",
    metaKeywords: Array.isArray(initialBlog?.metaKeywords)
      ? initialBlog.metaKeywords.join(", ")
      : "",
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    initialBlog?.coverImage.original ?? null,
  );
  const [coverDrag, setCoverDrag] = useState(false);
  const coverRef = useRef(null);

  const [extraFiles, setExtraFiles] = useState([]);
  const [existingImgUrls, setExistingImgUrls] = useState(
    initialBlog?.images ?? [],
  );
  const [newImgPreviews, setNewImgPreviews] = useState([]);
  const extraRef = useRef(null);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCoverPick = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const addExtras = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setExtraFiles((p) => [...p, ...valid]);
    setNewImgPreviews((p) => [
      ...p,
      ...valid.map((f) => URL.createObjectURL(f)),
    ]);
  };


  const removeExisting = (i) =>
    setExistingImgUrls((p) => p.filter((_, idx) => idx !== i));
  const removeNew = (i) => {
    setExtraFiles((p) => p.filter((_, idx) => idx !== i));
    setNewImgPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("excerpt", form.excerpt);
    fd.append("content", form.content);
    fd.append("tags", form.tags);
    fd.append("isPublished", String(form.isPublished));
    fd.append("metaTitle", form.metaTitle);
    fd.append("metaDescription", form.metaDescription);
    fd.append("metaKeywords", form.metaKeywords);
    if (coverFile) fd.append("coverImage", coverFile);
    extraFiles.forEach((f) => fd.append("images", f));
    onSubmit(fd);
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(wordCount / 200));

  const tagChips = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);


  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* ── Drawer header ── */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-green-200"
              style={{
                background: "linear-gradient(135deg, #15803d, #22c55e)",
              }}
            >
              {isEdit ? (
                <Pencil className="w-4 h-4 text-white" />
              ) : (
                <Plus className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {isEdit ? "Edit Blog Post" : "New Blog Post"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit
                  ? `Editing: "${initialBlog.title?.slice(0, 32)}…"`
                  : "Write, preview and publish a new article"}
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          {/* ── BASIC ── */}
          <CollapseSection
            title="Basic Information"
            icon={FileText}
            iconColor="#15803d"
            iconBg="#dcfce7"
          >
            <div className="space-y-1.5">
              <FL required>Title</FL>
              <Input
                placeholder="Blog post title"
                value={form.title}
                onChange={(e) => upd("title", e.target.value)}
                required
                className={inputCls}
              />
              {form.title && (
                <p className="text-[11px] text-gray-400">
                  Slug:{" "}
                  <span className="font-mono text-green-600">
                    {form.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <FL required>
                Excerpt{" "}
                <span className="normal-case font-normal text-gray-400">
                  (max 300 chars)
                </span>
              </FL>
              <textarea
                rows={3}
                placeholder="Short summary shown in blog listing..."
                value={form.excerpt}
                maxLength={300}
                required
                className={textareaCls}
                onChange={(e) => upd("excerpt", e.target.value)}
              />
              <p
                className={`text-xs text-right font-medium ${form.excerpt.length >= 280 ? "text-amber-500" : "text-gray-400"}`}
              >
                {form.excerpt.length}/300
              </p>
            </div>

            <div className="space-y-1.5">
              <FL>
                Tags{" "}
                <span className="normal-case font-normal text-gray-400">
                  (comma separated)
                </span>
              </FL>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="sustainability, eco-friendly, products"
                  value={form.tags}
                  onChange={(e) => upd("tags", e.target.value)}
                  className={`${inputCls} pl-11`}
                />
              </div>
              {tagChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagChips.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"
                    >
                      <Hash className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Publish Status
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.isPublished
                    ? "Visible to public"
                    : "Saved as draft, not publicly visible"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => upd("isPublished", !form.isPublished)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all ${
                  form.isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {form.isPublished ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Published
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Draft
                  </>
                )}
              </button>
            </div>
          </CollapseSection>

          {/* ── CONTENT ── */}
          <CollapseSection
            title="Content"
            icon={BookOpen}
            iconColor="#16a34a"
            iconBg="#d1fae5"
          >
            <div className="space-y-1.5">
              <FL required>Body</FL>
              <textarea
                rows={14}
                required
                placeholder="Write your full blog content here...&#10;&#10;Tip: Markdown and HTML are both supported by most renderers."
                value={form.content}
                className={textareaCls}
                onChange={(e) => upd("content", e.target.value)}
              />
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{wordCount.toLocaleString()} words</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readMins} min read
                </span>
              </div>
            </div>
          </CollapseSection>

          {/* ── IMAGES ── */}
          <CollapseSection
            title="Cover & Images"
            icon={ImageIcon}
            iconColor="#0284c7"
            iconBg="#e0f2fe"
          >
            {/* Cover drop zone */}
            <div className="space-y-1.5">
              <FL required={!isEdit}>
                Cover Image{" "}
                {isEdit && (
                  <span className="normal-case font-normal text-gray-400">
                    (leave empty to keep current)
                  </span>
                )}
              </FL>
              <div
                onClick={() => coverRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setCoverDrag(true);
                }}
                onDragLeave={() => setCoverDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setCoverDrag(false);
                  handleCoverPick(e.dataTransfer.files?.[0]);
                }}
                className={`relative border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden transition-all ${
                  coverDrag
                    ? "border-green-500 bg-green-50"
                    : coverPreview
                      ? "border-green-200"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50/20"
                }`}
              >
                {coverPreview ? (
                  <div className="relative w-full h-40">
                    <Image
                      src={coverPreview}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                      <p className="text-white text-xs font-semibold">
                        Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-36 gap-2">
                    <Upload className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      Drop or click to upload cover
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP</p>
                  </div>
                )}
              </div>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCoverPick(e.target.files?.[0])}
              />
              {coverFile && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {coverFile.name}
                </p>
              )}
            </div>

            {/* Additional images */}
            <div className="space-y-1.5">
              <FL>Additional Images</FL>
              <div className="grid grid-cols-4 gap-2">
                {/* Existing (edit mode) */}
                {existingImgUrls.map((url, i) => (
                  <div
                    key={`e-${i}`}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100"
                  >
                    <Image
                      src={url?.original}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* New previews */}
                {newImgPreviews.map((src, i) => (
                  <div
                    key={`n-${i}`}
                    className="relative aspect-square rounded-xl overflow-hidden group border-2 border-green-200"
                  >
                    <Image src={src} alt="" fill className="object-cover" />
                    <div
                      className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-green-500"
                      title="New"
                    />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add more */}
                <button
                  type="button"
                  onClick={() => extraRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-green-300 hover:bg-green-50/20 transition-all"
                >
                  <Plus className="w-5 h-5 text-gray-300" />
                </button>
              </div>
              <input
                ref={extraRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addExtras(e.target.files)}
              />
              {existingImgUrls.length + newImgPreviews.length > 0 && (
                <p className="text-xs text-gray-400">
                  {existingImgUrls.length + newImgPreviews.length} image
                  {existingImgUrls.length + newImgPreviews.length > 1
                    ? "s"
                    : ""}
                  {newImgPreviews.length > 0 && (
                    <span className="text-green-600 font-medium">
                      {" "}
                      · {newImgPreviews.length} new
                    </span>
                  )}
                </p>
              )}
            </div>
          </CollapseSection>

          {/* ── SEO ── */}
          <CollapseSection
            title="SEO Settings"
            icon={Globe}
            iconColor="#059669"
            iconBg="#d1fae5"
            defaultOpen={false}
          >
            <p className="text-xs text-gray-400 -mt-1">
              Boost discoverability in search engines.
            </p>

            <div className="space-y-1.5">
              <FL>
                Meta Title{" "}
                <span className="normal-case font-normal text-gray-400">
                  (max 70)
                </span>
              </FL>
              <Input
                placeholder="SEO title (defaults to post title)"
                value={form.metaTitle}
                maxLength={70}
                onChange={(e) => upd("metaTitle", e.target.value)}
                className={inputCls}
              />
              <p
                className={`text-xs text-right font-medium ${form.metaTitle.length > 60 ? "text-amber-500" : "text-gray-400"}`}
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
                rows={3}
                placeholder="Brief description for search engine results..."
                value={form.metaDescription}
                maxLength={160}
                className={textareaCls}
                onChange={(e) => upd("metaDescription", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Ideal: 120–160 chars</p>
                <p
                  className={`text-xs font-medium ${
                    form.metaDescription.length > 160
                      ? "text-red-500"
                      : form.metaDescription.length >= 120
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {form.metaDescription.length}/160
                </p>
              </div>
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
            </div>
          </CollapseSection>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-50 shrink-0 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              upd("isPublished", false);
              setTimeout(handleSubmit, 30);
            }}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="group flex-1 h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-lg shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
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
                  {isEdit ? "Updating..." : "Publishing..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? "Update Post" : "Publish Post"}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Blog card ──────────────────────────────────────────────────
function BlogCard({ blog, onEdit, onDelete, onToggle }) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Cover */}
      <div className="relative w-full aspect-16/7 bg-gray-100 overflow-hidden">
        {blog.coverImage ? (
          <Image
            src={blog.coverImage.original}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-200" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
              blog.isPublished
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {blog.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1.5 flex-wrap max-w-[75%]">
            {blog.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black/50 text-white backdrop-blur-sm"
              >
                #{t}
              </span>
            ))}
            {blog.tags.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black/50 text-white backdrop-blur-sm">
                +{blog.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-4">
        <h3
          className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1.5"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {blog.title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
          {blog.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-3 pb-3 border-b border-gray-50">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{blog.readingTime || 1} min read</span>
          <span>·</span>
          <span>{formatDate(blog.createdAt)}</span>
          {blog.slug && (
            <>
              <span>·</span>
              <span className="font-mono text-gray-300 truncate max-w-25">
                {blog.slug}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(blog)}
            className="flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onToggle(blog._id)}
            className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              blog.isPublished
                ? "text-green-700 bg-green-50 hover:bg-green-100"
                : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {blog.isPublished ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                Live
              </>
            ) : (
              <>
                <ToggleLeft className="w-3.5 h-3.5" />
                Draft
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(blog)}
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
export default function BlogPage() {
  const {
    blogs,
    loading,
    actionLoading,
    fetchBlogs,
    createBlog,
    updateBlog,
    deleteBlog,
    togglePublishStatus,
  } = useBlogStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filtered = useMemo(() => {
    let list = [...blogs];
    if (filterStatus === "Published") list = list.filter((b) => b.isPublished);
    if (filterStatus === "Draft") list = list.filter((b) => !b.isPublished);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.excerpt?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    return list;
  }, [blogs, filterStatus, search]);

  const handleCreate = async (fd) => {
    const ok = await createBlog(fd);
    if (ok) setShowCreate(false);
  };

  const handleUpdate = async (fd) => {
    if (!editBlog) return;
    const ok = await updateBlog(editBlog._id, fd);
    if (ok) setEditBlog(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteBlog(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const publishedCount = blogs.filter((b) => b.isPublished).length;
  const draftCount = blogs.filter((b) => !b.isPublished).length;
  const totalReadMins = blogs.reduce((s, b) => s + (b.readingTime || 0), 0);

  return (
    <>
      <DeleteModal
        blog={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {showCreate && (
        <BlogDrawer
          blog={null}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
        />
      )}
      {editBlog && (
        <BlogDrawer
          blog={editBlog}
          onClose={() => setEditBlog(null)}
          onSubmit={handleUpdate}
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
              Blog Posts
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Write, manage and publish your brand's stories
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchBlogs()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                setEditBlog(null);
                setShowCreate(true);
              }}
              className="group inline-flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, #15803d, #16a34a 50%, #22c55e)",
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Plus className="w-4 h-4 relative" />
              <span className="relative">New Post</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Posts",
              value: blogs.length,
              icon: FileText,
              color: "#15803d",
              bg: "#dcfce7",
            },
            {
              label: "Published",
              value: publishedCount,
              icon: Globe,
              color: "#16a34a",
              bg: "#d1fae5",
            },
            {
              label: "Drafts",
              value: draftCount,
              icon: Pencil,
              color: "#f57c00",
              bg: "#fff3e0",
            },
            {
              label: "Total Read",
              value: `${totalReadMins}m`,
              icon: Clock,
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

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by title, excerpt or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all"
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
            {["All", "Published", "Draft"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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
            <p className="text-sm text-gray-400">Loading blog posts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <FileText className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search || filterStatus !== "All"
                ? "No posts match your filters"
                : "No blog posts yet"}
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
                Write your first post
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 font-medium -mt-2">
              Showing{" "}
              <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
              of {blogs.length} posts
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((blog) => (
                <BlogCard
                  key={blog._id}
                  blog={blog}
                  onEdit={(b) => {
                    setShowCreate(false);
                    setEditBlog(b);
                  }}
                  onDelete={setDeleteTarget}
                  onToggle={togglePublishStatus}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}