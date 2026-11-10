import type { NextConfig } from "next";

// Laravel API handles all book data and authentication.
//
// Origine publique de l'API : figée au build (variable NEXT_PUBLIC_API_URL).
// Par défaut https://api.aba.cd ; les builds de test du VPS passent leur propre nom.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "https://api.aba.cd").origin;
  } catch {
    return "https://api.aba.cd";
  }
})();
const apiHostname = new URL(apiOrigin).hostname;
const apiConnectSources = Array.from(new Set(["https://api.aba.cd", apiOrigin])).join(" ");

// Taille maximale des envois relayés par Next vers Laravel : 50 Mo de fichier
// (UPLOAD_MAX_KILOBYTES côté Laravel) + marge multipart, comme nginx (55m).
const MAX_REQUEST_BODY = "55mb";

const nextConfig: NextConfig = {
  // Le build Docker du VPS demande une sortie autonome (deploy/docker/web.Dockerfile).
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: MAX_REQUEST_BODY,
    },
    proxyClientMaxBodySize: MAX_REQUEST_BODY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.aba.cd",
        port: "",
        pathname: "/**",
      },
      ...(apiHostname !== "api.aba.cd"
        ? [{ protocol: "https" as const, hostname: apiHostname, port: "", pathname: "/**" }]
        : []),
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
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
              `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://*.cinetpay.com https://*.e-com-easypay.com; img-src 'self' data: blob: https: http://127.0.0.1:8000 http://localhost:8000; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ${apiConnectSources} http://127.0.0.1:8000 http://localhost:8000 https://*.cinetpay.com https://*.e-com-easypay.com; worker-src 'self' blob:; media-src 'self' blob: https: http://127.0.0.1:8000 http://localhost:8000; upgrade-insecure-requests`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
