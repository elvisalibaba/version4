import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  PenLine,
  School,
  ShieldCheck,
  Smartphone,
  Upload,
  UserPlus,
  Wallet,
} from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { BookCard } from "@/components/books/book-card";
import { AllAuthorsSection } from "@/components/home/all-authors-section";
import { getPublicAuthors } from "@/lib/authors";
import { getPublishedBooks } from "@/lib/books";
import { getPublicCategories } from "@/lib/categories";
import { COMPANY, INTERVENTION_POLES, PUBLISHING_PACKS } from "@/lib/holistique";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "La librairie des voix qui transforment",
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

function Shelf({ title, description, books, href }: { title: string; description?: string; books: HomeBook[]; href: string }) {
  if (books.length === 0) return null;

  return (
    <section aria-label={title} className="hb-reveal border-b border-slate-200 py-10 last:border-b-0">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-night-700 hover:text-brand-700 hover:underline">
          Voir tout <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="-mx-4 mt-5 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
        {books.slice(0, 12).map((book, index) => (
          <div key={book.id} className="w-[42vw] max-w-45 shrink-0 snap-start sm:w-auto sm:max-w-none">
            <BookCard book={book} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}

const promises = [
  { icon: BookOpen, title: "Lecture immédiate", text: "Lisez en ligne dès l’achat, sur téléphone ou ordinateur." },
  { icon: Wallet, title: "Mobile Money et carte", text: "Paiement sécurisé en USD ou en CDF via EasyPay." },
  { icon: ShieldCheck, title: "Œuvres protégées", text: "Lecture sécurisée qui respecte les droits des auteurs." },
  { icon: Smartphone, title: "Partout avec vous", text: "Votre bibliothèque synchronisée sur le web et l’application." },
];

const publishingSteps = [
  { icon: UserPlus, title: "Créez votre compte auteur", text: "Gratuit, en quelques minutes." },
  { icon: Upload, title: "Déposez votre manuscrit", text: "PDF ou EPUB, avec couverture et description." },
  { icon: Wallet, title: "Vendez et suivez vos revenus", text: "Royalties en USD ou CDF, versées par Mobile Money ou virement." },
];

export default async function HomePage() {
  const [books, authors, categoryRows] = await Promise.all([getPublishedBooks(), getPublicAuthors(), getPublicCategories()]);

  const categories = categoryRows.slice(0, 14);
  const popularBooks = [...books].sort(rankByAudience);
  // The catalogue is already ordered by newest publication first.
  const freeBooks = books.filter((book) => book.is_free);
  const paidBooks = books.filter((book) => !book.is_free);
  const withCovers = popularBooks.filter((book) => book.cover_signed_url);
  const heroBooks = (withCovers.length >= 3 ? withCovers : popularBooks).slice(0, 3);

  return (
    <div className="hb-home-page bg-white text-slate-900">
      {/* Bandeau principal */}
      <section className="bg-night-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-300">Librairie numérique et maison d’édition</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Des voix d’ici, des histoires pour le monde.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-night-100 sm:text-lg">
              Découvrez les auteurs du continent, lisez en ligne en toute simplicité et publiez vos propres livres avec un accompagnement professionnel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/books" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand-600 px-6 text-[0.95rem] font-semibold text-white transition hover:bg-brand-700">
                Explorer le catalogue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register?role=author" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/40 px-6 text-[0.95rem] font-semibold text-white transition hover:bg-white/10">
                <PenLine className="h-4 w-4" /> Publier votre livre
              </Link>
            </div>
            {freeBooks.length > 0 ? (
              <p className="mt-5 text-sm text-night-200">
                <Link href="/books?access=free" className="font-medium text-white underline-offset-4 hover:underline">Lire gratuitement</Link>
                {" "}— {freeBooks.length} titre{freeBooks.length > 1 ? "s" : ""} disponible{freeBooks.length > 1 ? "s" : ""} sans paiement.
              </p>
            ) : null}
          </div>

          {heroBooks.length > 0 ? (
            <div className="hidden grid-cols-3 items-end gap-4 lg:grid">
              {heroBooks.map((book, index) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className={`block overflow-hidden rounded-md border border-white/10 bg-night-800 shadow-md transition hover:-translate-y-1 ${index === 1 ? "lg:-translate-y-6 lg:hover:-translate-y-7" : ""}`}
                >
                  {book.cover_signed_url ? (
                    <Image src={book.cover_signed_url} alt={`Couverture de ${book.title}`} width={300} height={450} priority className="aspect-2/3 h-full w-full object-cover" />
                  ) : (
                    <span className="flex aspect-2/3 flex-col justify-end gap-2 p-4">
                      <span className="h-0.5 w-8 bg-brand-600" aria-hidden="true" />
                      <span className="line-clamp-4 text-base font-bold leading-snug text-white">{book.title}</span>
                      <span className="line-clamp-1 text-xs text-night-200">{book.author_name}</span>
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Engagements */}
      <section aria-label="Nos engagements" className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-night-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Catégories */}
        {categories.length > 0 ? (
          <nav aria-label="Parcourir par catégorie" className="border-b border-slate-200 py-8">
            <h2 className="text-lg font-bold text-slate-900">Parcourir par catégorie</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={`/books?category=${encodeURIComponent(category.name)}`}
                    className="inline-flex h-9 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-night-700 hover:text-night-900"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="pt-8">
          <AdSlot placementCode="web.home.feed" />
        </div>

        <Shelf
          title="Les plus lus du moment"
          description="Classement fondé sur les lectures, puis sur les consultations."
          books={popularBooks}
          href="/books"
        />

        <Shelf
          title="À lire gratuitement"
          description="Les dernières parutions accessibles sans paiement."
          books={freeBooks}
          href="/books?access=free"
        />

        {/* Éducation */}
        <section aria-labelledby="home-education" className="hb-reveal border-b border-slate-200 py-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-center">
            <div>
              <h2 id="home-education" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Espace Éducation RDC</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ouvrages scolaires et universitaires classés par niveau, section, option, cycle LMD et filière.
              </p>
              <Link href="/education" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-night-700 hover:text-brand-700 hover:underline">
                Explorer l’espace Éducation <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { href: "/education?audience=school", icon: School, title: "Élèves", text: "Primaire, CTEB, Humanités générales, techniques et professionnelles." },
                { href: "/education?audience=university", icon: GraduationCap, title: "Étudiants", text: "Licence, Master, Doctorat : domaines LMD, filières et mentions." },
              ].map(({ href, icon: Icon, title, text }) => (
                <Link key={href} href={href} className="group flex gap-4 rounded-lg border border-slate-200 bg-white p-5 transition hover:border-night-300 hover:shadow-sm">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-night-50 text-night-800">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900 group-hover:text-brand-700">
                      {title} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-sm text-slate-600">{text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {paidBooks.length > 0 ? (
          <Shelf
            title="Nouvelles parutions"
            description="Essais, récits, spiritualité, business et développement personnel."
            books={paidBooks}
            href="/books?access=purchase"
          />
        ) : null}

        <div className="py-10">
          <AllAuthorsSection authors={authors} />
        </div>
      </div>

      {/* Les trois pôles d'intervention */}
      <section aria-labelledby="home-poles" className="hb-reveal border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-700">{COMPANY.slogan}</p>
              <h2 id="home-poles" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Trois pôles, une même mission : transformer par l’écriture.</h2>
            </div>
            <Link href="/qui-sommes-nous" className="inline-flex items-center gap-1 text-sm font-semibold text-night-700 hover:text-brand-700 hover:underline">
              Découvrir Holistique Books <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {INTERVENTION_POLES.map((pole, index) => (
              <Link
                key={pole.slug}
                href={`/qui-sommes-nous#${pole.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-night-200 hover:shadow-lg"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand-600 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="text-sm font-bold tabular-nums text-brand-600">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-bold text-slate-900">Pôle {pole.name.toLowerCase()}</h3>
                <p className="mt-1 text-sm font-semibold text-night-700">{pole.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{pole.description}</p>
                <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{pole.audience}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Publier (esprit KDP) */}
      <section aria-labelledby="home-publish" className="hb-reveal border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold text-brand-700">Auteurs</p>
            <h2 id="home-publish" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Publiez votre livre et touchez vos lecteurs.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Holistique Books met votre livre en vente en RDC et dans le monde. Vous gardez la main sur votre œuvre, nous gérons la diffusion et les paiements.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=author" className="inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
                Commencer gratuitement
              </Link>
              <Link href="/services" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-400">
                Services éditoriaux
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-600">
              Besoin d’un accompagnement complet ?{" "}
              <Link href="/services#packs" className="font-semibold text-brand-700 hover:underline">
                Packs d’édition dès {PUBLISHING_PACKS[0].price}
              </Link>
              , impression incluse.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {publishingSteps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-night-900 text-sm font-bold text-white">{index + 1}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-night-700" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
