import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // APK uploads go through a server action on /admin/mobile-app.
      bodySizeLimit: "80mb",
    },
    // Admin routes are guarded by proxy.ts, which buffers request bodies.
    proxyClientMaxBodySize: "80mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
