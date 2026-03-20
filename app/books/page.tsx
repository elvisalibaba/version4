import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
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
    accessQuery === "free" ? "Livres gratuits" : accessQuery === "premium" ? "Inclus Premium" : accessQuery === "purchase" ? "Achat a l unite" : null;
  const activeFilters = [activeCategoryLabel, activeAccessLabel, authorQuery || null, searchQuery || null].filter(Boolean) as string[];

  return (
    <section className="space-y-8 pb-4">
      <section className="rounded-[40px] border border-[#ece3d7] bg-[linear-gradient(135deg,#171717_0%,#2c211b_44%,#6a3d2e_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              Catalogue
            </span>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-[2.35rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.15rem]">
                Parcourez la boutique comme une vraie librairie ebook.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                Recherche rapide, categories visibles, produits clairs et rayons mieux structures pour aider les lecteurs a trouver le bon livre.
              </p>
            </div>

            <form
              action="/books"
              className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/8 p-3 backdrop-blur sm:flex-row sm:items-center"
            >
              <div className="flex min-h-[3.25rem] flex-1 items-center gap-3 rounded-full bg-white px-4">
                <Search className="h-4 w-4 text-[#8b8177]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Titre, auteur ou categorie"
                  className="h-full flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9a8f84]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#171717] transition hover:bg-[#f3eee8]"
              >
                Rechercher
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/books"
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition ${
                  !activeCategoryLabel ? "border-white bg-white text-[#171717]" : "border-white/12 bg-white/8 text-white/84 hover:bg-white/14"
                }`}
              >
                Tous
              </Link>
              {HEADER_CATEGORY_ITEMS.filter((item) => item.value !== "all" && item.value !== "new").map((item) => {
                const active = item.label === activeCategoryLabel;
                return (
                  <Link
                    key={item.value}
                    href={`/books?category=${encodeURIComponent(item.value)}`}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition ${
                      active ? "border-white bg-white text-[#171717]" : "border-white/12 bg-white/8 text-white/84 hover:bg-white/14"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffd9cd]">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#ffd9cd]">Vue boutique</p>
                <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">{books.length} titre(s)</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Link
                href="/books?access=free"
                className={`rounded-[22px] border px-4 py-3 text-sm transition ${
                  accessQuery === "free" ? "border-white bg-white text-[#171717]" : "border-white/10 bg-white/8 text-white/84 hover:bg-white/12"
                }`}
              >
                Livres gratuits
              </Link>
              <Link
                href="/books?access=premium"
                className={`rounded-[22px] border px-4 py-3 text-sm transition ${
                  accessQuery === "premium" ? "border-white bg-white text-[#171717]" : "border-white/10 bg-white/8 text-white/84 hover:bg-white/12"
                }`}
              >
                Inclus Premium
              </Link>
              <Link
                href="/books?access=purchase"
                className={`rounded-[22px] border px-4 py-3 text-sm transition ${
                  accessQuery === "purchase" ? "border-white bg-white text-[#171717]" : "border-white/10 bg-white/8 text-white/84 hover:bg-white/12"
                }`}
              >
                Achat a l unite
              </Link>
              <Link href="/dashboard/reader/subscriptions" className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#ffd9cd]">
                Voir Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Resultats</p>
            <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717]">Rayon principal</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">
              {activeFilters.length > 0
                ? "Les filtres ci-dessous sont appliques sur le catalogue publie."
                : "Tous les livres publies apparaissent ici avec une presentation plus storefront."}
            </p>
          </div>
          {activeFilters.length > 0 ? (
            <Link
              href="/books"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-[#fcfaf7] px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb] hover:bg-white"
            >
              Effacer les filtres
            </Link>
          ) : null}
        </div>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="inline-flex items-center rounded-full bg-[#fff1ea] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#a85b3f]">
                {filter}
              </span>
            ))}
          </div>
        ) : null}

        {books.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun livre trouve"
            description={
              searchQuery || activeCategoryLabel || authorQuery || activeAccessLabel
                ? "Essayez un autre terme ou retirez les filtres pour retrouver le reste de la selection."
                : "Aucun livre publie n est disponible pour le moment."
            }
            action={
              <Link
                href="/books"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Revenir au catalogue complet
              </Link>
            }
          />
        )}
      </section>
    </section>
  );
}
