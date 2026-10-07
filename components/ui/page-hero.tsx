import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";

type PageHeroProps = {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

/** Ancienne API conservée : délègue à l'en-tête commun de l'identité. */
export function PageHero({ kicker, title, description, actions, aside, className = "" }: PageHeroProps) {
  return (
    <div className={`hb-bleed ${className}`.trim()}>
      <PageHeader kicker={kicker} title={title} intro={description} actions={actions} aside={aside} />
    </div>
  );
}
