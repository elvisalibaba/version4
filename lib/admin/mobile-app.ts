import { Smartphone, Gift, ShieldCheck } from "lucide-react";
import { getMobileAppConfig, createMobileAppSignedDownloadUrl } from "@/lib/mobile-app";
import { isExternalMobileAppUrl } from "@/lib/mobile-app-path";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { AdminNotice } from "@/types/admin";

export async function getAdminMobileAppData() {
  const config = await getMobileAppConfig();
  let activeTrials = 0;
  let totalClaimedReaders = 0;
  let totalDownloadClaims = 0;

  try {
    const supabase = createServiceRoleClient();
    const [{ count: activeCount }, { data: trialRows }] = await Promise.all([
      supabase
        .from("mobile_app_trial_grants")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString()),
      supabase.from("mobile_app_trial_grants").select("claimed_download_count"),
    ]);

    activeTrials = activeCount ?? 0;
    totalClaimedReaders = (trialRows ?? []).length;
    totalDownloadClaims = (trialRows ?? []).reduce((sum, row) => sum + Number(row.claimed_download_count ?? 0), 0);
  } catch {
    activeTrials = 0;
    totalClaimedReaders = 0;
    totalDownloadClaims = 0;
  }

  const signedPreviewUrl = config.apkPath ? await createMobileAppSignedDownloadUrl(config.apkPath, 60 * 30) : null;
  const notices: AdminNotice[] = [
    {
      id: "mobile-app-flow",
      tone: "success",
      title: "Telechargement APK + bonus mobile centralises",
      description:
        "Le hero public peut maintenant pointer vers un APK gere par l admin, et le bonus mobile s active automatiquement lors d un telechargement authentifie.",
    },
  ];

  if (!config.apkPath) {
    notices.push({
      id: "mobile-app-no-apk",
      tone: "info",
      title: "Aucun APK public pour le moment",
      description:
        "Ajoute un fichier APK ou colle une URL externe comme Google Drive ou GitHub Releases pour activer le bouton de telechargement sur la home. Tant qu aucun fichier n est configure, le CTA reste visible mais non telechargeable.",
      });
  }

  if (config.apkPath && isExternalMobileAppUrl(config.apkPath)) {
    notices.push({
      id: "mobile-app-external-url",
      tone: "info",
      title: "APK pilote par URL externe",
      description:
        "Cette configuration pointe vers un asset externe, par exemple Google Drive ou GitHub Releases. Le bonus mobile reste attribue via la route publique avant la redirection.",
    });
  }

  if (!config.isPublic) {
    notices.push({
      id: "mobile-app-private",
      tone: "warning",
      title: "Publication actuellement coupee",
      description:
        "Le fichier peut etre pret en back-office, mais le telechargement public reste masque tant que l option publication n est pas activee.",
    });
  }

  if (config.trialEnabled) {
    notices.push({
      id: "mobile-app-trial",
      tone: "info",
      title: `${config.trialDays} jours offerts sans engagement`,
      description:
        "Le bonus mobile ouvre l acces lecture sur tous les contenus numeriques publies et non bloques, sans creer d abonnement payant.",
    });
  }

  return {
    config,
    activeTrials,
    totalClaimedReaders,
    totalDownloadClaims,
    signedPreviewUrl,
    publicDownloadHref: config.isPublic && config.apkPath ? "/api/mobile-app/download" : null,
    stats: [
      {
        icon: Smartphone,
        label: "APK public",
        value: config.apkPath ? (config.versionLabel ?? "Pret") : "Aucun",
        hint: config.apkFileName
          ? config.apkFileName
          : config.apkPath && isExternalMobileAppUrl(config.apkPath)
            ? "Lien externe"
            : "Charge depuis l admin",
        tone: config.apkPath ? "emerald" : "amber",
      },
      {
        icon: Gift,
        label: "Bonus mobile",
        value: config.trialEnabled ? `${config.trialDays} jours` : "Coupe",
        hint: "Acces lecture sans engagement",
        tone: config.trialEnabled ? "sky" : "amber",
      },
      {
        icon: ShieldCheck,
        label: "Lecteurs ayant reclame",
        value: totalClaimedReaders,
        hint: `${totalDownloadClaims} telechargements suivis`,
        tone: "violet",
      },
      {
        icon: Gift,
        label: "Trials actifs",
        value: activeTrials,
        hint: "Acces mobile encore ouverts",
        tone: "amber",
      },
    ] as const,
    notices,
  };
}
