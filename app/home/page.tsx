import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Globe2,
  Headphones,
  PenTool,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { AllAuthorsSection } from "@/components/home/all-authors-section";
import { getPublicAuthors } from "@/lib/authors";
import { getPublishedBooks } from "@/lib/books";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "La librairie des voix qui transforment",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/home" },
};

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

const categories = [
  { label: "Romans", value: "Roman", color: "bg-[#e85d3f]" },
  { label: "Business", value: "Business", color: "bg-[#174c42]" },
  { label: "Spiritualité", value: "Spiritualite", color: "bg-[#3f3a78]" },
  { label: "Jeunesse", value: "Jeunesse", color: "bg-[#dc9b2d]" },
  { label: "Développement", value: "Developpement personnel", color: "bg-[#a43b57]" },
  { label: "Voix africaines", value: "Auteurs africains", color: "bg-[#1d6480]" },
];

function formatPrice(book: HomeBook) {
  return book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code}`);
}

function bookHref(book: HomeBook) {
  return book.is_free ? `/book/${book.id}?read=1` : `/book/${book.id}`;
}

function BookTile({ book, priority = false }: { book: HomeBook; priority?: boolean }) {
  return (
    <article className="group min-w-0">
      <Link href={bookHref(book)} className="relative block overflow-hidden rounded-[1.15rem] bg-[#e9e1d7] shadow-[0_16px_35px_rgba(34,28,22,0.12)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_45px_rgba(34,28,22,0.18)]">
        <div className="aspect-[0.69]">
          {book.cover_signed_url ? (
            <Image
              src={book.cover_signed_url}
              alt={book.cover_alt_text || `Couverture de ${book.title}`}
              width={420}
              height={610}
              priority={priority}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#efe3d4,#d8c5af)] p-5 text-center font-display text-sm font-bold text-[#5b4d40]">{book.title}</div>
          )}
        </div>
        <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] shadow-sm ${book.is_free ? "bg-[#f4b942] text-[#282014]" : "bg-white/92 text-[#2d2925] backdrop-blur"}`}>
          {book.is_free ? "Lecture gratuite" : "Nouveauté"}
        </span>
      </Link>
      <div className="pt-3">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-[#1d1a17] sm:text-[0.95rem]">
          <Link href={bookHref(book)} className="transition hover:text-[#c34d35]">{book.title}</Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-[#766b61]">{book.author_name || "Auteur Holistique"}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className={`text-sm font-extrabold ${book.is_free ? "text-[#176052]" : "text-[#1d1a17]"}`}>{formatPrice(book)}</p>
          {book.rating_avg ? (
            <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[#7d7166]"><Star className="h-3 w-3 fill-[#e7a52d] text-[#e7a52d]" />{Number(book.rating_avg).toFixed(1)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Shelf({ title, eyebrow, description, books, href }: { title: string; eyebrow: string; description: string; books: HomeBook[]; href: string }) {
  if (books.length === 0) return null;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] text-[#1d1a17] sm:text-4xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#766b61]">{description}</p>
        </div>
        <Link href={href} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-[#d9ccbf] bg-white px-4 text-sm font-bold text-[#403830] transition hover:border-[#e85d3f] hover:text-[#b9432d] sm:self-auto">
          Voir toute la sélection <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5 xl:grid-cols-6">
        {books.slice(0, 12).map((book, index) => <BookTile key={book.id} book={book} priority={index < 2} />)}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [books, authors] = await Promise.all([getPublishedBooks(), getPublicAuthors()]);
  const freeBooks = books.filter((book) => book.is_free);
  const paidBooks = books.filter((book) => !book.is_free);
  const popularBooks = [...books].sort((a, b) =>
    Number(b.purchases_count || 0) - Number(a.purchases_count || 0) ||
    Number(b.views_count || 0) - Number(a.views_count || 0),
  );
  const heroBooks = (freeBooks.length >= 3 ? freeBooks : books).slice(0, 3);
  const leadBook = heroBooks[0] ?? null;

  return (
    <div className="hb-home-page bg-[#f8f4ed] text-[#1d1a17]">
      <section className="relative overflow-hidden bg-[#123f37] text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(30deg,transparent_48%,rgba(255,255,255,.14)_49%,rgba(255,255,255,.14)_51%,transparent_52%),linear-gradient(150deg,transparent_48%,rgba(255,255,255,.08)_49%,rgba(255,255,255,.08)_51%,transparent_52%)] [background-size:64px_112px]" />
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#e85d3f]/40 blur-3xl" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f8ce78] backdrop-blur">
              <Globe2 className="h-3.5 w-3.5" /> La librairie africaine nouvelle génération
            </div>
            <h1 className="mt-6 font-display text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[4.5rem]">
              Des voix d’ici.<br /><span className="text-[#f4b942]">Des histoires</span> pour le monde.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">Découvrez gratuitement de nouvelles plumes, explorez les imaginaires du continent et soutenez une édition africaine ambitieuse.</p>
            <form action="/books" className="mt-8 flex max-w-xl items-center rounded-2xl bg-white p-1.5 shadow-[0_22px_55px_rgba(0,0,0,.2)]">
              <Search aria-hidden="true" className="ml-3 h-5 w-5 shrink-0 text-[#85796d]" />
              <input type="search" name="q" placeholder="Titre, auteur, thème…" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-[#1d1a17] outline-none placeholder:text-[#9a8e82]" />
              <button type="submit" className="h-12 shrink-0 rounded-xl bg-[#e85d3f] px-4 text-sm font-extrabold text-white transition hover:bg-[#d44e34] sm:px-6">Rechercher</button>
            </form>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/62">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#f4b942]" /> Lecture web immédiate</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#f4b942]" /> Nouvelles voix</span>
              <span className="inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-[#f4b942]" /> Multi-formats</span>
            </div>
          </div>

          <div className="relative hidden min-h-[390px] lg:block">
            <div className="absolute inset-x-10 bottom-3 h-20 rounded-[50%] bg-black/30 blur-2xl" />
            {heroBooks.map((book, index) => {
              const positions = ["left-[26%] top-0 z-30 rotate-[-2deg]", "left-[2%] top-16 z-10 rotate-[-10deg]", "right-[2%] top-14 z-20 rotate-[9deg]"];
              return (
                <Link key={book.id} href={bookHref(book)} className={`absolute block w-[210px] overflow-hidden rounded-xl bg-[#e8ddcf] shadow-[0_30px_65px_rgba(0,0,0,.38)] transition duration-300 hover:z-40 hover:-translate-y-3 hover:rotate-0 ${positions[index]}`}>
                  <div className="aspect-[0.69]">
                    {book.cover_signed_url ? <Image src={book.cover_signed_url} alt={book.title} width={420} height={610} priority className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-5 text-center font-bold text-[#4f4439]">{book.title}</div>}
                  </div>
                </Link>
              );
            })}
            {leadBook ? <p className="absolute bottom-0 right-6 z-40 rounded-full bg-[#f4b942] px-4 py-2 text-xs font-extrabold text-[#2c271f]">À lire gratuitement</p> : null}
          </div>
        </div>
      </section>

      <nav aria-label="Explorer par catégorie" className="border-b border-[#dfd3c7] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-8">
          {categories.map((category) => (
            <Link key={category.value} href={`/books?category=${encodeURIComponent(category.value)}`} className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#e4d9ce] bg-white px-4 text-sm font-bold text-[#403830] transition hover:-translate-y-0.5 hover:border-[#c9b7a6] hover:shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${category.color}`} />{category.label}<ChevronRight className="h-3.5 w-3.5 text-[#aa9d91] transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Shelf
          eyebrow="La bibliothèque ouverte"
          title="Lisez gratuitement, dès maintenant."
          description="Entrez dans la lecture numérique, découvrez un auteur et laissez-vous surprendre par un nouvel univers. Aucun paiement nécessaire."
          books={freeBooks}
          href="/books?access=free"
        />

        <section className="relative overflow-hidden rounded-[2rem] bg-[#e85d3f] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[38px] border-white/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffd98b]">Écrire depuis l’Afrique</p>
              <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">Votre histoire mérite de rencontrer ses lecteurs.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">De l’idée au livre publié, notre pôle d’ingénierie éditoriale vous accompagne avec méthode et ambition.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/formation-editoriale" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#a83b27]">Présenter mon manuscrit <PenTool className="h-4 w-4" /></Link>
              <Link href="/services" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-extrabold text-white hover:bg-white/10">Découvrir nos services</Link>
            </div>
          </div>
        </section>

        <Shelf
          eyebrow="Les choix des lecteurs"
          title="Les livres qui circulent."
          description="Les titres les plus consultés et les plus appréciés par la communauté Holistique Books."
          books={popularBooks}
          href="/books"
        />

        <AllAuthorsSection authors={authors} />

        {paidBooks.length > 0 ? (
          <Shelf
            eyebrow="Nouvelles parutions"
            title="À découvrir cette semaine."
            description="Essais, récits, spiritualité, business et développement personnel : les derniers titres de notre catalogue."
            books={paidBooks}
            href="/books?access=purchase"
          />
        ) : null}
      </main>
    </div>
  );
}
