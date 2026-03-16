import type { ReactNode } from "react";

type PageHeroProps = {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function PageHero({ kicker, title, description, actions, aside, className = "" }: PageHeroProps) {
  return (
    <section className={`page-hero-shell ${className}`.trim()}>
      <div className="page-hero-grid">
        <div className="space-y-4">
          <span className="premium-badge">{kicker}</span>
          <div className="space-y-3">
            <h1 className="section-title text-3xl sm:text-4xl lg:text-5xl">{title}</h1>
            {description ? <p className="section-description max-w-3xl">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="page-hero-aside">{aside}</div> : null}
      </div>
    </section>
  );
}
