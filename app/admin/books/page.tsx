import Link from "next/link";
import { getCopyrightStatusLabel } from "@/lib/book-copyright";
import { formatMoney } from "@/lib/book-offers";
import { listAdminBooks } from "@/lib/supabase/admin/books";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type BooksPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: "draft" | "published" | "archived" | "coming_soon";
    reviewStatus?: "draft" | "submitted" | "approved" | "rejected" | "changes_requested";
    copyrightStatus?: "clear" | "review" | "blocked";
    language?: string;
    authorId?: string;
    category?: string;
    singleSaleEnabled?: string;
    subscriptionAvailable?: string;
    sort?: "views" | "purchases" | "rating" | "recent";
    page?: string;
  }>;
};

export default async function AdminBooksPage({ searchParams }: BooksPageProps) {
  const {
    q,
    status,
    reviewStatus,
    copyrightStatus,
    language,
    authorId,
    category,
    singleSaleEnabled,
    subscriptionAvailable,
    sort,
    page,
  } = await searchParams;

  const data = await listAdminBooks({
    page: page ? Number(page) : 1,
    search: q,
    status: status ?? "",
    reviewStatus: reviewStatus ?? "",
    copyrightStatus: copyrightStatus ?? "",
    language: language ?? "",
    authorId: authorId ?? "",
    category: category ?? "",
    singleSaleEnabled: singleSaleEnabled ?? "",
    subscriptionAvailable: subscriptionAvailable ?? "",
    sort: sort ?? "recent",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Livres"
        description="Gestion du catalogue principal, de la revue des soumissions auteur, des prix vitrine et des disponibilites vente / abonnement."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Livres" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <AdminPanel title="Filtres catalogue" description="Recherche texte, criteres editoriaux et tri metier sur le schema books actuel.">
        <AdminFilterBar action="/admin/books">
          <AdminSearchInput defaultValue={q} placeholder="Titre, sous-titre, description ou ISBN" />
          <AdminSelect name="status" label="Status" defaultValue={status} options={data.filterOptions.statuses} />
          <AdminSelect name="reviewStatus" label="Revue" defaultValue={reviewStatus} options={data.filterOptions.reviewStatuses} />
          <AdminSelect name="copyrightStatus" label="Droits" defaultValue={copyrightStatus} options={data.filterOptions.copyrightStatuses} />
          <AdminSelect name="language" label="Langue" defaultValue={language} options={data.filterOptions.languages} />
          <AdminSelect name="authorId" label="Auteur" defaultValue={authorId} options={data.filterOptions.authors} />
          <AdminSelect name="category" label="Categorie" defaultValue={category} options={data.filterOptions.categories} />
          <AdminSelect
            name="singleSaleEnabled"
            label="Vente unitaire"
            defaultValue={singleSaleEnabled}
            options={[
              { label: "Activee", value: "true" },
              { label: "Desactivee", value: "false" },
            ]}
          />
          <AdminSelect
            name="subscriptionAvailable"
            label="Abonnement"
            defaultValue={subscriptionAvailable}
            options={[
              { label: "Disponible", value: "true" },
              { label: "Indisponible", value: "false" },
            ]}
          />
          <AdminSelect
            name="sort"
            label="Tri"
            defaultValue={sort ?? "recent"}
            options={[
              { label: "Plus recents", value: "recent" },
              { label: "Plus vus", value: "views" },
              { label: "Plus vendus", value: "purchases" },
              { label: "Mieux notes", value: "rating" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/books" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Catalogue complet" description="books.price reste le prix vitrine principal ; les prix par format, l'etat de revue et le controle droits sont consultables dans les details du livre.">
        <AdminDataTable columns={["Livre", "Auteur", "Etat", "Revue", "Droits", "Prix", "Stats", "Publication", "Actions"]}>
          {data.items.map((book) => (
            <tr key={book.id} className="border-t border-violet-100/70 align-top">
              <td className="px-4 py-3">
                <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {book.title}
                </Link>
                {book.subtitle ? <p className="text-sm text-slate-500">{book.subtitle}</p> : null}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{book.author_name}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="book" value={book.status} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge kind="review" value={book.review_status} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge kind="copyright" value={book.copyright_status} label={getCopyrightStatusLabel(book.copyright_status)} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(book.price, book.currency_code)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {book.views_count} vues - {book.purchases_count} achats
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  {book.rating_avg ? `${book.rating_avg}/5` : "-"} - {book.ratings_count} notes
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {formatAdminDateTime(book.published_at || book.created_at)}
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{book.language.toUpperCase()}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/books/${book.id}`} className="cta-secondary px-4 py-2 text-xs">
                    Detail
                  </Link>
                  <Link href={`/admin/books/${book.id}/edit`} className="cta-secondary px-4 py-2 text-xs">
                    Editer
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/books"
            pagination={data.pagination}
            params={{
              q: q ?? "",
              status: status ?? "",
              reviewStatus: reviewStatus ?? "",
              copyrightStatus: copyrightStatus ?? "",
              language: language ?? "",
              authorId: authorId ?? "",
              category: category ?? "",
              singleSaleEnabled: singleSaleEnabled ?? "",
              subscriptionAvailable: subscriptionAvailable ?? "",
              sort: sort ?? "recent",
            }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
