import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search, Zap } from "lucide-react";
import { FiltersPanel } from "@/components/librairie/filters-panel";
import { Badge } from "@/components/ui/badge";
import { BookCard } from "@/components/ui/book-card";
import { FilterGroup } from "@/components/ui/filter-group";
import { getFlashSaleBooks } from "@/lib/books";
import {
  ACCESS_FILTERS,
  activeCatalogueFilters,
  CATALOGUE_FORMATS,
  catalogueApiQuery,
  catalogueHref,
  EDITORIAL_POLES,
  parseCatalogueFilters,
  toggleFormat,
  WORK_TYPES,
  type RawSearchParams,
} from "@/lib/catalogue-filters";
import { getPublicCategories } from "@/lib/categories";
import { CatalogueResults, CatalogueSkeleton } from "./catalogue-results";

export const metadata: Metadata = {
  title: "Librairie",
  description: "Ebooks, livres papier, livres audio et magazines d’auteurs africains et francophones : la librairie Holistique Books.",
  alternates: { canonical: "/librairie" },
};

export default async function LibrairiePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = parseCatalogueFilters(await searchParams);
  const [categories, flashSale] = await Promise.all([getPublicCategories(), getFlashSaleBooks()]);
  const activeCount = activeCatalogueFilters(filters).filter((filter) => filter.key !== "search").length;

  return (
    <div className="hb-bleed bg-white">
      {/* Bandeau et recherche */}
      <section aria-labelledby="librairie-title" className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <p className="hb-eyebrow !text-brand-soft">Holistique Books Store</p>
          <h1 id="librairie-title" className="mt-4 font-display text-[2.2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
            La librairie de l’Afrique francophone
          </h1>
          <p className="mt-4 max-w-xl text-[1.05rem] leading-7 text-muted-dark">
            Ebooks, livres papier, livres audio et magazines d’auteurs africains et francophones.
          </p>
          <form action="/librairie" role="search" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label htmlFor="catalogue-search" className="sr-only">Rechercher par titre, sous-titre, auteur ou éditeur</label>
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="catalogue-search"
                name="search"
                type="search"
                defaultValue={filters.search}
                placeholder="Titre, sous-titre, auteur, éditeur…"
                className="hb-bare-input block min-h-12 w-full !rounded-full !bg-white !pl-12 pr-5 text-[0.95rem] text-ink placeholder:text-muted focus:!outline-2 focus:!outline-brand-soft"
              />
            </div>
            {/* La recherche conserve les autres filtres et revient en page 1. */}
            {filters.editorial_pole ? <input type="hidden" name="editorial_pole" value={filters.editorial_pole} /> : null}
            {filters.work_type ? <input type="hidden" name="work_type" value={filters.work_type} /> : null}
            {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
            {filters.format.length ? <input type="hidden" name="format" value={filters.format.join(",")} /> : null}
            {ACCESS_FILTERS.map((access) => (filters[access.key] ? <input key={access.key} type="hidden" name={access.key} value="1" /> : null))}
            {filters.sort !== "newest" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
            <button type="submit" className="min-h-12 rounded-full bg-brand px-7 font-semibold text-black transition-colors hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:px-8 lg:py-12">
        <aside aria-label="Filtres du catalogue">
          <FiltersPanel activeCount={activeCount}>
            <FilterGroup
              title="Pôle éditorial"
              options={[
                { label: "Tous les pôles", href: catalogueHref(filters, { editorial_pole: "" }), active: !filters.editorial_pole },
                ...EDITORIAL_POLES.map((pole) => ({ label: pole.label, href: catalogueHref(filters, { editorial_pole: pole.value }), active: filters.editorial_pole === pole.value })),
              ]}
            />
            <FilterGroup
              title="Type d’œuvre"
              variant="chips"
              options={[
                { label: "Tous", href: catalogueHref(filters, { work_type: "" }), active: !filters.work_type },
                ...WORK_TYPES.map((type) => ({ label: type.label, href: catalogueHref(filters, { work_type: type.value }), active: filters.work_type === type.value })),
              ]}
            />
            <FilterGroup
              title="Catégories"
              options={[
                { label: "Toutes les catégories", href: catalogueHref(filters, { category: "" }), active: !filters.category },
                ...categories.filter((category) => (category.books_count ?? 0) > 0 || category.name === filters.category).map((category) => ({
                  label: category.name,
                  href: catalogueHref(filters, { category: filters.category === category.name ? "" : category.name }),
                  active: filters.category === category.name,
                  count: category.books_count,
                })),
              ]}
            />
            <FilterGroup
              title="Format"
              variant="chips"
              options={[
                { label: "Tous", href: catalogueHref(filters, { format: [] }), active: filters.format.length === 0 },
                ...CATALOGUE_FORMATS.map((format) => ({ label: format.label, href: catalogueHref(filters, { format: toggleFormat(filters, format.value) }), active: filters.format.includes(format.value) })),
              ]}
            />
            <FilterGroup
              title="Accès"
              variant="checkbox"
              className="border-b-0"
              options={ACCESS_FILTERS.map((access) => ({ label: access.label, href: catalogueHref(filters, { [access.key]: !filters[access.key] }), active: filters[access.key] }))}
            />
            <div className="rounded-card bg-surface p-5">
              <p className="font-display text-sm font-bold text-ink">Vous êtes auteur ?</p>
              <p className="mt-2 text-sm leading-6 text-muted">Publiez votre livre et touchez des lecteurs dans toute l’Afrique francophone.</p>
              <Link href="/register?role=author" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-brand-deep hover:underline">Publier mon livre →</Link>
            </div>
          </FiltersPanel>
        </aside>

        <div className="min-w-0">
          {flashSale.books.length > 0 ? (
            <details className="group mb-8 rounded-card bg-ink text-white">
              <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  {flashSale.discountPercentage > 0 ? (
                    <Badge tone="flash" className="px-3 py-2 text-base">−{flashSale.discountPercentage} %</Badge>
                  ) : (
                    <Zap aria-hidden="true" className="h-6 w-6 text-flash" />
                  )}
                  <span>
                    <span className="block font-display text-lg font-bold">Vente flash</span>
                    <span className="block text-sm text-muted-dark">Une sélection de livres à prix réduit, pour une durée limitée.</span>
                  </span>
                </span>
                <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-black transition-colors group-open:bg-brand-soft">
                  <span className="group-open:hidden">Voir la sélection</span>
                  <span className="hidden group-open:inline">Masquer la sélection</span>
                </span>
              </summary>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-10 border-t border-white/10 p-5 sm:grid-cols-3 xl:grid-cols-4">
                {flashSale.books.map((book) => (
                  <li key={book.id}><BookCard book={book} tone="dark" /></li>
                ))}
              </ul>
            </details>
          ) : null}

          <Suspense key={catalogueApiQuery(filters)} fallback={<CatalogueSkeleton />}>
            <CatalogueResults filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
