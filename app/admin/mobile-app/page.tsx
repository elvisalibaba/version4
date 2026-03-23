import Link from "next/link";
import { Download, Gift, ShieldCheck, Smartphone } from "lucide-react";
import { saveMobileAppConfigAction } from "@/app/admin/actions";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { getAdminMobileAppData } from "@/lib/admin/mobile-app";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type AdminMobileAppPageProps = {
  searchParams?: Promise<{
    saved?: string;
  }>;
};

export default async function AdminMobileAppPage({ searchParams }: AdminMobileAppPageProps) {
  const { saved } = (await searchParams) ?? {};
  const data = await getAdminMobileAppData();
  const notices = [...data.notices];

  if (saved === "mobile_app_public") {
    notices.unshift({
      id: "mobile-app-saved-public",
      tone: "success",
      title: "Application publiee sur la home",
      description: "Le hero public peut maintenant telecharger l APK et activer automatiquement le bonus mobile pour les lecteurs connectes.",
    });
  } else if (saved === "mobile_app_updated") {
    notices.unshift({
      id: "mobile-app-saved",
      tone: "success",
      title: "Configuration application mise a jour",
      description: "Les textes, le bonus mobile et les reglages de telechargement ont ete enregistres.",
    });
  } else if (saved === "upload_failed") {
    notices.unshift({
      id: "mobile-app-upload-failed",
      tone: "danger",
      title: "Upload APK impossible",
      description: "Le fichier n a pas pu etre envoye dans Supabase Storage. Verifie le bucket et la configuration serveur avant de recommencer.",
    });
  }

  return (
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Application mobile"
        description="Upload de l APK Holistique Stores, pilotage du bouton hero public et activation du bonus mobile de 7 jours sans engagement."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Application mobile" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <AdminKpiCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} hint={stat.hint} tone={stat.tone} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {notices.map((notice) => (
          <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
        ))}
      </div>

      <AdminPanel title="Publication Android" description="Charge ton APK, regle le texte public et decide si le telechargement doit etre ouvert sur la home.">
        <form action={saveMobileAppConfigAction} className="grid gap-6">
          <input type="hidden" name="redirect_to" value="/admin/mobile-app" />

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nom de l application</span>
              <input
                type="text"
                name="app_name"
                defaultValue={data.config.appName}
                className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Version affichee</span>
              <input
                type="text"
                name="version_label"
                placeholder="v1.0.0"
                defaultValue={data.config.versionLabel ?? ""}
                className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
              />
            </label>

            <label className="grid gap-2 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titre hero</span>
              <input
                type="text"
                name="hero_title"
                defaultValue={data.config.heroTitle}
                className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
              />
            </label>

            <label className="grid gap-2 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description hero</span>
              <textarea
                name="hero_description"
                rows={4}
                defaultValue={data.config.heroDescription}
                className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Label bouton Android</span>
              <input
                type="text"
                name="android_cta_label"
                defaultValue={data.config.androidCtaLabel}
                className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nouveau fichier APK</span>
              <input
                type="file"
                name="apk_file"
                accept=".apk,application/vnd.android.package-archive"
                className="min-h-11 rounded-2xl border border-dashed border-violet-200 bg-white px-4 py-3 text-sm text-slate-700 file:mb-3 file:mr-0 file:block file:rounded-full file:border-0 file:bg-[#171717] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white sm:file:mb-0 sm:file:mr-3 sm:file:inline-flex"
              />
            </label>

            <label className="grid gap-2 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Release notes</span>
              <textarea
                name="release_notes"
                rows={4}
                defaultValue={data.config.releaseNotes ?? ""}
                placeholder="Nouveautes de la build Android, correctifs, infos lecteur..."
                className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
          </div>

          <div className="grid gap-5 rounded-[1.8rem] border border-[#ece4d7] bg-[#fcfaf7] p-4 sm:p-5 lg:grid-cols-2">
            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
              <input type="checkbox" name="is_public" value="true" defaultChecked={data.config.isPublic} className="mt-1 h-4 w-4 rounded border-slate-300" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">Activer le telechargement public</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Le bouton hero devient telechargeable seulement si un APK existe. Sans APK, la publication reste automatiquement coupee.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
              <input type="checkbox" name="trial_enabled" value="true" defaultChecked={data.config.trialEnabled} className="mt-1 h-4 w-4 rounded border-slate-300" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">Activer le bonus mobile</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Quand un lecteur connecte telecharge l application, il recoit automatiquement un acces lecture temporaire sans engagement.
                </span>
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Duree du bonus</span>
              <input
                type="number"
                min="1"
                max="30"
                name="trial_days"
                defaultValue={String(data.config.trialDays)}
                className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
              />
            </label>

            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[#f5d7d7] bg-white p-4">
              <input type="checkbox" name="clear_apk" value="true" className="mt-1 h-4 w-4 rounded border-slate-300" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-950">Retirer l APK actuel</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Cette option coupe aussi la publication publique tant qu un nouveau fichier n est pas charge.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="submit" className="cta-primary w-full px-5 py-3 text-sm sm:w-auto">
              Enregistrer l application
            </button>
            {data.publicDownloadHref ? (
              <Link href={data.publicDownloadHref} className="cta-secondary w-full px-5 py-3 text-center text-sm sm:w-auto">
                Tester le telechargement public
              </Link>
            ) : null}
          </div>
        </form>
      </AdminPanel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_320px] xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <AdminPanel title="Etat actuel" description="Resume de ce qui est expose au hero public et de la recompense mobile accordee aux lecteurs.">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-[#ece4d7] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1db] text-[#b96e12]">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{data.config.appName}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {data.config.versionLabel ?? "Version non renseignee"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {data.config.apkFileName ? `APK courant: ${data.config.apkFileName}` : "Aucun APK charge pour le moment."}
              </p>
              {data.config.apkFileName ? (
                <p className="mt-2 break-all text-xs uppercase tracking-[0.16em] text-slate-400">{data.config.apkFileName}</p>
              ) : null}
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                Derniere mise a jour: {formatAdminDateTime(data.config.updatedAt)}
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-[#ece4d7] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {data.config.trialEnabled ? `${data.config.trialDays} jours actifs` : "Bonus coupe"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Offre mobile</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Les lecteurs connectes qui telechargent l application debloquent un acces lecture temporaire sur les contenus numeriques publies.
              </p>
            </article>
          </div>

          {data.config.releaseNotes ? (
            <div className="mt-5 rounded-[1.5rem] border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Release notes</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{data.config.releaseNotes}</p>
            </div>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Passerelles" description="Acces rapide vers le hero public et controle du lien expose.">
          <div className="space-y-4">
            <article className="rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hero public</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Le bouton Holistique Stores apparait maintenant directement sur la home avec le logo `playstore.png` et le message sur le bonus mobile.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/home" className="cta-secondary w-full px-4 py-2 text-center text-sm sm:w-auto">
                  Voir la home
                </Link>
                {data.signedPreviewUrl ? (
                  <a href={data.signedPreviewUrl} className="cta-primary w-full px-4 py-2 text-center text-sm sm:w-auto">
                    Telecharger l APK
                  </a>
                ) : null}
              </div>
            </article>

            <article className="rounded-[1.4rem] border border-[#ece4d7] bg-[#fcfaf7] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                  <Download className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {data.publicDownloadHref ? "Lien public actif" : "Lien public inactif"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Route de telechargement</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                La route publique attribue le bonus mobile si le lecteur est connecte, puis redirige vers un lien signe Supabase pour l APK.
              </p>
            </article>

            <article className="rounded-[1.4rem] border border-[#ece4d7] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Bonus sans engagement</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Acces temporaire</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Le bonus ne cree aucun abonnement payant. Il ouvre seulement un acces lecture temporaire aux formats numeriques publies tant que la periode offerte est active.
              </p>
            </article>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
