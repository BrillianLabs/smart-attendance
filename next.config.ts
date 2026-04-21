import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize production bundle
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // cache images 7 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wzyxmuycxlycgjqplnwh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Cache AI model files aggressively (they never change)
  async headers() {
    return [
      {
        source: '/models/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
