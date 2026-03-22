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
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Positionnement home"
        description="Choisis l'ordre des livres à pousser en tête de la home pour mettre tes priorités éditoriales devant."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Positionnement home" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={BringToFront}
          label="Livres épinglés"
          value={data.selectedBooks.length}
          hint="Ordre manuel prioritaire sur la home"
        />
        <AdminKpiCard
          icon={BookCopy}
          label="Catalogue publié"
          value={data.eligibleBooks.length}
          hint="Base disponible pour la sélection"
        />
        <AdminKpiCard
          icon={LayoutDashboard}
          label="Aperçu frontal"
          value={data.previewBooks.length}
          hint="Top livres renvoyés dans les premiers blocs"
        />
        <AdminKpiCard
          icon={RefreshCw}
          label="Dernière mise à jour"
          value={formatAdminDateTime(data.config.updatedAt)}
          hint="Horodatage de configuration"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.notices.map((notice) => (
          <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
        ))}
      </div>

      <AdminPanel
        title="Ajouter un livre en avant"
        description="Le livre ajouté rejoint la file prioritaire et remonte automatiquement dans les blocs principaux de la home."
      >
        <div className="flex flex-wrap gap-4">
          <form action={addHomeFeaturedBookAction} className="flex min-w-[320px] flex-1 flex-wrap items-end gap-4">
            <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
            <label className="grid min-w-[320px] flex-1 gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Livre</span>
              <select
                name="book_id"
                className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900]"
              >
                {data.eligibleOptions.length > 0 ? (
                  data.eligibleOptions.map((book) => (
                    <option key={book.value} value={book.value}>
                      {book.label}
                    </option>
                  ))
                ) : (
                  <option value="">Aucun livre publié</option>
                )}
              </select>
            </label>
            <button
              type="submit"
              disabled={data.eligibleOptions.length === 0}
              className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ajouter
            </button>
          </form>

          <form action={clearHomeFeaturedBooksAction} className="flex items-end">
            <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
            <ConfirmSubmitButton
              label="Réinitialiser"
              confirmMessage="Vider toute la file de positionnement home ?"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            />
          </form>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Ordre actuel"
        description="Cet ordre est appliqué pour mettre les livres en avant sur la home, avant le tri automatique par performance."
      >
        <AdminDataTable columns={["Position", "Livre", "Auteur", "Prix", "Actions"]}>
          {data.selectedBooks.map((book, index) => {
            const canMoveUp = index > 0;
            const canMoveDown = index < data.selectedBooks.length - 1;

            return (
              <tr key={book.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-700">#{index + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.display_price_label}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{book.author_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatMoney(book.price, book.currency_code)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={moveHomeFeaturedBookAction}>
                      <input type="hidden" name="book_id" value={book.id} />
                      <input type="hidden" name="direction" value="up" />
                      <input type="hidden" name="redirect_to" value="/admin/home-positioning" />
                      <button
                        type="submit"
                        disabled={!canMoveUp}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminDataTable>
        {data.selectedBooks.length === 0 ? <p className="mt-4 text-sm text-gray-500">Aucun livre n&apos;est actuellement épinglé.</p> : null}
      </AdminPanel>

      <AdminPanel
        title="Aperçu frontal"
        description="Projection des premiers livres renvoyés à la home après application de la file prioritaire."
      >
        {data.previewBooks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.previewBooks.map((book, index) => (
              <article
                key={book.id}
                className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Slot {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{book.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{book.author_name}</p>
                <p className="mt-3 text-sm text-gray-600">{formatMoney(book.price, book.currency_code)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun livre publié disponible pour l&apos;aperçu.</p>
        )}
      </AdminPanel>
    </div>
  );
}
