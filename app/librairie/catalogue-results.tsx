import Link from "next/link";
import { AlertTriangle, SearchX, X } from "lucide-react";
import { SortSelect } from "@/components/librairie/sort-select";
import { BookCard } from "@/components/ui/book-card";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getCataloguePage } from "@/lib/books";
import { activeCatalogueFilters, CATALOGUE_SORTS, catalogueApiQuery, catalogueHref, type CatalogueFilters } from "@/lib/catalogue-filters";

export async function CatalogueResults({ filters }: { filters: CatalogueFilters }) {
  const result = await getCataloguePage(catalogueApiQuery(filters));
  const active = activeCatalogueFilters(filters);
  const sortOptions = CATALOGUE_SORTS.map((sort) => ({ ...sort, href: catalogueHref(filters, { sort: sort.value }) }));

  if (result.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-card bg-surface p-8">
        <AlertTriangle aria-hidden="true" className="h-7 w-7 text-amber-700" />
        <h2 className="font-display text-xl font-bold text-ink">La librairie est momentanément indisponible</h2>
        <p className="text-muted">Nous n’arrivons pas à charger le catalogue. Réessayez dans un instant.</p>
        <ButtonLink href={catalogueHref(filters, { page: filters.page })}>Réessayer</ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p role="status" className="text-sm text-muted">
            <strong className="font-display text-base text-ink">{result.total.toLocaleString("fr-FR")}</strong> résultat{result.total > 1 ? "s" : ""}
          </p>
          {active.length > 0 ? (
            <ul aria-label="Filtres actifs" className="mt-3 flex flex-wrap gap-2">
              {active.map((filter) => (
                <li key={filter.key}>
                  <Link
                    href={filter.href}
                    scroll={false}
                    aria-label={`Retirer le filtre ${filter.label}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-wash pl-3 pr-2 text-[0.8rem] font-semibold text-brand-deep transition-colors hover:bg-brand-tint"
                  >
                    {filter.label}
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/librairie" scroll={false} className="inline-flex min-h-11 items-center px-2 text-[0.8rem] font-semibold text-ink underline underline-offset-4">
                  Tout effacer
                </Link>
              </li>
            </ul>
          ) : null}
        </div>
        <SortSelect value={filters.sort} options={sortOptions} />
      </div>

      {result.books.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-card bg-surface px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="h-8 w-8 text-brand-deep" />
          <h2 className="font-display text-xl font-bold text-ink">Aucun livre ne correspond à ces filtres</h2>
          <p className="max-w-md text-muted">Essayez un autre mot-clé ou retirez quelques filtres pour élargir la recherche.</p>
          <ButtonLink href="/librairie">Réinitialiser les filtres</ButtonLink>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {result.books.map((book, index) => (
              <li key={book.id}><BookCard book={book} priority={index < 4} /></li>
            ))}
          </ul>
          <Pagination
            className="mt-14"
            currentPage={result.currentPage}
            lastPage={result.lastPage}
            hrefFor={(page) => catalogueHref(filters, { page })}
          />
        </>
      )}
    </div>
  );
}

export function CatalogueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement des livres">
      <div className="flex justify-between border-b border-line pb-5">
        <div className="hb-skeleton h-5 w-32 rounded-full" />
        <div className="hb-skeleton h-11 w-48 rounded-xl" />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index}>
            <div className="hb-skeleton aspect-[2/3] rounded-xl" />
            <div className="hb-skeleton mt-3 h-4 w-4/5 rounded-full" />
            <div className="hb-skeleton mt-2 h-3 w-1/2 rounded-full" />
            <div className="hb-skeleton mt-4 h-4 w-1/3 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
