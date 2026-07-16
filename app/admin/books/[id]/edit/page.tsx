import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopyrightStatusLabel } from "@/lib/book-copyright";
import { getAdminBookDetail, getAdminBookEditorOptions } from "@/lib/supabase/admin/books";
import { updateBookAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type BookEditPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

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
        description="Edition admin complete des metadonnees, de la revue et du controle droits du livre."
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

      {data.book.copyright_status === "blocked" ? (
        <AdminNotice
          tone="danger"
          title="Livre actuellement bloque pour droits d auteur"
          description="Tant que ce blocage reste actif, le livre doit rester coupe cote detail public, lecture web et checkout."
        />
      ) : null}

      <form action={updateBookAction} className="space-y-6">
        <input type="hidden" name="book_id" value={data.book.id} />
        <input type="hidden" name="redirect_to" value={`/admin/books/${data.book.id}`} />

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel title="Identite editoriale" description="Titre, compte editeur, auteur affiche et visibilite du livre.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titre</span>
                <input
                  type="text"
                  name="title"
                  defaultValue={data.book.title}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sous-titre</span>
                <input
                  type="text"
                  name="subtitle"
                  defaultValue={data.book.subtitle ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Compte editeur</span>
                <select
                  name="author_id"
                  defaultValue={data.book.author_id}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                >
                  {editorOptions.authors.map((author) => (
                    <option key={author.value} value={author.value}>
                      {author.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Auteur affiche</span>
                <input
                  type="text"
                  name="author_display_name"
                  defaultValue={data.book.author_display_name ?? data.book.author_name}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status catalogue</span>
                <select
                  name="status"
                  defaultValue={data.book.status}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                  <option value="coming_soon">coming_soon</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span>
                <textarea
                  name="description"
                  defaultValue={data.book.description ?? ""}
                  rows={7}
                  className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="Commerce et diffusion" description="Prix vitrine, publication et modes d acces.">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix vitrine</span>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={data.book.price}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
                  <input
                    type="text"
                    name="currency_code"
                    defaultValue={data.book.currency_code}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Langue</span>
                  <input
                    type="text"
                    name="language"
                    defaultValue={data.book.language}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date de publication</span>
                  <input
                    type="date"
                    name="publication_date"
                    defaultValue={data.book.publication_date ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Published at</span>
                <input
                  type="datetime-local"
                  name="published_at"
                  defaultValue={formatDateTimeLocalValue(data.book.published_at)}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
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
          <AdminPanel title="Pilotage editorial" description="Soumission, revue admin et horodatage metier.">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review status</span>
                  <select
                    name="review_status"
                    defaultValue={data.book.review_status}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  >
                    <option value="draft">draft</option>
                    <option value="submitted">submitted</option>
                    <option value="approved">approved</option>
                    <option value="changes_requested">changes_requested</option>
                    <option value="rejected">rejected</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Droits d auteur</span>
                  <select
                    name="copyright_status"
                    defaultValue={data.book.copyright_status}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  >
                    <option value="clear">{getCopyrightStatusLabel("clear")}</option>
                    <option value="review">{getCopyrightStatusLabel("review")}</option>
                    <option value="blocked">{getCopyrightStatusLabel("blocked")}</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submitted at</span>
                  <input
                    type="datetime-local"
                    name="submitted_at"
                    defaultValue={formatDateTimeLocalValue(data.book.submitted_at)}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reviewed at</span>
                  <input
                    type="datetime-local"
                    name="reviewed_at"
                    defaultValue={formatDateTimeLocalValue(data.book.reviewed_at)}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Note de revue</span>
                <textarea
                  name="review_note"
                  defaultValue={data.book.review_note ?? ""}
                  rows={4}
                  className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Note droits / blocage</span>
                <textarea
                  name="copyright_note"
                  defaultValue={data.book.copyright_note ?? ""}
                  rows={5}
                  className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>

              <p className="text-xs leading-6 text-slate-500">
                Le nom de l admin qui a traite la revue ou pose le blocage est renseigne automatiquement lors de l enregistrement.
              </p>
            </div>
          </AdminPanel>

          <AdminPanel title="Compteurs et systeme" description="Correction manuelle des signaux visibles et reperes temporels.">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Views count</span>
                  <input
                    type="number"
                    min="0"
                    name="views_count"
                    defaultValue={data.book.views_count}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Purchases count</span>
                  <input
                    type="number"
                    min="0"
                    name="purchases_count"
                    defaultValue={data.book.purchases_count}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rating average</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    name="rating_avg"
                    defaultValue={data.book.rating_avg ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ratings count</span>
                  <input
                    type="number"
                    min="0"
                    name="ratings_count"
                    defaultValue={data.book.ratings_count}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.3rem] border border-violet-200/70 bg-violet-50/50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cree le</p>
                  <p className="mt-2 text-sm text-slate-900">{data.book.created_at}</p>
                </div>
                <div className="rounded-[1.3rem] border border-violet-200/70 bg-violet-50/50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Derniere mise a jour</p>
                  <p className="mt-2 text-sm text-slate-900">{data.book.updated_at}</p>
                </div>
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel title="Metadonnees enrichies" description="Champs metadata et organisation editoriale.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ISBN</span>
                <input
                  type="text"
                  name="isbn"
                  defaultValue={data.book.isbn ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publisher</span>
                <input
                  type="text"
                  name="publisher"
                  defaultValue={data.book.publisher ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Page count</span>
                  <input
                    type="number"
                    name="page_count"
                    defaultValue={data.book.page_count ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Age rating</span>
                  <input
                    type="text"
                    name="age_rating"
                    defaultValue={data.book.age_rating ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Edition</span>
                  <input
                    type="text"
                    name="edition"
                    defaultValue={data.book.edition ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Series name</span>
                  <input
                    type="text"
                    name="series_name"
                    defaultValue={data.book.series_name ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Series position</span>
                  <input
                    type="number"
                    name="series_position"
                    defaultValue={data.book.series_position ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Co-authors</span>
                  <input
                    type="text"
                    name="co_authors"
                    defaultValue={data.book.co_authors.join(", ")}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</span>
                <input
                  type="text"
                  name="categories"
                  defaultValue={data.book.categories.join(", ")}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tags</span>
                <input
                  type="text"
                  name="tags"
                  defaultValue={data.book.tags.join(", ")}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="Assets et fichiers" description="URLs cover, extrait et fichier principal.">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover URL</span>
                <input
                  type="url"
                  name="cover_url"
                  defaultValue={data.book.cover_url ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover thumbnail URL</span>
                <input
                  type="url"
                  name="cover_thumbnail_url"
                  defaultValue={data.book.cover_thumbnail_url ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cover alt text</span>
                <input
                  type="text"
                  name="cover_alt_text"
                  defaultValue={data.book.cover_alt_text ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File URL</span>
                <input
                  type="text"
                  name="file_url"
                  defaultValue={data.book.file_url ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample URL</span>
                <input
                  type="text"
                  name="sample_url"
                  defaultValue={data.book.sample_url ?? ""}
                  className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sample pages</span>
                  <input
                    type="number"
                    name="sample_pages"
                    defaultValue={data.book.sample_pages ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File format</span>
                  <input
                    type="text"
                    name="file_format"
                    defaultValue={data.book.file_format ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File size</span>
                  <input
                    type="number"
                    name="file_size"
                    defaultValue={data.book.file_size ?? ""}
                    className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
                  />
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
