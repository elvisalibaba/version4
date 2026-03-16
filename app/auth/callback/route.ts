import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OtpType = "signup" | "invite" | "recovery" | "email_change" | "email";

function getBaseUrl(request: NextRequest) {
  const configuredUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (configuredUrl) {
    return configuredUrl;
  }

  return request.nextUrl.origin;
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

function isOtpType(value: string | null): value is OtpType {
  return value === "signup" || value === "invite" || value === "recovery" || value === "email_change" || value === "email";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const baseUrl = getBaseUrl(request);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?verification=failed`);
}
