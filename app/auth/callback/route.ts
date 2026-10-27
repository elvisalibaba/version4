import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/safe-next-path";

/** Legacy authentication callbacks cannot exchange sessions on the Laravel site. */
export async function GET(request: NextRequest) {
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const url = new URL("/login", request.url);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}
