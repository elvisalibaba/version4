"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type ChromeFrameProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function ChromeFrame({ header, footer, children }: ChromeFrameProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? null : header}
      <main className={isAdminRoute ? "min-h-screen" : "site-main min-h-[60vh]"}>{children}</main>
      {isAdminRoute ? null : footer}
    </>
  );
}
