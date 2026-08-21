import ShopPageClient from "@/components/shop/ShopPageClient";

const SITE_URL = "https://greenfibre.org";
const SITE_NAME = "Green Fibre";
const PAGE_TITLE = "Shop Sustainable Products | Green Fibre";
const PAGE_DESCRIPTION =
  "Shop eco-friendly products for sustainable living, including natural fibre essentials, reusable solutions, zero-waste goods, and garden care from Green Fibre.";

export const metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "sustainable products",
    "eco-friendly products",
    "zero waste products",
    "natural fibre products",
    "reusable products",
    "sustainable shopping India",
  ],
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/shop`,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: `${SITE_URL}/og-shop.jpg`,
        width: 1200,
        height: 630,
        alt: "Green Fibre sustainable products shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${SITE_URL}/og-shop.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/shop#webpage`,
  url: `${SITE_URL}/shop`,
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  inLanguage: "en-IN",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
};

export default function ShopPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopPageClient />
    </>
  );
}
