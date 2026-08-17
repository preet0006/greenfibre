const SITE = "https://www.greenfibre.org";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/about",
  "/sustainability",
  "/contact",
  "/blogs",
  "/gallery",
  "/search",
  "/privacy-policy",
  "/terms-and-conditions",
  "/shipping-policy",
  "/refund-policy",
  "/login",
  "/register",
];

export default async function sitemap() {
  const now = new Date();
  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/shop" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.7,
  }));

  let productEntries = [];
  let blogEntries = [];

  try {
    const api = process.env.NEXT_PUBLIC_API_URL || "https://api.greenfibre.org";
    const [productsRes, blogsRes] = await Promise.all([
      fetch(`${api}/api/product?limit=200`, { next: { revalidate: 3600 } }),
      fetch(`${api}/api/blogs`, { next: { revalidate: 3600 } }),
    ]);

    if (productsRes.ok) {
      const data = await productsRes.json();
      productEntries = (data.products || []).map((p) => ({
        url: `${SITE}/shop/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }

    if (blogsRes.ok) {
      const data = await blogsRes.json();
      blogEntries = (data.blogs || []).map((b) => ({
        url: `${SITE}/blogs/${b.slug}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch {
    // Sitemap still returns static routes if API is unavailable
  }

  return [...staticEntries, ...productEntries, ...blogEntries];
}
