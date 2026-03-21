import Link from "next/link";
import { Suspense } from "react";
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

// Skeleton loaders for better perceived performance
function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12">
      <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function formatPercent(value: number) {
  const precision = Number.isInteger(value) ? 0 : 1;
  return `${value.toFixed(precision)}%`;
}

export default async function AdminDashboardPage() {
  // Add error handling with try/catch
  let data;
  try {
    data = await getAdminDashboardData();
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // You might want to render a fallback UI or throw an error page
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-600">We couldn't load the dashboard. Please try again later.</p>
        </div>
      </div>
    );
  }

  const marketingModules = [
    {
      id: "funnel",
      icon: Funnel,
      label: "Funnel vue → achat",
      value: formatPercent(data.marketing.viewToPurchaseRate),
      hint: `${formatCompactNumber(data.marketing.totalBookPurchases)} achats pour ${formatCompactNumber(data.marketing.totalBookViews)} vues catalogue.`,
    },
    {
      id: "checkout",
      icon: Target,
      label: "Checkout payé",
      value: formatPercent(data.marketing.paidOrderRate),
      hint: `${formatCompactNumber(data.totals.paidOrders)} commandes payées sur ${formatCompactNumber(data.totals.orders)} commandes.`,
    },
    {
      id: "subscriptions",
      icon: Sparkles,
      label: "Activation abonnements",
      value: formatPercent(data.marketing.activeSubscriptionRate),
      hint: `${formatCompactNumber(data.totals.activeSubscriptions)} abonnements actifs pour ${formatCompactNumber(data.totals.readers)} lecteurs.`,
    },
    {
      id: "pipeline",
      icon: Megaphone,
      label: "Pression éditoriale",
      value: formatPercent(data.marketing.submissionPressureRate),
      hint: `${formatCompactNumber(data.totals.submittedBooks)} soumissions en attente face au catalogue publié.`,
    },
  ] as const;

  return (
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Cockpit admin"
        description="Vue unifiée des indicateurs business, éditoriaux et opérationnels du schéma Supabase actuel."
        breadcrumbs={[{ label: "Admin" }]}
        actions={
          <>
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Gérer les utilisateurs
            </Link>
            <Link
              href="/admin/books"
              className="inline-flex items-center rounded-md bg-[#ff9900] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Gérer le catalogue
            </Link>
          </>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          hint={`${data.totals.publishedBooks} publiés / ${data.totals.draftBooks} drafts`}
        />
        <AdminKpiCard
          icon={ClipboardCheck}
          label="À revoir"
          value={formatCompactNumber(data.totals.submittedBooks)}
          hint={data.recentSubmittedBooks[0]?.title ?? "Aucune soumission en attente"}
        />
        <AdminKpiCard
          icon={ShoppingCart}
          label="Commandes"
          value={formatCompactNumber(data.totals.orders)}
          hint={`${data.totals.paidOrders} payées / ${data.totals.pendingOrders} en attente`}
        />
        <AdminKpiCard
          icon={BadgeDollarSign}
          label="Revenus"
          value={data.totals.revenueLabel}
          hint="Agrégation par devise sans conversion implicite."
        />
        <AdminKpiCard
          icon={CreditCard}
          label="Abonnements actifs"
          value={formatCompactNumber(data.totals.activeSubscriptions)}
          hint="Statut actif et date d'expiration non échue."
        />
        <AdminKpiCard
          icon={Star}
          label="Note moyenne"
          value={data.totals.averageRating ? `${data.totals.averageRating}/5` : "-"}
          hint="Calculée sur les ratings visibles."
        />
        <AdminKpiCard
          icon={Eye}
          label="Top vues"
          value={formatCompactNumber(data.topViewedBooks[0]?.views_count ?? 0)}
          hint={data.topViewedBooks[0]?.title ?? "Aucun livre"}
        />
        <AdminKpiCard
          icon={Layers3}
          label="Coming soon"
          value={formatCompactNumber(data.totals.comingSoonBooks)}
          hint={`${data.totals.archivedBooks} archivés`}
        />
      </div>

      {/* Notices */}
      {data.notices.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      {/* Marketing Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#ff9900]">Modules marketing</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pilotage acquisition, conversion et relance</h2>
            <p className="max-w-3xl text-sm text-gray-500">
              Cette zone transforme les signaux de ton catalogue en plan d'action clair : quoi pousser, quoi corriger, et où investir l'effort de campagne.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/home-positioning"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Positionnement home
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
            >
              Ouvrir les commandes
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {marketingModules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{module.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{module.value}</p>
                <p className="mt-2 text-sm text-gray-500">{module.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminPanel
            title="Watchlist conversion"
            description="Livres avec trafic déjà présent mais conversion faible. Priorité : page produit, offre et argumentaire."
          >
            <div className="space-y-3">
              {data.marketing.watchlist.length ? (
                data.marketing.watchlist.map((book) => (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    className="flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{book.title}</p>
                      <p className="truncate text-xs uppercase tracking-wide text-gray-500">{book.author_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatPercent(book.conversion_rate)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCompactNumber(book.views_count)} vues / {formatCompactNumber(book.purchases_count)} achats
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune alerte critique de conversion pour le moment.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Campagnes à pousser maintenant"
            description="Titres qui convertissent déjà bien. Priorité : amplification paid, social et newsletter."
          >
            <div className="space-y-3">
              {data.marketing.campaignCandidates.length ? (
                data.marketing.campaignCandidates.map((book) => (
                  <Link
                    key={book.id}
                    href={`/admin/books/${book.id}`}
                    className="flex items-center justify-between gap-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 transition hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{book.title}</p>
                      <p className="truncate text-xs uppercase tracking-wide text-gray-500">{book.author_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatPercent(book.conversion_rate)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCompactNumber(book.purchases_count)} achats / {formatCompactNumber(book.views_count)} vues
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">Pas encore assez de data pour recommander une campagne prioritaire.</p>
              )}
            </div>
          </AdminPanel>
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel title="Top auteurs en ventes estimées" description="Agrégation actuelle basée sur purchases_count × books.price.">
          <SimpleBarChart
            data={data.topAuthorsBySales.map((author) => ({
              label: author.displayName,
              value: author.estimatedSales,
            }))}
            emptyLabel="Aucune performance auteur disponible."
          />
        </AdminPanel>

        <AdminPanel title="Distribution des notes" description="Répartition des notes de 1 à 5 sur l'ensemble des ratings visibles.">
          <SimpleBarChart data={data.ratingDistribution} emptyLabel="Aucune note disponible." />
        </AdminPanel>
      </div>

      {/* Top Books Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Top livres les plus vus" description="Basé sur books.views_count.">
          <div className="space-y-4">
            {data.topViewedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{book.title}</p>
                  <p className="truncate text-xs uppercase tracking-wide text-gray-500">{book.author_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCompactNumber(book.views_count)}</p>
                  <p className="text-xs text-gray-500">vues</p>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Top livres les plus achetés" description="Basé sur books.purchases_count.">
          <div className="space-y-4">
            {data.topPurchasedBooks.map((book) => (
              <Link
                key={book.id}
                href={`/admin/books/${book.id}`}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{book.title}</p>
                  <p className="truncate text-xs uppercase tracking-wide text-gray-500">{book.author_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCompactNumber(book.purchases_count)}</p>
                  <p className="text-xs text-gray-500">achats</p>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminPanel title="Soumissions à traiter" description="Livres envoyés par les auteurs et en attente d'une revue admin.">
          <AdminDataTable columns={["Livre", "Auteur", "Soumission"]}>
            {data.recentSubmittedBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-gray-900 hover:text-[#ff9900]">
                    {book.title}
                  </Link>
                  <div className="mt-2">
                    <StatusBadge kind="review" value={book.review_status} />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{book.author_name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatAdminDateTime(book.submitted_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Derniers inscrits" description="Nouveaux profils créés sur la plateforme.">
          <AdminDataTable columns={["Utilisateur", "Rôle", "Création"]}>
            {data.recentUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="font-semibold text-gray-900 hover:text-[#ff9900]">
                    {user.name ?? "Sans nom"}
                  </Link>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="role" value={user.role} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatAdminDateTime(user.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Dernières commandes" description="Dernières transactions visibles en base.">
          <AdminDataTable columns={["Commande", "Statut", "Montant"]}>
            {data.recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-gray-900 hover:text-[#ff9900]">
                    {order.id.slice(0, 8)}
                  </Link>
                  <p className="text-sm text-gray-500">{order.user_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="payment" value={order.payment_status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatMoney(order.total_price, order.currency_code)}
                  <div className="text-xs uppercase tracking-wide text-gray-400">{order.itemCount} article(s)</div>
                </td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Derniers livres ajoutés" description="Création de titres dans le catalogue.">
          <AdminDataTable columns={["Livre", "État", "Ajout"]}>
            {data.recentBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/books/${book.id}`} className="font-semibold text-gray-900 hover:text-[#ff9900]">
                    {book.title}
                  </Link>
                  <p className="text-sm text-gray-500">{book.author_name}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="book" value={book.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatAdminDateTime(book.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>
    </div>
  );
}