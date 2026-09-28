import { NextResponse } from "next/server";
import { apiServer } from "@/lib/api/server";
import { getMobileAppConfig } from "@/lib/mobile-app";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = await getMobileAppConfig();

  if (!config.isPublic) {
    return NextResponse.redirect(new URL("/home?app=unavailable", request.url));
  }

  try {
    if (config.trialEnabled) {
      await apiServer("mobile/trial/claim", { method: "POST" }).catch(() => null);
    }
  } catch {
    // Download remains available even if a guest has no authenticated trial.
  }

  const target = new URL("/api/backend/mobile/download", request.url);
  return NextResponse.redirect(target, 307);
}
