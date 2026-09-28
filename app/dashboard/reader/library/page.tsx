import Link from "next/link";
import { BookOpen, Compass, Gem, LibraryBig, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { getReaderLibrary } from "@/lib/reader-api";

export default async function ReaderLibraryPage() {
  await requireRole(["reader"]);
  const items = await getReaderLibrary();
  const purchases = items.filter((item) => item.access_type === "purchase").length;
  const subscriptions = items.filter((item) => item.access_type === "subscription").length;
  const free = items.filter((item) => item.access_type === "free").length;

  return (
    <section className="space-y-6">
      <DashboardTopbar kicker="Espace lecteur" title="Ma bibliothèque" description="Tous vos accès actifs, servis par Laravel." actions={<Link href="/books" className="cta-primary px-5 py-3 text-sm"><Compass className="h-4 w-4" /> Explorer</Link>} />
      <div className="metric-grid">
        <StatCard icon={LibraryBig} label="Tous mes livres" value={items.length} description="Titres actifs" tone="violet" />
        <StatCard icon={BookOpen} label="Achats" value={purchases} description="Accès permanents" tone="sky" />
        <StatCard icon={Gem} label="Premium" value={subscriptions} description="Via abonnement" tone="amber" />
        <StatCard icon={Sparkles} label="Gratuits" value={free} description="Titres offerts" tone="emerald" />
      </div>

      <section className="surface-panel p-6">
        {items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((entry) => (
              <article key={entry.id} className="overflow-hidden rounded-[1.6rem] border border-[#ece3d7] bg-white">
                {entry.book.cover_url ? <img src={entry.book.cover_url} alt={entry.book.cover_alt_text ?? entry.book.title} className="aspect-[1.55] w-full object-cover" /> : null}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="catalog-badge">{entry.access_type}</span>
                    <span className="text-xs text-[#766e64]">{entry.status}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-[#171717]">{entry.book.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6f665e]">{entry.book.description ?? "Livre disponible dans votre bibliothèque."}</p>
                  <Link href={`/book/${entry.book.id}?read=1`} className="cta-primary mt-4 px-4 py-2 text-sm"><BookOpen className="h-4 w-4" /> Lire</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Bibliothèque vide" description="Vos achats, titres gratuits et accès Premium apparaîtront ici." action={<Link href="/books" className="cta-secondary px-5 py-3 text-sm">Explorer le catalogue</Link>} />
        )}
      </section>
    </section>
  );
}
