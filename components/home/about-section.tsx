import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Feather, Globe2, ShieldCheck, Sparkles } from "lucide-react";

const editorialJourney = [
  {
    step: "01",
    title: "Éclairer",
    description: "Positionnement, diagnostic et feuille de route sur mesure.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Éditer",
    description: "Coaching, relecture et exigence éditoriale à chaque page.",
    icon: Feather,
  },
  {
    step: "03",
    title: "Produire",
    description: "Couverture, mise en page et formats prêts pour tous les écrans.",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Rayonner",
    description: "Diffusion, campagnes et pilotage durable de votre catalogue.",
    icon: Globe2,
  },
];

const promises = ["Vos droits restent les vôtres", "Un interlocuteur éditorial", "Un catalogue piloté en temps réel"];

export function AboutSection() {
  return (
    <section id="a-propos" aria-labelledby="about-title" className="relative py-1 sm:py-6">
      <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-[#171717] text-white shadow-[0_24px_60px_rgba(23,23,23,0.16)] sm:rounded-[2.5rem] sm:shadow-[0_32px_80px_rgba(23,23,23,0.18)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#ff7a5c]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#ffb59f]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
        />

        <div className="relative grid gap-6 p-5 sm:gap-10 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-12 lg:p-12 xl:p-14">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#ffb39f] backdrop-blur-sm sm:px-3.5 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.22em]">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Maison d&apos;édition augmentée
            </p>

            <h2
              id="about-title"
              className="mt-5 max-w-3xl text-[2rem] font-bold leading-[1.08] tracking-[-0.04em] text-white sm:mt-6 sm:text-4xl lg:text-5xl xl:text-[3.5rem]"
            >
              Plus qu&apos;une marketplace. <span className="text-[#ff8b70]">Un écosystème pour faire grandir les œuvres.</span>
            </h2>

            <p className="mt-4 max-w-2xl text-[0.94rem] leading-6 text-[#d8d0c8] sm:mt-6 sm:text-lg sm:leading-8">
              Holistique Books réunit l&apos;exigence d&apos;une maison d&apos;édition, la souplesse d&apos;un studio numérique et la
              puissance d&apos;une librairie moderne. Chaque auteur est accompagné. Chaque livre est pensé pour rencontrer son
              lectorat.
            </p>

            <div className="mt-5 grid gap-2.5 sm:mt-7 sm:grid-cols-2 sm:gap-3">
              {promises.map((promise) => (
                <div key={promise} className="flex items-start gap-2.5 text-sm font-medium text-[#eee8e2]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ff7a5c]/15 text-[#ff9a82]">
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <span>{promise}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/formation-editoriale"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff7a5c] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(255,122,92,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ff6948] hover:shadow-[0_20px_42px_rgba(255,122,92,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb39f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717]"
              >
                Construire mon projet
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/qui-sommes-nous"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717]"
              >
                Découvrir la maison
              </Link>
            </div>
          </div>

          <figure className="relative min-h-[270px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#29241f] sm:min-h-[470px] sm:rounded-[1.75rem] lg:min-h-full">
            <Image
              src="/images/ce1.jpg"
              alt="Lectrice dans une bibliothèque Holistique Books"
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="object-cover object-center transition-transform duration-700 hover:scale-[1.025]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/15 to-transparent" />

            <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-[#171717]/80 p-3.5 shadow-2xl backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#ff9a82]">Notre différence</p>
                  <p className="mt-2 max-w-sm text-base font-semibold leading-6 text-white sm:text-lg">
                    Nous ne mettons pas seulement des livres en ligne. Nous construisons leur trajectoire.
                  </p>
                </div>
                <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff7a5c] text-white sm:grid">
                  <Feather aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.035] px-5 py-5 sm:px-8 sm:py-6 lg:px-12 xl:px-14">
          <div className="mb-3 flex items-center justify-between sm:hidden">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/55">Le parcours éditorial</p>
            <p className="text-xs font-medium text-[#ff9a82]">Glisser →</p>
          </div>
          <ol
            aria-label="Parcours éditorial"
            className="-mr-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mr-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pr-0 xl:grid-cols-4"
          >
            {editorialJourney.map(({ step, title, description, icon: Icon }) => (
              <li
                key={step}
                className="group min-w-[82%] snap-start rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 transition-colors duration-300 hover:border-[#ff7a5c]/30 hover:bg-white/[0.075] sm:min-w-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold tracking-[0.18em] text-[#ff9a82]">{step}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.07] text-[#f4ddd5] transition-colors group-hover:bg-[#ff7a5c] group-hover:text-white">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#bdb4ac]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
