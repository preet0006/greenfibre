"use client";

import { useEffect, useState, useMemo } from "react";
import useContactStore from "@/store/useContactStore";
import {
  Mail,
  Phone,
  MapPin,
  Hash,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  User,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Helpers ────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function fullDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Delete modal ───────────────────────────────────────────────
function DeleteModal({ contact, onConfirm, onCancel, loading }) {
  if (!contact) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-red-50 p-7 w-full max-w-sm">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Delete Contact?
            </h3>
            <p className="text-sm font-semibold text-gray-700">
              {contact.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">{contact.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              This action cannot be undone.
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

// ── Contact row ────────────────────────────────────────────────
function ContactRow({ contact, onDelete, onToggle, expanded, onExpand }) {
  const isNew = contact.status === "new";

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isNew
          ? "border-green-100 shadow-sm shadow-green-50"
          : "border-gray-100 shadow-sm"
      }`}
    >
      {/* ── Summary row ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
        onClick={onExpand}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
          style={{
            background: isNew ? "#dcfce7" : "#f3f4f6",
            color: isNew ? "#15803d" : "#6b7280",
          }}
        >
          {contact.name?.charAt(0)?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "15px",
              }}
            >
              {contact.name}
            </p>
            {isNew && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 shrink-0" />
              {contact.email}
            </span>
          </div>
        </div>

        {/* Message preview */}
        <p className="text-xs text-gray-400 line-clamp-1 flex-1 min-w-0 hidden md:block max-w-xs">
          {contact.message}
        </p>

        {/* Time */}
        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
          {timeAgo(contact.createdAt)}
        </span>

        {/* Status badge */}
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1.5 ${
            isNew ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
          }`}
        >
          {isNew ? (
            <>
              <Clock className="w-3 h-3" />
              Open
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Resolved
            </>
          )}
        </span>

        {/* Expand arrow */}
        <div className="shrink-0 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 py-5">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Contact details */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                Contact Details
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#dcfce7" }}
                  >
                    <User
                      className="w-3.5 h-3.5"
                      style={{ color: "#15803d" }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Name</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {contact.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#d1fae5" }}
                  >
                    <Mail
                      className="w-3.5 h-3.5"
                      style={{ color: "#16a34a" }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Email</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm font-semibold text-gray-800 hover:text-green-600 transition-colors"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#d1fae5" }}
                  >
                    <Phone
                      className="w-3.5 h-3.5"
                      style={{ color: "#059669" }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Phone</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm font-semibold text-gray-800 hover:text-green-600 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#fff3e0" }}
                  >
                    <Calendar
                      className="w-3.5 h-3.5"
                      style={{ color: "#f57c00" }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Submitted</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {fullDate(contact.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">
                Message
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {contact.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 mt-4">
                <a
                  href={`mailto:${contact.email}?subject=Re: Your inquiry to Green Fibre`}
                  className="group inline-flex items-center gap-2 px-4 h-9 rounded-xl text-white text-xs font-semibold relative overflow-hidden shadow-sm shadow-green-200 transition-all duration-200 hover:shadow-green-300 hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg,#15803d,#16a34a 50%,#22c55e)",
                  }}
                >
                  <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <Mail className="w-3.5 h-3.5 relative" />
                  <span className="relative">Reply via Email</span>
                </a>

                <button
                  onClick={() => onToggle(contact._id)}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isNew
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                  }`}
                >
                  {isNew ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Resolved
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Reopen
                    </>
                  )}
                </button>

                <button
                  onClick={() => onDelete(contact)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-all ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function ContactPage() {
  const {
    contacts,
    loading,
    actionLoading,
    fetchContacts,
    toggleContactStatus,
    deleteContact,
  } = useContactStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  // ── Filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchSearch =
        !q ||
        [c.name, c.email, c.phone, c.city, c.message].some((f) =>
          f?.toLowerCase().includes(q),
        );
      const matchStatus =
        filterStatus === "All"
          ? true
          : filterStatus === "Open"
            ? c.status === "new"
            : filterStatus === "Resolved"
              ? c.status === "resolved"
              : true;
      return matchSearch && matchStatus;
    });
  }, [contacts, search, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────
  const totalCount = contacts.length;
  const openCount = contacts.filter((c) => c.status === "new").length;
  const resolvedCount = contacts.filter((c) => c.status === "resolved").length;

  // ── Handlers ──────────────────────────────────────────────
  const handleToggle = (id) => toggleContactStatus(id);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteContact(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    if (expandedId === deleteTarget._id) setExpandedId(null);
  };

  const handleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <>
      <DeleteModal
        contact={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Contact Inquiries
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Customer messages submitted from the website
            </p>
          </div>
          <button
            onClick={() => fetchContacts()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all self-start sm:self-auto"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total",
              value: totalCount,
              icon: MessageSquare,
              color: "#15803d",
              bg: "#dcfce7",
              onClick: () => setFilterStatus("All"),
            },
            {
              label: "Open",
              value: openCount,
              icon: Clock,
              color: "#d97706",
              bg: "#fffbeb",
              onClick: () => setFilterStatus("Open"),
            },
            {
              label: "Resolved",
              value: resolvedCount,
              icon: CheckCircle2,
              color: "#16a34a",
              bg: "#f0fdf4",
              onClick: () => setFilterStatus("Resolved"),
            },
          ].map(({ label, value, icon: Icon, color, bg, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`bg-white rounded-2xl px-5 py-4 border shadow-sm flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full ${
                filterStatus === label ||
                (label === "Total" && filterStatus === "All")
                  ? "border-green-200 shadow-green-50"
                  : "border-gray-100"
              }`}
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
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search by name, email, phone, city or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1.5">
            {["All", "Open", "Resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 h-10 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === s
                    ? "text-white shadow-sm"
                    : "text-gray-500 bg-white border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                }`}
                style={
                  filterStatus === s
                    ? { background: "linear-gradient(135deg,#15803d,#22c55e)" }
                    : {}
                }
              >
                {s}
                {s === "Open" && openCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-white/25 rounded-full px-1.5 py-0.5">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contact list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
              style={{ background: "linear-gradient(135deg,#15803d,#22c55e)" }}
            >
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Loading contacts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search || filterStatus !== "All"
                ? "No contacts match your filters"
                : "No contacts yet"}
            </p>
            {(search || filterStatus !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                }}
                className="text-xs text-green-600 hover:text-emerald-600 font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Result count */}
            <p className="text-xs text-gray-400 font-medium px-1">
              {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
              {(search || filterStatus !== "All") && " · filtered"}
            </p>

            {filtered.map((contact) => (
              <ContactRow
                key={contact._id}
                contact={contact}
                expanded={expandedId === contact._id}
                onExpand={() => handleExpand(contact._id)}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}