import { NextResponse } from "next/server";
import { createMobileAppSignedDownloadUrl, getMobileAppConfig } from "@/lib/mobile-app";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = await getMobileAppConfig();

  if (!config.isPublic || !config.apkPath) {
    return NextResponse.redirect(new URL("/home?app=unavailable", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && config.trialEnabled) {
    await supabase.rpc("claim_current_user_mobile_app_trial", {
      p_trial_days: config.trialDays,
      p_source: "hero_download",
    });
  }

  const signedUrl = await createMobileAppSignedDownloadUrl(config.apkPath, 60 * 10);

  if (!signedUrl) {
    return NextResponse.redirect(new URL("/home?app=unavailable", request.url));
  }

  return NextResponse.redirect(signedUrl, 307);
}
