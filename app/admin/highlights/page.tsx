import Link from "next/link";
import { deleteHighlightAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { SimpleBarChart } from "@/components/admin/charts/simple-bar-chart";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { listAdminHighlights } from "@/lib/supabase/admin/highlights";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type HighlightsPageProps = {
  searchParams: Promise<{
    q?: string;
    color?: string;
    userId?: string;
    bookId?: string;
    page?: string;
  }>;
};

export default async function AdminHighlightsPage({ searchParams }: HighlightsPageProps) {
  const { q, color, userId, bookId, page } = await searchParams;
  const data = await listAdminHighlights({
    page: page ? Number(page) : 1,
    search: q,
    color: color ?? "",
    userId: userId ?? "",
    bookId: bookId ?? "",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Highlights"
        description="Consultation, moderation et analyse d engagement lecture a partir des highlights lecteurs."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Highlights" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Couleurs utilisees" description="Distribution des couleurs d annotation.">
          <SimpleBarChart data={data.stats.byColor} />
        </AdminPanel>
        <AdminPanel title="Livres les plus annotés" description="Indicateur simple d engagement sur le corpus visible.">
          <SimpleBarChart data={data.stats.topBooks} />
        </AdminPanel>
      </div>

      <AdminPanel title="Filtres" description="Recherche textuelle par utilisateur ou livre, plus filtre par couleur.">
        <AdminFilterBar action="/admin/highlights">
          <AdminSearchInput defaultValue={q} placeholder="Utilisateur ou livre" />
          <AdminSelect
            name="color"
            label="Couleur"
            defaultValue={color}
            options={[
              { label: "yellow", value: "yellow" },
              { label: "blue", value: "blue" },
              { label: "green", value: "green" },
              { label: "pink", value: "pink" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/highlights" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Tous les highlights" description="Suppression possible si le contenu devient problematique.">
        <AdminDataTable columns={["Utilisateur", "Livre", "Extrait", "Couleur", "Date", "Action"]}>
          {data.items.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70 align-top">
              <td className="px-4 py-3 text-sm text-slate-500">{entry.user_name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.book_title}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.text?.slice(0, 90) || entry.note || "Sans texte"}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{entry.color}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.created_at)}</td>
              <td className="px-4 py-3">
                <form action={deleteHighlightAction}>
                  <input type="hidden" name="highlight_id" value={entry.id} />
                  <input type="hidden" name="redirect_to" value="/admin/highlights" />
                  <ConfirmSubmitButton
                    label="Supprimer"
                    confirmMessage="Supprimer ce highlight ?"
                    className="cta-secondary px-4 py-2 text-xs text-rose-700"
                  />
                </form>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination basePath="/admin/highlights" pagination={data.pagination} params={{ q: q ?? "", color: color ?? "" }} />
        </div>
      </AdminPanel>
    </div>
  );
}
