import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { ChromeFrame } from "@/components/layout/chrome-frame";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";
import "./cinema-theme.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://holistique-books.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "HolistiqueBooks",
    template: "%s | HolistiqueBooks",
  },
  description: "Plateforme de livres numeriques et de lectures de transformation pour grandir, apprendre et agir.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Holistique Books",
  },
};

export const viewport: Viewport = {
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
        <ChromeFrame header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </ChromeFrame>
        <CookieConsentBanner />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
