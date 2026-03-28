import Link from "next/link";
import {
  FileSpreadsheet,
  GraduationCap,
  Laptop,
  ScrollText,
} from "lucide-react";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import {
  editorialTrainingPreferredFormatOptions,
  getEditorialTrainingExperienceLevelLabel,
  getEditorialTrainingPreferredFormatLabel,
  getEditorialTrainingProfileTypeLabel,
  getEditorialTrainingProjectStageLabel,
  isEditorialTrainingPreferredFormat,
} from "@/lib/editorial-training";
import { listAdminEditorialTrainingRequests } from "@/lib/supabase/admin/editorial-training";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type AdminEditorialTrainingPageProps = {
  searchParams: Promise<{
    q?: string;
    format?: string;
    page?: string;
  }>;
};

export default async function AdminEditorialTrainingPage({
  searchParams,
}: AdminEditorialTrainingPageProps) {
  const { q, format, page } = await searchParams;
  const preferredFormat =
    format && isEditorialTrainingPreferredFormat(format) ? format : "";
  const data = await listAdminEditorialTrainingRequests({
    page: page ? Number(page) : 1,
    search: q,
    preferredFormat,
  });

  const exportSearchParams = new URLSearchParams();
  if (q) exportSearchParams.set("q", q);
  if (preferredFormat) exportSearchParams.set("format", preferredFormat);
  const exportHref = `/admin/editorial-training/${
    exportSearchParams.size ? `export?${exportSearchParams.toString()}` : "export"
  }`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Formation editoriale"
        description="Demandes d inscription recues depuis le formulaire public, centralisees pour consultation et export CSV."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Formation editoriale" },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/formation-editoriale"
              className="cta-secondary px-5 py-3 text-sm"
            >
              Voir le formulaire public
            </Link>
            <Link href={exportHref} className="cta-primary px-5 py-3 text-sm">
              Export CSV
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon={GraduationCap}
          label="Demandes"
          value={data.stats.totalRequests}
          hint="Inscriptions enregistrees en base"
        />
        <AdminKpiCard
          icon={ScrollText}
          label="7 derniers jours"
          value={data.stats.last7Days}
          hint="Nouvelles demandes recentes"
          tone="sky"
        />
        <AdminKpiCard
          icon={Laptop}
          label="En ligne / hybride"
          value={data.stats.remoteFriendly}
          hint="Formats souples les plus demandes"
          tone="emerald"
        />
        <AdminKpiCard
          icon={FileSpreadsheet}
          label="Projets murs"
          value={data.stats.matureProjects}
          hint="Manuscrits termines ou catalogues existants"
          tone="amber"
        />
      </div>

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice
              key={notice.id}
              tone={notice.tone}
              title={notice.title}
              description={notice.description}
            />
          ))}
        </div>
      ) : null}

      <AdminPanel
        title="Filtres"
        description="Recherche par nom, email, organisation ou objectif, avec filtre sur le format souhaite."
      >
        <AdminFilterBar action="/admin/editorial-training">
          <AdminSearchInput
            defaultValue={q}
            placeholder="Nom, email, structure ou objectif"
          />
          <AdminSelect
            name="format"
            label="Format"
            defaultValue={preferredFormat}
            options={editorialTrainingPreferredFormatOptions}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link
              href="/admin/editorial-training"
              className="cta-secondary px-5 py-3 text-sm"
            >
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel
        title="Demandes recues"
        description="Chaque demande reprend le contact, le profil, le niveau et le besoin editorial saisi depuis le site public."
      >
        <AdminDataTable
          columns={["Contact", "Profil", "Projet", "Objectifs", "Reception"]}
        >
          {data.items.length ? (
            data.items.map((request) => (
              <tr
                key={request.id}
                className="border-t border-violet-100/70 align-top"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">
                    {request.fullName}
                  </p>
                  <a
                    href={`mailto:${request.email}`}
                    className="mt-1 block text-sm text-violet-700 hover:text-violet-900"
                  >
                    {request.email}
                  </a>
                  {request.phone ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {request.phone}
                    </p>
                  ) : null}
                  {request.city || request.country ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                      {[request.city, request.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">
                    {getEditorialTrainingProfileTypeLabel(request.profile_type)}
                  </p>
                  <p className="mt-1">
                    Niveau:{" "}
                    {getEditorialTrainingExperienceLevelLabel(
                      request.experience_level,
                    )}
                  </p>
                  {request.organization_name ? (
                    <p className="mt-1 text-slate-500">
                      {request.organization_name}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <p>
                    {getEditorialTrainingProjectStageLabel(request.project_stage)}
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {getEditorialTrainingPreferredFormatLabel(
                      request.preferred_format,
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <p className="whitespace-pre-line text-slate-700">
                    {request.objectives}
                  </p>
                  {request.message ? (
                    <div className="mt-3 rounded-[1rem] border border-[#ece4d7] bg-[#fcfaf7] px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Message
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                        {request.message}
                      </p>
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  <p>{formatAdminDateTime(request.created_at)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {request.source}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Consentement: {request.consent_to_contact ? "Oui" : "Non"}
                  </p>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                Aucune demande a afficher.
              </td>
            </tr>
          )}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/editorial-training"
            pagination={data.pagination}
            params={{ q: q ?? "", format: preferredFormat ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
