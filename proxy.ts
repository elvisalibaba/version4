import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";
import { getApiBaseUrl } from "@/lib/api/client";

/** The public storefront uses Laravel Sanctum exclusively. */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Filament is hosted on Laravel, not in a parallel Next.js admin console.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/admin", getApiBaseUrl()));
  }

  if ((pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) && token) {
    return NextResponse.redirect(new URL("/admin", getApiBaseUrl()));
  }

  if (pathname.startsWith("/dashboard") && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
