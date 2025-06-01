/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === "production" ? "/pdf-utility" : "",
  basePath: process.env.NODE_ENV === "production" ? "/pdf-utility" : "",
};

module.exports = nextConfig;
