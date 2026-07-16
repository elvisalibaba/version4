import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_FORMATS, getBookFormatLabel } from "@/lib/book-formats";
import { formatMoney } from "@/lib/book-offers";
import { deleteBookFormatAction, saveBookFormatAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { getAdminFormatDetail } from "@/lib/supabase/admin/formats";

type FormatDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminFormatDetailPage({ params }: FormatDetailPageProps) {
  const { id } = await params;
  const data = await getAdminFormatDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${getBookFormatLabel(data.format.format)} - ${data.book.title}`}
        description="Edition d un format lie a un livre, avec controle de publication, prix et lecture protegee web/app."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Formats", href: "/admin/formats" },
          { label: getBookFormatLabel(data.format.format) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <AdminPanel title="Contexte" description="Livre et auteur relies a ce format.">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Livre</dt>
              <dd className="text-slate-500">
                <Link href={`/admin/books/${data.book.id}`} className="font-semibold text-violet-700">
                  {data.book.title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Auteur</dt>
              <dd className="text-slate-500">{data.book.author_name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Etat livre</dt>
              <dd className="mt-2">
                <StatusBadge kind="book" value={data.book.status} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Prix vitrine livre</dt>
              <dd className="text-slate-500">{formatMoney(data.book.price, data.book.currency_code)}</dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Editer le format" description="Metadonnees, cout d impression et assets du format actuel.">
          <form action={saveBookFormatAction} className="grid gap-4">
            <input type="hidden" name="format_id" value={data.format.id} />
            <input type="hidden" name="book_id" value={data.book.id} />
            <input type="hidden" name="redirect_to" value={`/admin/formats/${data.format.id}`} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Format</span>
                <select name="format" defaultValue={data.format.format} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                  {BOOK_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {getBookFormatLabel(format)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix</span>
                <input type="number" step="0.01" name="price" defaultValue={data.format.price} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
                <input type="text" name="currency_code" defaultValue={data.format.currency_code} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cout impression</span>
                <input type="number" step="0.01" name="printing_cost" defaultValue={data.format.printing_cost ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stock</span>
                <input type="number" name="stock_quantity" defaultValue={data.format.stock_quantity ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
              </label>
              <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-3 text-sm text-slate-500">
                Pour les formats papier, le cout d impression aide l admin a arbitrer la marge, le prix public et la preparation de commande.
              </div>
            </div>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">File URL</span>
              <input type="text" name="file_url" defaultValue={data.format.file_url ?? ""} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm leading-7 text-slate-700">
                Les ebooks sont maintenant verrouilles en lecture protegee: site Holistique Books ou application uniquement.
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="is_published" defaultChecked={data.format.is_published} />
                Publier ce format
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="cta-primary px-5 py-3 text-sm">
                Enregistrer
              </button>
            </div>
          </form>
          <form action={deleteBookFormatAction} className="mt-4">
            <input type="hidden" name="format_id" value={data.format.id} />
            <input type="hidden" name="book_id" value={data.book.id} />
            <input type="hidden" name="redirect_to" value="/admin/formats" />
            <ConfirmSubmitButton
              label="Supprimer le format"
              confirmMessage="Supprimer ce format non publie ?"
              className="cta-secondary px-5 py-3 text-sm text-rose-700"
            />
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Le delete reste volontairement prudent: l action ne s applique que si le format n est pas publie.
          </p>
        </AdminPanel>
      </div>
    </div>
  );
}
