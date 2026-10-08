"use client";

import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cx } from "@/components/ui/cx";

/** Sur mobile, les filtres se replient au-dessus de la grille ; toujours visibles sur grand écran. */
export function FiltersPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink px-5 text-sm font-semibold text-ink lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        {open ? "Masquer les filtres" : "Filtrer"}
        {activeCount > 0 ? <span className="rounded-full bg-brand-deep px-2 text-xs text-white">{activeCount}</span> : null}
      </button>
      <div id={panelId} className={cx("mt-6 space-y-6 lg:mt-0 lg:block", open ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  );
}
