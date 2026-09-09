import ShopPageClient from "@/components/home/ShopPageClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
const SITE_NAME = "YourStoreName";

const ALLOWED_PARAMS = [
  "category",
  "subCategory",
  "minPrice",
  "maxPrice",
  "isFeatured",
  "inStock",
  "sort",
  "page",
];

async function getProducts(sp) {
  try {
    const params = new URLSearchParams();
    ALLOWED_PARAMS.forEach((key) => {
      const val = sp?.[key];
      if (val) params.set(key, val);
    });

    const res = await fetch(`${API_URL}/product?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { products: [], pagination: null };

    const data = await res.json();
    return { products: data.products || [], pagination: data.pagination || null };
  } catch (err) {
    console.error("SSR shop fetch error:", err);
    return { products: [], pagination: null };
  }
}

async function getCategory(categoryId) {
  if (!categoryId) return null;
  try {
    const res = await fetch(`${API_URL}/category/${categoryId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.category || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const category = await getCategory(sp?.category);

  const title = category
    ? `${category.name} | Shop | ${SITE_NAME}`
    : `Shop All Products | ${SITE_NAME}`;

  const description = category
    ? `Browse the ${category.name} collection at ${SITE_NAME}. Quality products, best prices, fast delivery.`
    : `Explore the full product range at ${SITE_NAME}. Quality products, best prices, fast delivery.`;

  const url = `${SITE_URL}/shop${sp?.category ? `?category=${sp.category}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const { products, pagination } = await getProducts(sp);

  return (
    <>
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: products.map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                url: `${SITE_URL}/shop/${p.slug}`,
                name: p.name,
                image:
                  p.mainImage ||
                  p.colors?.[0]?.images?.[0]?.original ||
                  p.colors?.[0]?.images?.[0]?.card,
              })),
            }),
          }}
        />
      )}
      <ShopPageClient initialProducts={products} initialPagination={pagination} />
    </>
  );
}