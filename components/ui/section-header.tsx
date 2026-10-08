import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Niveau du titre : h1 pour l'en-tête de page, h2 (défaut) pour une section. */
  as?: "h1" | "h2";
  tone?: "light" | "dark";
  align?: "start" | "center";
  action?: ReactNode;
  id?: string;
  className?: string;
};

/** Surtitre + titre (+ chapô et action), commun à toutes les sections. */
export function SectionHeader({ eyebrow, title, intro, as: Heading = "h2", tone = "light", align = "start", action, id, className }: SectionHeaderProps) {
  const dark = tone === "dark";
  const centered = align === "center";

  return (
    <div className={cx("flex flex-col gap-5", !centered && action ? "md:flex-row md:items-end md:justify-between" : "", centered ? "items-center text-center" : "", className)}>
      <div className={cx("max-w-2xl", centered && "mx-auto")}>
        {eyebrow ? <p className={cx("hb-eyebrow", dark && "!text-brand-soft")}>{eyebrow}</p> : null}
        <Heading
          id={id}
          className={cx(
            "font-display font-extrabold tracking-[-0.02em] text-balance",
            eyebrow ? "mt-3" : "",
            Heading === "h1" ? "text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-[3.5rem]" : "text-[1.75rem] leading-tight sm:text-[2.25rem]",
            dark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </Heading>
        {intro ? <p className={cx("mt-4 text-base leading-7 sm:text-[1.05rem]", dark ? "text-muted-dark" : "text-muted")}>{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
