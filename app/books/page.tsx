import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HEADER_CATEGORY_ITEMS } from "@/lib/book-categories";
import { getPublishedBooks } from "@/lib/books";

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
      <div className="rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm">
        <div className="space-y-5">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8178]">Catégories</h2>
            <div className="mt-3 flex flex-wrap gap-2 lg:grid lg:gap-1">
              <Link
                href="/books"
                className={`rounded-full px-3 py-2 text-sm font-semibold transition lg:rounded-xl ${
                  !normalizedCategory ? "bg-[#171717] text-white" : "bg-[#f8f5f0] text-[#5f574f] hover:bg-[#f2ebe3]"
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
                      ? "bg-[#ff7a5c] text-white"
                      : "bg-[#f8f5f0] text-[#5f574f] hover:bg-[#f2ebe3]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="border-t border-[#efe6dc] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8178]">Type d’accès</h2>
            <div className="mt-3 flex flex-wrap gap-2 lg:grid lg:gap-1">
              {accessItems.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition lg:rounded-xl ${
                    accessQuery === item.value
                      ? "bg-[#ff7a5c] text-white"
                      : "bg-[#f8f5f0] text-[#5f574f] hover:bg-[#f2ebe3]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-[#ff7a5c]/25 bg-[#fff3ef] p-4">
        <p className="text-sm font-bold text-[#171717]">Holistique Premium</p>
        <p className="mt-1 text-xs leading-5 text-[#6f665e]">Retrouvez toutes les lectures incluses dans votre abonnement.</p>
        <Link href="/dashboard/reader/subscriptions" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-[#c85439]">
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
    <div className="min-h-screen bg-[#f8f5f0]">
      <div className="border-b border-[#eadfd4] bg-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Librairie mobile</p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#171717] sm:text-3xl">Trouver votre prochaine lecture</h1>
            </div>
            <span className="shrink-0 rounded-full bg-[#f8f5f0] px-3 py-1.5 text-xs font-bold text-[#6f665e]">{books.length} livres</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <form action="/books" className="rounded-2xl border border-[#eadfd4] bg-white p-2 shadow-sm sm:p-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-[#8a8178]" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Titre, auteur, catégorie…"
              className="h-11 min-w-0 flex-1 bg-transparent px-1 text-base text-[#171717] outline-none"
            />
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-[#171717] px-4 text-sm font-bold text-white">
              Chercher
            </button>
          </div>
        </form>

        <details className="group mt-3 rounded-2xl border border-[#eadfd4] bg-white shadow-sm lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-[#403a34] [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-[#ff7a5c]" />
              Filtrer les livres
              {activeFilters.length > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff7a5c] px-1 text-[0.65rem] text-white">{activeFilters.length}</span>
              ) : null}
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-[#efe6dc] p-3">
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
            <form action="/books" className="mb-6 hidden rounded-2xl border border-[#eadfd4] bg-white p-3 shadow-sm lg:flex lg:gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl bg-[#f8f5f0]">
                <Search aria-hidden="true" className="ml-3 h-4 w-4 text-[#8a8178]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Rechercher par titre, auteur ou catégorie"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-[#171717] outline-none"
                />
              </div>
              <button type="submit" className="rounded-xl bg-[#171717] px-5 text-sm font-bold text-white">
                Rechercher
              </button>
            </form>

            {activeFilters.length > 0 ? (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeFilters.map((filter) => (
                  <span key={filter} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#5f574f] ring-1 ring-[#eadfd4]">
                    {filter}
                    <Link href="/books" className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#fff0ec] hover:text-red-500" aria-label={`Retirer ${filter}`}>
                      <X aria-hidden="true" className="h-3 w-3" />
                    </Link>
                  </span>
                ))}
                <Link href="/books" className="shrink-0 px-2 py-2 text-xs font-bold text-[#c85439]">
                  Effacer
                </Link>
              </div>
            ) : null}

            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[#6f665e]">
              <p className="font-semibold">{books.length} résultat{books.length > 1 ? "s" : ""}</p>
              <label className="flex min-w-0 items-center gap-2">
                <span className="hidden sm:inline">Trier :</span>
                <select aria-label="Trier les livres" className="min-h-11 max-w-[170px] rounded-xl border border-[#eadfd4] bg-white px-3 text-base text-[#403a34]">
                  <option>Pertinence</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Plus récents</option>
                </select>
              </label>
            </div>

            {books.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
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
                  <Link href="/books" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#171717] px-4 text-sm font-bold text-white">
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
