import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, LockKeyhole, PenLine, School, Smartphone, Wallet } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { BookCard } from "@/components/books/book-card";
import { Ribbon } from "@/components/brand/ribbon";
import { AllAuthorsSection } from "@/components/home/all-authors-section";
import { Kicker, SectionHeading } from "@/components/ui/page-header";
import { getPublicAuthors } from "@/lib/authors";
import { getPublishedBooks } from "@/lib/books";
import { getPublicCategories } from "@/lib/categories";
import { COMPANY, INTERVENTION_POLES, PUBLISHING_PACKS } from "@/lib/holistique";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Maison d’édition et librairie numérique",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/home" },
};

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

function rankByAudience(a: HomeBook, b: HomeBook) {
  const aReads = Number(a.purchases_count ?? 0);
  const bReads = Number(b.purchases_count ?? 0);
  const aViews = Number(a.views_count ?? 0);
  const bViews = Number(b.views_count ?? 0);
  return bReads - aReads || bViews - aViews || new Date(b.published_at ?? b.created_at ?? 0).getTime() - new Date(a.published_at ?? a.created_at ?? 0).getTime();
}

function Shelf({ index, kicker, title, intro, books, href }: { index: string; kicker: string; title: string; intro?: string; books: HomeBook[]; href: string }) {
  if (books.length === 0) return null;

  return (
    <section aria-label={title} className="hb-reveal py-14">
      <SectionHeading index={index} kicker={kicker} title={title} intro={intro} href={href} />
      <div className="-mx-4 mt-8 flex snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {books.slice(0, 12).map((book, position) => (
          <div key={book.id} className="w-[42vw] max-w-45 shrink-0 snap-start sm:w-auto sm:max-w-none">
            <BookCard book={book} priority={position < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Couverture « objet livre » pour la page de titre. */
function FeaturedCover({ book, className = "" }: { book: HomeBook; className?: string }) {
  return (
    <span className={`hb-book block aspect-2/3 bg-night-900 ${className}`}>
      {book.cover_signed_url ? (
        <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} fill sizes="(max-width: 1024px) 50vw, 300px" priority className="object-cover" />
      ) : (
        <span className="flex h-full flex-col px-6 pb-6 text-white">
          <span className="ml-auto h-10 w-5 bg-brand-600 [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" aria-hidden="true" />
          <span className="mt-auto line-clamp-4 font-display text-2xl font-semibold leading-tight">{book.title}</span>
          <span className="mt-3 h-px w-10 bg-night-400" aria-hidden="true" />
          <span className="mt-3 font-display text-sm italic text-night-200">{book.author_name}</span>
        </span>
      )}
    </span>
  );
}

const assurances = [
  { icon: BookOpen, text: "Lecture immédiate, sur téléphone ou ordinateur" },
  { icon: Wallet, text: "Mobile money ou carte, en USD ou en CDF" },
  { icon: LockKeyhole, text: "Œuvres protégées, droits d’auteur respectés" },
  { icon: Smartphone, text: "Bibliothèque synchronisée sur le web et l’application" },
];

const publishingSteps = [
  { title: "Créer votre compte auteur", text: "Gratuit, en quelques minutes." },
  { title: "Déposer votre manuscrit", text: "PDF ou EPUB, avec couverture et présentation." },
  { title: "Vendre et suivre vos revenus", text: "Droits d’auteur en USD ou en CDF, versés par mobile money ou virement." },
];

export default async function HomePage() {
  const [books, authors, categoryRows] = await Promise.all([getPublishedBooks(), getPublicAuthors(), getPublicCategories()]);

  const categories = categoryRows.slice(0, 12);
  const popularBooks = [...books].sort(rankByAudience);
  // Le catalogue arrive déjà trié de la plus récente à la plus ancienne parution.
  const freeBooks = books.filter((book) => book.is_free);
  const paidBooks = books.filter((book) => !book.is_free);
  const featured = popularBooks.find((book) => book.cover_signed_url) ?? popularBooks[0];
  const second = popularBooks.find((book) => book.id !== featured?.id);

  const contents = [
    { label: "Le catalogue", text: `${books.length} titre${books.length > 1 ? "s" : ""} à découvrir`, href: "/books" },
    { label: "Lire gratuitement", text: "Les premières pages, sans compte", href: "/books?access=free" },
    { label: "Élèves & étudiants", text: "Du primaire à l’université", href: "/education" },
    { label: "Publier avec nous", text: `Accompagnement dès ${PUBLISHING_PACKS[0].price}`, href: "/services" },
  ];

  return (
    <div className="hb-home-page bg-paper text-slate-900">
      {/* Page de titre */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-20 lg:pt-16">
          <div className="hb-fade-up">
            <Kicker>Maison d’édition · Kinshasa · depuis {COMPANY.founded}</Kicker>
            <h1 className="mt-6 max-w-2xl font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-night-900 sm:text-6xl lg:text-[4.1rem]">
              La révolution transformationnelle de <em className="font-medium italic text-brand-700">l’écriture</em>.
            </h1>
            <p className="mt-6 max-w-xl text-[1.08rem] leading-8 text-slate-600">
              Nous publions les voix qui édifient, forment et transforment — et vous les faisons lire partout, en ligne ou sur papier.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/books" className="cta-primary inline-flex h-12 items-center justify-center gap-2 px-6 text-[0.95rem]">
                Découvrir le catalogue <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/register?role=author" className="cta-secondary inline-flex h-12 items-center justify-center gap-2 px-6 text-[0.95rem]">
                <PenLine aria-hidden="true" className="h-4 w-4" /> Publier un livre
              </Link>
            </div>
          </div>

          {featured ? (
            <figure className="relative mx-auto w-full max-w-[22rem] lg:mr-0">
              {second ? (
                <Link href={`/book/${second.id}`} tabIndex={-1} aria-hidden="true" className="absolute -left-10 top-10 hidden w-[62%] -rotate-6 opacity-90 sm:block">
                  <FeaturedCover book={second} />
                </Link>
              ) : null}
              <Link href={`/book/${featured.id}`} className="relative ml-auto block w-[78%] transition duration-300 hover:-translate-y-1.5">
                <FeaturedCover book={featured} />
              </Link>
              <figcaption className="ml-auto mt-6 w-[78%] border-t border-rule-strong pt-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-700">À la une</p>
                <Link href={`/book/${featured.id}`} className="hb-link mt-1 inline font-display text-lg font-semibold leading-snug text-night-900">{featured.title}</Link>
                <p className="mt-0.5 text-sm italic text-slate-600">{featured.author_name}</p>
              </figcaption>
            </figure>
          ) : null}
        </div>

        {/* Sommaire */}
        <nav aria-label="Sommaire" className="border-t border-rule bg-white/60">
          <ol className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">
            {contents.map((entry, position) => (
              <li key={entry.href} className="border-b border-rule last:border-b-0 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
                <Link href={entry.href} className="group flex items-baseline gap-4 px-4 py-5 transition hover:bg-white sm:px-6 lg:px-8">
                  <span className="font-display text-2xl font-medium text-brand-600 tabular-nums">0{position + 1}</span>
                  <span>
                    <span className="block font-display text-lg font-semibold text-night-900 group-hover:text-brand-700">{entry.label}</span>
                    <span className="block text-sm text-slate-600">{entry.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Shelf index="I" kicker="Les plus lus" title="Ce que nos lecteurs lisent en ce moment" books={popularBooks} href="/books" />

        <AdSlot placementCode="web.home.feed" />

        <Shelf index="II" kicker="Accès libre" title="À lire gratuitement" intro="Commencez sans compte : les dix premières pages s’ouvrent immédiatement." books={freeBooks} href="/books?access=free" />
      </div>

      {/* Mot de la direction */}
      <section className="hb-reveal bg-night-900 text-white">
        <figure className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Ribbon className="mx-auto h-8 w-5" />
          <blockquote className="mt-6 font-display text-[1.65rem] font-medium italic leading-snug sm:text-[2.1rem]">
            « La littérature est une âme de l’entreprise : elle n’est plus une option, mais une nécessité pour construire, transmettre et réussir. »
          </blockquote>
          <figcaption className="mt-6 text-sm text-night-200">Gode Muala, directeur général et éditeur en chef</figcaption>
        </figure>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Les trois pôles */}
        <section aria-labelledby="home-poles" className="hb-reveal py-14">
          <SectionHeading index="III" kicker="Nos pôles" title="Une Église, une institution, une entreprise : chacune a un message à transmettre." href="/qui-sommes-nous#poles" linkLabel="Découvrir la maison" />
          <div className="mt-2 grid md:grid-cols-3">
            {INTERVENTION_POLES.map((pole) => (
              <Link key={pole.slug} href={`/qui-sommes-nous#${pole.slug}`} className="group border-b border-rule py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-700">Pôle</p>
                <h3 className="mt-1 font-display text-[1.6rem] font-semibold text-night-900 group-hover:text-brand-700">{pole.name}</h3>
                <p className="mt-2 font-display text-lg italic text-night-700">{pole.tagline}</p>
                <p className="mt-3 text-[0.95rem] leading-7 text-slate-600">{pole.description}</p>
                <p className="mt-4 text-sm text-slate-500">{pole.magazine.name} — {pole.magazine.focus}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Éducation */}
        <section aria-labelledby="home-education" className="hb-reveal py-14">
          <SectionHeading index="IV" kicker="Éducation" title="Les manuels du programme congolais, en ligne." intro="Ouvrages scolaires et universitaires classés par niveau, section, option et filière." href="/education" linkLabel="Ouvrir l’espace Éducation" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { href: "/education?audience=school", icon: School, title: "Élèves", text: "Primaire, CTEB, humanités générales, techniques et professionnelles." },
              { href: "/education?audience=university", icon: GraduationCap, title: "Étudiants", text: "Licence, master, doctorat : domaines LMD, filières et mentions." },
            ].map(({ href, icon: Icon, title, text }) => (
              <Link key={href} href={href} className="group flex items-start gap-5 border border-rule bg-white p-6 transition hover:border-night-900">
                <Icon aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-night-700" />
                <span>
                  <span className="flex items-center gap-2 font-display text-xl font-semibold text-night-900">
                    {title} <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                  <span className="mt-1 block text-[0.95rem] leading-6 text-slate-600">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Shelf index="V" kicker="Nouvelles parutions" title="Fraîchement sortis de presse" intro="Essais, récits, spiritualité, entreprise et développement personnel." books={paidBooks} href="/books?access=purchase" />

        {/* Rayons */}
        {categories.length > 0 ? (
          <nav aria-labelledby="home-rayons" className="hb-reveal py-14">
            <SectionHeading index="VI" kicker="Rayons" title="Parcourir la librairie" href="/books" linkLabel="Tout le catalogue" />
            <ul className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <li key={category.name} className="border-b border-rule">
                  <Link href={`/books?category=${encodeURIComponent(category.name)}`} className="group flex items-center justify-between py-4 pr-4">
                    <span className="font-display text-lg text-night-900 group-hover:text-brand-700">{category.name}</span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="py-14">
          <AllAuthorsSection authors={authors} />
        </div>
      </div>

      {/* Pour les auteurs */}
      <section aria-labelledby="home-publish" className="hb-reveal border-y border-rule bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <Kicker>Pour les auteurs</Kicker>
            <h2 id="home-publish" className="mt-4 font-display text-[2.2rem] font-semibold leading-tight tracking-tight text-night-900">
              De votre manuscrit à vos lecteurs, une maison vous accompagné.
            </h2>
            <p className="mt-4 text-[1.02rem] leading-7 text-slate-600">
              Publiez en autonomie et vendez en RDC comme à l’étranger, ou confiez-nous tout le parcours : édition, impression, diffusion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=author" className="cta-primary inline-flex h-11 items-center justify-center px-5 text-sm">Publier gratuitement</Link>
              <Link href="/services#packs" className="cta-secondary inline-flex h-11 items-center justify-center px-5 text-sm">Packs dès {PUBLISHING_PACKS[0].price}</Link>
            </div>
          </div>
          <ol className="divide-y divide-rule border-y border-rule">
            {publishingSteps.map((step, position) => (
              <li key={step.title} className="flex gap-6 py-6">
                <span className="font-display text-4xl font-medium leading-none text-brand-600 tabular-nums">{position + 1}</span>
                <span>
                  <span className="block font-display text-xl font-semibold text-night-900">{step.title}</span>
                  <span className="mt-1 block text-[0.95rem] text-slate-600">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Engagements */}
      <section aria-label="Nos engagements" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {assurances.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-night-700" />
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
