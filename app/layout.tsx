import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Montserrat } from "next/font/google";
import Script from "next/script";
import { ChromeFrame } from "@/components/layout/chrome-frame";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
// Fichier renommé (ex-globals.css) : force Vercel à recompiler Tailwind au lieu de réutiliser un cache périmé.
import "./theme.css";
import "./cinema-theme.css";
import "./brand.css";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Charte Holistique Books : titres en Montserrat, texte en Instrument Sans.
const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap", weight: ["400", "500", "600"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-display", display: "swap" });
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
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: "Holistique Books — Lire, publier et découvrir",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/home" },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    siteName: SITE_NAME,
    title: "Holistique Books — Lire, publier et découvrir",
    description: SITE_DESCRIPTION,
    url: "/home",
    images: [{ url: "/pwa-icon-512.png", width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Holistique Books — Lire, publier et découvrir",
    description: SITE_DESCRIPTION,
    images: ["/pwa-icon-512.png"],
  },
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
  themeColor: "#0E1124",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={`${instrumentSans.variable} ${montserrat.variable} premium-body bg-paper text-slate-900 antialiased`}>
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
