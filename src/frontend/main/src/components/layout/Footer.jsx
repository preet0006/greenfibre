"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import usePageSettingsStore from "@/store/usePageSettingsStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Leaf,
  Recycle,
  Heart,
  ChevronDown,
} from "lucide-react";

// ── Social SVG icons (inline — no lucide dependency) ──────────
const SvgFacebook = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);
const SvgInstagram = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const SvgTwitter = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const SvgYoutube = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const SvgPinterest = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const SOCIAL_ICONS = {
  facebook: { icon: SvgFacebook, label: "Facebook" },
  instagram: { icon: SvgInstagram, label: "Instagram" },
  twitter: { icon: SvgTwitter, label: "X" },
  x: { icon: SvgTwitter, label: "X" },
  youtube: { icon: SvgYoutube, label: "YouTube" },
  pinterest: { icon: SvgPinterest, label: "Pinterest" },
};

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Mission", href: "/sustainability" },
  { label: "Contact Us", href: "/contact" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blogs", href: "/blogs" },
  { label: "Track Order", href: "/orders" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

function FooterHeading({ children }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-900 sm:mb-6">
      {children}
    </p>
  );
}

function FooterLink({ href, children, external = false }) {
  return (
    <li>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-xs sm:text-sm text-gray-600 transition-colors duration-200 hover:text-green-600"
      >
        {children}
        {external && (
          <ExternalLink className="inline h-3 w-3 ml-1 opacity-50" />
        )}
      </Link>
    </li>
  );
}

export default function Footer() {
  const settings = usePageSettingsStore((s) => s.settings);
  const loading = usePageSettingsStore((s) => s.loading);
  const fetchPageSettings = usePageSettingsStore((s) => s.fetchPageSettings);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  const [mobileOpen, setMobileOpen] = useState({
    shop: true,
    company: false,
    legal: false,
  });

  const toggleSection = (section) => {
    setMobileOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    fetchPageSettings();
    fetchCategories();
  }, []);

  // Default social links if settings not yet loaded or empty
  const defaultSocials = {
    facebook: "https://www.facebook.com/profile.php?id=100064103706224",
    instagram: "https://www.instagram.com/greenfibre_4?dlrf=Y2Rxdzc2cHNqNmdz",
    twitter: "https://x.com/greenfibre01",
  };

  const socialSource =
    settings.socialLinks && Object.values(settings.socialLinks).some(Boolean)
      ? settings.socialLinks
      : defaultSocials;

  // Collect active social links (excluding linkedin)
  const activeSocials = Object.entries(socialSource).filter(
    ([platform, url]) => platform !== "linkedin" && url?.trim(),
  );

  const primaryEmail = settings.emails?.[0] || "info@greenfibre.org";
  const primaryPhone = settings.phoneNumbers?.[0] || "+91 9217328777";
  const secondaryPhone = settings.phoneNumbers?.[1] || "+91 9217988874";

  return (
    <footer className="relative mt-auto bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* ── Brand column ── */}
          <div className="space-y-4 sm:space-y-5 lg:col-span-5">
            <Link href="/" className="inline-block group">
              {/* Logo */}
              <div className="relative h-12 w-36 sm:h-20 sm:w-44 lg:h-32 lg:w-44">
                <Image
                  src="/greenfiber-logo.png"
                  alt="Green Fibre"
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 640px) 144px, 176px"
                />
              </div>
            </Link>

            {/* Description */}
            {settings.footerDescription ? (
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600 max-w-md">
                {settings.footerDescription}
              </p>
            ) : (
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600 max-w-md">
                Eco-friendly products engineered by blending agricultural rice husk with durable polymers.
                High-strength, food-safe, and sustainable essentials for conscious living.
              </p>
            )}

            {/* Contact details */}
            <div className="space-y-2.5 sm:space-y-3">
              {primaryEmail && (
                <a
                  href={`mailto:${primaryEmail}`}
                  className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors group"
                >
                  <Mail className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="break-all">{primaryEmail}</span>
                </a>
              )}
              {primaryPhone && (
                <a
                  href={`tel:${primaryPhone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors group"
                >
                  <Phone className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{primaryPhone}{secondaryPhone ? ` / ${secondaryPhone}` : ""}</span>
                </a>
              )}
              <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  Plot no: 334, Udyog Kendra 2, Ecotech III, Greater Noida, Uttar Pradesh 201306
                </span>
              </div>
            </div>

            {/* Social icons */}
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                {activeSocials.map(([platform, url]) => {
                  const meta = SOCIAL_ICONS[platform];
                  if (!meta) return null;
                  const { icon: Icon } = meta;
                  return (
                    <motion.a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:border-green-600 hover:text-green-600 hover:bg-green-50"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Mobile Accordion Navigation (sm:hidden) ── */}
          <div className="divide-y divide-gray-100 sm:hidden">
            {/* Shop Section */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleSection("shop")}
                className="flex w-full items-center justify-between py-1 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Shop
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    mobileOpen.shop ? "rotate-180 text-green-600" : ""
                  }`}
                />
              </button>
              {mobileOpen.shop && (
                <ul className="mt-3 space-y-2.5 pl-1">
                  <FooterLink href="/shop">All Products</FooterLink>
                  {categories
                    ?.filter((category) => category.isActive)
                    ?.map((category) => (
                      <FooterLink
                        key={category._id}
                        href={`/shop?category=${category.slug}`}
                      >
                        {category.name}
                      </FooterLink>
                    ))}
                </ul>
              )}
            </div>

            {/* Company Section */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleSection("company")}
                className="flex w-full items-center justify-between py-1 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Company
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    mobileOpen.company ? "rotate-180 text-green-600" : ""
                  }`}
                />
              </button>
              {mobileOpen.company && (
                <ul className="mt-3 space-y-2.5 pl-1">
                  {COMPANY_LINKS.map(({ label, href }) => (
                    <FooterLink key={label} href={href}>
                      {label}
                    </FooterLink>
                  ))}
                </ul>
              )}
            </div>

            {/* Legal Section */}
            <div className="py-3">
              <button
                type="button"
                onClick={() => toggleSection("legal")}
                className="flex w-full items-center justify-between py-1 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Legal
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    mobileOpen.legal ? "rotate-180 text-green-600" : ""
                  }`}
                />
              </button>
              {mobileOpen.legal && (
                <ul className="mt-3 space-y-2.5 pl-1">
                  {LEGAL_LINKS.map(({ label, href }) => (
                    <FooterLink key={label} href={href}>
                      {label}
                    </FooterLink>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Desktop Links columns (hidden sm:grid) ── */}
          <div className="hidden sm:grid sm:grid-cols-3 sm:gap-12 lg:col-span-7 lg:gap-16">
            {/* Shop */}
            <div>
              <FooterHeading>Shop</FooterHeading>
              <ul className="space-y-3">
                <FooterLink href="/shop">All Products</FooterLink>
                {categories
                  ?.filter((category) => category.isActive)
                  ?.map((category) => (
                    <FooterLink
                      key={category._id}
                      href={`/shop?category=${category.slug}`}
                    >
                      {category.name}
                    </FooterLink>
                  ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <FooterHeading>Company</FooterHeading>
              <ul className="space-y-3">
                {COMPANY_LINKS.map(({ label, href }) => (
                  <FooterLink key={label} href={href}>
                    {label}
                  </FooterLink>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <FooterHeading>Legal</FooterHeading>
              <ul className="space-y-3">
                {LEGAL_LINKS.map(({ label, href }) => (
                  <FooterLink key={label} href={href}>
                    {label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Eco badges ── */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-10 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="font-medium">100% Sustainable</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Recycle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="font-medium">Carbon Neutral</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="font-medium">Earth Friendly</span>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 pb-16 sm:pb-0">
          <div className="flex flex-col items-center justify-between gap-2 sm:gap-4 sm:flex-row text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">
              © {new Date().getFullYear()}{" "}
              {settings.companyName || "Green Fibre"}. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Powered by{" "}
              <span className="font-medium text-gray-700">
                Charvik Moulds and Products Private Limited
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
