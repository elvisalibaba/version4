import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/safe-next-path";

export async function GET(request: NextRequest) {
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("auth", "laravel");
  return NextResponse.redirect(url);
}
