import Link from "next/link";
import {
  BadgeDollarSign,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Eye,
  Funnel,
  Layers3,
  Megaphone,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
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
  let data: Awaited<ReturnType<typeof getAdminDashboardData>>;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Chargement impossible</h1>
          <p className="mt-2 text-gray-600">Le cockpit admin ne peut pas etre charge pour le moment.</p>
        </div>
      </div>
    );
  }

  const businessSignals = [
    {
      id: "funnel",
      icon: Funnel,
      label: "Vue vers achat",
      value: formatPercent(data.marketing.viewToPurchaseRate),
      hint: `${formatCompactNumber(data.marketing.totalBookPurchases)} achats pour ${formatCompactNumber(data.marketing.totalBookViews)} vues catalogue`,
    },
    {
      id: "checkout",
      icon: Target,
      label: "Commandes payees",
      value: formatPercent(data.marketing.paidOrderRate),
      hint: `${formatCompactNumber(data.totals.paidOrders)} commandes payees sur ${formatCompactNumber(data.totals.orders)} commandes`,
    },
    {
      id: "subscriptions",
      icon: Sparkles,
      label: "Activation Premium",
      value: formatPercent(data.marketing.activeSubscriptionRate),
      hint: `${formatCompactNumber(data.totals.activeSubscriptions)} abonnements actifs pour ${formatCompactNumber(data.totals.readers)} lecteurs`,
    },
    {
      id: "pipeline",
      icon: Megaphone,
      label: "Pression editoriale",
      value: formatPercent(data.marketing.submissionPressureRate),
      hint: `${formatCompactNumber(data.totals.submittedBooks)} soumissions en attente face au catalogue publie`,
    },
  ] as const;

  const operationalSignals = [
    {
      label: "Soumissions a traiter",
      value: formatCompactNumber(data.totals.submittedBooks),
      detail: data.recentSubmittedBooks[0]?.title ?? "Aucune soumission urgente",
    },
    {
      label: "Top auteur estime",
      value: data.topAuthorsBySales[0]?.displayName ?? "Aucun",
      detail: data.topAuthorsBySales[0]?.estimatedSalesLabel ?? "Pas encore de ventes consolidees",
    },
    {
      label: "Top traction catalogue",
      value: data.topViewedBooks[0]?.title ?? "Aucun titre",
      detail: `${formatCompactNumber(data.topViewedBooks[0]?.views_count ?? 0)} vues en tete`,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Marketplace control tower"
        description="Vue unifiee du business, de la moderation catalogue, de la conversion et des signaux auteurs sur le schema Supabase actuel."
        breadcrumbs={[{ label: "Admin" }]}
        actions={
          <>
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-full border border-[#e4d7c6] bg-white px-4 py-2 text-sm font-semibold text-[#26221d] shadow-sm transition hover:border-[#ccbba7] hover:bg-[#fcfaf7]"
            >
              Gerer les utilisateurs
            </Link>
            <Link
              href="/admin/books"
              className="inline-flex items-center rounded-full bg-[#ff9900] px-4 py-2 text-sm font-semibold text-[#171717] shadow-sm transition hover:bg-[#f08f00]"
            >
              Gerer le catalogue
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AdminKpiCard
          icon={Users}
          label="Utilisateurs"
          value={formatCompactNumber(data.totals.users)}
          hint={`${data.totals.readers} lecteurs / ${data.totals.authors} auteurs / ${data.totals.admins} admins`}
          tone="sky"
        />
        <AdminKpiCard
          icon={BookOpen}
          label="Catalogue"
          value={formatCompactNumber(data.totals.books)}
          hint={`${data.totals.publishedBooks} publies / ${data.totals.draftBooks} brouillons`}
          tone="violet"
        />
        <AdminKpiCard
          icon={ClipboardCheck}
          label="Revue"
          value={formatCompactNumber(data.totals.submittedBooks)}
          hint={data.recentSubmittedBooks[0]?.title ?? "Aucune soumission en attente"}
          tone="amber"
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
          hint="Aggregation par devise sans conversion implicite"
          tone="rose"
        />
        <AdminKpiCard
          icon={CreditCard}
          label="Abonnements"
          value={formatCompactNumber(data.totals.activeSubscriptions)}
          hint="Statut actif et date de validite correcte"
          tone="sky"
        />
        <AdminKpiCard
          icon={Star}
          label="Note moyenne"
          value={data.totals.averageRating ? `${data.totals.averageRating}/5` : "-"}
          hint="Calcul sur les ratings visibles"
          tone="amber"
        />
        <AdminKpiCard
          icon={Eye}
          label="Top vues"
          value={formatCompactNumber(data.topViewedBooks[0]?.views_count ?? 0)}
          hint={data.topViewedBooks[0]?.title ?? "Aucun livre"}
          tone="violet"
        />
        <AdminKpiCard
          icon={Layers3}
          label="Coming soon"
          value={formatCompactNumber(data.totals.comingSoonBooks)}
          hint={`${data.totals.archivedBooks} archives`}
          tone="rose"
        />
      </div>

      {data.notices.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <AdminPanel
          title="Signaux business"
          description="Lecture rapide de la conversion, du commerce et de la pression editoriale pour arbitrer les priorites."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {businessSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <article
                  key={signal.id}
                  className="rounded-[1.4rem] border border-[#ece4d7] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,239,0.94))] p-4"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1db] text-[#b96e12]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{signal.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{signal.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{signal.hint}</p>
                </article>
              );
            })}
          </div>
        </AdminPanel>

        <div className="grid gap-6">
          <AdminPanel title="Focus operations" description="Trois repers pour piloter la journee.">
            <div className="grid gap-3">
              {operationalSignals.map((signal) => (
                <div key={signal.label} className="rounded-[1.25rem] border border-[#ece4d7] bg-[#fcfaf7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{signal.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{signal.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{signal.detail}</p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="Actions rapides" description="Acces direct aux zones qui bougent le plus.">
            <div className="grid gap-2">
              <Link
                href="/admin/orders"
                className="rounded-[1.15rem] border border-[#ece4d7] bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#ccbba7] hover:bg-[#fcfaf7]"
              >
                Ouvrir les commandes
              </Link>
              <Link
                href="/admin/authors"
                className="rounded-[1.15rem] border border-[#ece4d7] bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#ccbba7] hover:bg-[#fcfaf7]"
              >
                Ouvrir les auteurs
              </Link>
              <Link
                href="/admin/subscriptions/plans"
                className="rounded-[1.15rem] border border-[#ece4d7] bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-[#ccbba7] hover:bg-[#fcfaf7]"
              >
                Ouvrir les plans Premium
              </Link>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel
          title="Watchlist conversion"
          description="Titres avec trafic present mais conversion faible. Priorite: fiche produit, offre et argumentaire."
        >
          <div className="space-y-3">
            {data.marketing.watchlist.length ? (
              data.marketing.watchlist.map((book) => (
                <Link
                  key={book.id}
                  href={`/admin/books/${book.id}`}
                  className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 transition hover:bg-red-100"
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
          title="Campagnes a pousser"
          description="Titres qui convertissent deja bien. Priorite: amplification paid, social et newsletter."
        >
          <div className="space-y-3">
            {data.marketing.campaignCandidates.length ? (
              data.marketing.campaignCandidates.map((book) => (
                <Link
                  key={book.id}
                  href={`/admin/books/${book.id}`}
                  className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 transition hover:bg-emerald-100"
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
              <p className="text-sm text-slate-500">Pas encore assez de donnees pour recommander une campagne forte.</p>
            )}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <AdminPanel title="Top auteurs en ventes estimees" description="Aggregation actuelle basee sur purchases_count multiplie par books.price.">
          <SimpleBarChart
            data={data.topAuthorsBySales.map((author) => ({
              label: author.displayName,
              value: author.estimatedSales,
            }))}
            emptyLabel="Aucune performance auteur disponible."
          />
        </AdminPanel>

        <AdminPanel title="Distribution des notes" description="Repartition des ratings visibles de 1 a 5 sur la plateforme.">
          <SimpleBarChart data={data.ratingDistribution} emptyLabel="Aucune note disponible." />
        </AdminPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Top livres les plus vus" description="Base sur books.views_count.">
          <div className="space-y-4">
            {data.topViewedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[#ece4d7] bg-white px-4 py-3 transition hover:bg-[#fcfaf7]"
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
                className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-[#ece4d7] bg-white px-4 py-3 transition hover:bg-[#fcfaf7]"
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

      <div className="grid gap-6 xl:grid-cols-4">
        <AdminPanel title="Soumissions a traiter" description="Livres envoyes par les auteurs et en attente de revue.">
          <AdminDataTable columns={["Livre", "Auteur", "Soumission"]}>
            {data.recentSubmittedBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-[#ff9900]">
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

        <AdminPanel title="Dernieres commandes" description="Transactions recentes visibles en base.">
          <AdminDataTable columns={["Commande", "Statut", "Montant"]}>
            {data.recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-slate-950 hover:text-[#ff9900]">
                    {order.id.slice(0, 8)}
                  </Link>
                  <p className="text-sm text-slate-500">{order.user_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="payment" value={order.payment_status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {formatMoney(order.total_price, order.currency_code)}
                  <div className="text-xs uppercase tracking-wide text-slate-400">{order.itemCount} article(s)</div>
                </td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Derniers utilisateurs" description="Nouveaux profils crees sur la plateforme.">
          <AdminDataTable columns={["Utilisateur", "Role", "Creation"]}>
            {data.recentUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-950 hover:text-[#ff9900]">
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

        <AdminPanel title="Derniers livres ajoutes" description="Creation recente de titres dans le catalogue.">
          <AdminDataTable columns={["Livre", "Etat", "Ajout"]}>
            {data.recentBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-slate-950 hover:text-[#ff9900]">
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
