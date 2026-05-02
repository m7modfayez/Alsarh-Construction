// next.config.mjs

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Do NOT silence TypeScript errors in production
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agygawewzqgweeufhhre.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // ✅ FIX: Added unsplash — without this, Next.js cannot optimize Unsplash images
        // and falls back to serving the full original resolution (~800–1200px raw JPEG)
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],

    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // ✅ FIX: Removed tiny icon sizes (16, 32, 48) — project images don't need them
    // and they bloat the image cache unnecessarily
    imageSizes: [64, 128, 256, 384],
  },
};

export default nextConfig;
