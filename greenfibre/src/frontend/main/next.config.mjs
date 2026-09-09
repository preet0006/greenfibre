/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "media.greenfibre.org",
      },
      {
        protocol: "https",
        hostname: "api.greenfibre.org",
      },
      {
        protocol: "https",
        hostname: "greenfibre.org",
      },
      {
        protocol: "https",
        hostname: "www.greenfibre.org",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/terms",
        destination: "/terms-and-conditions",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/faq",
        destination: "/contact",
        permanent: false,
      },
      {
        source: "/reviews",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
