import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/book-offers";
import { getAdminAuthorDetail } from "@/lib/supabase/admin/authors";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { updateAuthorProfileAction } from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type AuthorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAuthorDetailPage({ params }: AuthorDetailPageProps) {
  const { id } = await params;
  const data = await getAdminAuthorDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.profile.display_name}
        description="Pilotage detaille d un auteur, de son catalogue, de ses formats et de ses performances commerciales."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Auteurs", href: "/admin/authors" },
          { label: data.profile.display_name },
        ]}
        actions={
          <Link href="/admin/authors" className="cta-secondary px-5 py-3 text-sm">
            Retour a la liste
          </Link>
        }
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel title="Profil auteur" description="Edition des champs author_profiles sans changer le schema.">
          <form action={updateAuthorProfileAction} className="grid gap-4">
            <input type="hidden" name="author_id" value={data.profile.id} />
            <input type="hidden" name="redirect_to" value={`/admin/authors/${data.profile.id}`} />
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Display name</span>
              <input type="text" name="display_name" defaultValue={data.profile.display_name} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Website</span>
              <input type="url" name="website" defaultValue={data.profile.website ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location</span>
              <input type="text" name="location" defaultValue={data.profile.location ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Professional headline</span>
              <input type="text" name="professional_headline" defaultValue={data.profile.professional_headline ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</span>
              <input type="text" name="phone" defaultValue={data.profile.phone ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Avatar URL</span>
              <input type="url" name="avatar_url" defaultValue={data.profile.avatar_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Genres</span>
              <input type="text" name="genres" defaultValue={data.profile.genres.join(", ")} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bio</span>
              <textarea name="bio" defaultValue={data.profile.bio ?? ""} rows={5} className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publishing goals</span>
              <textarea name="publishing_goals" defaultValue={data.profile.publishing_goals ?? ""} rows={4} className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
            </label>
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Enregistrer
            </button>
          </form>
        </AdminPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminPanel>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Livres</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.booksCount}</p>
          </AdminPanel>
          <AdminPanel>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vues</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.totalViews}</p>
          </AdminPanel>
          <AdminPanel>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Achats</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.totalPurchases}</p>
          </AdminPanel>
          <AdminPanel>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ventes estimees</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatMoney(data.metrics.estimatedSales)}</p>
            <p className="mt-2 text-sm text-slate-500">{data.metrics.averageRating ? `${data.metrics.averageRating}/5 de moyenne` : "Pas encore de notes."}</p>
          </AdminPanel>
        </div>
      </div>

      <AdminPanel title="Catalogue auteur" description="Acces rapide aux livres, formats, plans et performances par titre.">
        <AdminDataTable columns={["Livre", "Etat", "Formats", "Commandes", "Plans", "Actions"]}>
          {data.books.map((book) => (
            <tr key={book.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {book.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {book.views_count} vues - {book.purchases_count} achats
                </p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge kind="book" value={book.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {book.formatCount} format(s)
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{book.availableFormats.join(", ") || "Aucun"}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{book.orderCount}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{book.includedPlanCount}</td>
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
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Formats disponibles" description="Declinaisons commerciales et techniques sur les livres de cet auteur.">
          <AdminDataTable columns={["Livre", "Format", "Prix", "Publication"]}>
            {data.formats.map((format) => (
              <tr key={format.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3 text-sm text-slate-500">
                  {data.books.find((book) => book.id === format.book_id)?.title ?? "Livre inconnu"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="format" value={format.format} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(format.price, format.currency_code)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{format.is_published ? "Publie" : "Brouillon"}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Plans lies indirectement" description="Livres de l auteur actuellement inclus dans un ou plusieurs plans Premium.">
          <AdminDataTable columns={["Plan", "Livre", "Ajout"]}>
            {data.subscriptionMappings.map((mapping) => (
              <tr key={mapping.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3 font-semibold text-slate-950">{mapping.plan_name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{mapping.book_title}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(mapping.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>
    </div>
  );
}
