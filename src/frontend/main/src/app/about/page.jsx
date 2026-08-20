import About from "@/components/home/AboutUsClient";

// This runs on the server at request/build time — fetches SEO fields
// (title, description, keywords, og image, etc.) from your backend
// for this specific page, then feeds them into Next.js's metadata system.
// ─── Replace all TODO comments with your real data ───────────────────────────

const SITE_URL = "https://greenfibre.org";
const SITE_NAME = "Green Fibre";

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata = {
  title: "About Us | Green Fibre – Eco-Friendly Products for Sustainable Living",
  description:
    "Learn about Green Fibre's mission to make sustainable living accessible to everyone — organic home essentials, natural fibre products, reusable solutions, and garden care.",
  keywords:
    "sustainable living, eco-friendly products, organic home essentials, natural fibre, green products, reusable solutions, garden care, carbon neutral, plastic free",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About Us | Green Fibre – Sustainability, Simplified",
    description:
      "Learn about Green Fibre's mission to make sustainable living accessible to everyone — organic home essentials, natural fibre products, reusable solutions, and garden care.",
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: `${SITE_URL}/og-about.jpg`, // TODO: replace with real OG image path
        width: 1200,
        height: 630,
        alt: "About Green Fibre – Sustainability, Simplified",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Green Fibre – Sustainability, Simplified",
    description:
      "Learn about Green Fibre's mission to make sustainable living accessible to everyone — organic home essentials, natural fibre products, reusable solutions, and garden care.",
    images: [`${SITE_URL}/og-about.jpg`], // TODO: replace with real OG image path
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ─── JSON-LD schemas ──────────────────────────────────────────────────────────

const jsonLd = [
  // 1. Organization — your brand entity, anchored by @id
  //    Google uses this to build a knowledge panel for Green Fibre.
  //    Only declare the full block here + homepage. All other pages reference @id only.
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`, // TODO: replace with real logo path
      width: 200,
      height: 60,
    },
    description:
      "Green Fibre brings eco-friendly products for sustainable living — organic home essentials, natural fibre products, reusable solutions, and garden care. Carbon-neutral delivery and plastic-free packaging.",
    foundingDate: "2020", // TODO: replace with real founding year
    founder: {
      "@type": "Person",
      name: "Green Fibre Founder", // TODO: replace with real founder name
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai", // TODO: replace with real city
      addressRegion: "Maharashtra", // TODO: replace with real state
      addressCountry: "IN",
    },
    areaServed: "IN",
    email: "support@greenfibre.org", // TODO: replace with real support email
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@greenfibre.org", // TODO: replace with real support email
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://www.instagram.com/greenfibre", // TODO: replace with real Instagram URL
      "https://www.facebook.com/greenfibre",  // TODO: replace with real Facebook URL
      // "https://twitter.com/greenfibre",    // TODO: uncomment + replace if you have Twitter/X
      // "https://www.linkedin.com/company/greenfibre", // TODO: uncomment + replace if LinkedIn
    ],
  },

  // 2. AboutPage — declares this specific URL as the about page entity,
  //    linked to the Organization above via @id (no address duplication).
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: "About Us | Green Fibre – Sustainability, Simplified",
    description:
      "Learn about Green Fibre's mission to make sustainable living accessible to everyone — from organic home essentials and natural fibre products to carbon-neutral delivery and reforestation programs.",
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
  },

  // 3. BreadcrumbList — Home → About Us
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About Us",
        item: `${SITE_URL}/about`,
      },
    ],
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* Inject all JSON-LD schemas as a single <script> tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

    <About/>
    </>
  );
}