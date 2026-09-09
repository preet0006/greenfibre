import ProductDetailClient from "@/components/home/ProductDetailsClient";
// Set your real API base and domain here
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
const SITE_NAME = "YourStoreName";

async function getProduct(slug) {
  try {
    const res = await fetch(`${API_URL}/product/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || null;
  } catch (err) {
    console.error("SSR product fetch error:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product may have been removed or the link is incorrect.",
    };
  }

  const title = `${product.name} | ${SITE_NAME}`;
  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} online at the best price.${
      product.category?.name ? ` Shop the ${product.category.name} collection.` : ""
    }`;

  const image =
    product.mainImage ||
    product.colors?.[0]?.images?.[0]?.original ||
    product.colors?.[0]?.images?.[0]?.card;

  const url = `${SITE_URL}/shop/${slug}`;

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
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description,
              image:
                product.mainImage ||
                product.colors?.[0]?.images?.[0]?.original,
              offers: {
                "@type": "Offer",
                priceCurrency: "INR",
                price: product.discountedPrice,
                availability: product.colors?.some((c) => c.stock > 0)
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              },
              ...(product.reviewCount
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: product.averageRating || 0,
                      reviewCount: product.reviewCount,
                    },
                  }
                : {}),
            }),
          }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}