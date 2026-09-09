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
  /* config options here */
};

export default nextConfig;