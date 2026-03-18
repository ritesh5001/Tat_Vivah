import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ──────────────────────────────────────────────────────────────────────── */
  /*  IMAGE OPTIMISATION                                                    */
  /* ──────────────────────────────────────────────────────────────────────── */
  images: {
    // Serve modern formats — AVIF first, WebP fallback
    formats: ["image/avif", "image/webp"],

    // Responsive breakpoints matching actual layout needs
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Allow remote patterns (ImageKit for seller uploads)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],

    // Cache optimised images for 60 days
    minimumCacheTTL: 5184000,
  },

  /* ──────────────────────────────────────────────────────────────────────── */
  /*  CACHING HEADERS                                                       */
  /* ──────────────────────────────────────────────────────────────────────── */
  async headers() {
    return [
      {
        // Static assets in /public — immutable long-term cache
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Category images at root
        source: "/:path(Sherwani|EthanicKurta|IndoWestern|Accesories)TatvivahTatvivah.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Next.js optimised images
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Static JS/CSS chunks
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  /* ──────────────────────────────────────────────────────────────────────── */
  /*  CSS OPTIMISATION                                                      */
  /* ──────────────────────────────────────────────────────────────────────── */
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
