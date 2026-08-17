import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/layout/FloatingButtons";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "Green Fibre – Sustainability, Simplified",
    template: "%s | Green Fibre",
  },
  metadataBase: new URL("https://www.greenfibre.org"),
  description:
    "Green Fibre brings you eco-friendly products for sustainable living — organic home essentials, natural fibre products, reusable solutions, and garden care. Choose green, live clean.",
  keywords: [
    "Green Fibre",
    "sustainable products",
    "eco-friendly",
    "organic home essentials",
    "natural fibre",
    "zero waste",
    "reusable products",
    "biodegradable",
    "carbon neutral",
    "sustainable living",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Green Fibre – Sustainability, Simplified",
    description:
      "Eco-friendly products for conscious living. Sustainable, natural, and kind to the planet.",
    type: "website",
    url: "https://www.greenfibre.org",
    siteName: "Green Fibre",
    images: [
      {
        url: "/greenfiber-logo.png",
        width: 1200,
        height: 630,
        alt: "Green Fibre",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Fibre – Sustainability, Simplified",
    description:
      "Eco-friendly products for conscious living. Sustainable, natural, and kind to the planet.",
    images: ["/greenfiber-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-white text-gray-900"
        style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
      >
        {/* Subtle organic texture overlay for natural depth */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Top eco accent line - natural green gradient */}
        <div
          className="fixed top-0 left-0 right-0 z-60 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #15803d 20%, #16a34a 40%, #22c55e 50%, #16a34a 60%, #15803d 80%, transparent 100%)",
          }}
        />

        <Navbar />

        {/* Main content area */}
        <main className="relative z-10 flex-1 pt-[136px] md:pt-[144px]">
          {children}
        </main>

        <Footer />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#ffffff",
              color: "#1f2937",
              border: "1px solid rgba(21, 128, 61, 0.15)",
              borderRadius: "16px",
              fontSize: "14px",
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontWeight: "500",
              padding: "14px 18px",
              boxShadow:
                "0 10px 40px rgba(21, 128, 61, 0.08), 0 4px 12px rgba(21, 128, 61, 0.04)",
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "#ffffff" },
              style: {
                borderLeft: "4px solid #16a34a",
                background:
                  "linear-gradient(to right, #f0fdf4 0%, #ffffff 100%)",
              },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
              style: {
                borderLeft: "4px solid #dc2626",
                background:
                  "linear-gradient(to right, #fef2f2 0%, #ffffff 100%)",
              },
            },
            loading: {
              iconTheme: { primary: "#15803d", secondary: "#dcfce7" },
              style: {
                borderLeft: "4px solid #15803d",
              },
            },
          }}
        />
        <FloatingButtons />
      </body>
    </html>
  );
}
