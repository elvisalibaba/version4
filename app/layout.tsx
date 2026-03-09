import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en">
      <body className={`${inter.variable} ios-shell antialiased`}>
        <SiteHeader />
        <main className="ios-page min-h-[60vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
