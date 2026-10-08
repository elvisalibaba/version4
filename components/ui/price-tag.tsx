import { formatMoney } from "@/components/cart/money";
import { cx } from "@/components/ui/cx";

type PriceTagProps = {
  amount: number;
  currencyCode?: string;
  isFree?: boolean;
  /** Prix barré (vente flash). */
  compareAt?: number | null;
  /** Libellé déjà calculé (ex. « Inclus dans l'abonnement »), prioritaire sur le montant. */
  label?: string | null;
  tone?: "light" | "dark";
  className?: string;
};

export function PriceTag({ amount, currencyCode = "USD", isFree = false, compareAt, label, tone = "light", className }: PriceTagProps) {
  const color = tone === "dark" ? "text-brand-soft" : "text-brand-deep";

  if (isFree || amount <= 0) {
    return <p className={cx("font-display text-[0.95rem] font-bold", color, className)}>{label && !isFree ? label : "Gratuit"}</p>;
  }

  return (
    <p className={cx("flex flex-wrap items-baseline gap-x-2 font-display text-[0.95rem] font-bold tabular-nums", color, className)}>
      <span>{label ?? formatMoney(amount, currencyCode)}</span>
      {compareAt && compareAt > amount ? (
        <s className={cx("text-xs font-semibold", tone === "dark" ? "text-muted-dark" : "text-muted")}>
          <span className="sr-only">Prix initial </span>
          {formatMoney(compareAt, currencyCode)}
        </s>
      ) : null}
    </p>
  );
}
