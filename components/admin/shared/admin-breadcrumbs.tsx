import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'ariane" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-slate-950" : ""}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
