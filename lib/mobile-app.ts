import "server-only";

import { apiServer } from "@/lib/api/server";

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

type ApiMobileResponse = {
  data: {
    config: {
      app_name: string;
      hero_title: string;
      hero_description: string;
      android_cta_label: string;
      apk_path: string | null;
      apk_file_name: string | null;
      version_label: string | null;
      release_notes: string | null;
      is_public: boolean;
      trial_enabled: boolean;
      trial_days: number;
      updated_at: string;
      updated_by: string | null;
    } | null;
    current_version: {
      version_name: string;
      file_name: string;
      release_notes: string | null;
    } | null;
  };
};

const fallback: MobileAppConfig = {
  appName: "Holistique Stores",
  heroTitle: "Télécharger Holistique Stores",
  heroDescription: "Installez l’application Android Holistique Stores.",
  androidCtaLabel: "Télécharger l’APK",
  apkPath: null,
  apkFileName: null,
  versionLabel: null,
  releaseNotes: null,
  isPublic: false,
  trialEnabled: true,
  trialDays: 7,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

export async function getMobileAppConfig(): Promise<MobileAppConfig> {
  try {
    const response = await apiServer<ApiMobileResponse>("mobile", { authenticated: false });
    const config = response.data.config;
    const version = response.data.current_version;
    if (!config) return fallback;

    return {
      appName: config.app_name,
      heroTitle: config.hero_title,
      heroDescription: config.hero_description,
      androidCtaLabel: config.android_cta_label,
      apkPath: config.apk_path,
      apkFileName: version?.file_name ?? config.apk_file_name,
      versionLabel: version?.version_name ?? config.version_label,
      releaseNotes: version?.release_notes ?? config.release_notes,
      isPublic: Boolean(config.is_public),
      trialEnabled: Boolean(config.trial_enabled),
      trialDays: Number(config.trial_days ?? 7),
      updatedAt: config.updated_at,
      updatedBy: config.updated_by,
    };
  } catch {
    return fallback;
  }
}

export async function saveMobileAppConfig(config: MobileAppConfig) {
  void config;
  throw new Error("La configuration mobile se gère désormais dans l’administration Laravel.");
}

export async function createMobileAppSignedDownloadUrl(apkPath: string, expiresInSeconds = 600) {
  void apkPath;
  void expiresInSeconds;
  return "/api/mobile-app/download";
}
