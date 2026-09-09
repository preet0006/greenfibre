import SustainabilityPage from "@/components/home/Sustainability";
const SITE_URL = "https://greenfibre.org";
const SITE_NAME = "Green Fibre";



export const metadata = {
  title: "Our Sustainability Impact | Green Fibre – Building a Greener Future",
  description:
    "Green Fibre has planted 250,000+ trees, eliminated plastic packaging, offset 10,000 tons of CO₂ annually, and saved 50M+ litres of water. Every order plants a tree. Shop sustainably.",
  keywords:
    "sustainability, eco-friendly, tree planting, carbon neutral, zero waste packaging, plastic free, water conservation, circular economy, ethical trade, sustainable living India",
  alternates: {
    canonical: `${SITE_URL}/sustainability`,
  },
  openGraph: {
    title: "Our Sustainability Impact | Green Fibre",
    description:
      "250,000+ trees planted, 100% recyclable packaging, carbon-neutral operations, and 50M+ litres of water saved. Every Green Fibre order makes a real difference.",
    url: `${SITE_URL}/sustainability`,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: `${SITE_URL}/og-sustainability.jpg`, // TODO: replace with real OG image
        width: 1200,
        height: 630,
        alt: "Green Fibre Sustainability Impact – Building a Greener Future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Sustainability Impact | Green Fibre",
    description:
      "250,000+ trees planted, 100% recyclable packaging, carbon-neutral operations, and 50M+ litres of water saved. Every Green Fibre order makes a real difference.",
    images: [`${SITE_URL}/og-sustainability.jpg`], // TODO: replace with real OG image
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = [
  // 1. WebPage — typed as a general informational page.
  //    No specific schema.org type exists for "sustainability page"
  //    so WebPage is the correct, honest choice here.
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/sustainability#webpage`,
    url: `${SITE_URL}/sustainability`,
    name: "Our Sustainability Impact | Green Fibre – Building a Greener Future",
    description:
      "Green Fibre has planted 250,000+ trees, eliminated plastic packaging, offset 10,000 tons of CO₂ annually, and saved 50M+ litres of water. Every order plants a tree.",
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

  // 2. BreadcrumbList — Home → Sustainability
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
        name: "Sustainability",
        item: `${SITE_URL}/sustainability`,
      },
    ],
  },

  // 3. ItemList — your sustainability initiatives as structured list items.
  //    Helps Google understand and potentially surface individual
  //    program details in rich results or AI overviews.
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Green Fibre Sustainability Initiatives",
    description:
      "Comprehensive programs driving real environmental impact at Green Fibre.",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Reforestation Program",
        description:
          "For every order placed, we plant one tree in partnership with environmental organisations across India. Goal: 1 million trees by 2025. 250,000 trees planted since 2020.",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Zero-Waste Packaging",
        description:
          "All packaging is made from 100% recycled and biodegradable materials. Plastic completely eliminated. Plant-based inks used for printing. 500+ tons of plastic avoided.",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Carbon-Neutral Delivery",
        description:
          "We partner with eco-conscious courier services and offset 100% of carbon emissions from shipping through verified carbon credit programs. 10,000 tons CO₂ offset annually.",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Water Conservation",
        description:
          "Products sourced from manufacturers using water-efficient processes and water recycling systems. 50M+ litres of water saved.",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Circular Economy",
        description:
          "Product returns encouraged for recycling and upcycling. Items that cannot be resold are broken down and repurposed responsibly. 95% waste diversion rate.",
      },
    ],
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function Sustainability() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

     <SustainabilityPage/>
    </>
  );
}