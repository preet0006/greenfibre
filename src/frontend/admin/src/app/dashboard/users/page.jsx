"use client";

import { useEffect, useState, useMemo } from "react";
import useUserStore from "@/store/useUserStore";
import {
  Users,
  Search,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  UserX,
  MoreVertical,
  RefreshCw,
  ShieldPlus,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  CheckCircle2,
  XCircle,
  Crown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const PAGE_SIZE = 10;

// ── Avatar color by first letter ──────────────────────────────
const AVATAR_COLORS = [
  ["#dcfce7", "#15803d"],
  ["#d1fae5", "#16a34a"],
  ["#e0f2fe", "#0284c7"],
  ["#d1fae5", "#059669"],
  ["#fff3e0", "#e65100"],
  ["#dcfce7", "#166534"],
  ["#e0f7fa", "#00838f"],
  ["#dcfce7", "#14532d"],
];
function getAvatarColor(str = "") {
  const i = (str.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Delete confirm modal ──────────────────────────────────────
function DeleteModal({ user, onConfirm, onCancel, loading }) {
  if (!user) return null;
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
            Delete User?
          </h3>
          <p className="text-sm text-gray-400 mb-1">
            You&apos;re about to permanently delete
          </p>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {user.full_name || user.email}
          </p>
          <p className="text-xs text-gray-400 mb-5">{user.email}</p>

          {user.role === "admin" && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-5 w-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              This user is an admin account.
            </div>
          )}

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

// ── Create Admin Modal ────────────────────────────────────────
function CreateAdminModal({ onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ full_name: "", email: "" });
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-green-100/60 border border-green-50 p-7 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-green-200"
            style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-gray-900 leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Create Admin
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add a new admin account
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-5 mt-4">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            A secure password will be auto-generated and emailed to the admin
            along with login credentials.
          </span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
              Full Name
            </Label>
            <Input
              name="full_name"
              placeholder="Admin Full Name"
              value={form.full_name}
              onChange={handle}
              required
              className="h-11 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-gray-600 text-xs tracking-widest uppercase font-medium">
              Email Address
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="admin@greenfibre.com"
              value={form.email}
              onChange={handle}
              required
              className="h-11 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-green-400/30 focus-visible:border-green-500 transition-all hover:border-green-300"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="group w-full h-11 rounded-xl text-white text-sm font-semibold tracking-wide relative overflow-hidden shadow-lg shadow-green-200 transition-all duration-300 hover:shadow-green-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
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
                    <ShieldPlus className="w-4 h-4" />
                    Create Admin & Send Credentials
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Detail Drawer ────────────────────────────────────────
function UserDrawer({ user, onClose, onDelete }) {
  if (!user) return null;
  const [avatarBg, avatarColor] = getAvatarColor(user.full_name || user.email);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl shadow-green-100/60 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-gray-400 tracking-widest uppercase font-medium">
              User Details
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center text-center">
            {user.profile_image.original ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-green-100 shadow-lg mb-3">
                <Image
                  src={
                    user.profile_image?.original ||
                    user.profile_image
                  }
                  alt={user.full_name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg mb-3"
                style={{ background: avatarBg, color: avatarColor }}
              >
                {(user.full_name || user.email)?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {user.full_name || "—"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  user.role === "admin"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.role === "admin" ? (
                  <Crown className="w-3 h-3" />
                ) : (
                  <User className="w-3 h-3" />
                )}
                {user.role === "admin" ? "Admin" : "User"}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  user.isVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {user.isVerified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Unverified
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Info list */}
        <div className="px-6 py-5 space-y-4 flex-1">
          {[
            { label: "User ID", value: user._id, icon: ShieldCheck },
            { label: "Email", value: user.email, icon: Mail },
            { label: "Phone", value: user.phone || "—", icon: Phone },
            {
              label: "Joined",
              value: formatDate(user.createdAt),
              icon: Calendar,
            },
            {
              label: "Updated",
              value: formatDate(user.updatedAt),
              icon: Calendar,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-50">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                  {label}
                </p>
                <p className="text-sm text-gray-700 font-medium break-all mt-0.5">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer action */}
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              onDelete(user);
              onClose();
            }}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all border border-red-100"
          >
            <Trash2 className="w-4 h-4" /> Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "user", label: "Customers" },
  { key: "admin", label: "Admins" },
  { key: "verified", label: "Verified" },
  { key: "unverified", label: "Unverified" },
];

// ── Main Page ─────────────────────────────────────────────────
export default function UsersPage() {
  const { users, userLoading, loading, fetchUsers, deleteUser, createAdmin } =
    useUserStore();

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close action menu on outside click
  useEffect(() => {
    const close = () => setOpenMenu(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ── Filter + search ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...users];

    // Tab filter
    if (filterTab === "user") list = list.filter((u) => u.role === "user");
    else if (filterTab === "admin")
      list = list.filter((u) => u.role === "admin");
    else if (filterTab === "verified") list = list.filter((u) => u.isVerified);
    else if (filterTab === "unverified")
      list = list.filter((u) => !u.isVerified);

    // Search
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [users, search, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [search, filterTab]);

  // ── Handlers ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteUser(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleCreateAdmin = async (formData) => {
    await createAdmin(formData);
    setShowCreate(false);
    fetchUsers();
  };

  // ── Stats ─────────────────────────────────────────────────
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const newThisMonth = users.filter((u) => {
    if (!u.createdAt) return false;
    const d = new Date(u.createdAt),
      now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <>
      {/* Modals */}
      <DeleteModal
        user={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateAdmin}
          loading={loading}
        />
      )}
      <UserDrawer
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onDelete={(u) => setDeleteTarget(u)}
      />

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              User Management
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage all registered customers and admin accounts
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchUsers()}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${userLoading ? "animate-spin" : ""}`}
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
              <ShieldPlus className="w-4 h-4 relative" />
              <span className="relative">Create Admin</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Users",
              value: totalCount,
              icon: Users,
              color: "#15803d",
              bg: "#dcfce7",
            },
            {
              label: "Admins",
              value: adminCount,
              icon: Crown,
              color: "#16a34a",
              bg: "#d1fae5",
            },
            {
              label: "Verified",
              value: verifiedCount,
              icon: CheckCircle2,
              color: "#059669",
              bg: "#d1fae5",
            },
            {
              label: "New This Month",
              value: newThisMonth,
              icon: User,
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

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-50 space-y-3">
            {/* Search + result count */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search by name, email or phone..."
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
              <p className="text-xs text-gray-400 sm:ml-auto font-medium whitespace-nowrap">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTER_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterTab(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    filterTab === key
                      ? "text-white shadow-sm shadow-green-200"
                      : "text-gray-500 bg-gray-100 hover:bg-green-50 hover:text-green-600"
                  }`}
                  style={
                    filterTab === key
                      ? {
                          background:
                            "linear-gradient(135deg, #15803d, #22c55e)",
                        }
                      : {}
                  }
                >
                  {label}
                  {key === "all" && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filterTab === key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}
                    >
                      {users.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Loading state ── */}
          {userLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-green-200"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <p className="text-sm text-gray-400">Loading users...</p>
            </div>
          ) : paginated.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
                <UserX className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {search ? "No users match your search" : "No users found"}
              </p>
              {(search || filterTab !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterTab("all");
                  }}
                  className="text-xs text-green-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {[
                        "User",
                        "Email",
                        "Phone",
                        "Role",
                        "Status",
                        "Joined",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 tracking-widest uppercase whitespace-nowrap first:pl-6 last:pr-6"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/80">
                    {paginated.map((user) => {
                      const [avatarBg, avatarColor] = getAvatarColor(
                        user.full_name || user.email,
                      );
                      return (
                        <tr
                          key={user._id}
                          className="hover:bg-green-50/20 transition-colors group"
                        >
                          {/* User */}
                          <td className="pl-6 pr-5 py-3.5">
                            <button
                              onClick={() => setDrawerUser(user)}
                              className="flex items-center gap-3 text-left group/row"
                            >
                              {user.profile_image?.thumbnail ? (
                                <div className="w-9 h-9 rounded-xl overflow-hidden border border-green-100 shrink-0">
                                  <Image
                                    src={user.profile_image.thumbnail}
                                    alt={user.full_name}
                                    width={36}
                                    height={36}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                                  style={{
                                    background: avatarBg,
                                    color: avatarColor,
                                  }}
                                >
                                  {(user.full_name || user.email)
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 leading-none truncate max-w-35 group-hover/row:text-green-700 transition-colors">
                                  {user.full_name || "—"}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                  {user._id?.slice(-8)}
                                </p>
                              </div>
                            </button>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-45 text-sm">
                                {user.email || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="text-sm">
                                {user.phone || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                user.role === "admin"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {user.role === "admin" ? (
                                <>
                                  <Crown className="w-3 h-3" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3" />
                                  User
                                </>
                              )}
                            </span>
                          </td>

                          {/* Verified */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                user.isVerified
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-500"
                              }`}
                            >
                              {user.isVerified ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Verified
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Unverified
                                </>
                              )}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="text-sm whitespace-nowrap">
                                {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="pl-5 pr-6 py-3.5">
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list ── */}
              <div className="md:hidden divide-y divide-gray-50">
                {paginated.map((user) => {
                  const [avatarBg, avatarColor] = getAvatarColor(
                    user.full_name || user.email,
                  );
                  const menuOpen = openMenu === user._id;
                  return (
                    <div
                      key={user._id}
                      className="px-5 py-4 flex items-center gap-3 hover:bg-green-50/30 transition-colors"
                    >
                      {/* Avatar */}
                      {user.profile_image ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-green-100 shrink-0">
                          <Image
                            src={user.profile_image.original}
                            alt={user.full_name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: avatarBg, color: avatarColor }}
                        >
                          {(user.full_name || user.email)
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => setDrawerUser(user)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {user.full_name || "—"}
                          </p>
                          {user.role === "admin" && (
                            <Crown className="w-3 h-3 text-green-600 shrink-0" />
                          )}
                          {user.isVerified ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(user.createdAt)}
                        </p>
                      </button>

                      {/* 3-dot menu */}
                      <div className="relative shrink-0">
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setOpenMenu(menuOpen ? null : user._id);
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                            <button
                              onClick={() => {
                                setDrawerUser(user);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget(user);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!userLoading && filtered.length > PAGE_SIZE && (
            <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-400">
                Page <span className="font-semibold text-gray-700">{page}</span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {totalPages}
                </span>
                {" · "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                users
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                  )
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`e-${idx}`}
                        className="w-8 text-center text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                          page === item
                            ? "text-white shadow-md shadow-green-200"
                            : "border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        }`}
                        style={
                          page === item
                            ? {
                                background:
                                  "linear-gradient(135deg, #15803d, #22c55e)",
                              }
                            : {}
                        }
                      >
                        {item}
                      </button>
                    ),
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}