import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  LibraryBig,
  PenLine,
  Sparkles,
} from "lucide-react";

const readingSolutions = [
  {
    title: "Lire gratuitement",
    eyebrow: "Sans compte",
    description:
      "Ouvrez immédiatement les livres signalés comme gratuits. Aucun formulaire ne vous sépare de la première page.",
    href: "/library",
    cta: "Choisir un livre gratuit",
    icon: BookOpen,
    featured: true,
  },
  {
    title: "Ma bibliothèque",
    eyebrow: "Espace personnel",
    description:
      "Rassemblez vos achats et vos lectures pour les retrouver facilement sur votre téléphone.",
    href: "/dashboard/reader/library",
    cta: "Ouvrir ma bibliothèque",
    icon: LibraryBig,
    featured: false,
  },
  {
    title: "Holistique Plus",
    eyebrow: "Lecture Premium",
    description:
      "Accédez aux titres éligibles avec une formule pensée pour les lecteurs réguliers.",
    href: "/dashboard/reader/subscriptions",
    cta: "Découvrir Holistique Plus",
    icon: Sparkles,
    featured: false,
  },
] as const;

export function ReadingSolutionsSection() {
  return (
    <section aria-labelledby="reading-solutions-title" className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#c85439]">
            Lire à votre manière
          </p>
          <h2
            id="reading-solutions-title"
            className="text-2xl font-bold tracking-[-0.035em] text-[#171717] sm:text-3xl"
          >
            Nos solutions de lecture
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#6f665e] sm:text-base">
            Commencez sans friction, puis construisez votre bibliothèque seulement si vous le souhaitez.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff0eb] px-3 py-2 text-xs font-bold text-[#a94731]">
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          Lecture pensée pour mobile
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-5">
        {readingSolutions.map((solution) => {
          const Icon = solution.icon;

          return (
            <article
              key={solution.title}
              className={`group flex min-h-[230px] flex-col rounded-[1.65rem] border p-5 transition duration-300 sm:p-6 ${
                solution.featured
                  ? "border-[#ff7a5c] bg-[#ff7a5c] text-white shadow-[0_20px_45px_rgba(255,122,92,0.2)]"
                  : "border-[#eadfd4] bg-white text-[#171717] shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    solution.featured ? "bg-white/18 text-white" : "bg-[#fff0eb] text-[#c85439]"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${
                    solution.featured ? "bg-white/16 text-white" : "bg-[#f8f5f0] text-[#746a61]"
                  }`}
                >
                  {solution.eyebrow}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-[-0.025em]">{solution.title}</h3>
              <p
                className={`mt-2 text-sm leading-6 ${
                  solution.featured ? "text-white/82" : "text-[#6f665e]"
                }`}
              >
                {solution.description}
              </p>

              <Link
                href={solution.href}
                className={`mt-auto inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold transition sm:w-fit ${
                  solution.featured
                    ? "bg-white text-[#171717] hover:bg-[#fff7f3]"
                    : "bg-[#171717] text-white hover:bg-[#302a25]"
                }`}
              >
                {solution.cta}
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-[1.65rem] border border-[#2c2824] bg-[#171717] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#ff9b84]">
            <PenLine aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">Vous écrivez plutôt que vous ne lisez ?</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/65">
              Le Studio Auteur accompagne votre manuscrit jusqu’à sa rencontre avec les lecteurs.
            </p>
          </div>
        </div>
        <Link
          href="/register?role=author"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white transition hover:border-[#ff7a5c] hover:bg-white/5"
        >
          Ouvrir le Studio Auteur
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
