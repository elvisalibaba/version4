import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/book-offers";
import { getAdminSubscriptionEditorOptions, getAdminSubscriptionPlanDetail } from "@/lib/supabase/admin/subscriptions";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { addBookToPlanAction, removeBookFromPlanAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type PlanDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSubscriptionPlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const [data, editorOptions] = await Promise.all([getAdminSubscriptionPlanDetail(id), getAdminSubscriptionEditorOptions()]);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.plan.name}
        description="Detail d un plan Premium, de ses livres inclus et de ses abonnes."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Plans Premium", href: "/admin/subscriptions/plans" },
          { label: data.plan.name },
        ]}
        actions={
          <Link href={`/admin/subscriptions/plans/${data.plan.id}/edit`} className="cta-primary px-5 py-3 text-sm">
            Editer le plan
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
        <AdminPanel title="Plan" description="Metadonnees et pricing du plan.">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Slug</dt>
              <dd className="text-slate-500">{data.plan.slug}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Prix mensuel</dt>
              <dd className="text-slate-500">{formatMoney(data.plan.monthly_price, data.plan.currency_code)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Etat</dt>
              <dd className="mt-2">
                <StatusBadge kind="boolean" value={data.plan.is_active} label={data.plan.is_active ? "Actif" : "Inactif"} />
              </dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Ajouter un livre au plan" description="Le warning est affiche si le livre n est pas marque comme disponible par abonnement.">
          <form action={addBookToPlanAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="plan_id" value={data.plan.id} />
            <input type="hidden" name="redirect_to" value={`/admin/subscriptions/plans/${data.plan.id}`} />
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
            <button type="submit" className="cta-primary self-end px-5 py-3 text-sm">
              Ajouter
            </button>
          </form>
        </AdminPanel>
      </div>

      <AdminPanel title="Livres inclus" description="Mappings subscription_plan_books relies a ce plan.">
        <AdminDataTable columns={["Livre", "Auteur", "Abonnement", "Ajout", "Action"]}>
          {data.includedBooks.map((mapping) => (
            <tr key={mapping.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/books/${mapping.book_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {mapping.book_title}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{mapping.author_name}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  kind="boolean"
                  value={!mapping.subscriptionWarning}
                  label={mapping.subscriptionWarning ? "Warning" : "OK"}
                />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(mapping.created_at)}</td>
              <td className="px-4 py-3">
                <form action={removeBookFromPlanAction}>
                  <input type="hidden" name="mapping_id" value={mapping.id} />
                  <input type="hidden" name="plan_id" value={data.plan.id} />
                  <input type="hidden" name="redirect_to" value={`/admin/subscriptions/plans/${data.plan.id}`} />
                  <ConfirmSubmitButton
                    label="Retirer"
                    confirmMessage="Retirer ce livre du plan ?"
                    className="cta-secondary px-4 py-2 text-xs text-rose-700"
                  />
                </form>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel title="Abonnes au plan" description="user_subscriptions actuellement rattaches au plan.">
        <AdminDataTable columns={["Utilisateur", "Statut", "Debut", "Expiration"]}>
          {data.subscribers.map((subscription) => (
            <tr key={subscription.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3 text-sm text-slate-500">{subscription.user_name}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="subscription" value={subscription.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.started_at)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.expires_at)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </div>
  );
}
