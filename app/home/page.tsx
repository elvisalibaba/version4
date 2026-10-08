import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, GraduationCap, Layers, Megaphone, PenLine, Printer } from "lucide-react";
import { HomeContactForm } from "@/components/home/contact-form";
import { Badge } from "@/components/ui/badge";
import { BookCard } from "@/components/ui/book-card";
import { ButtonLink } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { SectionHeader } from "@/components/ui/section-header";
import { getHomeFeaturedBooks } from "@/lib/books";
import { getPublicCategories } from "@/lib/categories";
import { COMPANY, INTERVENTION_POLES, PUBLISHING_PACKS } from "@/lib/holistique";

export const metadata: Metadata = {
  title: "La révolution transformationnelle de l’écriture",
  description:
    "Holistique Books transforme vos idées, connaissances et visions en œuvres éditoriales professionnelles : édition, impression, diffusion et librairie numérique.",
  alternates: { canonical: "/home" },
};

const POLE_API_VALUES = { ecclesiastique: "ecclesial", institutionnel: "institutional", entrepreneurial: "entrepreneurial" } as const;

const POLE_CARD_TONES = [
  { card: "bg-ink text-white", text: "text-muted-dark", number: "text-brand-soft", link: "text-brand-soft" },
  { card: "bg-brand-deep text-white", text: "text-brand-wash", number: "text-brand-tint", link: "text-white" },
  { card: "bg-surface text-ink", text: "text-muted", number: "text-brand-deep", link: "text-brand-deep" },
];

const STATS = [
  { value: String(COMPANY.founded), label: "Début de l’aventure éditoriale" },
  { value: `${COMPANY.countries.length} pays`, label: COMPANY.countries.join(", ") },
  { value: `${INTERVENTION_POLES.length} pôles`, label: "Églises · Institutions · Entreprises" },
  { value: "1 écosystème", label: "De l’idée à la diffusion" },
];

const CHAIN = ["Idée", "Écriture", "Correction", "Design", "Publication", "Impression", "Diffusion", "Lecteur cible"];

const SERVICES = [
  { icon: BookOpen, title: "Édition intégrale", text: "Nous prenons en charge tout le projet, de l’idée initiale jusqu’à la mise à disposition de l’œuvre auprès de son lecteur." },
  { icon: PenLine, title: "Accompagnement éditorial", text: "Déjà commencé ? Nous reprenons votre projet à l’étape où vous êtes bloqué, jusqu’à son aboutissement." },
  { icon: Layers, title: "Publication multiformat", text: "Livre papier, numérique, audio, podcast, documentaire, illustration — en français, en anglais et plus." },
  { icon: Megaphone, title: "Communication & marketing", text: "Lancement, promotion, visibilité digitale et relations médias pour que votre livre trouve son lectorat." },
  { icon: Printer, title: "Impression & distribution", text: "Fabrication, contrôle qualité, logistique et diffusion, en RDC comme à l’international." },
  { icon: GraduationCap, title: "Académie Transformationnelle", text: "Formations en écriture, édition, communication, nouvelles technologies et entrepreneuriat littéraire." },
];

const PACK_STYLES = [
  { card: "border border-line bg-white", label: "text-brand-deep", text: "text-muted", check: "text-brand-deep", button: "secondary" as const },
  { card: "bg-surface", label: "text-brand-deep", text: "text-muted", check: "text-brand-deep", button: "primary" as const },
  { card: "bg-ink text-white", label: "text-brand-soft", text: "text-muted-dark", check: "text-brand-soft", button: "on-dark" as const },
];

const MAGAZINES = [
  { pole: "institutionnel", href: "/librairie?work_type=magazine", linkLabel: "Lire les numéros" },
  { pole: "ecclesiastique", href: "/librairie?work_type=magazine", linkLabel: "Lire les numéros" },
  { pole: "entrepreneurial", href: "/home?projet=Acc%C3%A9l%C3%A9rateur%20Mag#contact", linkLabel: "Être averti du lancement", upcoming: true },
];

