import Link from "next/link";
import { Check } from "lucide-react";
import { cx } from "@/components/ui/cx";

export type FilterOption = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

type FilterGroupProps = {
  title: string;
  options: FilterOption[];
  /** radio : un seul choix ; checkbox : cumulable ; chips : pastilles compactes. */
  variant?: "radio" | "checkbox" | "chips";
  className?: string;
};

/**
 * Groupe de filtres sous forme de liens : chaque option porte l'URL du
 * catalogue une fois le filtre appliqué (ou retiré), sans JavaScript.
 */
export function FilterGroup({ title, options, variant = "radio", className }: FilterGroupProps) {
  if (options.length === 0) return null;
  const headingId = `filtre-${title.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className={cx("border-b border-line pb-6", className)}>
      <h2 id={headingId} className="font-display text-sm font-bold text-ink">{title}</h2>
      <ul className={cx("mt-3", variant === "chips" ? "flex flex-wrap gap-2" : "space-y-0.5")}>
        {options.map((option) => (
          <li key={option.href}>
            {variant === "chips" ? (
              <Link
                href={option.href}
                scroll={false}
                aria-current={option.active ? "true" : undefined}
                className={cx(
                  "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[0.8rem] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep",
                  option.active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-brand-tint hover:bg-brand-wash",
                )}
              >
                {option.label}
              </Link>
            ) : (
              <Link
                href={option.href}
                scroll={false}
                aria-current={option.active ? "true" : undefined}
                className="group flex min-h-10 items-center gap-3 rounded-lg px-1 text-sm text-ink transition-colors hover:text-brand-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "grid h-[18px] w-[18px] shrink-0 place-items-center border-[1.5px] transition-colors",
                    variant === "radio" ? "rounded-full" : "rounded-[5px]",
                    option.active ? "border-brand-deep bg-brand-deep" : "border-night-300 bg-white group-hover:border-brand-deep",
                  )}
                >
                  {option.active ? (
                    variant === "radio" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  ) : null}
                </span>
                <span className={cx("min-w-0 flex-1", option.active && "font-semibold")}>{option.label}</span>
                {typeof option.count === "number" ? <span className="text-xs tabular-nums text-muted">{option.count}</span> : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
