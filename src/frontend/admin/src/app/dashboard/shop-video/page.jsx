"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import useShopByVideoStore from "@/store/useShopByVideoStore";
import useProductStore from "@/store/useProductStore";
import Image from "next/image";
import {
  Video,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Upload,
  Play,
  Package,
  Search,
  ImageIcon,
  Info,
  FileVideo,
  Eye,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Shared styles ──────────────────────────────────────────────
const inputCls =
  "h-11 bg-gray-50 border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-purple-400/30 focus-visible:border-purple-400 transition-all hover:border-purple-300";

const textareaCls =
  "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-400 transition-all hover:border-purple-300";

function FL({ children, required }) {
  return (
    <Label className="text-gray-600 text-[11px] tracking-widest uppercase font-semibold">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ video, onConfirm, onCancel, loading }) {
  if (!video) return null;
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
          {/* Preview */}
          <div className="w-28 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-900 flex items-center justify-center">
            {video.thumbnail ? (
              <Image
                src={video.thumbnail}
                alt=""
                width={112}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <Play className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Video?
            </h3>
            <p className="text-sm font-semibold text-gray-700 line-clamp-1">
              {video.title || "Untitled Video"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              The video and thumbnail will be permanently deleted from
              Cloudinary.
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
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create drawer ──────────────────────────────────────────────
function CreateDrawer({ onClose, onSubmit, loading, products }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    productId: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [videoDrag, setVideoDrag] = useState(false);
  const [thumbDrag, setThumbDrag] = useState(false);
  const [errors, setErrors] = useState({});
  const [productSearch, setProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleVideoFile = (f) => {
    if (!f) return;
    setVideoFile(f);
    setErrors((e) => ({ ...e, video: "" }));
  };

  const handleThumbFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const validate = () => {
    const e = {};
    if (!videoFile) e.video = "Video file is required";
    if (!form.productId) e.productId = "Please select a linked product";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const fd = new FormData();
    // Controller reads: req.files.video[0] and req.files.thumbnail[0]
    fd.append("video", videoFile);
    if (thumbFile) fd.append("thumbnail", thumbFile);
    fd.append("productId", form.productId);
    if (form.title) fd.append("title", form.title);
    if (form.description) fd.append("description", form.description);
    onSubmit(fd);
  };

  // Product dropdown
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [products, productSearch]);

  const selectedProduct = products.find((p) => p._id === form.productId);

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
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-purple-200"
              style={{
                background: "linear-gradient(135deg, #9b27af, #c2185b)",
              }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3
                className="text-base font-semibold text-gray-900 leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Add Shop Video
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload a shoppable product video
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
          {/* ── Video upload ── */}
          <div className="space-y-1.5">
            <FL required>Video File</FL>
            <div
              onClick={() => videoInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setVideoDrag(true);
              }}
              onDragLeave={() => setVideoDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setVideoDrag(false);
                handleVideoFile(e.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                videoDrag
                  ? "border-purple-400 bg-purple-50"
                  : errors.video
                    ? "border-red-300 bg-red-50/20"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/20"
              }`}
            >
              {videoFile ? (
                <div
                  className="flex items-center gap-3 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <FileVideo className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">
                      {videoFile.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatBytes(videoFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setErrors((e) => ({ ...e, video: "" }));
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Upload className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Drop video or click to browse
                  </p>
                  <p className="text-xs text-gray-400">MP4, MOV, WebM</p>
                </div>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleVideoFile(e.target.files?.[0])}
            />
            {errors.video && (
              <p className="text-xs text-red-500">{errors.video}</p>
            )}
          </div>

          {/* ── Thumbnail upload ── */}
          <div className="space-y-1.5">
            <FL>
              Thumbnail{" "}
              <span className="normal-case font-normal text-gray-400">
                (optional)
              </span>
            </FL>
            <div
              onClick={() => thumbInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setThumbDrag(true);
              }}
              onDragLeave={() => setThumbDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setThumbDrag(false);
                handleThumbFile(e.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden ${
                thumbDrag
                  ? "border-purple-400 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/20"
              }`}
            >
              {thumbPreview ? (
                <div
                  className="relative h-32 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={thumbPreview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-semibold">
                      Click to change
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbFile(null);
                      setThumbPreview(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-28 gap-2">
                  <ImageIcon className="w-7 h-7 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Drop or click to add thumbnail
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP</p>
                </div>
              )}
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleThumbFile(e.target.files?.[0])}
            />
          </div>

          {/* ── Title ── */}
          <div className="space-y-1.5">
            <FL>
              Title{" "}
              <span className="normal-case font-normal text-gray-400">
                (optional)
              </span>
            </FL>
            <Input
              placeholder="e.g. Summer Silk Collection"
              value={form.title}
              onChange={(e) => upd("title", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* ── Description ── */}
          <div className="space-y-1.5">
            <FL>
              Description{" "}
              <span className="normal-case font-normal text-gray-400">
                (optional)
              </span>
            </FL>
            <textarea
              rows={3}
              placeholder="Brief description of the video..."
              value={form.description}
              onChange={(e) => upd("description", e.target.value)}
              className={textareaCls}
            />
          </div>

          {/* ── Product selector ── */}
          <div className="space-y-1.5">
            <FL required>Linked Product</FL>
            {selectedProduct ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-50 border-2 border-purple-300">
                {selectedProduct.images?.[0] && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-purple-200 shrink-0">
                    <Image
                      src={selectedProduct.images[0]}
                      alt=""
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-800 truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-[11px] text-purple-500 font-medium">
                    ₹{selectedProduct.discountedPrice?.toLocaleString("en-IN")}{" "}
                    · {selectedProduct.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    upd("productId", "");
                    setProductSearch("");
                  }}
                  className="w-6 h-6 rounded-lg bg-purple-200/60 flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Search product by name or category..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductOpen(true);
                    }}
                    onFocus={() => setProductOpen(true)}
                    className={`${inputCls} pl-11 ${errors.productId ? "border-red-300" : ""}`}
                  />
                </div>
                {productOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProductOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 max-h-56 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="px-4 py-5 text-center text-sm text-gray-400">
                          No products found
                        </p>
                      ) : (
                        filteredProducts.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              upd("productId", p._id);
                              setProductOpen(false);
                              setProductSearch("");
                            }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-purple-50 transition-colors text-left"
                          >
                            {p.images?.[0] && (
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                <Image
                                  src={p.images[0]}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">
                                ₹{p.discountedPrice?.toLocaleString("en-IN")} ·{" "}
                                {p.category}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {errors.productId && (
              <p className="text-xs text-red-500">{errors.productId}</p>
            )}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Video uploads may take a moment depending on file size. Thumbnail
              is optional — browsers will use the first frame as fallback.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="group w-full h-11 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-lg shadow-purple-200 transition-all duration-300 hover:shadow-purple-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, #7b1fa2, #9b27af 50%, #c2185b)",
            }}
          >
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Video card ─────────────────────────────────────────────────
function VideoCard({
  video,
  index,
  total,
  onDelete,
  onToggle,
  onOrderUp,
  onOrderDown,
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const product = video.product || {};

  const handlePlayToggle = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        video.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
      }`}
    >
      {/* ── Video / thumbnail ── */}
      <div
        className="relative w-full bg-gray-900 overflow-hidden"
        style={{ aspectRatio: "9/16", maxHeight: "280px" }}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnail || undefined}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted
          onEnded={() => setPlaying(false)}
        />

        {/* Play / pause overlay */}
        {!playing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <button
              onClick={handlePlayToggle}
              className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all"
            >
              <Play className="w-6 h-6 text-gray-800 fill-gray-800 ml-0.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handlePlayToggle}
            className="absolute inset-0 w-full h-full opacity-0"
          />
        )}

        {/* Order controls — top left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOrderUp(video, index)}
            disabled={index === 0}
            className="w-7 h-7 rounded-xl bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-xl bg-black/55 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">
              {index + 1}
            </span>
          </div>
          <button
            onClick={() => onOrderDown(video, index)}
            disabled={index === total - 1}
            className="w-7 h-7 rounded-xl bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge — top right */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-sm ${
              video.isActive
                ? "bg-green-100/90 text-green-700"
                : "bg-black/55 text-gray-200"
            }`}
          >
            {video.isActive ? "Active" : "Hidden"}
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-4">
        {/* Title */}
        <p
          className="text-sm font-semibold text-gray-900 line-clamp-1 mb-0.5"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {video.title || (
            <span className="text-gray-400 italic font-normal text-xs">
              No title
            </span>
          )}
        </p>

        {/* Description */}
        {video.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {video.description}
          </p>
        )}

        {/* Linked product chip */}
        {product._id ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-100 mb-3">
            {product.images?.[0] ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-100 shrink-0">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-800 truncate">
                {product.name}
              </p>
              {product.discountedPrice && (
                <p className="text-[11px] text-purple-500 font-medium">
                  ₹{product.discountedPrice?.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Product not linked
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-gray-50">
          <button
            onClick={() => onToggle(video._id)}
            className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              video.isActive
                ? "text-green-700 bg-green-50 hover:bg-green-100"
                : "text-gray-500 bg-gray-100 hover:bg-purple-50 hover:text-purple-600"
            }`}
          >
            {video.isActive ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Active
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
          <button
            onClick={() => onDelete(video)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function ShopVideoPage() {
  const {
    allVideos,
    loading,
    actionLoading,
    fetchAllVideos,
    createVideo,
    toggleVideoStatus,
    updateVideoOrder,
    deleteVideo,
  } = useShopByVideoStore();

  const { products, fetchProducts } = useProductStore();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchAllVideos();
    if (!products.length) fetchProducts();
  }, []);

  // ── Sorted + filtered ──────────────────────────────────────
  const sortedVideos = useMemo(
    () => [...allVideos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [allVideos],
  );

  const filtered = useMemo(() => {
    if (filterStatus === "Active")
      return sortedVideos.filter((v) => v.isActive);
    if (filterStatus === "Hidden")
      return sortedVideos.filter((v) => !v.isActive);
    return sortedVideos;
  }, [sortedVideos, filterStatus]);

  const handleToggle = async (videoId) => {
    await toggleVideoStatus(videoId);
    fetchAllVideos();
  };

  const handleOrderUp = async (video, index) => {
    if (index === 0) return;
    const prev = sortedVideos[index - 1];
    await updateVideoOrder(video._id, prev.order ?? index - 1);
    await updateVideoOrder(prev._id, video.order ?? index);
    fetchAllVideos();
  };

  const handleOrderDown = async (video, index) => {
    if (index === sortedVideos.length - 1) return;
    const next = sortedVideos[index + 1];
    await updateVideoOrder(video._id, next.order ?? index + 1);
    await updateVideoOrder(next._id, video.order ?? index);
    fetchAllVideos();
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = async (fd) => {
    const ok = await createVideo(fd);
    if (ok) {
      setShowCreate(false);
      fetchAllVideos();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteVideo(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchAllVideos();
  };

  // ── Stats ──────────────────────────────────────────────────
  const activeCount = allVideos.filter((v) => v.isActive).length;
  const hiddenCount = allVideos.filter((v) => !v.isActive).length;

  return (
    <>
      <DeleteModal
        video={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {showCreate && (
        <CreateDrawer
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
          products={products.filter((p) => p.isActive)}
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
              Shop By Video
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage shoppable product videos shown on the storefront
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAllVideos()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="group inline-flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold relative overflow-hidden shadow-md shadow-purple-200 transition-all duration-200 hover:shadow-purple-300 hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, #7b1fa2, #9b27af 50%, #c2185b)",
              }}
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Plus className="w-4 h-4 relative" />
              <span className="relative">Add Video</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total",
              value: allVideos.length,
              icon: Video,
              color: "#9b27af",
              bg: "#f3e8ff",
            },
            {
              label: "Active",
              value: activeCount,
              icon: Eye,
              color: "#16a34a",
              bg: "#f0fdf4",
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

        {/* ── Filter tabs + result count ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", "Active", "Hidden"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === s
                  ? "text-white shadow-sm"
                  : "text-gray-500 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
              }`}
              style={
                filterStatus === s
                  ? { background: "linear-gradient(135deg, #9b27af, #c2185b)" }
                  : {}
              }
            >
              {s}
            </button>
          ))}
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 font-medium ml-auto">
              {filtered.length} video{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Reorder hint ── */}
        {filtered.length > 1 && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-purple-50 border border-purple-100">
            <Info className="w-4 h-4 text-purple-500 shrink-0" />
            <p className="text-xs text-purple-700 font-medium">
              Hover over a card to reveal ↑ ↓ controls and change the display
              order on the storefront.
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-purple-200"
              style={{
                background: "linear-gradient(135deg, #9b27af, #c2185b)",
              }}
            >
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Loading videos…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <Video className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {filterStatus !== "All"
                ? `No ${filterStatus.toLowerCase()} videos`
                : "No videos yet"}
            </p>
            {filterStatus !== "All" ? (
              <button
                onClick={() => setFilterStatus("All")}
                className="text-xs text-purple-600 hover:text-pink-600 font-semibold transition-colors"
              >
                Show all
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs text-purple-600 hover:text-pink-600 font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first video
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((video, i) => (
              <VideoCard
                key={video._id}
                video={video}
                index={i}
                total={filtered.length}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
                onOrderUp={handleOrderUp}
                onOrderDown={handleOrderDown}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
