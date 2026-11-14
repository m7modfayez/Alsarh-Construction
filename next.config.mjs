const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
if (!cloudinaryCloudName) {
  throw new Error("CLOUDINARY_CLOUD_NAME is required to configure Cloudinary image delivery");
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agygawewzqgweeufhhre.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${cloudinaryCloudName}/image/upload/**`,
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],

    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],

    qualities: [75, 80, 85, 90],

    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  // Fix for Next.js 16.2.4 segment configuration issues
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
