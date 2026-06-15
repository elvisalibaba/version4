import { NextResponse } from "next/server";
import { getMobileAppConfig } from "@/lib/mobile-app";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getMobileAppConfig();
  const downloadReady = config.isPublic && Boolean(config.apkPath);

  return NextResponse.json({
    downloadReady,
    downloadHref: downloadReady ? "/api/mobile-app/download" : null,
    androidCtaLabel: config.androidCtaLabel,
    apkFileName: config.apkFileName,
    versionLabel: config.versionLabel,
    trialEnabled: config.trialEnabled,
    trialDays: config.trialDays,
  });
}
