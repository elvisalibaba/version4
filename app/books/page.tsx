import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { EmptyState } from "@/components/ui/empty-state";
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
    accessQuery === "free" ? "Livres gratuits" : accessQuery === "premium" ? "Inclus Premium" : accessQuery === "purchase" ? "Achat à l'unité" : null;
  const activeFilters = [activeCategoryLabel, activeAccessLabel, authorQuery || null, searchQuery || null].filter(Boolean) as string[];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header breadcrumb / banner (Amazon style) */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-[#ff9900]">Accueil</Link>
              <span>›</span>
              <span className="text-gray-800 font-medium">Catalogue</span>
            </div>
            <div className="text-sm text-gray-500">
              {books.length} résultats
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <h2 className="font-medium text-gray-900 mb-3">Filtres</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Catégories</h3>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/books"
                        className={`text-sm block py-1 ${!normalizedCategory ? "text-[#ff9900] font-medium" : "text-gray-600 hover:text-[#ff9900]"}`}
                      >
                        Tous les livres
                      </Link>
                    </li>
                    {HEADER_CATEGORY_ITEMS.filter((item) => item.value !== "all" && item.value !== "new").map((item) => (
                      <li key={item.value}>
                        <Link
                          href={`/books?category=${encodeURIComponent(item.value)}`}
                          className={`text-sm block py-1 ${item.value === normalizedCategory ? "text-[#ff9900] font-medium" : "text-gray-600 hover:text-[#ff9900]"}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Type d&apos;accès</h3>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/books?access=free"
                        className={`text-sm block py-1 ${accessQuery === "free" ? "text-[#ff9900] font-medium" : "text-gray-600 hover:text-[#ff9900]"}`}
                      >
                        Livres gratuits
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/books?access=premium"
                        className={`text-sm block py-1 ${accessQuery === "premium" ? "text-[#ff9900] font-medium" : "text-gray-600 hover:text-[#ff9900]"}`}
                      >
                        Inclus Premium
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/books?access=purchase"
                        className={`text-sm block py-1 ${accessQuery === "purchase" ? "text-[#ff9900] font-medium" : "text-gray-600 hover:text-[#ff9900]"}`}
                      >
                        Achat à l&apos;unité
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional: promotion banner */}
            <div className="bg-[#ff9900]/10 border border-[#ff9900]/30 rounded-md p-4">
              <p className="text-sm font-semibold text-gray-900">Offre Premium</p>
              <p className="text-xs text-gray-600 mt-1">Accédez à tous les livres en illimité.</p>
              <Link href="/dashboard/reader/subscriptions" className="mt-2 inline-block text-xs font-medium text-[#ff9900] hover:underline">
                Découvrir →
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Search bar */}
            <div className="bg-white rounded-md border border-gray-200 p-4 mb-6">
              <form action="/books" className="flex gap-2">
                <div className="flex-1 flex items-center border border-gray-300 rounded-md bg-white">
                  <Search className="h-4 w-4 text-gray-400 ml-3" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Rechercher par titre, auteur ou catégorie"
                    className="flex-1 px-3 py-2 text-sm text-gray-900 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#ff9900] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#e68900] transition"
                >
                  Rechercher
                </button>
              </form>
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Filtres actifs :</span>
                {activeFilters.map((filter) => (
                  <span key={filter} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {filter}
                    <Link href="/books" className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </Link>
                  </span>
                ))}
                <Link href="/books" className="text-xs text-[#ff9900] hover:underline ml-2">
                  Tout effacer
                </Link>
              </div>
            )}

            {/* Results count and sorting (Amazon style) */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
              <p>{books.length} résultats</p>
              <div className="flex items-center gap-2">
                <span>Trier par :</span>
                <select className="border border-gray-300 rounded-md text-sm px-2 py-1 bg-white">
                  <option>Pertinence</option>
                  <option>Prix croissant</option>
                  <option>Prix décroissant</option>
                  <option>Les plus récents</option>
                </select>
              </div>
            </div>

            {/* Books grid */}
            {books.length > 0 ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    : "Aucun livre publié n'est disponible pour le moment."
                }
                action={
                  <Link
                    href="/books"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#ff9900] px-4 text-sm font-semibold text-white transition hover:bg-[#e68900]"
                  >
                    Voir tout le catalogue
                  </Link>
                }
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
