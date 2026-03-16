import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBookDetail, getAdminBookEditorOptions } from "@/lib/supabase/admin/books";
import { updateBookAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type BookEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBookEditPage({ params }: BookEditPageProps) {
  const { id } = await params;
  const [data, editorOptions] = await Promise.all([getAdminBookDetail(id), getAdminBookEditorOptions()]);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editer: ${data.book.title}`}
        description="Edition serveur des metadonnees du livre dans les limites du schema actuel."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Livres", href: "/admin/books" },
          { label: data.book.title, href: `/admin/books/${data.book.id}` },
          { label: "Edition" },
        ]}
        actions={
          <Link href={`/admin/books/${data.book.id}`} className="cta-secondary px-5 py-3 text-sm">
            Retour au detail
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

      <form action={updateBookAction} className="space-y-6">
        <input type="hidden" name="book_id" value={data.book.id} />
        <input type="hidden" name="redirect_to" value={`/admin/books/${data.book.id}`} />

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel title="Identite editoriale" description="Titre, auteur et visibilite du livre.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titre</span>
                <input type="text" name="title" defaultValue={data.book.title} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sous-titre</span>
                <input type="text" name="subtitle" defaultValue={data.book.subtitle ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Auteur</span>
                <select name="author_id" defaultValue={data.book.author_id} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                  {editorOptions.authors.map((author) => (
                    <option key={author.value} value={author.value}>
                      {author.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
                <select name="status" defaultValue={data.book.status} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                  <option value="coming_soon">coming_soon</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span>
                <textarea name="description" defaultValue={data.book.description ?? ""} rows={7} className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="Commerce et diffusion" description="Prix vitrine, publication et disponibilites.">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix vitrine</span>
                  <input type="number" step="0.01" name="price" defaultValue={data.book.price} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
                  <input type="text" name="currency_code" defaultValue={data.book.currency_code} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Langue</span>
                  <input type="text" name="language" defaultValue={data.book.language} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date de publication</span>
                  <input type="date" name="publication_date" defaultValue={data.book.publication_date ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Published at</span>
                <input type="datetime-local" name="published_at" defaultValue={data.book.published_at ? data.book.published_at.slice(0, 16) : ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="is_single_sale_enabled" defaultChecked={data.book.is_single_sale_enabled} />
                  Activer la vente unitaire
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" name="is_subscription_available" defaultChecked={data.book.is_subscription_available} />
                  Activer l acces abonnement
                </label>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel title="Metadonnees enrichies" description="Champs metadata et organisation editoriale.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ISBN</span>
                <input type="text" name="isbn" defaultValue={data.book.isbn ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publisher</span>
                <input type="text" name="publisher" defaultValue={data.book.publisher ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Page count</span>
                  <input type="number" name="page_count" defaultValue={data.book.page_count ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Age rating</span>
                  <input type="text" name="age_rating" defaultValue={data.book.age_rating ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Edition</span>
                  <input type="text" name="edition" defaultValue={data.book.edition ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Series name</span>
                  <input type="text" name="series_name" defaultValue={data.book.series_name ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Series position</span>
                  <input type="number" name="series_position" defaultValue={data.book.series_position ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Co-authors</span>
                  <input type="text" name="co_authors" defaultValue={data.book.co_authors.join(", ")} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</span>
                <input type="text" name="categories" defaultValue={data.book.categories.join(", ")} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tags</span>
                <input type="text" name="tags" defaultValue={data.book.tags.join(", ")} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="Assets et fichiers" description="URLs cover, sample et fichier principal.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover URL</span>
                <input type="url" name="cover_url" defaultValue={data.book.cover_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover thumbnail URL</span>
                <input type="url" name="cover_thumbnail_url" defaultValue={data.book.cover_thumbnail_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover alt text</span>
                <input type="text" name="cover_alt_text" defaultValue={data.book.cover_alt_text ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File URL</span>
                <input type="text" name="file_url" defaultValue={data.book.file_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample URL</span>
                <input type="text" name="sample_url" defaultValue={data.book.sample_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample pages</span>
                  <input type="number" name="sample_pages" defaultValue={data.book.sample_pages ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File format</span>
                  <input type="text" name="file_format" defaultValue={data.book.file_format ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File size</span>
                  <input type="number" name="file_size" defaultValue={data.book.file_size ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
                </label>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="cta-primary px-6 py-3 text-sm">
            Enregistrer les modifications
          </button>
          <Link href={`/admin/books/${data.book.id}`} className="cta-secondary px-6 py-3 text-sm">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
