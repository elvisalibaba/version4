import Link from "next/link";
import { BookOpen, Clapperboard, Compass, Gem, Headphones, LibraryBig, Sparkles } from "lucide-react";
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
      <DashboardTopbar kicker="Espace lecteur" title="Ma bibliothèque" description="Tous les livres auxquels vous avez accès." actions={<Link href="/books" className="cta-primary px-5 py-3 text-sm"><Compass className="h-4 w-4" /> Explorer</Link>} />
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
              <article key={entry.id} className="overflow-hidden rounded-md border border-rule bg-white">
                {entry.book.cover_url ? <img src={entry.book.cover_url} alt={entry.book.cover_alt_text ?? entry.book.title} className="aspect-[1.55] w-full object-cover" /> : null}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="catalog-badge">{entry.access_type}</span>
                    <span className="text-xs text-slate-600">{entry.status}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{entry.book.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.book.media_editions?.some((edition) => edition.media_type === "audiobook" && edition.status === "published") ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-bold text-night-900"><Headphones className="h-3 w-3" /> Audio</span>
                    ) : null}
                    {entry.book.media_editions?.some((edition) => edition.media_type === "video" && edition.status === "published") ? (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-brand-100 px-2.5 py-1 text-[0.65rem] font-bold text-brand-700"><Clapperboard className="h-3 w-3" /> Vidéo</span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{entry.book.description ?? "Livre disponible dans votre bibliothèque."}</p>
                  {entry.reading_progress ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[0.68rem] font-semibold text-slate-600">
                        <span>Lecture</span>
                        <span>{Math.round(Number(entry.reading_progress.progress_percent ?? 0))}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                        <div className="h-full rounded-full bg-night-900" style={{ width: `${Math.max(0, Math.min(100, Number(entry.reading_progress.progress_percent ?? 0)))}%` }} />
                      </div>
                    </div>
                  ) : null}
                  <Link href={`/book/${entry.book.id}?read=1`} className="cta-primary mt-4 px-4 py-2 text-sm"><BookOpen className="h-4 w-4" /> {entry.reading_progress ? "Reprendre" : "Lire"}</Link>
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
