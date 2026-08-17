"use client";

import { useEffect, useState, useMemo } from "react";
import useReviewStore from "@/store/useReviewStore";
import Image from "next/image";
import {
  Star,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  User,
  Package,
  MessageSquare,
  ImageIcon,
  ShieldCheck,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Helpers ────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(d) {
  if (!d) return "";
  const secs = Math.floor((Date.now() - new Date(d)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return formatDate(d);
}

// ── Star display ───────────────────────────────────────────────
function Stars({ rating, size = "sm" }) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ── Rating badge ───────────────────────────────────────────────
const RATING_STYLE = {
  5: { bg: "#dcfce7", color: "#15803d" },
  4: { bg: "#d1fae5", color: "#16a34a" },
  3: { bg: "#fff3e0", color: "#f57c00" },
  2: { bg: "#fce4ec", color: "#c62828" },
  1: { bg: "#ffebee", color: "#b71c1c" },
};

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ review, onConfirm, onCancel, loading }) {
  if (!review) return null;
  const userName = review.user?.full_name || review.user?.name || "this user";
  const productName = review.product?.name || "this product";

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
              Delete Review?
            </h3>
            <p className="text-sm text-gray-500">
              Review by{" "}
              <span className="font-semibold text-gray-700">{userName}</span> on{" "}
              <span className="font-semibold text-gray-700">{productName}</span>{" "}
              will be permanently removed and the product rating will be
              recalculated.
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

// ── Image lightbox ─────────────────────────────────────────────
function ImgLightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 max-w-lg w-full"
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
            src={src}
            alt="Review image"
            width={600}
            height={500}
            className="w-full object-contain max-h-[70vh]"
          />
        </div>
      </div>
    </div>
  );
}

