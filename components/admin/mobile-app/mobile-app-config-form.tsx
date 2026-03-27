"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  extractMobileAppFileName,
  isExternalMobileAppUrl,
} from "@/lib/mobile-app-path";
import { createClient } from "@/lib/supabase/client";
import {
  getSupabaseBrowserConfigErrorMessage,
  getSupabaseBrowserErrorMessage,
} from "@/lib/supabase/browser-errors";

const APK_CONTENT_TYPE = "application/vnd.android.package-archive";

type MobileAppConfigFormProps = {
  config: {
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
  };
  publicDownloadHref: string | null;
};

type UploadUrlResponse = {
  bucket: string;
  path: string;
  token: string;
};

type UploadedApkState = {
  cacheKey: string;
  path: string;
  fileName: string;
};

function isUploadUrlResponse(value: unknown): value is UploadUrlResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "bucket" in value &&
    typeof value.bucket === "string" &&
    "path" in value &&
    typeof value.path === "string" &&
    "token" in value &&
    typeof value.token === "string"
  );
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error.trim();
  }

  return fallback;
}

function getFileCacheKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function MobileAppConfigForm({
  config,
  publicDownloadHref,
}: MobileAppConfigFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [uploadedApk, setUploadedApk] = useState<UploadedApkState | null>(null);
  const defaultExternalApkUrl = isExternalMobileAppUrl(config.apkPath)
    ? config.apkPath ?? ""
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const configError = getSupabaseBrowserConfigErrorMessage();

    if (configError) {
      setError(configError);
      return;
    }

    const apkFileValue = formData.get("apk_file");
    const apkFile =
      apkFileValue instanceof File && apkFileValue.size > 0 ? apkFileValue : null;
    const clearApk = formData.get("clear_apk") !== null;
    const rawExternalApkUrl =
      typeof formData.get("apk_external_url") === "string"
        ? String(formData.get("apk_external_url")).trim()
        : "";
    const externalApkUrl =
      clearApk && rawExternalApkUrl === defaultExternalApkUrl && !apkFile
        ? ""
        : rawExternalApkUrl;

    setSaving(true);
    setError(null);

    try {
      let apkPath = clearApk ? null : config.apkPath;
      let apkFileName = clearApk ? null : config.apkFileName;

      if (externalApkUrl) {
        apkPath = externalApkUrl;
        apkFileName =
          extractMobileAppFileName(externalApkUrl) ??
          config.apkFileName ??
          "github-release.apk";
        setStatusText(
          "URL GitHub Releases detectee. Aucun upload serveur n est necessaire.",
        );
      } else if (apkFile) {
        const cacheKey = getFileCacheKey(apkFile);

        if (uploadedApk?.cacheKey === cacheKey) {
          apkPath = uploadedApk.path;
          apkFileName = uploadedApk.fileName;
        } else {
          setStatusText("Preparation de l upload direct vers Supabase...");

          const uploadUrlResponse = await fetch("/api/admin/mobile-app/upload-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: apkFile.name,
            }),
          });

          const uploadUrlPayload = (await uploadUrlResponse
            .json()
            .catch(() => null)) as UploadUrlResponse | { error?: string } | null;

          if (!uploadUrlResponse.ok || !isUploadUrlResponse(uploadUrlPayload)) {
            throw new Error(
              readErrorMessage(
                uploadUrlPayload,
                "Preparation de l upload APK impossible.",
              ),
            );
          }

          const supabase = createClient();

          setStatusText(
            `Upload direct de ${apkFile.name} en cours. Garde cette page ouverte jusqu a la fin.`,
          );

          const { error: uploadError } = await supabase.storage
            .from(uploadUrlPayload.bucket)
            .uploadToSignedUrl(
              uploadUrlPayload.path,
              uploadUrlPayload.token,
              apkFile,
              {
                contentType: apkFile.type || APK_CONTENT_TYPE,
                cacheControl: "3600",
              },
            );

          if (uploadError) {
            throw new Error(uploadError.message);
          }

          apkPath = uploadUrlPayload.path;
          apkFileName = apkFile.name;
          setUploadedApk({
            cacheKey,
            path: apkPath,
            fileName: apkFileName,
          });
        }
      }

      setStatusText("Enregistrement de la configuration mobile...");

      const saveResponse = await fetch("/api/admin/mobile-app/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName: formData.get("app_name"),
          heroTitle: formData.get("hero_title"),
          heroDescription: formData.get("hero_description"),
          androidCtaLabel: formData.get("android_cta_label"),
          versionLabel: formData.get("version_label"),
          releaseNotes: formData.get("release_notes"),
          isPublic: formData.get("is_public") !== null,
          trialEnabled: formData.get("trial_enabled") !== null,
          trialDays: Number.parseInt(String(formData.get("trial_days") ?? "7"), 10),
          apkPath,
          apkFileName,
        }),
      });

      const savePayload = (await saveResponse.json().catch(() => null)) as
        | { saved?: string; error?: string }
        | null;

      if (!saveResponse.ok || !savePayload?.saved) {
        throw new Error(
          readErrorMessage(
            savePayload,
            "Enregistrement de l application impossible.",
          ),
        );
      }

      setStatusText(null);
      router.push(`/admin/mobile-app?saved=${encodeURIComponent(savePayload.saved)}`);
      router.refresh();
    } catch (submitError) {
      setStatusText(null);
      setError(
        getSupabaseBrowserErrorMessage(
          submitError,
          "la sauvegarde de l application mobile",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="grid gap-6"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Nom de l application
          </span>
          <input
            type="text"
            name="app_name"
            defaultValue={config.appName}
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Version affichee
          </span>
          <input
            type="text"
            name="version_label"
            placeholder="v1.0.0"
            defaultValue={config.versionLabel ?? ""}
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Titre hero
          </span>
          <input
            type="text"
            name="hero_title"
            defaultValue={config.heroTitle}
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description hero
          </span>
          <textarea
            name="hero_description"
            rows={4}
            defaultValue={config.heroDescription}
            className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Label bouton Android
          </span>
          <input
            type="text"
            name="android_cta_label"
            defaultValue={config.androidCtaLabel}
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            URL APK GitHub Releases
          </span>
          <input
            type="url"
            name="apk_external_url"
            defaultValue={defaultExternalApkUrl}
            placeholder="https://github.com/.../releases/download/.../app-release.apk"
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
          <span className="text-xs leading-5 text-slate-500">
            Colle ici le lien direct de ton asset GitHub Releases. Si ce champ
            est rempli, il prend la priorite sur l upload local.
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Nouveau fichier APK
          </span>
          <input
            type="file"
            name="apk_file"
            accept=".apk,application/vnd.android.package-archive"
            className="min-h-11 rounded-2xl border border-dashed border-violet-200 bg-white px-4 py-3 text-sm text-slate-700 file:mb-3 file:mr-0 file:block file:rounded-full file:border-0 file:bg-[#171717] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white sm:file:mb-0 sm:file:mr-3 sm:file:inline-flex"
          />
          <span className="text-xs leading-5 text-slate-500">
            Upload direct vers Supabase Storage. Adapté aux APK lourds de 200 Mo
            et plus.
          </span>
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Release notes
          </span>
          <textarea
            name="release_notes"
            rows={4}
            defaultValue={config.releaseNotes ?? ""}
            placeholder="Nouveautes de la build Android, correctifs, infos lecteur..."
            className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
        </label>
      </div>

      <div className="grid gap-5 rounded-[1.8rem] border border-[#ece4d7] bg-[#fcfaf7] p-4 sm:p-5 lg:grid-cols-2">
        <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
          <input
            type="checkbox"
            name="is_public"
            value="true"
            defaultChecked={config.isPublic}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">
              Activer le telechargement public
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Le bouton hero devient telechargeable seulement si un APK existe.
              Sans APK, la publication reste automatiquement coupee.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
          <input
            type="checkbox"
            name="trial_enabled"
            value="true"
            defaultChecked={config.trialEnabled}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">
              Activer le bonus mobile
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Quand un lecteur connecte telecharge l application, il recoit
              automatiquement un acces lecture temporaire sans engagement.
            </span>
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Duree du bonus
          </span>
          <input
            type="number"
            min="1"
            max="30"
            name="trial_days"
            defaultValue={String(config.trialDays)}
            className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
          />
        </label>

        <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#f5d7d7] bg-white p-4">
          <input
            type="checkbox"
            name="clear_apk"
            value="true"
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">
              Retirer l APK actuel
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Cette option coupe aussi la publication publique tant qu un nouveau
              fichier n est pas charge.
            </span>
          </span>
        </label>
      </div>

      {statusText ? (
        <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {statusText}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          disabled={saving}
          className="cta-primary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Enregistrement..." : "Enregistrer l application"}
        </button>
        {publicDownloadHref ? (
          <Link
            href={publicDownloadHref}
            className="cta-secondary w-full px-5 py-3 text-center text-sm sm:w-auto"
          >
            Tester le telechargement public
          </Link>
        ) : null}
      </div>
    </form>
  );
}
