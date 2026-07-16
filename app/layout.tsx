import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import Script from "next/script";
import { ChromeFrame } from "@/components/layout/chrome-frame";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";
import "./cinema-theme.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const FALLBACK_APP_URL = "https://holistique-books.com";
const DEV_SERVICE_WORKER_RESET_SCRIPT = `
(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => undefined);
  if ("caches" in window) {
    window.caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("hb-")).map((key) => window.caches.delete(key))))
      .catch(() => undefined);
  }
})();
`;
let hasLoggedInvalidAppBaseUrl = false;

function resolveMetadataBase() {
  const rawCandidate = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_BASE_URL?.trim() || FALLBACK_APP_URL;

  try {
    const parsed = new URL(rawCandidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed;
    }
  } catch {
    // Fallback handled below.
  }

  if (!hasLoggedInvalidAppBaseUrl) {
    hasLoggedInvalidAppBaseUrl = true;
    console.error(`[App URL] Invalid NEXT_PUBLIC_APP_URL/APP_BASE_URL value: "${rawCandidate}". Falling back to ${FALLBACK_APP_URL}.`);
  }

  return new URL(FALLBACK_APP_URL);
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  applicationName: "Holistique Books",
  title: {
    default: "HolistiqueBooks",
    template: "%s | HolistiqueBooks",
  },
  description: "Plateforme de livres numeriques et de lectures de transformation pour grandir, apprendre et agir.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/pwa-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/pwa-icon-192.png",
    apple: [
      { url: "/pwa-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/pwa-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Holistique Books",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17130f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={`${plusJakartaSans.variable} ${sora.variable} premium-body antialiased`}>
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-service-worker-reset" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: DEV_SERVICE_WORKER_RESET_SCRIPT }} />
        ) : null}
        <ChromeFrame header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </ChromeFrame>
        <CookieConsentBanner />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
