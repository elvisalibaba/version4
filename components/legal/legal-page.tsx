import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  kicker: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const legalLinks = [
  { href: "/conditions", label: "Conditions" },
  { href: "/confidentialite", label: "Confidentialite" },
  { href: "/cookies", label: "Cookies" },
];

export function LegalPage({ kicker, title, description, lastUpdated, sections }: LegalPageProps) {
  return (
    <section className="space-y-8">
      <PageHero
        kicker={kicker}
        title={title}
        description={description}
        actions={
          <>
            <Link href="/home" className="cta-primary px-5 py-3 text-sm">
              Retour a l accueil
            </Link>
            <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
              Explorer les livres
            </Link>
          </>
        }
        aside={
          <div className="surface-panel-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Documents legaux</p>
            <div className="mt-4 grid gap-3">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="cta-secondary px-4 py-3 text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-5 rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mise a jour</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{lastUpdated}</p>
            </div>
          </div>
        }
      />

      <div className="form-panel space-y-8">
        {sections.map((section) => (
          <article key={section.title} className="space-y-3">
            <h2 className="section-title text-2xl">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="section-description">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
