import Link from "next/link";
import { Heart, LibraryBig, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";
import { requireRole } from "@/lib/auth";
import { getReaderFavorites } from "@/lib/reader-api";

export default async function ReaderFavoritesPage() {
  const profile = await requireRole(["reader"]);
  const books = await getReaderFavorites();
  const categories = new Set(books.flatMap((book) => book.categories ?? []));

  return (
    <section className="space-y-6">
      <DashboardTopbar kicker="Favoris" title={`Vos livres à suivre, ${profile.name ?? profile.email}`} description="Votre sélection personnelle est maintenant synchronisée via l’API Laravel." actions={<Link href="/books" className="cta-primary px-5 py-3 text-sm">Explorer</Link>} />
      <div className="metric-grid">
        <StatCard icon={Heart} label="Favoris" value={books.length} description="Titres sauvegardés" tone="rose" />
        <StatCard icon={Sparkles} label="Catégories" value={categories.size} description="Univers suivis" tone="violet" />
        <StatCard icon={LibraryBig} label="Disponibles" value={books.filter((book) => book.status === "published").length} description="À consulter" tone="amber" />
      </div>
      <section className="surface-panel p-6">
        {books.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {books.map((book) => (
              <article key={book.id} className="rounded-[1.6rem] border border-[#ece3d7] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{book.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6f665e]">{book.description ?? "Livre sauvegardé."}</p>
                  </div>
                  <FavoriteBookButton bookId={book.id} initialIsFavorite compact />
                </div>
                <Link href={`/book/${book.id}`} className="cta-secondary mt-4 px-4 py-2 text-sm">Voir le livre</Link>
              </article>
            ))}
          </div>
        ) : <EmptyState title="Aucun favori" description="Ajoutez des livres avec le bouton cœur depuis le catalogue." />}
      </section>
    </section>
  );
}
