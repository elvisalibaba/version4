import Link from "next/link";
import { addLibraryAccessAction, removeLibraryAccessAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { listAdminLibrary, getAdminLibraryEditorOptions } from "@/lib/supabase/admin/library";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type LibraryPageProps = {
  searchParams: Promise<{
    q?: string;
    accessType?: string;
    userId?: string;
    bookId?: string;
    page?: string;
  }>;
};

export default async function AdminLibraryPage({ searchParams }: LibraryPageProps) {
  const { q, accessType, userId, bookId, page } = await searchParams;
  const [data, editorOptions] = await Promise.all([
    listAdminLibrary({
      page: page ? Number(page) : 1,
      search: q,
      accessType: accessType ?? "",
      userId: userId ?? "",
      bookId: bookId ?? "",
    }),
    getAdminLibraryEditorOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bibliotheque"
        description="Gestion des acces library avec provenance d acces et correction manuelle des entrees."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Bibliotheque" },
        ]}
      />

      <AdminPanel title="Ajouter un acces manuel" description="Injection manuelle d un acces purchase, subscription ou free pour corriger une situation metier.">
        <form action={addLibraryAccessAction} className="grid gap-4 xl:grid-cols-5">
          <input type="hidden" name="redirect_to" value="/admin/library" />
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Utilisateur</span>
            <select name="user_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              {editorOptions.users.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Livre</span>
            <select name="book_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              {editorOptions.books.map((book) => (
                <option key={book.value} value={book.value}>
                  {book.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type d acces</span>
            <select name="access_type" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              <option value="purchase">purchase</option>
              <option value="subscription">subscription</option>
              <option value="free">free</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subscription liee</span>
            <select name="subscription_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              <option value="">Aucune</option>
              {editorOptions.subscriptions.map((subscription) => (
                <option key={subscription.value} value={subscription.value}>
                  {subscription.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="cta-primary w-full px-5 py-3 text-sm">
              Ajouter
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Filtres" description="Recherche par utilisateur ou livre, avec filtres sur le type d acces.">
        <AdminFilterBar action="/admin/library">
          <AdminSearchInput defaultValue={q} placeholder="Utilisateur ou livre" />
          <AdminSelect
            name="accessType"
            label="Type"
            defaultValue={accessType}
            options={[
              { label: "purchase", value: "purchase" },
              { label: "subscription", value: "subscription" },
              { label: "free", value: "free" },
            ]}
          />
          <AdminSelect name="userId" label="Utilisateur" defaultValue={userId} options={editorOptions.users} />
          <AdminSelect name="bookId" label="Livre" defaultValue={bookId} options={editorOptions.books} />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/library" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Acces library" description="Lecture des acces existants et retrait manuel en cas d erreur.">
        <AdminDataTable columns={["Utilisateur", "Livre", "Type", "Date", "Provenance", "Action"]}>
          {data.items.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3 text-sm text-slate-500">{entry.user_name}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.book_title}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="access" value={entry.access_type} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.purchased_at)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.plan_name ?? "Manuel / achat / gratuit"}</td>
              <td className="px-4 py-3">
                <form action={removeLibraryAccessAction}>
                  <input type="hidden" name="library_id" value={entry.id} />
                  <input type="hidden" name="redirect_to" value="/admin/library" />
                  <ConfirmSubmitButton
                    label="Retirer"
                    confirmMessage="Retirer cet acces de la bibliotheque ?"
                    className="cta-secondary px-4 py-2 text-xs text-rose-700"
                  />
                </form>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/library"
            pagination={data.pagination}
            params={{ q: q ?? "", accessType: accessType ?? "", userId: userId ?? "", bookId: bookId ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
