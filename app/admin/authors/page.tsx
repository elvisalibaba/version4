import Link from "next/link";
import { formatMoney } from "@/lib/book-offers";
import { listAdminAuthors } from "@/lib/supabase/admin/authors";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type AuthorsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function AdminAuthorsPage({ searchParams }: AuthorsPageProps) {
  const { q, page } = await searchParams;
  const data = await listAdminAuthors({
    page: page ? Number(page) : 1,
    search: q,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Auteurs"
        description="Vue conjointe de author_profiles, profiles et performances du catalogue par auteur."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Auteurs" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <AdminPanel title="Filtres" description="Recherche par nom public, email, bio, website ou localisation.">
        <AdminFilterBar action="/admin/authors">
          <AdminSearchInput defaultValue={q} placeholder="Nom auteur, email, bio, location" />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/authors" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Fiches auteur" description="Performances commerciales et editoriales consolidees par auteur.">
        <AdminDataTable columns={["Auteur", "Localisation", "Livres", "Vues", "Achats", "Rating", "Ventes estimees"]}>
          {data.items.map((author) => (
            <tr key={author.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/authors/${author.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {author.displayName}
                </Link>
                <p className="text-sm text-slate-500">{author.email}</p>
                {author.website ? (
                  <a href={author.website} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                    {author.website}
                  </a>
                ) : null}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{author.location ?? "-"}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{author.booksCount}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{author.totalViews}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{author.totalPurchases}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{author.averageRating ? `${author.averageRating}/5` : "-"}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{formatMoney(author.estimatedSales)}</td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination basePath="/admin/authors" pagination={data.pagination} params={{ q: q ?? "" }} />
        </div>
      </AdminPanel>
    </div>
  );
}
