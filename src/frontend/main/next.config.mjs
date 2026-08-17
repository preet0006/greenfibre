/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "media.greenfibre.org",
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
