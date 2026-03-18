import Link from "next/link";
import { BadgeDollarSign, BookOpen, ClipboardCheck, CreditCard, Eye, Funnel, Layers3, Megaphone, ShoppingCart, Sparkles, Star, Target, Users } from "lucide-react";
import { formatMoney } from "@/lib/book-offers";
import { getAdminDashboardData } from "@/lib/supabase/admin/dashboard";
import { formatAdminDateTime, formatCompactNumber } from "@/lib/supabase/admin/shared";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { SimpleBarChart } from "@/components/admin/charts/simple-bar-chart";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

function formatPercent(value: number) {
  const precision = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(precision)}%`;
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  const marketingModules = [
    {
      id: "funnel",
      icon: Funnel,
      label: "Funnel vue -> achat",
      value: formatPercent(data.marketing.viewToPurchaseRate),
      hint: `${formatCompactNumber(data.marketing.totalBookPurchases)} achats pour ${formatCompactNumber(data.marketing.totalBookViews)} vues catalogue.`,
      tone: "from-sky-50 to-indigo-50 border-sky-200/70 text-sky-700",
    },
    {
      id: "checkout",
      icon: Target,
      label: "Checkout paye",
      value: formatPercent(data.marketing.paidOrderRate),
      hint: `${formatCompactNumber(data.totals.paidOrders)} commandes payees sur ${formatCompactNumber(data.totals.orders)} commandes.`,
      tone: "from-emerald-50 to-lime-50 border-emerald-200/70 text-emerald-700",
    },
    {
      id: "subscriptions",
      icon: Sparkles,
      label: "Activation abonnements",
      value: formatPercent(data.marketing.activeSubscriptionRate),
      hint: `${formatCompactNumber(data.totals.activeSubscriptions)} abonnements actifs pour ${formatCompactNumber(data.totals.readers)} lecteurs.`,
      tone: "from-violet-50 to-fuchsia-50 border-violet-200/70 text-violet-700",
    },
    {
      id: "pipeline",
      icon: Megaphone,
      label: "Pression editoriale",
      value: formatPercent(data.marketing.submissionPressureRate),
      hint: `${formatCompactNumber(data.totals.submittedBooks)} soumissions en attente face au catalogue publie.`,
      tone: "from-amber-50 to-orange-50 border-amber-200/70 text-amber-700",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cockpit admin"
        description="Vue unifiee des indicateurs business, editoriaux et operationnels du schema Supabase actuel."
        breadcrumbs={[{ label: "Admin" }]}
        actions={
          <>
            <Link href="/admin/users" className="cta-secondary px-5 py-3 text-sm">
              Gerer les utilisateurs
            </Link>
            <Link href="/admin/books" className="cta-primary px-5 py-3 text-sm">
              Gerer le catalogue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon={Users}
          label="Utilisateurs"
          value={formatCompactNumber(data.totals.users)}
          hint={`${data.totals.readers} lecteurs / ${data.totals.authors} auteurs / ${data.totals.admins} admins`}
        />
        <AdminKpiCard
          icon={BookOpen}
          label="Livres"
          value={formatCompactNumber(data.totals.books)}
          hint={`${data.totals.publishedBooks} publies / ${data.totals.draftBooks} drafts`}
          tone="sky"
        />
        <AdminKpiCard
          icon={ClipboardCheck}
          label="A revoir"
          value={formatCompactNumber(data.totals.submittedBooks)}
          hint={data.recentSubmittedBooks[0]?.title ?? "Aucune soumission en attente"}
          tone="rose"
        />
        <AdminKpiCard
          icon={ShoppingCart}
          label="Commandes"
          value={formatCompactNumber(data.totals.orders)}
          hint={`${data.totals.paidOrders} payees / ${data.totals.pendingOrders} en attente`}
          tone="emerald"
        />
        <AdminKpiCard
          icon={BadgeDollarSign}
          label="Revenus"
          value={data.totals.revenueLabel}
          hint="Agregation par devise sans conversion implicite."
          tone="amber"
        />
        <AdminKpiCard
          icon={CreditCard}
          label="Abonnements actifs"
          value={formatCompactNumber(data.totals.activeSubscriptions)}
          hint="Statut active et date d expiration non echue."
          tone="violet"
        />
        <AdminKpiCard
          icon={Star}
          label="Note moyenne"
          value={data.totals.averageRating ? `${data.totals.averageRating}/5` : "-"}
          hint="Calculee sur les ratings visibles."
          tone="rose"
        />
        <AdminKpiCard
          icon={Eye}
          label="Top vues"
          value={formatCompactNumber(data.topViewedBooks[0]?.views_count ?? 0)}
          hint={data.topViewedBooks[0]?.title ?? "Aucun livre"}
          tone="sky"
        />
        <AdminKpiCard
          icon={Layers3}
          label="Coming soon"
          value={formatCompactNumber(data.totals.comingSoonBooks)}
          hint={`${data.totals.archivedBooks} archives`}
          tone="violet"
        />
      </div>

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Modules marketing</p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Pilotage acquisition, conversion et relance</h2>
            <p className="max-w-3xl text-sm text-slate-500">
              Cette zone transforme les signaux de ton catalogue en plan d action clair: quoi pousser, quoi corriger, et ou investir l effort de campagne.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/home-positioning" className="cta-secondary px-5 py-3 text-sm">
              Positionnement home
            </Link>
            <Link href="/admin/orders" className="cta-secondary px-5 py-3 text-sm">
              Ouvrir les commandes
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {marketingModules.map((module) => {
            const Icon = module.icon;

            return (
              <article
                key={module.id}
                className={`rounded-[1.6rem] border bg-gradient-to-br p-5 shadow-[0_18px_35px_rgba(15,23,42,0.07)] ${module.tone}`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{module.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{module.value}</p>
                <p className="mt-2 text-sm text-slate-600">{module.hint}</p>
              </article>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel
            title="Watchlist conversion"
            description="Livres avec trafic deja present mais conversion faible. Priorite: page produit, offre et argumentaire."
          >
            <div className="space-y-3">
              {data.marketing.watchlist.length ? (
                data.marketing.watchlist.map((book) => (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200/70 bg-rose-50/60 px-4 py-3 transition hover:bg-rose-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{book.title}</p>
                      <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">{book.author_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{formatPercent(book.conversion_rate)}</p>
                      <p className="text-xs text-slate-500">
                        {formatCompactNumber(book.views_count)} vues / {formatCompactNumber(book.purchases_count)} achats
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucune alerte critique de conversion pour le moment.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Campagnes a pousser maintenant"
            description="Titres qui convertissent deja bien. Priorite: amplification paid, social et newsletter."
          >
            <div className="space-y-3">
              {data.marketing.campaignCandidates.length ? (
                data.marketing.campaignCandidates.map((book) => (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 transition hover:bg-emerald-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{book.title}</p>
                      <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">{book.author_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{formatPercent(book.conversion_rate)}</p>
                      <p className="text-xs text-slate-500">
                        {formatCompactNumber(book.purchases_count)} achats / {formatCompactNumber(book.views_count)} vues
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">Pas encore assez de data pour recommander une campagne prioritaire.</p>
              )}
            </div>
          </AdminPanel>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel title="Top auteurs en ventes estimees" description="Agregation actuelle basee sur purchases_count x books.price.">
          <SimpleBarChart
            data={data.topAuthorsBySales.map((author) => ({
              label: author.displayName,
              value: author.estimatedSales,
            }))}
            emptyLabel="Aucune performance auteur disponible."
          />
        </AdminPanel>

        <AdminPanel title="Distribution des notes" description="Repartition des notes de 1 a 5 sur l ensemble des ratings visibles.">
          <SimpleBarChart data={data.ratingDistribution} emptyLabel="Aucune note disponible." />
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Top livres les plus vus" description="Base sur books.views_count.">
          <div className="space-y-4">
            {data.topViewedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-violet-200/60 bg-violet-50/40 px-4 py-3 transition hover:bg-violet-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{book.title}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">{book.author_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{formatCompactNumber(book.views_count)}</p>
                  <p className="text-xs text-slate-500">vues</p>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Top livres les plus achetes" description="Base sur books.purchases_count.">
          <div className="space-y-4">
            {data.topPurchasedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-violet-200/60 bg-violet-50/40 px-4 py-3 transition hover:bg-violet-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{book.title}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">{book.author_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{formatCompactNumber(book.purchases_count)}</p>
                  <p className="text-xs text-slate-500">achats</p>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Soumissions a traiter" description="Livres envoyes par les auteurs et en attente d une revue admin.">
          <AdminDataTable columns={["Livre", "Auteur", "Soumission"]}>
            {data.recentSubmittedBooks.map((book) => (
              <tr key={book.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {book.title}
                  </Link>
                  <div className="mt-2">
                    <StatusBadge kind="review" value={book.review_status} />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{book.author_name}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(book.submitted_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Derniers inscrits" description="Nouveaux profils crees sur la plateforme.">
          <AdminDataTable columns={["Utilisateur", "Role", "Creation"]}>
            {data.recentUsers.map((user) => (
              <tr key={user.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {user.name ?? "Sans nom"}
                  </Link>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="role" value={user.role} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(user.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Dernieres commandes" description="Dernieres transactions visibles en base.">
          <AdminDataTable columns={["Commande", "Statut", "Montant"]}>
            {data.recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {order.id.slice(0, 8)}
                  </Link>
                  <p className="text-sm text-slate-500">{order.user_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="payment" value={order.payment_status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatMoney(order.total_price, order.currency_code)}
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{order.itemCount} item(s)</div>
                </td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Derniers livres ajoutes" description="Creation de titres dans le catalogue.">
          <AdminDataTable columns={["Livre", "Etat", "Ajout"]}>
            {data.recentBooks.map((book) => (
              <tr key={book.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {book.title}
                  </Link>
                  <p className="text-sm text-slate-500">{book.author_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="book" value={book.status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(book.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>
    </div>
  );
}
