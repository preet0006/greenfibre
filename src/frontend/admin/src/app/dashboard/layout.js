"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useUserStore from "@/store/useUserStore";
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Ticket,
  Image as ImageIcon,
  Tag,
  Video,
  Star,
  Boxes,
  MapPin,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  Loader2,
  MessageCircle,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutGrid }],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Products", href: "/dashboard/products", icon: Package },
      { label: "Categories", href: "/dashboard/categories", icon: LayoutGrid },
      // { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
      { label: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
      { label: "Coupons", href: "/dashboard/coupons", icon: Ticket },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Users", href: "/dashboard/users", icon: Users },
      { label: "Reviews", href: "/dashboard/reviews", icon: Star },
      { label: "Contact", href: "/dashboard/contact", icon: MessageCircle },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blog", href: "/dashboard/blog", icon: FileText },
      { label: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
      { label: "Banners", href: "/dashboard/banners", icon: Tag },
      // { label: "Shop Video", href: "/dashboard/shop-video", icon: Video },
      {
        label: "Page Settings",
        href: "/dashboard/page-settings",
        icon: Settings,
      },
    ],
  },
];

export default function DashboardLayout({ children }) {
  const { admin, fetchAdminProfile, logoutAdmin } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [indiaTime, setIndiaTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeString = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      setIndiaTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ── Auth check ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await fetchAdminProfile();
      setChecking(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!checking && admin === null) router.replace("/login");
  }, [admin, checking]);

  // ── Close sidebar on route change (mobile) ──────────────
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ── Close sidebar on outside click ──────────────────────
  useEffect(() => {
    const close = (e) => {
      if (
        sidebarOpen &&
        !e.target.closest("#tb-sidebar") &&
        !e.target.closest("#tb-hamburger")
      )
        setSidebarOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sidebarOpen]);

  // ── Loading / auth guard ─────────────────────────────────
  if (checking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f7faf9] gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200"
          style={{ background: "linear-gradient(135deg, #15803d, #22c55e)" }}
        >
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm text-gray-400 tracking-wide">
          Verifying session...
        </p>
      </div>
    );
  }

  if (!admin) return null;

  const handleLogout = () => logoutAdmin(router);

  // ── Dynamic page title ───────────────────────────────────
  const currentNav = NAV_GROUPS.flatMap((g) => g.items).find(
    (n) => n.href === pathname,
  );
  const pageTitle = currentNav?.label || "Dashboard";

  return (
    <div
      className="h-screen flex overflow-hidden bg-[#f7faf9]"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ═══════════════════════════════════
          SIDEBAR
          — mobile: fixed drawer
          — desktop: sticky, fills viewport height, scrolls internally
      ═══════════════════════════════════ */}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="tb-sidebar"
        className={`
          fixed inset-y-0 left-0 z-40 w-62 bg-white
          flex flex-col border-r border-green-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0 shadow-2xl shadow-green-100/60" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none lg:h-screen lg:shrink-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-green-50/80 flex items-center justify-between shrink-0">
          <Image
            src="/logo.jpg"
            alt="Green Fibre"
            width={126}
            height={40}
            className="object-contain"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable nav — takes all available space between logo and footer */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 min-h-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 group
                        ${
                          active
                            ? "text-white shadow-md shadow-green-300/40"
                            : "text-gray-500 hover:text-gray-800 hover:bg-green-50/80"
                        }
                      `}
                      style={
                        active
                          ? {
                              background:
                                "linear-gradient(135deg, #15803d, #22c55e)",
                            }
                          : {}
                      }
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : ""}`}
                      />
                      <span className="truncate">{label}</span>
                      {active && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: settings + logout + admin card — always pinned at bottom */}
        <div className="shrink-0 border-t border-green-50/80">
          <div className="px-3 py-2 space-y-0.5">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-green-50/80 transition-all"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* Admin info card */}
          <div className="mx-3 mb-3 p-3 rounded-2xl border border-green-100 bg-linear-to-br from-green-50 to-emerald-50">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-green-200 shrink-0"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                {admin?.full_name?.charAt(0)?.toUpperCase() ||
                  admin?.name?.charAt(0)?.toUpperCase() ||
                  "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-none truncate">
                  {admin?.full_name || admin?.name || "Admin"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {admin?.email || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════
          MAIN AREA
          — flex column, fills remaining width
          — scrolls independently of sidebar
      ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Sticky topbar ── */}
        <header className="shrink-0 sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-green-50 px-5 lg:px-7 h-15 flex items-center justify-between shadow-sm shadow-green-50/60">
          <div className="flex items-center gap-3">
            <button
              id="tb-hamburger"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-none">
                {pageTitle}
              </h1>
              <p className="text-[12px] text-gray-400 mt-0.5 hidden sm:flex items-center gap-2">
                {new Intl.DateTimeFormat("en-IN", {
                  timeZone: "Asia/Kolkata",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}

                <span className="text-green-600 font-medium">
                  • {indiaTime}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile avatar */}
            <div className="lg:hidden flex items-center gap-2 pl-2 border-l border-gray-100">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-green-200"
                style={{
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                {admin?.full_name?.charAt(0)?.toUpperCase() ||
                  admin?.name?.charAt(0)?.toUpperCase() ||
                  "A"}
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">{children}</main>

        {/* ── Footer ── */}
        <footer className="shrink-0 border-t border-green-50 bg-white px-5 lg:px-7 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <p className="text-[11px] text-gray-400">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-gray-600">Green Fibre</span> ·
              All rights reserved.
            </p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              Designed &amp; Developed by{" "}
              <a
                href="https://aleczo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-transparent bg-clip-text hover:opacity-80 transition-opacity duration-200"
                style={{
                  backgroundImage: "linear-gradient(135deg, #15803d, #22c55e)",
                }}
              >
                Aleczo Media Pvt. Ltd.
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}