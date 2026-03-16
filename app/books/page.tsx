import Link from "next/link";
import { BookCard } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { SearchBar } from "@/components/ui/search-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { HEADER_CATEGORY_ITEMS } from "@/lib/book-categories";
import { getPublishedBooks } from "@/lib/books";

type BooksPageProps = {
  searchParams: Promise<{ q?: string; category?: string; author?: string; access?: string }>;
};

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { q, category, author, access } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const authorQuery = author?.trim() ?? "";
  const accessQuery = access?.trim() ?? "all";
  const normalizedCategory = category?.trim() ? category.trim() : undefined;
  const baseBooks = await getPublishedBooks({
    searchQuery,
    category: normalizedCategory,
  });
  const books = baseBooks.filter((book) => {
    const matchesAuthor = authorQuery ? (book.author_name ?? "").toLowerCase() === authorQuery.toLowerCase() : true;
    const matchesAccess =
      accessQuery === "free"
        ? book.is_free
        : accessQuery === "premium"
          ? book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only"
          : accessQuery === "purchase"
            ? book.offer_mode === "sale_only" || book.offer_mode === "sale_and_subscription"
            : true;

    return matchesAuthor && matchesAccess;
  });
  const activeCategoryLabel = HEADER_CATEGORY_ITEMS.find((item) => item.value === normalizedCategory)?.label ?? normalizedCategory;
  const activeAccessLabel =
    accessQuery === "free" ? "Livres gratuits" : accessQuery === "premium" ? "Inclus Premium" : accessQuery === "purchase" ? "Achat a l unite" : null;

  return (
    <section className="space-y-8">
      <PageHero
        kicker="Catalogue"
        title="Trouvez le livre de transformation qui parle a votre saison."
        description="Explorez une selection de lectures pour la foi, la clarte, la croissance personnelle, le leadership et la guerison interieure."
        actions={
          <>
            <Link href="/librairie" className="cta-primary px-5 py-3 text-sm">
              Explorer la librairie
            </Link>
            <Link href="/dashboard/reader/subscriptions" className="cta-secondary px-5 py-3 text-sm">
              Decouvrir Premium
            </Link>
          </>
        }
        aside={
          <div className="surface-panel-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Trouver vite</p>
            <div className="mt-4">
              <SearchBar defaultValue={searchQuery} placeholder="Titre, auteur, theme ou categorie" buttonLabel="Chercher" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Titres</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{books.length}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Filtre</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{activeCategoryLabel ?? activeAccessLabel ?? "Tous les genres"}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Intention</p>
                <p className="mt-2 truncate text-base font-semibold text-slate-950">{searchQuery || authorQuery || "Foi, clarte, leadership..."}</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="catalog-layout">
        <aside className="catalog-panel space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Votre parcours</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Affinez votre recherche</h2>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Recherche</p>
            <SearchBar defaultValue={searchQuery} placeholder="Rechercher un livre transformationnel" buttonLabel="Aller" compact />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Genres</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/books" className={`cta-secondary px-4 py-2 text-xs ${!activeCategoryLabel ? "bg-violet-50 text-violet-700" : ""}`}>
                Tous
              </Link>
              {HEADER_CATEGORY_ITEMS.map((item) => {
                const active = item.label === activeCategoryLabel;
                return (
                  <Link
                    key={item.value}
                    href={`/books?category=${item.value}`}
                    className={`cta-secondary px-4 py-2 text-xs ${active ? "bg-violet-50 text-violet-700" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-violet-50/80 p-4">
            <p className="text-sm font-semibold text-slate-950">Disponibilite</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="catalog-badge">Lecture instantanee</span>
              <span className="catalog-badge">Vente individuelle</span>
              <span className="catalog-badge">Inclus Premium</span>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="surface-panel p-5">
            <SectionHeader
              kicker="Selection"
              title="Lectures pour grandir"
              description={
                searchQuery || activeCategoryLabel || authorQuery || activeAccessLabel
                  ? "Votre recherche a ete appliquee sur notre selection actuelle."
                  : "Des livres choisis pour aider a penser mieux, vivre mieux et agir avec plus de clarte."
              }
              action={
                searchQuery || activeCategoryLabel || authorQuery || activeAccessLabel ? (
                  <Link href="/books" className="cta-secondary px-4 py-2 text-sm">
                    Effacer les filtres
                  </Link>
                ) : null
              }
            />
            {(searchQuery || activeCategoryLabel) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeCategoryLabel ? <span className="catalog-badge">{activeCategoryLabel}</span> : null}
                {searchQuery ? <span className="catalog-badge">&quot;{searchQuery}&quot;</span> : null}
              </div>
            )}
            {(authorQuery || activeAccessLabel) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {authorQuery ? <span className="catalog-badge">{authorQuery}</span> : null}
                {activeAccessLabel ? <span className="catalog-badge">{activeAccessLabel}</span> : null}
              </div>
            )}
          </div>

          {books.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun livre trouve"
              description={
                searchQuery || activeCategoryLabel
                  ? "Essayez une autre thematique ou retirez vos filtres pour retrouver le reste de la selection."
                  : "Aucun livre publie n est disponible pour le moment."
              }
              action={
                <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
                  Revenir au catalogue complet
                </Link>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
