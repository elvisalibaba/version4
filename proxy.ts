import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerClient } from "@supabase/ssr";
import { AUTH_COOKIE_NAME } from "@/lib/api/session";

export function proxy(request: NextRequest) {
  if (isSupabaseMode()) {
    if (request.nextUrl.pathname.startsWith("/api/payments/")) return NextResponse.json({ message: "Paiement désactivé pendant la migration Supabase." }, { status: 503 });
    return supabaseProxy(request);
  }
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (pathname.startsWith("/admin")) {
    const backend = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
    return NextResponse.redirect(new URL("/admin", backend));
  }

  if (pathname.startsWith("/dashboard") && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

async function supabaseProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(changes) {
        changes.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        changes.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !user) {
    const destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname);
    return NextResponse.redirect(destination);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/payments/:path*"],
};
