import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HEADER_CATEGORY_ITEMS } from "@/lib/book-categories";
import { getPublishedBooks } from "@/lib/books";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tous les livres",
  description: "Explorez le catalogue Holistique Books : livres gratuits, achats à l’unité et lectures incluses avec Premium.",
  alternates: { canonical: "/books" },
  openGraph: {
    title: "Catalogue de livres | Holistique Books",
    description: "Trouvez votre prochaine lecture parmi les auteurs et sélections Holistique Books.",
    url: "/books",
  },
};

type BooksPageProps = {
  searchParams: Promise<{ q?: string; category?: string; author?: string; access?: string }>;
};

type FilterPanelProps = {
  normalizedCategory?: string;
  accessQuery: string;
  compact?: boolean;
};

function FilterPanel({ normalizedCategory, accessQuery, compact = false }: FilterPanelProps) {
  const accessItems = [
    { label: "Tous les accès", value: "all", href: "/books" },
    { label: "Livres gratuits", value: "free", href: "/books?access=free" },
    { label: "Inclus Premium", value: "premium", href: "/books?access=premium" },
    { label: "Achat à l’unité", value: "purchase", href: "/books?access=purchase" },
  ];

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-5">
          <section>
            <h2 className="text-xs font-bold text-slate-500">Catégories</h2>
            <div className="mt-3 flex flex-wrap gap-2 lg:grid lg:gap-1">
              <Link
                href="/books"
                className={`rounded-full px-3 py-2 text-sm font-semibold transition lg:rounded-xl ${
                  !normalizedCategory ? "bg-night-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tous les livres
              </Link>
              {HEADER_CATEGORY_ITEMS.filter((item) => item.value !== "all" && item.value !== "new").map((item) => (
                <Link
                  key={item.value}
                  href={`/books?category=${encodeURIComponent(item.value)}`}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition lg:rounded-xl ${
                    item.value === normalizedCategory
                      ? "bg-brand-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h2 className="text-xs font-bold text-slate-500">Type d’accès</h2>
            <div className="mt-3 flex flex-wrap gap-2 lg:grid lg:gap-1">
              {accessItems.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition lg:rounded-xl ${
                    accessQuery === item.value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-600/25 bg-brand-50 p-4">
        <p className="text-sm font-bold text-slate-900">Holistique Premium</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Retrouvez toutes les lectures incluses dans votre abonnement.</p>
        <Link href="/dashboard/reader/subscriptions" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-brand-600">
          Découvrir Premium →
        </Link>
      </div>
    </div>
  );
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { q, category, author, access } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const authorQuery = author?.trim() ?? "";
  const accessQuery = access?.trim() ?? "all";
  const normalizedCategory = category?.trim() ? category.trim() : undefined;
  const baseBooks = await getPublishedBooks({ searchQuery, category: normalizedCategory });

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
    accessQuery === "free"
      ? "Livres gratuits"
      : accessQuery === "premium"
        ? "Inclus Premium"
        : accessQuery === "purchase"
          ? "Achat à l’unité"
          : null;
  const activeFilters = [activeCategoryLabel, activeAccessLabel, authorQuery || null, searchQuery || null].filter(Boolean) as string[];

  return (
    <div className="hb-fullbleed min-h-screen bg-slate-100">
      <div className="relative overflow-hidden bg-night-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-brand-300">La librairie Holistique</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Des histoires africaines à lire partout.</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Romans, essais et voix nouvelles, sélectionnés avec une vraie exigence éditoriale.</p>
            </div>
            <span className="relative hidden shrink-0 rounded-full border border-white/30 px-4 py-2 text-sm font-bold sm:inline">{books.length} livres</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-7 sm:px-6 sm:py-10 lg:px-8">
        <form action="/books" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-slate-500" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Titre, auteur, catégorie…"
              className="h-11 min-w-0 flex-1 bg-transparent px-1 text-base text-slate-900 outline-none"
            />
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-night-900 px-4 text-sm font-bold text-white">
              Chercher
            </button>
          </div>
        </form>

        <details className="group mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-brand-600" />
              Filtrer les livres
              {activeFilters.length > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[0.65rem] text-white">{activeFilters.length}</span>
              ) : null}
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 p-3">
            <FilterPanel normalizedCategory={normalizedCategory} accessQuery={accessQuery} compact />
          </div>
        </details>

        <div className="mt-5 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <FilterPanel normalizedCategory={normalizedCategory} accessQuery={accessQuery} />
            </div>
          </aside>

          <div className="min-w-0">
            <form action="/books" className="mb-6 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex lg:gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl bg-slate-50">
                <Search aria-hidden="true" className="ml-3 h-4 w-4 text-slate-500" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Rechercher par titre, auteur ou catégorie"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-slate-900 outline-none"
                />
              </div>
              <button type="submit" className="rounded-xl bg-night-900 px-5 text-sm font-bold text-white">
                Rechercher
              </button>
            </form>

            {activeFilters.length > 0 ? (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeFilters.map((filter) => (
                  <span key={filter} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {filter}
                    <Link href="/books" className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-50 hover:text-red-500" aria-label={`Retirer ${filter}`}>
                      <X aria-hidden="true" className="h-3 w-3" />
                    </Link>
                  </span>
                ))}
                <Link href="/books" className="shrink-0 px-2 py-2 text-xs font-bold text-brand-600">
                  Effacer
                </Link>
              </div>
            ) : null}

            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600">
              <p className="font-semibold">{books.length} résultat{books.length > 1 ? "s" : ""}</p>
              <label className="flex min-w-0 items-center gap-2">
                <span className="hidden sm:inline">Trier :</span>
                <select aria-label="Trier les livres" className="min-h-11 max-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-800">
                  <option>Pertinence</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Plus récents</option>
                </select>
              </label>
            </div>

            {books.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-11 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucun livre trouvé"
                description={
                  searchQuery || activeCategoryLabel || authorQuery || activeAccessLabel
                    ? "Essayez un autre terme ou retirez les filtres pour retrouver le reste de la sélection."
                    : "Aucun livre publié n’est disponible pour le moment."
                }
                action={
                  <Link href="/books" className="inline-flex h-11 items-center justify-center rounded-xl bg-night-900 px-4 text-sm font-bold text-white">
                    Voir tout le catalogue
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
