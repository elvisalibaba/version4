"use client";

import { useRouter } from "next/navigation";

/** Tri des résultats : chaque option porte déjà l'URL correspondante. */
export function SortSelect({ value, options }: { value: string; options: Array<{ value: string; label: string; href: string }> }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalogue-sort" className="text-sm font-semibold text-ink">Trier par</label>
      <select
        id="catalogue-sort"
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) router.push(option.href, { scroll: false });
        }}
        className="min-h-11 rounded-xl border border-line bg-white pl-3 pr-8 text-sm text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
