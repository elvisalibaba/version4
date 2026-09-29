import Link from "next/link";
import { BookOpen, CircleDollarSign, Clapperboard, Headphones, Heart, LibraryBig, Receipt, Sparkles } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { getReaderDashboard } from "@/lib/reader-api";

function money(value: number | string, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export default async function ReaderDashboardPage() {
  const profile = await requireRole(["reader"]);
  const data = await getReaderDashboard();
  const spent = data.orders.filter((order) => order.payment_status === "paid").reduce((sum, order) => sum + Number(order.total_price), 0);

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Espace lecteur"
        title={`Bonjour ${profile.name ?? profile.email}`}
        description="Votre bibliothèque, vos favoris, commandes et abonnements sont désormais servis par l’API HolisticBooks."
        actions={<Link href="/books" className="cta-primary px-5 py-3 text-sm">Explorer les livres</Link>}
      />

      <div className="metric-grid">
        <StatCard icon={LibraryBig} label="Bibliothèque" value={data.stats.library} description="Titres actifs" tone="violet" />
        <StatCard icon={Heart} label="Favoris" value={data.stats.favorites} description="Livres sauvegardés" tone="rose" />
        <StatCard icon={Receipt} label="Commandes" value={data.stats.orders} description="Transactions" tone="sky" />
        <StatCard icon={Sparkles} label="Premium" value={data.stats.active_subscriptions} description="Abonnements actifs" tone="amber" />
        <StatCard icon={CircleDollarSign} label="Dépenses" value={money(spent)} description="Commandes payées" tone="emerald" />
        <StatCard icon={Headphones} label="Livres audio" value={data.stats.audiobooks} description="Disponibles dans vos accès" tone="sky" />
        <StatCard icon={Clapperboard} label="Vidéos" value={data.stats.videos} description="Éditions vidéo disponibles" tone="rose" />
      </div>

      <AdSlot placementCode="web.reader.dashboard" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <section className="surface-panel p-6">
          <div className="section-header">
            <div>
              <p className="section-kicker">Bibliothèque</p>
              <h2 className="section-title text-2xl">Reprendre une lecture</h2>
            </div>
            <Link href="/dashboard/reader/library" className="cta-secondary px-4 py-2 text-sm">Tout voir</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.library.slice(0, 6).map((entry) => (
              <Link key={entry.id} href={`/book/${entry.book.id}?read=1`} className="rounded-2xl border border-[#ece3d7] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#a85b3f]">{entry.access_type}</p>
                <h3 className="mt-2 font-semibold text-[#171717]">{entry.book.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-[#6f665e]">{entry.book.description ?? "Prêt à reprendre."}</p>
                {entry.reading_progress ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[0.68rem] font-semibold text-[#766e64]">
                      <span>Progression</span>
                      <span>{Math.round(Number(entry.reading_progress.progress_percent ?? 0))}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eee6dc]">
                      <div className="h-full rounded-full bg-[#173d2c]" style={{ width: `${Math.max(0, Math.min(100, Number(entry.reading_progress.progress_percent ?? 0)))}%` }} />
                    </div>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        <aside className="surface-panel p-6">
          <p className="section-kicker">Transactions récentes</p>
          <div className="mt-4 space-y-3">
            {data.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-2xl border border-[#ece3d7] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="catalog-badge">{order.payment_status}</span>
                </div>
                <p className="mt-2 text-sm text-[#6f665e]">{money(order.total_price, order.currency_code)}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/reader/purchases" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#a85b3f]">
            Voir toutes les transactions <Receipt className="h-4 w-4" />
          </Link>
        </aside>
      </div>

      <Link href="/dashboard/reader/library" className="inline-flex items-center gap-2 text-sm font-bold text-[#173d2c]">
        <BookOpen className="h-4 w-4" /> Ouvrir ma bibliothèque
      </Link>
    </section>
  );
}
