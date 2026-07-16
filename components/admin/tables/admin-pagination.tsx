import Link from "next/link";
import type { AdminPaginationMeta } from "@/types/admin";

function toSearchString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

type AdminPaginationProps = {
  basePath: string;
  pagination: AdminPaginationMeta;
  params?: Record<string, string | undefined>;
};

export function AdminPagination({ basePath, pagination, params = {} }: AdminPaginationProps) {
  const canGoBack = pagination.page > 1;
  const canGoForward = pagination.page < pagination.totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-violet-200/60 bg-white/80 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-950">{pagination.page}</span> sur{" "}
        <span className="font-semibold text-slate-950">{pagination.totalPages}</span> · {pagination.total} element(s)
      </p>
      <div className="flex gap-2">
        <Link
          href={`${basePath}${toSearchString({ ...params, page: canGoBack ? String(pagination.page - 1) : "1" })}`}
          aria-disabled={!canGoBack}
          className={`cta-secondary px-4 py-2 text-xs ${!canGoBack ? "pointer-events-none opacity-50" : ""}`}
        >
          Precedent
        </Link>
        <Link
          href={`${basePath}${toSearchString({
            ...params,
            page: canGoForward ? String(pagination.page + 1) : String(pagination.totalPages),
          })}`}
          aria-disabled={!canGoForward}
          className={`cta-secondary px-4 py-2 text-xs ${!canGoForward ? "pointer-events-none opacity-50" : ""}`}
        >
          Suivant
        </Link>
      </div>
    </div>
  );
}
