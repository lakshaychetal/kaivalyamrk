import type { NextConfig } from "next";

/**
 * Next.js configuration for the Kaivalyam Homestay Website.
 *
 * Image optimization is configured to emit modern formats (AVIF/WebP) and to
 * provide responsive breakpoints that align with the build-time asset pipeline
 * (400 / 800 / 1200 / 1600 widths — see tech.md "Asset Pipeline").
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Prefer AVIF, fall back to WebP, then the original format.
    formats: ["image/avif", "image/webp"],
    // Full-bleed/hero candidate widths (used when an image's `sizes` is viewport-width).
    deviceSizes: [400, 640, 750, 828, 1080, 1200, 1600, 1920],
    // Fixed-size art-direction widths (matching the 400/800/1200/1600 pipeline variants).
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 400, 800, 1200, 1600],
  },
};

export default nextConfig;