/** « 1 500 USD » → montant et devise (le montant contient lui-même une espace). */
function splitPrice(price: string) {
  const match = price.match(/^(.+)\s([A-Z]{3})$/);
  return match ? { amount: match[1], currency: match[2] } : { amount: price, currency: "" };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ pack?: string; projet?: string }> }) {
  const [{ pack, projet }, featuredBooks, categories] = await Promise.all([searchParams, getHomeFeaturedBooks(4), getPublicCategories()]);
  const chosenPack = PUBLISHING_PACKS.find((item) => item.name === pack);
  const defaultProject = chosenPack ? `Je suis intéressé(e) par le pack ${chosenPack.name} (${chosenPack.price}).` : projet ? `Je souhaite être averti(e) du lancement de ${projet}.` : "";

  return (
    <div className="hb-home-page bg-white text-ink">
      {/* Hero */}
      <section aria-labelledby="hero-title" className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pb-20 lg:pt-20">
          <div className="hb-fade-up">
            <p className="hb-eyebrow !text-brand-soft">Édition · Production littéraire · Innovation</p>
            <h1 id="hero-title" className="mt-5 max-w-2xl font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4rem]">
              La révolution transformationnelle de l’écriture.
            </h1>
            <p className="mt-6 max-w-xl text-[1.08rem] leading-8 text-muted-dark">
              Nous transformons vos idées, connaissances et visions en œuvres éditoriales professionnelles — de l’idée jusqu’au lecteur.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register?role=author" variant="on-dark" size="lg">Publier mon livre</ButtonLink>
              <ButtonLink href="/librairie" variant="outline-on-dark" size="lg">Découvrir la librairie</ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-card lg:aspect-[4/4.2]">
            <Image src="/images/ce1.jpg" alt="Une lectrice souriante, un livre ouvert, dans une bibliothèque" fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
          </div>
        </div>

        <div className="border-t border-white/10">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
            {STATS.map((stat) => (
              <div key={stat.value} className="pr-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-2xl font-extrabold text-brand-soft sm:text-3xl">{stat.value}</span>
                  <span className="mt-1 block text-sm text-muted-dark">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Les trois pôles */}
      <section aria-labelledby="poles-title" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <SectionHeader id="poles-title" eyebrow="Pour qui ?" title="Trois pôles, une même mission : transmettre." />
          <p className="text-[1.02rem] leading-7 text-muted">
            Une Église a un message à transmettre, une institution un savoir à préserver, une entreprise une expertise à valoriser.
          </p>
        </div>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {INTERVENTION_POLES.map((pole, index) => {
            const tone = POLE_CARD_TONES[index];
            return (
              <li key={pole.slug}>
                <Link
                  href={`/librairie?editorial_pole=${POLE_API_VALUES[pole.slug]}`}
                  className={cx("group flex h-full flex-col rounded-card p-7 transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2", tone.card)}
                >
                  <span className={cx("font-display text-sm font-bold tabular-nums", tone.number)}>0{index + 1}</span>
                  <h3 className="mt-6 font-display text-2xl font-extrabold tracking-[-0.02em]">{pole.name}</h3>
                  <p className={cx("mt-3 flex-1 text-[0.95rem] leading-6", tone.text)}>{pole.audience} : {pole.tagline.toLowerCase()}</p>
                  <span className={cx("mt-6 inline-flex items-center gap-1.5 text-sm font-bold", tone.link)}>
                    Voir les livres <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Services */}
      <section aria-labelledby="services-title" className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader id="services-title" eyebrow="Nos services" title={<>Un projet. Plusieurs expertises.<br className="hidden sm:block" /> Un seul écosystème.</>} />
          <ol aria-label="Chaîne éditoriale" className="mt-10 flex flex-wrap items-center gap-2">
            {CHAIN.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className={cx("inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold", index === CHAIN.length - 1 ? "bg-brand-deep text-white" : "border border-line bg-white text-ink")}>
                  {step}
                </span>
                {index < CHAIN.length - 1 ? <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-muted" /> : null}
              </li>
            ))}
          </ol>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <li key={service.title} className="rounded-card bg-white p-7 shadow-[var(--shadow-card)]">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-wash text-brand-deep">
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink">{service.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-6 text-muted">{service.text}</p>
                </li>
              );
            })}
          </ul>
          <ButtonLink href="/services" variant="secondary" className="mt-10">
            Tous nos services <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      {/* Packs */}
      <section id="packs" aria-labelledby="packs-title" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          id="packs-title"
          align="center"
          eyebrow="Offre promotionnelle annuelle"
          title="Les packs transformationnels"
          intro="Vous apportez la vision. Nous construisons avec vous le parcours qui conduit l’œuvre jusqu’à son public."
        />
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {PUBLISHING_PACKS.map((item, index) => {
            const style = PACK_STYLES[index];
            const { amount, currency } = splitPrice(item.price);
            const shortName = item.name.replace("Transformation ", "");
            return (
              <li key={item.name} className={cx("flex flex-col rounded-card p-7 sm:p-8", style.card)}>
                <div className="flex items-start justify-between gap-3">
                  <p className={cx("font-display text-xs font-bold uppercase tracking-[0.16em]", style.label)}>Pack {index + 1} · {shortName}</p>
                  {index === 2 ? <Badge tone="flash">Tout inclus</Badge> : null}
                </div>
                <p className="mt-5 flex items-baseline gap-2 font-display">
                  <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.02em]">{amount}</span>
                  <span className={cx("text-sm font-bold", style.text)}>{currency}</span>
                </p>
                <p className={cx("mt-2 text-sm font-semibold", style.text)}>{item.copies} · {item.languages}</p>
                <p className={cx("mt-4 text-[0.95rem] leading-6", style.text)}>{item.tagline}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-[0.92rem]">
                  {[...item.includes, ...(item.bonus ?? []).map((bonus) => `Bonus : ${bonus}`)].map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <Check aria-hidden="true" className={cx("mt-0.5 h-4 w-4 shrink-0", style.check)} strokeWidth={2.5} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <ButtonLink href={`/home?pack=${encodeURIComponent(item.name)}#contact`} variant={style.button} className="mt-8 w-full" aria-label={`Choisir le pack ${item.name}`}>
                  Choisir {shortName}
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Vitrine librairie */}
      <section aria-labelledby="store-title" className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            id="store-title"
            tone="dark"
            eyebrow="Holistique Books Store"
            title="Vos auteurs africains, dans votre poche."
            action={<ButtonLink href="/librairie" variant="outline-on-dark">Voir tout le catalogue <ArrowRight aria-hidden="true" /></ButtonLink>}
          />
          {categories.length > 0 ? (
            <ul aria-label="Catégories" className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              <li className="shrink-0">
                <Link href="/librairie?sort=newest" className="inline-flex min-h-11 items-center rounded-full bg-brand px-4 text-sm font-semibold text-black transition-colors hover:bg-brand-soft">Nouveautés</Link>
              </li>
              {categories.slice(0, 8).map((category) => (
                <li key={category.id} className="shrink-0">
                  <Link href={`/librairie?category=${encodeURIComponent(category.name)}`} className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {featuredBooks.length > 0 ? (
            <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {featuredBooks.map((book, index) => (
                <li key={book.id}><BookCard book={book} tone="dark" priority={index < 2} /></li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-muted-dark">Le catalogue arrive très bientôt. <Link href="/librairie" className="font-semibold text-white underline">Ouvrir la librairie</Link></p>
          )}
        </div>
      </section>

      {/* Magazines */}
      <section id="magazines" aria-labelledby="magazines-title" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader id="magazines-title" eyebrow="Nos magazines" title="Trois magazines, trois axes d’impact." />
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {MAGAZINES.map((entry) => {
            const pole = INTERVENTION_POLES.find((item) => item.slug === entry.pole)!;
            return (
              <li key={pole.magazine.name} className="flex flex-col rounded-card border border-line p-7">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-extrabold uppercase tracking-[-0.01em] text-ink">{pole.magazine.name}</h3>
                  {entry.upcoming ? <Badge tone="brand" className="normal-case tracking-normal">En développement</Badge> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-deep">{pole.magazine.focus}</p>
                <p className="mt-4 flex-1 text-[0.95rem] leading-6 text-muted">{pole.description}</p>
                <Link href={entry.href} className="mt-6 inline-flex min-h-11 items-center gap-1.5 self-start rounded-sm text-sm font-bold text-brand-deep hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep">
                  {entry.linkLabel} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Bloc auteurs */}
      <section aria-labelledby="authors-title" className="bg-brand text-black">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-card">
            <Image src="/images/ce2.jpg" alt="Deux lecteurs, livres ouverts sur les genoux" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <p className="font-display text-[0.8125rem] font-bold uppercase tracking-[0.16em]">Pour les auteurs</p>
            <h2 id="authors-title" className="mt-3 font-display text-[2rem] font-extrabold leading-tight tracking-[-0.02em] sm:text-[2.6rem]">Vous avez une idée ou un manuscrit ?</h2>
            <p className="mt-5 max-w-lg text-[1.05rem] leading-7">
              Parlez-nous de votre projet : nous vous proposerons le parcours adapté, de l’écriture à la diffusion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#contact" variant="ink" size="lg">Soumettre mon projet</ButtonLink>
              <ButtonLink href="#packs" variant="outline-on-brand" size="lg">Voir les packs</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-title" className="scroll-mt-24 mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
        <div>
          <SectionHeader id="contact-title" eyebrow="Contact" title="Une idée à transformer ? Parlons-en." />
          <dl className="mt-10 space-y-6 text-[0.95rem]">
            <div>
              <dt className="font-display text-sm font-bold text-ink">Siège central</dt>
              <dd className="mt-1 text-muted">{COMPANY.address.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-display text-sm font-bold text-ink">Téléphone</dt>
              <dd className="mt-1"><a href={COMPANY.phoneHref} className="inline-flex min-h-11 items-center font-semibold text-brand-deep hover:underline">{COMPANY.phone}</a></dd>
            </div>
            <div>
              <dt className="font-display text-sm font-bold text-ink">E-mail</dt>
              <dd className="mt-1"><a href={`mailto:${COMPANY.email}`} className="inline-flex min-h-11 items-center font-semibold text-brand-deep hover:underline">{COMPANY.email}</a></dd>
            </div>
            <div>
              <dt className="font-display text-sm font-bold text-ink">Nos implantations</dt>
              <dd className="mt-1 text-muted">{COMPANY.countries.join(" · ")}</dd>
            </div>
          </dl>
        </div>
        <HomeContactForm key={defaultProject} defaultProject={defaultProject} />
      </section>
    </div>
  );
}
