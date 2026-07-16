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
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Highlights"
        description="Consultation, modération et analyse d'engagement lecture à partir des highlights lecteurs."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Highlights" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Couleurs utilisées" description="Distribution des couleurs d'annotation.">
          <SimpleBarChart data={data.stats.byColor} />
        </AdminPanel>
        <AdminPanel title="Livres les plus annotés" description="Indicateur simple d'engagement sur le corpus visible.">
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
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Appliquer
            </button>
            <Link
              href="/admin/highlights"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Réinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Tous les highlights" description="Suppression possible si le contenu devient problématique.">
        <AdminDataTable columns={["Utilisateur", "Livre", "Extrait", "Couleur", "Date", "Action"]}>
          {data.items.map((entry) => (
            <tr key={entry.id} className="border-t border-gray-200 align-top hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600">{entry.user_name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{entry.book_title}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{entry.text?.slice(0, 90) || entry.note || "Sans texte"}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.color}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{formatAdminDateTime(entry.created_at)}</td>
              <td className="px-4 py-3">
                <form action={deleteHighlightAction}>
                  <input type="hidden" name="highlight_id" value={entry.id} />
                  <input type="hidden" name="redirect_to" value="/admin/highlights" />
                  <ConfirmSubmitButton
                    label="Supprimer"
                    confirmMessage="Supprimer ce highlight ?"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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