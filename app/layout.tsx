import type { Metadata } from "next";
import { Fraunces, Lato } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-body" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "HolisticBooks",
  description: "African ebook platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${lato.variable} ${fraunces.variable} ios-shell antialiased`}>
        <SiteHeader />
        <main className="ios-page min-h-[60vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
