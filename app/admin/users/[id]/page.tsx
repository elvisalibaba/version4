import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/book-offers";
import { getAdminUserDetail } from "@/lib/supabase/admin/users";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { updateUserRoleAction } from "@/app/admin/actions";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const data = await getAdminUserDetail(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.profile.name ?? "Utilisateur"}
        description="Detail admin du profil, de son historique commercial, de sa bibliotheque et de son engagement de lecture."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Utilisateurs", href: "/admin/users" },
          { label: data.profile.email },
        ]}
        actions={
          <Link href="/admin/users" className="cta-secondary px-5 py-3 text-sm">
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
        <AdminPanel title="Profil" description="Metadonnees principales du profil et role applicatif.">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Identite</dt>
              <dd className="text-slate-500">
                {[data.profile.first_name, data.profile.last_name].filter(Boolean).join(" ") || data.profile.name || "Non renseigne"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Email</dt>
              <dd className="text-slate-500">{data.profile.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Telephone</dt>
              <dd className="text-slate-500">{data.profile.phone ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Localisation</dt>
              <dd className="text-slate-500">{[data.profile.city, data.profile.country].filter(Boolean).join(", ") || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Langue preferee</dt>
              <dd className="text-slate-500">{data.profile.preferred_language.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Categories favorites</dt>
              <dd className="text-slate-500">{data.profile.favorite_categories.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Marketing</dt>
              <dd className="text-slate-500">{data.profile.marketing_opt_in ? "Opt-in actif" : "Non active"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Creation</dt>
              <dd className="text-slate-500">{formatAdminDateTime(data.profile.created_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Role actuel</dt>
              <dd className="mt-2">
                <StatusBadge kind="role" value={data.profile.role} />
              </dd>
            </div>
            {data.authorProfile ? (
              <div>
                <dt className="font-semibold text-slate-950">Profil auteur lie</dt>
                <dd className="text-slate-500">
                  <Link href={`/admin/authors/${data.authorProfile.id}`} className="font-semibold text-violet-700">
                    {data.authorProfile.display_name}
                  </Link>
                </dd>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  <p>{data.authorProfile.professional_headline ?? "Headline non renseignee"}</p>
                  <p>{data.authorProfile.location ?? "-"}</p>
                  <p>{data.authorProfile.phone ?? "-"}</p>
                  <p>{data.authorProfile.genres.join(", ") || "-"}</p>
                </div>
              </div>
            ) : null}
          </dl>
        </AdminPanel>

        <AdminPanel title="Actions admin" description="Promotion et retrogradation dans les limites du schema actuel.">
          <form action={updateUserRoleAction} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="user_id" value={data.profile.id} />
            <input type="hidden" name="redirect_to" value={`/admin/users/${data.profile.id}`} />
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role cible</span>
              <select name="role" defaultValue={data.profile.role} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                <option value="reader">reader</option>
                <option value="author">author</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <button type="submit" className="cta-primary self-end px-5 py-3 text-sm">
              Mettre a jour le role
            </button>
          </form>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Aucun flag de suspension n existe dans le schema actuel. Le code reste ouvert a une extension future, mais aucune colonne additionnelle n est inventee ici.
          </p>
        </AdminPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bibliotheque</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.libraryCount}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Commandes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.orderCount}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.ratingsCount}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Highlights</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.highlightsCount}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vues detail</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.detailViews}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ouvertures lecteur</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.readerOpenCount}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Acces fichier</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.metrics.fileAccessCount}</p>
        </AdminPanel>
      </div>

      <AdminPanel title="Parcours lecture" description="Derniers livres consultes, ouvertures de lecteur web et acces fichiers traces par l application.">
        <AdminDataTable columns={["Livre", "Evenement", "Source", "Date"]}>
          {data.engagements.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/books/${entry.book_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {entry.book_title}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.event_type}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.source ?? "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.created_at)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel title="Abonnements" description="Historique et statut des abonnements utilisateur.">
        <AdminDataTable columns={["Plan", "Statut", "Debut", "Expiration"]}>
          {data.subscriptions.map((subscription) => (
            <tr key={subscription.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3 font-semibold text-slate-950">{subscription.plan_name}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="subscription" value={subscription.status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.started_at)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(subscription.expires_at)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel title="Historique commandes" description="Commandes passees par cet utilisateur.">
        <AdminDataTable columns={["Commande", "Statut", "Montant", "Items"]}>
          {data.orders.map((order) => (
            <tr key={order.id} className="border-t border-violet-100/70 align-top">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {order.id.slice(0, 8)}
                </Link>
                <p className="text-sm text-slate-500">{formatAdminDateTime(order.created_at)}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge kind="payment" value={order.payment_status} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(order.total_price, order.currency_code)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {order.items.map((item) => item.book_title).join(", ") || "Aucun item"}
              </td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Bibliotheque" description="Acces aux livres achetes, offerts ou lies a un abonnement.">
          <AdminDataTable columns={["Livre", "Type", "Date", "Subscription"]}>
            {data.library.map((entry) => (
              <tr key={entry.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${entry.book_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {entry.book_title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="access" value={entry.access_type} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.purchased_at)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{entry.subscription_id ? entry.subscription_id.slice(0, 8) : "-"}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Engagement lecture" description="Notes et highlights relies au profil.">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</h3>
              <div className="mt-3 space-y-3">
                {data.ratings.map((rating) => (
                  <div key={rating.id} className="rounded-[1.2rem] border border-violet-200/60 bg-violet-50/40 p-4">
                    <p className="font-semibold text-slate-950">{rating.book_title}</p>
                    <p className="text-sm text-slate-500">{rating.rating}/5 - {formatAdminDateTime(rating.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Highlights</h3>
              <div className="mt-3 space-y-3">
                {data.highlights.map((highlight) => (
                  <div key={highlight.id} className="rounded-[1.2rem] border border-violet-200/60 bg-violet-50/40 p-4">
                    <p className="font-semibold text-slate-950">{highlight.book_title}</p>
                    <p className="text-sm text-slate-500">
                      Page {highlight.page} - {highlight.color} - {formatAdminDateTime(highlight.created_at)}
                    </p>
                    {highlight.text ? <p className="mt-2 text-sm text-slate-700">{highlight.text}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
