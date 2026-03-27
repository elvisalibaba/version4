import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/content-storage";
import {
  extractMobileAppFileName,
  isExternalMobileAppUrl,
} from "@/lib/mobile-app-path";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

const MOBILE_APP_FILE_PATH = "data/mobile-app.json";
const MOBILE_APP_SCOPE = "global";

type MobileAppConfigRow = Database["public"]["Tables"]["mobile_app_configs"]["Row"];

export type MobileAppConfig = {
  appName: string;
  heroTitle: string;
  heroDescription: string;
  androidCtaLabel: string;
  apkPath: string | null;
  apkFileName: string | null;
  versionLabel: string | null;
  releaseNotes: string | null;
  isPublic: boolean;
  trialEnabled: boolean;
  trialDays: number;
  updatedAt: string;
  updatedBy: string | null;
};

const defaultMobileAppConfig: MobileAppConfig = {
  appName: "Holistique Stores",
  heroTitle: "Telecharger Holistique Stores",
  heroDescription: "Installez l application Android et activez 7 jours offerts sur tous les contenus numeriques, sans engagement.",
  androidCtaLabel: "Telecharger l APK",
  apkPath: null,
  apkFileName: null,
  versionLabel: null,
  releaseNotes: null,
  isPublic: false,
  trialEnabled: true,
  trialDays: 7,
  updatedAt: "2026-03-23T00:00:00.000Z",
  updatedBy: null,
};

function normalizeMobileAppConfig(config: MobileAppConfig): MobileAppConfig {
  const normalizedTrialDays = Number.isFinite(config.trialDays) ? Math.round(config.trialDays) : defaultMobileAppConfig.trialDays;

  return {
    appName: config.appName?.trim() || defaultMobileAppConfig.appName,
    heroTitle: config.heroTitle?.trim() || defaultMobileAppConfig.heroTitle,
    heroDescription: config.heroDescription?.trim() || defaultMobileAppConfig.heroDescription,
    androidCtaLabel: config.androidCtaLabel?.trim() || defaultMobileAppConfig.androidCtaLabel,
    apkPath: config.apkPath?.trim() || null,
    apkFileName:
      config.apkFileName?.trim() ||
      extractMobileAppFileName(config.apkPath) ||
      null,
    versionLabel: config.versionLabel?.trim() || null,
    releaseNotes: config.releaseNotes?.trim() || null,
    isPublic: Boolean(config.isPublic),
    trialEnabled: Boolean(config.trialEnabled),
    trialDays: Math.min(30, Math.max(1, normalizedTrialDays)),
    updatedAt: config.updatedAt || new Date().toISOString(),
    updatedBy: config.updatedBy ?? null,
  };
}

function mapRowToMobileAppConfig(row: MobileAppConfigRow): MobileAppConfig {
  return normalizeMobileAppConfig({
    appName: row.app_name,
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    androidCtaLabel: row.android_cta_label,
    apkPath: row.apk_path,
    apkFileName: row.apk_file_name,
    versionLabel: row.version_label,
    releaseNotes: row.release_notes,
    isPublic: row.is_public,
    trialEnabled: row.trial_enabled,
    trialDays: row.trial_days,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  });
}

function getMobileAppClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function readLegacyMobileAppConfig() {
  const config = await readJsonFile<MobileAppConfig>(MOBILE_APP_FILE_PATH, defaultMobileAppConfig);
  return normalizeMobileAppConfig(config);
}

async function writeLegacyMobileAppConfig(config: MobileAppConfig) {
  const normalized = normalizeMobileAppConfig(config);
  await writeJsonFile(MOBILE_APP_FILE_PATH, normalized);
  return normalized;
}

async function readSupabaseMobileAppConfig() {
  const supabase = getMobileAppClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("mobile_app_configs").select("*").eq("scope", MOBILE_APP_SCOPE).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToMobileAppConfig(data as MobileAppConfigRow);
}

async function saveSupabaseMobileAppConfig(config: MobileAppConfig) {
  const supabase = getMobileAppClient();

  if (!supabase) {
    return null;
  }

  const normalized = normalizeMobileAppConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("mobile_app_configs")
    .upsert(
      {
        scope: MOBILE_APP_SCOPE,
        app_name: normalized.appName,
        hero_title: normalized.heroTitle,
        hero_description: normalized.heroDescription,
        android_cta_label: normalized.androidCtaLabel,
        apk_path: normalized.apkPath,
        apk_file_name: normalized.apkFileName,
        version_label: normalized.versionLabel,
        release_notes: normalized.releaseNotes,
        is_public: normalized.isPublic,
        trial_enabled: normalized.trialEnabled,
        trial_days: normalized.trialDays,
        updated_at: normalized.updatedAt,
        updated_by: normalized.updatedBy,
      },
      { onConflict: "scope" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToMobileAppConfig(data as MobileAppConfigRow);
}

export async function getMobileAppConfig() {
  const supabaseConfig = await readSupabaseMobileAppConfig();

  if (supabaseConfig) {
    return supabaseConfig;
  }

  const legacyConfig = await readLegacyMobileAppConfig();
  const savedConfig = await saveSupabaseMobileAppConfig(legacyConfig);

  return savedConfig ?? legacyConfig;
}

export async function saveMobileAppConfig(config: MobileAppConfig) {
  const normalized = normalizeMobileAppConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  const savedConfig = await saveSupabaseMobileAppConfig(normalized);

  if (savedConfig) {
    return savedConfig;
  }

  return writeLegacyMobileAppConfig(normalized);
}

export async function createMobileAppSignedDownloadUrl(apkPath: string, expiresInSeconds = 60 * 10) {
  const normalizedPath = apkPath.trim();

  if (!normalizedPath) {
    return null;
  }

  if (isExternalMobileAppUrl(normalizedPath)) {
    return normalizedPath;
  }

  const supabase = getMobileAppClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.from("books").createSignedUrl(normalizedPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
