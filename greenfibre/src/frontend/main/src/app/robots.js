export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/checkout", "/cart", "/wishlist", "/orders"],
    },
    sitemap: "https://www.greenfibre.org/sitemap.xml",
    host: "https://www.greenfibre.org",
  };
}
