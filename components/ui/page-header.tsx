import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Ribbon } from "@/components/brand/ribbon";

export type Crumb = { label: string; href?: string };

/** Fil d'Ariane discret, commun à toutes les pages intérieures. */
export function Breadcrumbs({ items, tone = "ink" }: { items: Crumb[]; tone?: "ink" | "light" }) {
  const muted = tone === "light" ? "text-night-200 hover:text-white" : "text-slate-500 hover:text-night-900";
  return (
    <nav aria-label="Fil d’Ariane" className="text-[0.8rem]">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link href="/home" className={`transition ${muted}`}>Accueil</Link></li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight aria-hidden="true" className={`h-3 w-3 ${tone === "light" ? "text-night-400" : "text-slate-400"}`} />
            {item.href ? (
              <Link href={item.href} className={`transition ${muted}`}>{item.label}</Link>
            ) : (
              <span aria-current="page" className={tone === "light" ? "text-white" : "text-night-900"}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Rubrique façon édition : ruban, numéro de chapitre, intitulé. */
export function Kicker({ children, index, tone = "ink" }: { children: ReactNode; index?: string; tone?: "ink" | "light" }) {
  return (
    <p className={`flex items-center gap-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] ${tone === "light" ? "text-night-100" : "text-night-700"}`}>
      <Ribbon className="h-4 w-2.5" />
      {index ? <span className="font-display text-sm normal-case tracking-normal text-brand-600">{index}</span> : null}
      <span>{children}</span>
    </p>
  );
}

type PageHeaderProps = {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  aside?: ReactNode;
  /** « ink » : bandeau bleu nuit ; « paper » (défaut) : page claire. */
  tone?: "paper" | "ink";
};

/** En-tête unique de toutes les pages intérieures. */
export function PageHeader({ kicker, title, intro, crumbs, actions, aside, tone = "paper" }: PageHeaderProps) {
  const ink = tone === "ink";
  return (
    <header className={ink ? "bg-night-900 text-white" : "border-b border-rule bg-paper"}>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8">
        {crumbs ? <Breadcrumbs items={crumbs} tone={ink ? "light" : "ink"} /> : null}
        <div className={`grid gap-8 ${crumbs ? "mt-8" : "mt-2"} ${aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end" : ""}`}>
          <div className="hb-fade-up">
            <Kicker tone={ink ? "light" : "ink"}>{kicker}</Kicker>
            <h1 className={`mt-4 max-w-3xl font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl ${ink ? "text-white" : "text-night-900"}`}>
              {title}
            </h1>
            {intro ? <p className={`mt-5 max-w-2xl text-[1.05rem] leading-7 ${ink ? "text-night-100" : "text-slate-600"}`}>{intro}</p> : null}
            {actions ? <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </div>
    </header>
  );
}

/** Titre de section : numéro de chapitre + titre serif + lien optionnel. */
export function SectionHeading({ index, kicker, title, href, linkLabel = "Tout voir", intro }: { index?: string; kicker: string; title: ReactNode; href?: string; linkLabel?: string; intro?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Kicker index={index}>{kicker}</Kicker>
        <h2 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-night-900 sm:text-[2rem]">{title}</h2>
        {intro ? <p className="mt-2 text-[0.95rem] leading-6 text-slate-600">{intro}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="hb-link inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-night-900">
          {linkLabel} <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
