import Link from "next/link";
import { deleteRatingAction } from "@/app/admin/actions";
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
import { listAdminRatings } from "@/lib/supabase/admin/ratings";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type RatingsPageProps = {
  searchParams: Promise<{
    q?: string;
    rating?: string;
    userId?: string;
    bookId?: string;
    page?: string;
  }>;
};

export default async function AdminRatingsPage({ searchParams }: RatingsPageProps) {
  const { q, rating, userId, bookId, page } = await searchParams;
  const data = await listAdminRatings({
    page: page ? Number(page) : 1,
    search: q,
    rating: rating ?? "",
    userId: userId ?? "",
    bookId: bookId ?? "",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notes lecteurs"
        description="Lecture, tri et moderation des ratings, avec statistiques derivees par note et par livre."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Notes" },
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
        <AdminPanel title="Distribution" description="Répartition des notes de 1 a 5.">
          <SimpleBarChart data={data.stats.distribution} />
        </AdminPanel>
        <AdminPanel title="Moyennes par livre" description={`Moyenne globale: ${data.stats.averageGlobal ? `${data.stats.averageGlobal}/5` : "-"}`}>
          <SimpleBarChart data={data.stats.averageByBook} />
        </AdminPanel>
      </div>

      <AdminPanel title="Filtres" description="Recherche par livre ou utilisateur, plus filtre de note.">
        <AdminFilterBar action="/admin/ratings">
          <AdminSearchInput defaultValue={q} placeholder="Utilisateur ou livre" />
          <AdminSelect
            name="rating"
            label="Note"
            defaultValue={rating}
            options={[
              { label: "1", value: "1" },
              { label: "2", value: "2" },
              { label: "3", value: "3" },
              { label: "4", value: "4" },
              { label: "5", value: "5" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/ratings" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Toutes les notes" description="Suppression possible pour moderation ou correction.">
        <AdminDataTable columns={["Utilisateur", "Livre", "Note", "Date", "Action"]}>
          {data.items.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3 text-sm text-slate-500">{entry.user_name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.book_title}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{entry.rating}/5</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.created_at)}</td>
              <td className="px-4 py-3">
                <form action={deleteRatingAction}>
                  <input type="hidden" name="rating_id" value={entry.id} />
                  <input type="hidden" name="redirect_to" value="/admin/ratings" />
                  <ConfirmSubmitButton
                    label="Supprimer"
                    confirmMessage="Supprimer cette note ?"
                    className="cta-secondary px-4 py-2 text-xs text-rose-700"
                  />
                </form>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination basePath="/admin/ratings" pagination={data.pagination} params={{ q: q ?? "", rating: rating ?? "" }} />
        </div>
      </AdminPanel>
    </div>
  );
}
