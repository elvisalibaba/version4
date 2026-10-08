import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type BadgeTone = "brand" | "ink" | "light" | "flash" | "success";

const tones: Record<BadgeTone, string> = {
  brand: "bg-brand-wash text-brand-deep",
  ink: "bg-ink text-white",
  light: "bg-white text-ink",
  flash: "bg-flash text-ink",
  success: "bg-emerald-50 text-emerald-800",
};

/** Pastille courte : format, accès, remise. */
export function Badge({ tone = "brand", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase leading-none tracking-[0.06em]", tones[tone], className)}>
      {children}
    </span>
  );
}
