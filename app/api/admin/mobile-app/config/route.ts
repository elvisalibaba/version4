import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/auth/get-admin-api-session";
import {
  getMobileAppConfig,
  saveMobileAppConfig,
} from "@/lib/mobile-app";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type SaveMobileAppConfigRequest = {
  appName?: string;
  heroTitle?: string;
  heroDescription?: string;
  androidCtaLabel?: string;
  apkPath?: string | null;
  apkFileName?: string | null;
  versionLabel?: string | null;
  releaseNotes?: string | null;
  isPublic?: boolean;
  trialEnabled?: boolean;
  trialDays?: number;
};

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredString(value: unknown, fallback: string) {
  return normalizeNullableString(value) ?? fallback;
}

function normalizeTrialDays(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(30, Math.max(1, Math.round(parsed)));
}

export async function POST(request: Request) {
  const admin = await getAdminApiSession();

  if (!admin) {
    return NextResponse.json(
      { error: "Authentification admin requise." },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | SaveMobileAppConfigRequest
    | null;

  if (!payload) {
    return NextResponse.json(
      { error: "Charge utile invalide." },
      { status: 400 },
    );
  }

  try {
    const currentConfig = await getMobileAppConfig();
    const nextApkPath = normalizeNullableString(payload.apkPath);
    const nextApkFileName = normalizeNullableString(payload.apkFileName);
    const shouldBePublic = Boolean(payload.isPublic) && Boolean(nextApkPath);

    const savedConfig = await saveMobileAppConfig({
      ...currentConfig,
      appName: normalizeRequiredString(payload.appName, currentConfig.appName),
      heroTitle: normalizeRequiredString(
        payload.heroTitle,
        currentConfig.heroTitle,
      ),
      heroDescription: normalizeRequiredString(
        payload.heroDescription,
        currentConfig.heroDescription,
      ),
      androidCtaLabel: normalizeRequiredString(
        payload.androidCtaLabel,
        currentConfig.androidCtaLabel,
      ),
      apkPath: nextApkPath,
      apkFileName: nextApkFileName,
      versionLabel: normalizeNullableString(payload.versionLabel),
      releaseNotes: normalizeNullableString(payload.releaseNotes),
      isPublic: shouldBePublic,
      trialEnabled: Boolean(payload.trialEnabled),
      trialDays: normalizeTrialDays(payload.trialDays, currentConfig.trialDays),
      updatedBy: admin.id,
      updatedAt: new Date().toISOString(),
    });

    if (
      currentConfig.apkPath &&
      currentConfig.apkPath !== savedConfig.apkPath
    ) {
      try {
        const service = createServiceRoleClient();
        await service.storage.from("books").remove([currentConfig.apkPath]);
      } catch {
        // Best effort cleanup for replaced or removed APK files.
      }
    }

    revalidatePath("/home");
    revalidatePath("/admin");
    revalidatePath("/admin/mobile-app");

    return NextResponse.json({
      ok: true,
      saved: shouldBePublic ? "mobile_app_public" : "mobile_app_updated",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Enregistrement de la configuration mobile impossible.",
      },
      { status: 500 },
    );
  }
}
