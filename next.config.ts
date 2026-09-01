import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://*.cinetpay.com https://*.e-com-easypay.com; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cinetpay.com https://*.e-com-easypay.com; worker-src 'self' blob:; media-src 'self' blob: https:; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
