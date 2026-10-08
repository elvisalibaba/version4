import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cx } from "@/components/ui/cx";
import { paginationRange } from "@/lib/pagination";

const itemClass =
  "grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2";

export function Pagination({ currentPage, lastPage, hrefFor, className }: { currentPage: number; lastPage: number; hrefFor: (page: number) => string; className?: string }) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cx("flex justify-center", className)}>
      <ul className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <li>
            <Link href={hrefFor(currentPage - 1)} className={cx(itemClass, "gap-2 border border-line text-ink hover:border-ink")}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Précédent</span>
            </Link>
          </li>
        ) : null}
        {paginationRange(currentPage, lastPage).map((page, index) =>
          page === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">…</li>
          ) : (
            <li key={page}>
              <Link
                href={hrefFor(page)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={cx(itemClass, page === currentPage ? "bg-ink text-white" : "border border-line text-ink hover:border-ink")}
              >
                {page}
              </Link>
            </li>
          ),
        )}
        {currentPage < lastPage ? (
          <li>
            <Link href={hrefFor(currentPage + 1)} className={cx(itemClass, "flex gap-2 border border-line px-4 text-ink hover:border-ink")}>
              Suivant
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
