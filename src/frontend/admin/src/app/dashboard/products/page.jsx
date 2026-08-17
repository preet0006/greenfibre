"use client";

import { useEffect, useState, useMemo } from "react";
import useProductStore from "@/store/useProductStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import Image from "next/image";
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Pencil,
  Eye,
  EyeOff,
  Star,
  Tag,
  IndianRupee,
  Layers,
  Upload,
  CheckCircle2,
  Filter,
  ChevronDown,
  Hash,
  LayoutGrid,
  List,
  XCircle,
  Palette,
  TrendingUp,
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
    <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
  );
}

function formatPrice(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function discountPct(orig, disc) {
  if (!orig || !disc) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

// ── Collapsible section ─────────────────────────────────────────
function Section({
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
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: iconBg }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
          <span className="text-xs font-bold text-gray-700 tracking-widest uppercase">
            {title}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-5 pt-3 space-y-4">{children}</div>}
    </div>
  );
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ product, onConfirm, onCancel, loading }) {
  if (!product) return null;
  
  const firstImage =
    product.colors?.[0]?.images?.[0]?.thumbnail ||
    product.colors?.[0]?.images?.[0];
  
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
          {firstImage && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <Image
                src={firstImage}
                alt={product.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Product?
            </h3>
            <p className="text-sm font-semibold text-gray-700 line-clamp-2">
              {product.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              All product images and color variants will be deleted.
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

// ── Product Form Drawer ────────────────────────────────────────
function ProductDrawer({
  product: initial,
  onClose,
  onSubmit,
  loading,
  categories,
}) {
  const isEdit = !!initial;

  const emptyForm = {
    name: "",
    description: "",
    originalPrice: "",
    discountedPrice: "",
    category: categories[0]?._id || "",
    subCategory: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    isFeatured: false,
  };

  const [form, setForm] = useState(
    isEdit
      ? {
          name: initial.name ?? "",
          description: initial.description ?? "",
          originalPrice: initial.originalPrice ?? "",
          discountedPrice: initial.discountedPrice ?? "",
          category: initial.category?._id || initial.category || "",
          subCategory: initial.subCategory?._id || initial.subCategory || "",
          metaTitle: initial.metaTitle ?? "",
          metaDescription: initial.metaDescription ?? "",
          metaKeywords: initial.metaKeywords?.join(", ") ?? "",
          isFeatured: initial.isFeatured ?? false,
        }
      : emptyForm,
  );

  // Features & Material Info (key-value pairs)
  const [features, setFeatures] = useState(() => {
    if (
      !isEdit ||
      !initial.features ||
      Object.keys(initial.features).length === 0
    ) {
      return [{ key: "", value: "" }];
    }
    return Object.entries(initial.features).map(([key, value]) => ({
      key,
      value,
    }));
  });

  const [materialInfo, setMaterialInfo] = useState(() => {
    if (
      !isEdit ||
      !initial.materialInfo ||
      Object.keys(initial.materialInfo).length === 0
    ) {
      return [{ key: "", value: "" }];
    }
    return Object.entries(initial.materialInfo).map(([key, value]) => ({
      key,
      value,
    }));
  });

  // Color variants
  const [colors, setColors] = useState(
    isEdit && initial.colors?.length > 0
      ? initial.colors.map((c) => ({
          name: c.name,
          hex: c.hex || "",
          stock: c.stock || 0,
          existingImages: Array.isArray(c.images) ? c.images : [],
          newImages: [],
          newPreviews: [],
        }))
      : [
          {
            name: "",
            hex: "",
            stock: 0,
            existingImages: [],
            newImages: [],
            newPreviews: [],
          },
        ],
  );

  const [errors, setErrors] = useState({});

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  // Feature handlers
  const addFeature = () => {
    setFeatures([...features, { key: "", value: "" }]);
  };

  const removeFeature = (idx) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const updateFeature = (idx, field, value) => {
    setFeatures(
      features.map((f, i) => (i === idx ? { ...f, [field]: value } : f)),
    );
  };

  // Material info handlers
  const addMaterialInfo = () => {
    setMaterialInfo([...materialInfo, { key: "", value: "" }]);
  };

  const removeMaterialInfo = (idx) => {
    setMaterialInfo(materialInfo.filter((_, i) => i !== idx));
  };

  const updateMaterialInfo = (idx, field, value) => {
    setMaterialInfo(
      materialInfo.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    );
  };

  const addColor = () => {
    setColors([
      ...colors,
      {
        name: "",
        hex: "",
        stock: 0,
        existingImages: [],
        newImages: [],
        newPreviews: [],
      },
    ]);
  };

  const removeColor = (idx) => {
    if (colors.length === 1) {
      setErrors({ colors: "At least one color variant is required" });
      return;
    }
    setColors(colors.filter((_, i) => i !== idx));
    setErrors((e) => ({ ...e, colors: "" }));
  };

  const updColor = (idx, field, value) => {
    setColors(colors.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    setErrors((e) => ({ ...e, [`color_${idx}`]: "" }));
  };

  const addColorImages = (idx, files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setColors(
      colors.map((c, i) =>
        i === idx
          ? {
              ...c,
              newImages: [...c.newImages, ...valid],
              newPreviews: [
                ...c.newPreviews,
                ...valid.map((f) => URL.createObjectURL(f)),
              ],
            }
          : c,
      ),
    );
  };

  const removeExistingImage = (colorIdx, imgIdx) => {
    setColors(
      colors.map((c, i) =>
        i === colorIdx
          ? {
              ...c,
              existingImages: c.existingImages.filter((_, j) => j !== imgIdx),
            }
          : c,
      ),
    );
  };

  const removeNewImage = (colorIdx, imgIdx) => {
    setColors(
      colors.map((c, i) =>
        i === colorIdx
          ? {
              ...c,
              newImages: c.newImages.filter((_, j) => j !== imgIdx),
              newPreviews: c.newPreviews.filter((_, j) => j !== imgIdx),
            }
          : c,
      ),
    );
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.originalPrice) e.originalPrice = "Required";
    if (!form.discountedPrice) e.discountedPrice = "Required";
    if (Number(form.discountedPrice) > Number(form.originalPrice))
      e.discountedPrice = "Cannot exceed original price";

    // Validate colors
    colors.forEach((color, idx) => {
      if (!color.name.trim()) e[`color_${idx}`] = "Color name is required";
      if (!isEdit && color.newImages.length === 0) {
        e[`color_${idx}_images`] = "At least one image required";
      }
    });

    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("originalPrice", form.originalPrice);
    fd.append("discountedPrice", form.discountedPrice);
    fd.append("category", form.category);
    if (form.subCategory) fd.append("subCategory", form.subCategory);
    fd.append("isFeatured", form.isFeatured);

    // SEO
    if (form.metaTitle) fd.append("metaTitle", form.metaTitle);
    if (form.metaDescription)
      fd.append("metaDescription", form.metaDescription);
    if (form.metaKeywords) fd.append("metaKeywords", form.metaKeywords);

    // Features - convert to object, filter out empty
    const featuresObj = {};
    features.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        featuresObj[key.trim()] = value.trim();
      }
    });
    if (Object.keys(featuresObj).length > 0) {
      fd.append("features", JSON.stringify(featuresObj));
    }

    // Material Info - convert to object, filter out empty
    const materialObj = {};
    materialInfo.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        materialObj[key.trim()] = value.trim();
      }
    });
    if (Object.keys(materialObj).length > 0) {
      fd.append("materialInfo", JSON.stringify(materialObj));
    }

    // Colors
    const colorData = colors.map((c) => ({
      name: c.name,
      hex: c.hex,
      stock: parseInt(c.stock) || 0,
    }));
    fd.append("colors", JSON.stringify(colorData));

    // Images per color
    colors.forEach((color, idx) => {
      color.newImages.forEach((file, fileIdx) => {
        fd.append(`color_${idx}_image_${fileIdx}`, file);
      });
    });

    onSubmit(fd);
  };

  const pct = discountPct(form.originalPrice, form.discountedPrice);
  const subCategories = categories.filter(
    (c) => c.parentCategory === form.category,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
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
                {isEdit ? "Edit Product" : "New Product"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit
                  ? `Editing: ${initial.name?.slice(0, 30)}`
                  : "Add a new product"}
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          {/* ── Basic Info ── */}
          <Section
            title="Basic Info"
            icon={Package}
            iconColor="#15803d"
            iconBg="#dcfce7"
          >
            <div className="space-y-1.5">
              <FL required>Product Name</FL>
              <Input
                placeholder="e.g. Earth friendly planter"
                value={form.name}
                onChange={(e) => upd("name", e.target.value)}
                className={`${inputCls} ${errors.name ? "border-red-300" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <FL required>Description</FL>
              <textarea
                rows={4}
                placeholder="Describe the product..."
                value={form.description}
                onChange={(e) => upd("description", e.target.value)}
                className={`${textareaCls} ${errors.description ? "border-red-300" : ""}`}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FL required>Category</FL>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={form.category}
                    onChange={(e) => upd("category", e.target.value)}
                    className={`${inputCls} appearance-none pl-11 pr-10`}
                  >
                    {categories
                      .filter((c) => !c.parentCategory)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <FL>Sub-Category</FL>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={form.subCategory}
                    onChange={(e) => upd("subCategory", e.target.value)}
                    className={`${inputCls} appearance-none pl-11 pr-10`}
                    disabled={subCategories.length === 0}
                  >
                    <option value="">None</option>
                    {subCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={form.isFeatured}
                onChange={(e) => upd("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isFeatured" className="text-sm text-gray-700">
                Feature this product
              </label>
            </div>
          </Section>

          {/* ── Pricing ── */}
          <Section
            title="Pricing"
            icon={IndianRupee}
            iconColor="#16a34a"
            iconBg="#d1fae5"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FL required>Original Price (₹)</FL>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="1299"
                    value={form.originalPrice}
                    onChange={(e) => upd("originalPrice", e.target.value)}
                    className={`${inputCls} pl-11 ${errors.originalPrice ? "border-red-300" : ""}`}
                  />
                </div>
                {errors.originalPrice && (
                  <p className="text-xs text-red-500">{errors.originalPrice}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <FL required>Discounted Price (₹)</FL>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="number"
                    min="0"
                    placeholder="999"
                    value={form.discountedPrice}
                    onChange={(e) => upd("discountedPrice", e.target.value)}
                    className={`${inputCls} pl-11 ${errors.discountedPrice ? "border-red-300" : ""}`}
                  />
                </div>
                {errors.discountedPrice && (
                  <p className="text-xs text-red-500">
                    {errors.discountedPrice}
                  </p>
                )}
              </div>
            </div>

            {pct > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs font-semibold text-green-700">
                  {pct}% off · Saves{" "}
                  {formatPrice(
                    Number(form.originalPrice) - Number(form.discountedPrice),
                  )}
                </p>
              </div>
            )}
          </Section>

          {/* ── Color Variants ── */}
          <Section
            title="Color Variants"
            icon={Palette}
            iconColor="#0284c7"
            iconBg="#e0f2fe"
          >
            {errors.colors && (
              <p className="text-xs text-red-500 -mt-2">{errors.colors}</p>
            )}

            <div className="space-y-4">
              {colors.map((color, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Color {idx + 1}
                    </span>
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColor(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Name & Hex */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FL required>Color Name</FL>
                      <Input
                        placeholder="e.g. Forest Green"
                        value={color.name}
                        onChange={(e) => updColor(idx, "name", e.target.value)}
                        className={`${inputCls} ${errors[`color_${idx}`] ? "border-red-300" : ""}`}
                      />
                      {errors[`color_${idx}`] && (
                        <p className="text-xs text-red-500">
                          {errors[`color_${idx}`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <FL>Hex Code</FL>
                      <div className="relative">
                        {color.hex && (
                          <div
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-gray-200"
                            style={{ background: color.hex }}
                          />
                        )}
                        <Input
                          placeholder="#000000"
                          value={color.hex}
                          onChange={(e) => updColor(idx, "hex", e.target.value)}
                          className={`${inputCls} ${color.hex ? "pl-11" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <FL>Stock Quantity</FL>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={color.stock}
                        onChange={(e) => updColor(idx, "stock", e.target.value)}
                        className={`${inputCls} pl-11`}
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-1.5">
                    <FL>Images</FL>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => addColorImages(idx, e.target.files)}
                        className="hidden"
                        id={`color-img-${idx}`}
                      />

                      {color.existingImages.length +
                        color.newPreviews.length ===
                      0 ? (
                        <label
                          htmlFor={`color-img-${idx}`}
                          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Upload className="w-6 h-6 text-gray-300 mb-2" />
                          <p className="text-xs text-gray-500">
                            Click to upload images
                          </p>
                        </label>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {/* Existing images */}
                          {color.existingImages.map((src, imgIdx) => {
                            const imgSrc =
                              typeof src === "string"
                                ? src
                                : src?.thumbnail || src?.original;
                            return (
                              <div
                                key={`e-${imgIdx}`}
                                className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200"
                              >
                                <Image
                                  src={imgSrc}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExistingImage(idx, imgIdx)
                                  }
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}

                          {/* New images */}
                          {color.newPreviews.map((src, imgIdx) => (
                            <div
                              key={`n-${imgIdx}`}
                              className="relative aspect-square rounded-lg overflow-hidden group border-2 border-green-300"
                            >
                              <Image
                                src={src}
                                alt=""
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-green-500" />
                              <button
                                type="button"
                                onClick={() => removeNewImage(idx, imgIdx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* Add more */}
                          <label
                            htmlFor={`color-img-${idx}`}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-green-300 hover:bg-green-50/20 transition-all cursor-pointer"
                          >
                            <Plus className="w-5 h-5 text-gray-300" />
                          </label>
                        </div>
                      )}
                    </div>
                    {errors[`color_${idx}_images`] && (
                      <p className="text-xs text-red-500">
                        {errors[`color_${idx}_images`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addColor}
              className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Color
            </button>
          </Section>

          {/* ── Features (Dynamic Key-Value) ── */}
          <Section
            title="Features"
            icon={Layers}
            iconColor="#059669"
            iconBg="#d1fae5"
            defaultOpen={false}
          >
            <div className="space-y-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Key (e.g. Material)"
                      value={feature.key}
                      onChange={(e) =>
                        updateFeature(idx, "key", e.target.value)
                      }
                      className={inputCls}
                    />
                    <Input
                      placeholder="Value (e.g. Rice Husk)"
                      value={feature.value}
                      onChange={(e) =>
                        updateFeature(idx, "value", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="w-9 h-11 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="w-full h-9 rounded-xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Feature
              </button>
            </div>
          </Section>

          {/* ── Material Info (Dynamic Key-Value) ── */}
          <Section
            title="Material Info"
            icon={TrendingUp}
            iconColor="#0284c7"
            iconBg="#e0f2fe"
            defaultOpen={false}
          >
            <div className="space-y-3">
              {materialInfo.map((info, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Key (e.g. Composition)"
                      value={info.key}
                      onChange={(e) =>
                        updateMaterialInfo(idx, "key", e.target.value)
                      }
                      className={inputCls}
                    />
                    <Input
                      placeholder="Value (e.g. 100% Organic)"
                      value={info.value}
                      onChange={(e) =>
                        updateMaterialInfo(idx, "value", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  {materialInfo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMaterialInfo(idx)}
                      className="w-9 h-11 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMaterialInfo}
                className="w-full h-9 rounded-xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Material Info
              </button>
            </div>
          </Section>

          {/* ── SEO ── */}
          <Section
            title="SEO & Meta"
            icon={Search}
            iconColor="#f59e0b"
            iconBg="#fef3c7"
            defaultOpen={false}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <FL>Meta Title</FL>
                <Input
                  placeholder="Product title for search engines"
                  value={form.metaTitle}
                  onChange={(e) => upd("metaTitle", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FL>Meta Description</FL>
                <textarea
                  rows={3}
                  placeholder="Brief description for search results"
                  value={form.metaDescription}
                  onChange={(e) => upd("metaDescription", e.target.value)}
                  className={textareaCls}
                />
              </div>
              <div className="space-y-1.5">
                <FL>Keywords (comma-separated)</FL>
                <Input
                  placeholder="organic, cotton, eco-friendly, sustainable"
                  value={form.metaKeywords}
                  onChange={(e) => upd("metaKeywords", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>
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
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? "Update Product" : "Create Product"}
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card (unchanged, keeping original) ───────────────
function ProductCard({ product, onEdit, onDelete, onToggle, getCategoryName }) {
  const pct = discountPct(product.originalPrice, product.discountedPrice);
  const firstColor = product.colors?.[0];
  const firstImage =
    firstColor?.images?.[0]?.card ||
    firstColor?.images?.[0]?.thumbnail ||
    firstColor?.images?.[0];
  const totalStock = product.totalStock || 0;

  return (
    <div
      className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
        product.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-3/4 bg-gray-100 overflow-hidden">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {pct > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-500 text-white shadow-sm">
              {pct}% off
            </span>
          )}
          {product.isFeatured && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-400 text-white shadow-sm">
              Featured
            </span>
          )}
          {totalStock <= 5 && totalStock > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-400 text-white shadow-sm">
              Low Stock
            </span>
          )}
          {totalStock === 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500 text-white shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Status */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              product.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-500"
            }`}
          >
            {product.isActive ? "Active" : "Off"}
          </span>
        </div>

        {/* Color count */}
        {product.colors?.length > 1 && (
          <div className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
            <Palette className="w-2.5 h-2.5" />
            {product.colors.length} colors
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        {/* Category */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-100 text-green-700 inline-block mb-1.5">
          {getCategoryName(product.category)}
        </span>

        <p
          className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {product.name}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.discountedPrice)}
          </span>
          {product.originalPrice !== product.discountedPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Colors + Stock */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1">
            {product.colors?.slice(0, 3).map((c, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-md border-2 border-gray-200"
                style={{ background: c.hex || "#ccc" }}
                title={c.name}
              />
            ))}
            {product.colors?.length > 3 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400 flex items-center">
                +{product.colors.length - 3}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              totalStock === 0
                ? "bg-red-50 text-red-600"
                : totalStock <= 5
                  ? "bg-amber-50 text-amber-600"
                  : "bg-gray-50 text-gray-600"
            }`}
          >
            Stock: {totalStock}
          </span>
        </div>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-gray-700">
              {Number(product.averageRating).toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-gray-50">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 h-7 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-all"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => onToggle(product._id)}
            title={product.isActive ? "Deactivate" : "Activate"}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              product.isActive
                ? "bg-green-50 text-green-600 hover:bg-green-100"
                : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
            }`}
          >
            {product.isActive ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => onDelete(product)}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page (unchanged structure, keeping original filters) ──
export default function ProductsPage() {
  const {
    products,
    loading,
    actionLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
  } = useProductStore();

  const { categories, refetchCategories } = useCategoryStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchProducts();
    refetchCategories();
  }, []);

  const getCategoryName = (catId) => {
    // Handle both populated category objects and string IDs
    const id = typeof catId === "object" ? catId?._id : catId;
    const cat = categories.find((c) => c._id === id);
    return cat?.name || "Uncategorized";
  };;

  const activeCategories = useMemo(() => {
    // Extract category IDs, handling both objects and strings
    const cats = products
      .map((p) => {
        const catId =
          typeof p.category === "object" ? p.category?._id : p.category;
        return catId;
      })
      .filter(Boolean);
    const unique = Array.from(new Set(cats));
    return ["All", ...unique.map((id) => ({ id, name: getCategoryName(id) }))];
  }, [products, categories]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (filterCat !== "All") {
      // Handle both populated category objects and string IDs
      list = list.filter((p) => {
        const catId =
          typeof p.category === "object" ? p.category?._id : p.category;
        return catId === filterCat;
      });
    }
    if (filterStatus === "Active") list = list.filter((p) => p.isActive);
    if (filterStatus === "Inactive") list = list.filter((p) => !p.isActive);
    if (filterStatus === "Low Stock")
      list = list.filter((p) => p.totalStock <= 5 && p.totalStock > 0);
    if (filterStatus === "Out of Stock")
      list = list.filter((p) => p.totalStock === 0);
    if (filterStatus === "Featured") list = list.filter((p) => p.isFeatured);

    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          getCategoryName(p.category).toLowerCase().includes(q),
      );
    return list;
  }, [products, filterCat, filterStatus, search, categories]);

  const handleCreate = async (fd) => {
    const ok = await createProduct(fd);
    if (ok) setShowCreate(false);
  };

  const handleUpdate = async (fd) => {
    if (!editProduct) return;
    const ok = await updateProduct(editProduct._id, fd);
    if (ok) setEditProduct(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteProduct(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter(
    (p) => p.totalStock <= 5 && p.totalStock > 0,
  ).length;
  const outOfStockCount = products.filter((p) => p.totalStock === 0).length;

  const hasFilters = search || filterCat !== "All" || filterStatus !== "All";

  return (
    <>
      <DeleteModal
        product={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {showCreate && (
        <ProductDrawer
          product={null}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          loading={actionLoading}
          categories={categories.filter((c) => c.isActive)}
        />
      )}
      {editProduct && (
        <ProductDrawer
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSubmit={handleUpdate}
          loading={actionLoading}
          categories={categories.filter((c) => c.isActive)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Products
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your product catalogue
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchProducts()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                setEditProduct(null);
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
              <span className="relative">Add Product</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Products",
              value: products.length,
              icon: Package,
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
              label: "Low Stock (≤5)",
              value: lowStockCount,
              icon: AlertTriangle,
              color: "#f59e0b",
              bg: "#fef3c7",
            },
            {
              label: "Out of Stock",
              value: outOfStockCount,
              icon: XCircle,
              color: "#ef4444",
              bg: "#fff1f2",
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

        {/* Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search products..."
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

            <div className="flex items-center gap-2 sm:ml-auto">
              {/* Status filters */}
              {[
                "All",
                "Active",
                "Inactive",
                "Featured",
                "Low Stock",
                "Out of Stock",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    filterStatus === s
                      ? "text-white shadow-sm"
                      : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
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

              {/* View toggle */}
              <div className="flex items-center gap-0.5 p-1 bg-gray-100 rounded-xl ml-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category pills */}
          {activeCategories.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
              </span>
              {activeCategories.map((cat) => {
                const catId = cat === "All" ? "All" : cat.id;
                const catName = cat === "All" ? "All" : cat.name;
                const count =
                  catId === "All"
                    ? products.length
                    : products.filter((p) => {
                        const productCatId =
                          typeof p.category === "object"
                            ? p.category?._id
                            : p.category;
                        return productCatId === catId;
                      }).length;
                const active = filterCat === catId;
                return (
                  <button
                    key={catId}
                    onClick={() => setFilterCat(catId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? "text-white shadow-sm"
                        : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
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
                    {catName}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
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
        {products.length > 0 && (
          <div className="flex items-center justify-between -mt-2">
            <p className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
              of {products.length} products
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterCat("All");
                  setFilterStatus("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Loading / Empty / Grid */}
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
            <p className="text-sm text-gray-400">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <Package className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {hasFilters
                ? "No products match your filters"
                : "No products yet"}
            </p>
            {hasFilters ? (
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
                onClick={() => setShowCreate(true)}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onEdit={(prod) => {
                  setShowCreate(false);
                  setEditProduct(prod);
                }}
                onDelete={setDeleteTarget}
                onToggle={toggleProductStatus}
                getCategoryName={getCategoryName}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}