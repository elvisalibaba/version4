import { Star } from "lucide-react";
import { cx } from "@/components/ui/cx";

/** Note sur 5 avec le nombre d'avis ; « Nouveauté » tant qu'il n'y a aucun avis. */
export function RatingStars({ value, count, tone = "light", className }: { value?: number | null; count?: number | null; tone?: "light" | "dark"; className?: string }) {
  const muted = tone === "dark" ? "text-muted-dark" : "text-muted";

  if (!value || !count) {
    return <p className={cx("text-xs", muted, className)}>Nouveauté</p>;
  }

  const rounded = Math.round(value);
  const label = `Note ${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5, ${count} avis`;

  return (
    <p className={cx("flex items-center gap-1.5 text-xs", muted, className)} aria-label={label} role="img">
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star key={index} strokeWidth={1.5} className={cx("h-3.5 w-3.5", index <= rounded ? "fill-flash text-amber-500" : "fill-transparent text-night-300")} />
        ))}
      </span>
      <span aria-hidden="true" className="tabular-nums">
        {value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · {count} avis
      </span>
    </p>
  );
}
