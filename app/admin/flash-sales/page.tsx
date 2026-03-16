import { BookCopy, LayoutDashboard, RefreshCw, Tag } from "lucide-react";
import { addFlashSaleBookAction, clearFlashSaleBooksAction, removeFlashSaleBookAction, updateFlashSaleDiscountAction } from "@/app/admin/actions";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { getAdminFlashSaleData } from "@/lib/admin/flash-sales";
import { formatMoney } from "@/lib/book-offers";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

export default async function AdminFlashSalesPage() {
  const data = await getAdminFlashSaleData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Flash sale"
        description="Management de la selection promotionnelle visible sur la home, avec ajout, retrait, ajustement global de la remise et stockage compatible Vercel."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Flash sale" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={Tag} label="Remise active" value={`${data.config.discountPercentage}%`} hint="Appliquee visuellement dans le bloc public" />
        <AdminKpiCard icon={BookCopy} label="Selection manuelle" value={data.selectedBooks.length} hint={`${data.eligibleBooks.length} livres eligibles`} tone="sky" />
        <AdminKpiCard icon={LayoutDashboard} label="Slots affiches" value={data.dealBooks.filter(Boolean).length} hint="La home affiche jusqu'a 3 offres" tone="emerald" />
        <AdminKpiCard icon={RefreshCw} label="Derniere mise a jour" value={formatAdminDateTime(data.config.updatedAt)} hint="Horodatage de la configuration" tone="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {data.notices.map((notice) => (
          <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
        ))}
      </div>

      <AdminPanel title="Regler la remise" description="Le pricing public n'est pas modifie en base: cette configuration pilote uniquement l'affichage du bloc flash sale.">
        <form action={updateFlashSaleDiscountAction} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="redirect_to" value="/admin/flash-sales" />
          <label className="grid min-w-[220px] gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pourcentage de remise</span>
            <input
              type="number"
              name="discount_percentage"
              min="0"
              max="90"
              defaultValue={String(data.config.discountPercentage)}
              className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900"
            />
          </label>
          <button type="submit" className="cta-primary px-5 py-3 text-sm">
            Enregistrer
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="Ajouter un livre a la flash sale" description="Seuls les livres eligibles a la vente unitaire payante sont proposes.">
        <div className="flex flex-wrap gap-4">
          <form action={addFlashSaleBookAction} className="flex min-w-[320px] flex-1 flex-wrap items-end gap-4">
            <input type="hidden" name="redirect_to" value="/admin/flash-sales" />
            <label className="grid min-w-[320px] flex-1 gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Livre</span>
              <select name="book_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                {data.eligibleOptions.map((book) => (
                  <option key={book.value} value={book.value}>
                    {book.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Ajouter
            </button>
          </form>

          <form action={clearFlashSaleBooksAction} className="flex items-end">
            <input type="hidden" name="redirect_to" value="/admin/flash-sales" />
            <ConfirmSubmitButton
              label="Vider la selection"
              confirmMessage="Vider toute la selection flash sale ?"
              className="cta-secondary px-5 py-3 text-sm text-rose-700"
            />
          </form>
        </div>
      </AdminPanel>

      <AdminPanel title="Selection actuelle" description="Les livres ci-dessous sont pousses en priorite sur la home. Les slots restants se completent avec le fallback public.">
        <AdminDataTable columns={["Livre", "Auteur", "Prix public", "Prix flash", "Action"]}>
          {data.selectedBooks.map((book) => {
            const salePrice = book.price * ((100 - data.config.discountPercentage) / 100);

            return (
              <tr key={book.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{book.title}</p>
                  <p className="text-sm text-slate-500">{book.display_price_label}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{book.author_name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(book.price, book.currency_code)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(salePrice, book.currency_code)}</td>
                <td className="px-4 py-3">
                  <form action={removeFlashSaleBookAction}>
                    <input type="hidden" name="book_id" value={book.id} />
                    <input type="hidden" name="redirect_to" value="/admin/flash-sales" />
                    <ConfirmSubmitButton
                      label="Retirer"
                      confirmMessage={`Retirer ${book.title} de la flash sale ?`}
                      className="cta-secondary px-4 py-2 text-xs text-rose-700"
                    />
                  </form>
                </td>
              </tr>
            );
          })}
        </AdminDataTable>
        {data.selectedBooks.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucun livre n&apos;est selectionne manuellement pour le moment.</p> : null}
      </AdminPanel>

      <AdminPanel title="Fallback public actuel" description="Ces livres prennent le relais si la selection manuelle est vide ou incomplete.">
        {data.fallbackBooks.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {data.fallbackBooks.map((book) => (
              <article key={book.id} className="rounded-[1.5rem] border border-violet-200/60 bg-violet-50/40 p-4">
                <p className="text-sm font-semibold text-slate-950">{book.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{book.author_name}</p>
                <p className="mt-3 text-sm text-slate-500">{formatMoney(book.price, book.currency_code)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun livre eligible n&apos;est actuellement disponible pour le bloc flash sale.</p>
        )}
      </AdminPanel>
    </div>
  );
}
