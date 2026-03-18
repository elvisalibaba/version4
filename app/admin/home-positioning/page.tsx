import { ArrowDown, ArrowUp, BookCopy, BringToFront, LayoutDashboard, RefreshCw } from "lucide-react";
import {
  addHomeFeaturedBookAction,
  clearHomeFeaturedBooksAction,
  moveHomeFeaturedBookAction,
  removeHomeFeaturedBookAction,
} from "@/app/admin/actions";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { getAdminHomePositioningData } from "@/lib/admin/home-positioning";
import { formatMoney } from "@/lib/book-offers";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

export default async function AdminHomePositioningPage() {
  const data = await getAdminHomePositioningData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Positionnement home"
        description="Choisis l ordre des livres a pousser en tete de la home pour mettre tes priorites editoriales devant."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Positionnement home" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={BringToFront} label="Livres epingles" value={data.selectedBooks.length} hint="Ordre manuel prioritaire sur la home" />
        <AdminKpiCard icon={BookCopy} label="Catalogue publie" value={data.eligibleBooks.length} hint="Base disponible pour la selection" tone="sky" />
        <AdminKpiCard icon={LayoutDashboard} label="Apercu frontal" value={data.previewBooks.length} hint="Top livres renvoyes dans les premiers blocs" tone="emerald" />
        <AdminKpiCard icon={RefreshCw} label="Derniere mise a jour" value={formatAdminDateTime(data.config.updatedAt)} hint="Horodatage de configuration" tone="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {data.notices.map((notice) => (
          <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
        ))}
      </div>

      <AdminPanel title="Ajouter un livre en avant" description="Le livre ajoute rejoint la file prioritaire et remonte automatiquement dans les blocs principaux de la home.">
        <div className="flex flex-wrap gap-4">
          <form action={addHomeFeaturedBookAction} className="flex min-w-[320px] flex-1 flex-wrap items-end gap-4">
            <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
            <label className="grid min-w-[320px] flex-1 gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Livre</span>
              <select name="book_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                {data.eligibleOptions.length > 0 ? (
                  data.eligibleOptions.map((book) => (
                    <option key={book.value} value={book.value}>
                      {book.label}
                    </option>
                  ))
                ) : (
                  <option value="">Aucun livre publie</option>
                )}
              </select>
            </label>
            <button type="submit" disabled={data.eligibleOptions.length === 0} className="cta-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              Ajouter
            </button>
          </form>

          <form action={clearHomeFeaturedBooksAction} className="flex items-end">
            <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
            <ConfirmSubmitButton
              label="Reinitialiser"
              confirmMessage="Vider toute la file de positionnement home ?"
              className="cta-secondary px-5 py-3 text-sm text-rose-700"
            />
          </form>
        </div>
      </AdminPanel>

      <AdminPanel title="Ordre actuel" description="Cet ordre est applique pour mettre les livres en avant sur la home, avant le tri automatique par performance.">
        <AdminDataTable columns={["Position", "Livre", "Auteur", "Prix", "Actions"]}>
          {data.selectedBooks.map((book, index) => {
            const canMoveUp = index > 0;
            const canMoveDown = index < data.selectedBooks.length - 1;

            return (
              <tr key={book.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">#{index + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{book.title}</p>
                  <p className="text-sm text-slate-500">{book.display_price_label}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{book.author_name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(book.price, book.currency_code)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={moveHomeFeaturedBookAction}>
                      <input type="hidden" name="book_id" value={book.id} />
                      <input type="hidden" name="direction" value="up" />
                      <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
                      <button
                        type="submit"
                        disabled={!canMoveUp}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Monter"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    </form>

                    <form action={moveHomeFeaturedBookAction}>
                      <input type="hidden" name="book_id" value={book.id} />
                      <input type="hidden" name="direction" value="down" />
                      <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
                      <button
                        type="submit"
                        disabled={!canMoveDown}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Descendre"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </form>

                    <form action={removeHomeFeaturedBookAction}>
                      <input type="hidden" name="book_id" value={book.id} />
                      <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
                      <ConfirmSubmitButton
                        label="Retirer"
                        confirmMessage={`Retirer ${book.title} de la file prioritaire ?`}
                        className="cta-secondary px-4 py-2 text-xs text-rose-700"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminDataTable>
        {data.selectedBooks.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucun livre n est actuellement epingle.</p> : null}
      </AdminPanel>

      <AdminPanel title="Apercu frontal" description="Projection des premiers livres renvoyes a la home apres application de la file prioritaire.">
        {data.previewBooks.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {data.previewBooks.map((book, index) => (
              <article key={book.id} className="rounded-[1.5rem] border border-violet-200/60 bg-violet-50/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">Slot {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{book.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{book.author_name}</p>
                <p className="mt-3 text-sm text-slate-500">{formatMoney(book.price, book.currency_code)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun livre publie disponible pour l apercu.</p>
        )}
      </AdminPanel>
    </div>
  );
}
