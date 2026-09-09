"use client";

/**
 * EXTRA ENDPOINT NEEDED
 * ─────────────────────────────────────────────────────────────────────────────
 * Add to product.controller.js:
 *
 *   export const updateStock = async (req, res) => {
 *     try {
 *       const { productId } = req.params;
 *       const { stock } = req.body;
 *       const product = await Product.findByIdAndUpdate(
 *         productId,
 *         { stock: Number(stock) },
 *         { new: true }
 *       );
 *       if (!product) return res.status(404).json({ message: "Product not found" });
 *       return res.status(200).json({ success: true, product });
 *     } catch (error) {
 *       return res.status(500).json({ message: "Error updating stock" });
 *     }
 *   };
 *
 * Add to product.routes.js (admin-protected):
 *   router.patch("/update-stock/:productId", authMiddleware, adminMiddleware, updateStock);
 *
 * Add to useProductStore.js:
 *
 *   updateStock: async (productId, stock) => {
 *     try {
 *       const res = await api.patch(`/product/update-stock/${productId}`, { stock });
 *       set({
 *         products: get().products.map(p =>
 *           p._id === productId ? { ...p, stock: res.data.product.stock } : p
 *         ),
 *       });
 *       toast.success("Stock updated");
 *       return true;
 *     } catch (error) {
 *       return false;
 *     }
 *   },
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useMemo, useRef } from "react";
import useProductStore from "@/store/useProductStore";
import Image from "next/image";
import {
  Package,
  Loader2,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Save,
  TrendingDown,
  TrendingUp,
  Layers,
  Filter,
  BarChart3,
  Archive,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  IndianRupee,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// ── Helpers ────────────────────────────────────────────────────
const STOCK_LEVELS = {
  out: {
    label: "Out of Stock",
    color: "#ef4444",
    bg: "#fff1f2",
    dot: "bg-red-500",
    min: 0,
    max: 0,
  },
  low: {
    label: "Low Stock",
    color: "#f97316",
    bg: "#fff7ed",
    dot: "bg-orange-400",
    min: 1,
    max: 5,
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bg: "#fefce8",
    dot: "bg-amber-400",
    min: 6,
    max: 20,
  },
  healthy: {
    label: "Healthy",
    color: "#22c55e",
    bg: "#f0fdf4",
    dot: "bg-green-500",
    min: 21,
    max: Infinity,
  },
};

function getStockLevel(stock) {
  if (stock === 0) return "out";
  if (stock <= 5) return "low";
  if (stock <= 20) return "medium";
  return "healthy";
}

function StockBadge({ stock }) {
  const level = getStockLevel(stock);
  const s = STOCK_LEVELS[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl"
      style={{ background: s.bg, color: s.color }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

const CATEGORY_STYLE = {
  Suits: { bg: "#f3e8ff", color: "#9b27af" },
  "Co Ord Set": { bg: "#fce4ec", color: "#c2185b" },
  Party: { bg: "#e1f5fe", color: "#0288d1" },
  Other: { bg: "#fff3e0", color: "#f57c00" },
};

// ── Inline stock editor ────────────────────────────────────────
function StockEditor({ product, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock ?? 0));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    const newStock = parseInt(value, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Enter a valid stock number");
      return;
    }
    if (newStock === product.stock) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(product._id, newStock);
    setSaving(false);
    if (ok) setEditing(false);
    else setValue(String(product.stock ?? 0));
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setValue(String(product.stock ?? 0));
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          className="w-20 h-8 px-2.5 rounded-xl border-2 border-purple-400 bg-purple-50 text-sm font-bold text-purple-700 text-center focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 transition-colors shadow-sm"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setValue(String(product.stock ?? 0));
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 px-3 h-8 rounded-xl border border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50 transition-all"
    >
      <span
        className={`text-sm font-bold ${
          product.stock === 0
            ? "text-red-500"
            : product.stock <= 5
              ? "text-orange-500"
              : "text-gray-800"
        }`}
      >
        {product.stock ?? 0}
      </span>
      <Pencil className="w-3 h-3 text-gray-300 group-hover:text-purple-400 transition-colors" />
    </button>
  );
}

// ── Sort helpers ───────────────────────────────────────────────
function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      {label}
      {active ? (
        sortDir === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function InventoryPage() {
  const { products, loading, fetchProducts, updateStock } = useProductStore();

  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [sortField, setSortField] = useState("stock");
  const [sortDir, setSortDir] = useState("asc");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Update stock via store ────────────────────────────────
  const handleUpdateStock = async (productId, stock) => {
    setUpdatingId(productId);
    const ok = await updateStock(productId, stock);
    setUpdatingId(null);
    return ok;
  };

  // ── Sort handler ──────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Filtered + sorted ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...products];

    if (filterLevel !== "All") {
      const level = filterLevel
        .toLowerCase()
        .replace(" ", "_")
        .replace("out_of_stock", "out")
        .replace("low_stock", "low");
      list = list.filter((p) => getStockLevel(p.stock) === level);
    }
    if (filterCat !== "All")
      list = list.filter((p) => p.category === filterCat);

    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );

    list.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "stock") {
        aVal = a.stock ?? 0;
        bVal = b.stock ?? 0;
      } else if (sortField === "name") {
        aVal = a.name?.toLowerCase();
        bVal = b.name?.toLowerCase();
      } else if (sortField === "price") {
        aVal = a.discountedPrice ?? 0;
        bVal = b.discountedPrice ?? 0;
      } else if (sortField === "category") {
        aVal = a.category;
        bVal = b.category;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, filterLevel, filterCat, search, sortField, sortDir]);

  // ── Stats ──────────────────────────────────────────────────
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const mediumStock = products.filter(
    (p) => p.stock > 5 && p.stock <= 20,
  ).length;
  const healthyStock = products.filter((p) => p.stock > 20).length;
  const totalUnits = products.reduce((s, p) => s + (p.stock ?? 0), 0);
  const totalValue = products.reduce(
    (s, p) => s + (p.stock ?? 0) * (p.discountedPrice ?? 0),
    0,
  );

  const LEVEL_FILTERS = [
    "All",
    "Out of Stock",
    "Low Stock",
    "Medium",
    "Healthy",
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-light text-gray-900"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Inventory
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Monitor and update stock levels across all products
          </p>
        </div>
        <button
          onClick={() => fetchProducts()}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Out of stock alert ── */}
      {outOfStock > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-800">
            <span className="font-bold">{outOfStock}</span> product
            {outOfStock > 1 ? "s are" : " is"} out of stock and will not be
            visible to customers.
          </p>
          <button
            onClick={() => setFilterLevel("Out of Stock")}
            className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 transition-colors whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: "Total SKUs",
            value: products.length,
            icon: Package,
            color: "#9b27af",
            bg: "#f3e8ff",
          },
          {
            label: "Total Units",
            value: totalUnits,
            icon: Layers,
            color: "#0288d1",
            bg: "#e1f5fe",
          },
          {
            label: "Inventory Value",
            value: `₹${totalValue.toLocaleString("en-IN")}`,
            icon: IndianRupee,
            color: "#2e7d32",
            bg: "#e8f5e9",
            span: true,
          },
          {
            label: "Out of Stock",
            value: outOfStock,
            icon: Archive,
            color: "#ef4444",
            bg: "#fff1f2",
          },
          {
            label: "Low Stock",
            value: lowStock,
            icon: TrendingDown,
            color: "#f97316",
            bg: "#fff7ed",
          },
          {
            label: "Healthy",
            value: healthyStock,
            icon: TrendingUp,
            color: "#22c55e",
            bg: "#f0fdf4",
          },
        ].map(({ label, value, icon: Icon, color, bg, span }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${span ? "xl:col-span-1" : ""}`}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 leading-none truncate">
                {value}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stock level distribution bar ── */}
      {products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              Stock Distribution
            </p>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {[
              { count: outOfStock, color: "#ef4444" },
              { count: lowStock, color: "#f97316" },
              { count: mediumStock, color: "#f59e0b" },
              { count: healthyStock, color: "#22c55e" },
            ].map(({ count, color }, i) => {
              const pct =
                products.length > 0 ? (count / products.length) * 100 : 0;
              return pct > 0 ? (
                <div
                  key={i}
                  className="h-full rounded-sm transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              ) : null;
            })}
          </div>
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            {[
              { label: "Out of Stock", count: outOfStock, color: "#ef4444" },
              { label: "Low (1–5)", count: lowStock, color: "#f97316" },
              { label: "Medium (6–20)", count: mediumStock, color: "#f59e0b" },
              { label: "Healthy (21+)", count: healthyStock, color: "#22c55e" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[11px] text-gray-500 font-medium">
                  {label}:{" "}
                  <span className="font-bold text-gray-700">{count}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by product name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-purple-400/30 focus-visible:border-purple-400 transition-all"
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

          {/* Category filter */}
          <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
            {["All", "Suits", "Co Ord Set", "Party", "Other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterCat === cat
                    ? "text-white shadow-sm"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                }`}
                style={
                  filterCat === cat
                    ? {
                        background: "linear-gradient(135deg, #9b27af, #c2185b)",
                      }
                    : {}
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock level filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Level:
          </span>
          {LEVEL_FILTERS.map((level) => {
            const count =
              level === "All"
                ? products.length
                : level === "Out of Stock"
                  ? outOfStock
                  : level === "Low Stock"
                    ? lowStock
                    : level === "Medium"
                      ? mediumStock
                      : healthyStock;
            const levelStyle =
              level === "Out of Stock"
                ? { background: "#fff1f2", color: "#ef4444" }
                : level === "Low Stock"
                  ? { background: "#fff7ed", color: "#f97316" }
                  : level === "Medium"
                    ? { background: "#fefce8", color: "#f59e0b" }
                    : level === "Healthy"
                      ? { background: "#f0fdf4", color: "#22c55e" }
                      : null;
            const active = filterLevel === level;
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  active
                    ? "text-white shadow-sm"
                    : "text-gray-500 bg-white border border-gray-200 hover:border-purple-200"
                }`}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, #9b27af, #c2185b)",
                      }
                    : {}
                }
              >
                {level}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    active ? "bg-white/20 text-white" : ""
                  }`}
                  style={
                    !active && levelStyle
                      ? {
                          background: levelStyle.background,
                          color: levelStyle.color,
                        }
                      : {}
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      {products.length > 0 && (
        <p className="text-xs text-gray-400 font-medium -mt-2">
          Showing{" "}
          <span className="font-bold text-gray-700">{filtered.length}</span> of{" "}
          {products.length} products
        </p>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-purple-200"
            style={{ background: "linear-gradient(135deg, #9b27af, #c2185b)" }}
          >
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Loading inventory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            No products match your filters
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterLevel("All");
              setFilterCat("All");
            }}
            className="text-xs text-purple-600 hover:text-pink-600 font-semibold transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* ── Inventory table ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-gray-50 bg-gray-50/60">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              #
            </span>
            <SortHeader
              label="Product"
              field="name"
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortHeader
              label="Category"
              field="category"
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortHeader
              label="Price"
              field="price"
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Status
            </span>
            <SortHeader
              label="Stock"
              field="stock"
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
              Edit
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filtered.map((product, idx) => {
              const cat =
                CATEGORY_STYLE[product.category] || CATEGORY_STYLE["Other"];
              return (
                <div
                  key={product._id}
                  className={`grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-gray-50/40 transition-colors ${
                    updatingId === product._id ? "opacity-60" : ""
                  }`}
                >
                  {/* Index */}
                  <span className="text-xs font-bold text-gray-300 text-center">
                    {idx + 1}
                  </span>

                  {/* Product */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-45">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono truncate">
                        {product._id.slice(-8)}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap hidden sm:inline"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {product.category === "Other" && product.customCategory
                      ? product.customCategory
                      : product.category}
                  </span>

                  {/* Price */}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-800">
                      ₹{product.discountedPrice?.toLocaleString("en-IN")}
                    </p>
                    {product.originalPrice !== product.discountedPrice && (
                      <p className="text-[11px] text-gray-400 line-through">
                        ₹{product.originalPrice?.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  {/* Stock status */}
                  <StockBadge stock={product.stock ?? 0} />

                  {/* Stock number (editable) */}
                  <StockEditor product={product} onSave={handleUpdateStock} />

                  {/* Stock value */}
                  <div className="text-right hidden xl:block">
                    <p className="text-xs font-bold text-gray-700">
                      ₹
                      {(
                        (product.stock ?? 0) * (product.discountedPrice ?? 0)
                      ).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-gray-400">value</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/40">
            <p className="text-xs text-gray-400 font-medium">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} ·{" "}
              {filtered.reduce((s, p) => s + (p.stock ?? 0), 0)} total units
            </p>
            <p className="text-xs font-bold text-gray-700">
              Filtered value: ₹
              {filtered
                .reduce(
                  (s, p) => s + (p.stock ?? 0) * (p.discountedPrice ?? 0),
                  0,
                )
                .toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