// ── Review card ────────────────────────────────────────────────
function ReviewCard({ review, onDelete, onApprove, onImgClick }) {
  const [expanded, setExpanded] = useState(false);
  const ratingStyle = RATING_STYLE[review.rating] || RATING_STYLE[3];
  const userName =
    review.user?.full_name || review.user?.name || "Unknown User";
  const userAvatar = review.user?.profile_image || null;
  const userInitial = userName.charAt(0).toUpperCase();
  const productName = review.product?.name || "Unknown Product";
  const productImg = review.product?.images?.[0] || null;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden ${
        review.isApproved ? "border-gray-100" : "border-amber-200"
      }`}
    >
      {/* Pending banner */}
      {!review.isApproved && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            Pending Approval
          </p>
        </div>
      )}

      <div className="p-4">
        {/* ── Top row: user + product + rating ── */}
        <div className="flex items-start gap-3 mb-3">
          {/* User avatar */}
          {userAvatar ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-green-100 shrink-0">
              <Image
                src={userAvatar}
                alt={userName}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: "#dcfce7", color: "#15803d" }}
            >
              {userInitial}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {userName}
              </p>
              {/* Rating badge */}
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg shrink-0"
                style={{ background: ratingStyle.bg, color: ratingStyle.color }}
              >
                <Star className="w-3 h-3 fill-current" />
                {review.rating}
              </span>
            </div>
            <Stars rating={review.rating} size="sm" />
          </div>
        </div>

        {/* Product reference */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          {productImg ? (
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
              <Image
                src={productImg}
                alt={productName}
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5 text-gray-400" />
            </div>
          )}
          <p className="text-xs font-semibold text-gray-600 truncate">
            {productName}
          </p>
        </div>

        {/* Comment */}
        {review.comment ? (
          <div className="mb-3">
            <p
              className={`text-sm text-gray-600 leading-relaxed ${!expanded && review.comment.length > 160 ? "line-clamp-3" : ""}`}
            >
              {review.comment}
            </p>
            {review.comment.length > 160 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-green-600 hover:text-emerald-600 transition-colors mt-1"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic mb-3">
            No written comment
          </p>
        )}

        {/* Review images */}
        {review.images?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {review.images.map((img, i) => (
              <button
                key={i}
                onClick={() => onImgClick(img)}
                className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 hover:border-green-300 hover:scale-105 transition-all"
              >
                <Image
                  src={img}
                  alt=""
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}

        {/* Footer row: date + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(review.createdAt)} · {formatDate(review.createdAt)}
          </p>

          <div className="flex items-center gap-1.5">
            {/* Approve (only if not approved) */}
            {!review.isApproved && (
              <button
                onClick={() => onApprove(review._id)}
                className="inline-flex items-center gap-1 px-2.5 h-7 rounded-xl text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-all"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Approve
              </button>
            )}
            {/* Approved indicator */}
            {review.isApproved && (
              <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-xl text-[11px] font-semibold text-green-700 bg-green-50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved
              </span>
            )}
            {/* Delete */}
            <button
              onClick={() => onDelete(review)}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rating distribution bar ────────────────────────────────────
function RatingBar({ rating, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const style = RATING_STYLE[rating] || RATING_STYLE[3];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-gray-500 w-3 text-right">
        {rating}
      </span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: style.color }}
        />
      </div>
      <span className="text-[11px] text-gray-400 w-5 text-right font-medium">
        {count}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ReviewsPage() {
  const { reviews, loading, fetchAllReviews, approveReview, deleteReview } =
    useReviewStore();

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState(0); // 0 = all
  const [filterStatus, setFilterStatus] = useState("All"); // All | Approved | Pending

  // ── Filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...reviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    if (filterStatus === "Approved") list = list.filter((r) => r.isApproved);
    if (filterStatus === "Pending") list = list.filter((r) => !r.isApproved);
    if (filterRating > 0) list = list.filter((r) => r.rating === filterRating);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) =>
          r.user?.full_name?.toLowerCase().includes(q) ||
          r.user?.name?.toLowerCase().includes(q) ||
          r.product?.name?.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q),
      );
    return list;
  }, [reviews, filterStatus, filterRating, search]);

  // ── Handlers ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteReview(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Stats ──────────────────────────────────────────────────
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((n) => ({
    rating: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const hasFilters = search || filterRating > 0 || filterStatus !== "All";

  return (
    <>
      <DeleteModal
        review={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      <ImgLightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Reviews
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Moderate customer reviews and manage product ratings
            </p>
          </div>
          <button
            onClick={() => fetchAllReviews()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all self-start sm:self-auto"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Stats + Rating distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stat cards */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Reviews",
                value: reviews.length,
                icon: MessageSquare,
                color: "#15803d",
                bg: "#dcfce7",
              },
              {
                label: "Avg Rating",
                value: avgRating,
                icon: Star,
                color: "#f59e0b",
                bg: "#fef3c7",
              },
              {
                label: "Approved",
                value: approvedCount,
                icon: ThumbsUp,
                color: "#16a34a",
                bg: "#d1fae5",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Clock,
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
                  <Icon
                    className={`w-5 h-5 ${label === "Avg Rating" ? "fill-amber-400" : ""}`}
                    style={{ color }}
                  />
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

          {/* Rating distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                Distribution
              </p>
            </div>
            <div className="space-y-2">
              {ratingDist.map(({ rating, count }) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={count}
                  total={reviews.length}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by user, product or comment..."
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

          <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
            {/* Status tabs */}
            {["All", "Approved", "Pending"].map((s) => (
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
                {s === "Pending" && pendingCount > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === s ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}

            {/* Star filter */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-400 font-medium mr-0.5">
                <Filter className="w-3.5 h-3.5" />
              </span>
              {[5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  onClick={() => setFilterRating(filterRating === n ? 0 : n)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    filterRating === n
                      ? "bg-amber-400 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result count + clear filters */}
        {(reviews.length > 0 || hasFilters) && (
          <div className="flex items-center justify-between -mt-2">
            <p className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-700">{filtered.length}</span>{" "}
              of {reviews.length} reviews
            </p>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterRating(0);
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

        {/* ── Loading / empty states ── */}
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
            <p className="text-sm text-gray-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* ── No reviews at all ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              No reviews yet
            </p>
            <p className="text-xs text-gray-400">
              Customer reviews will appear here once they start submitting them.
            </p>
          </div>
        ) : filtered.length === 0 && reviews.length > 0 ? (
          /* ── Filter empty state ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No reviews match your filters
            </p>
            <button
              onClick={() => {
                setSearch("");
                setFilterRating(0);
                setFilterStatus("All");
              }}
              className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : filtered.length > 0 ? (
          /* ── Review grid ── */
          <>
            {/* Pending section first */}
            {filterStatus === "All" &&
              pendingCount > 0 &&
              filtered.some((r) => !r.isApproved) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">
                        {filtered.filter((r) => !r.isApproved).length} Pending
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-amber-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered
                      .filter((r) => !r.isApproved)
                      .map((review) => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                          onDelete={setDeleteTarget}
                          onApprove={approveReview}
                          onImgClick={setLightboxImg}
                        />
                      ))}
                  </div>
                </div>
              )}

            {/* Approved section */}
            {filtered.filter((r) => r.isApproved).length > 0 && (
              <div className="space-y-3">
                {filterStatus === "All" && pendingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-bold text-green-700">
                        {filtered.filter((r) => r.isApproved).length} Approved
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-green-100" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered
                    .filter((r) =>
                      filterStatus === "All" ? r.isApproved : true,
                    )
                    .filter((r) => filterStatus !== "Pending")
                    .map((review) => (
                      <ReviewCard
                        key={review._id}
                        review={review}
                        onDelete={setDeleteTarget}
                        onApprove={approveReview}
                        onImgClick={setLightboxImg}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}