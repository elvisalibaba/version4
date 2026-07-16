import Link from "next/link";
import Image from "next/image";
import { Download, Gift, Smartphone } from "lucide-react";
import type { MobileAppConfig } from "@/lib/mobile-app";

type MobileAppHeroCardProps = {
  config: MobileAppConfig;
  isAuthenticated: boolean;
};

export function MobileAppHeroCard({ config, isAuthenticated }: MobileAppHeroCardProps) {
  const downloadReady = config.isPublic && Boolean(config.apkPath);
  const helperLabel = config.trialEnabled
    ? isAuthenticated
      ? `${config.trialDays} jours offerts s activent automatiquement au telechargement.`
      : `Connectez-vous puis telechargez l application pour activer ${config.trialDays} jours offerts.`
    : "APK Android direct, sans passage par le Play Store pour le moment.";

  return (
    <div className="w-full max-w-xl rounded-[1.35rem] border border-white/15 bg-white/10 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.16)] backdrop-blur sm:rounded-[1.6rem] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/15 bg-[#0f1111] shadow-[0_16px_30px_rgba(15,23,42,0.22)] sm:h-[72px] sm:w-[72px] sm:rounded-[1.4rem]">
          <Image src="/playstore.png" alt="Holistique Stores" width={52} height={52} className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white">
              <Smartphone className="h-3.5 w-3.5" />
              Android
            </span>
            {config.trialEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1db] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#b96e12]">
                <Gift className="h-3.5 w-3.5" />
                {config.trialDays} jours offerts
              </span>
            ) : null}
            {config.versionLabel ? (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/80">
                {config.versionLabel}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">{config.heroTitle}</h2>
            <p className="text-sm leading-6 text-gray-200">{config.heroDescription}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {downloadReady ? (
              <Link
                href="/api/mobile-app/download"
                className="inline-flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#171717] transition hover:bg-[#f8f5ef] sm:w-auto"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-white">
                  <Download className="h-4 w-4" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">Holistique Stores</span>
                  <span className="block text-sm text-slate-950">{config.androidCtaLabel}</span>
                </span>
              </Link>
            ) : (
              <span className="inline-flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/80 sm:w-auto">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                  <Download className="h-4 w-4" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-white/60">Holistique Stores</span>
                  <span className="block text-sm">APK bientot disponible</span>
                </span>
              </span>
            )}

            {config.apkFileName ? (
              <span className="break-all text-[0.68rem] uppercase tracking-[0.16em] text-white/60 sm:text-xs sm:tracking-[0.18em]">
                {config.apkFileName}
              </span>
            ) : null}
          </div>

          <p className="text-xs leading-6 text-white/70">{helperLabel}</p>
        </div>
      </div>
    </div>
  );
}
