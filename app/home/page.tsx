import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Globe,
  Headphones,
  MonitorPlay,
  PenSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { HEADER_CATEGORY_ITEMS } from "@/lib/book-categories";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";
import { getHomeFeaturedState } from "@/lib/home-positioning";

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

function isHomeBook(book: HomeBook | null): book is HomeBook {
  return book !== null;
}

function comparePopularBooks(a: HomeBook, b: HomeBook) {
  return (
    (b.purchases_count ?? 0) - (a.purchases_count ?? 0) ||
    (b.views_count ?? 0) - (a.views_count ?? 0) ||
    (b.rating_avg ?? 0) - (a.rating_avg ?? 0) ||
    (b.published_at ?? "").localeCompare(a.published_at ?? "")
  );
}

function formatPriceLabel(book: HomeBook) {
  return book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code}`);
}

function buildStars(rating?: number | null) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
  return Array.from({ length: 5 }, (_, index) => index < rounded);
}

function CoverArtwork({ book, priority = false }: { book: HomeBook; priority?: boolean }) {
  if (book.cover_signed_url) {
    return (
      <Image
        src={book.cover_signed_url}
        alt={book.title}
        width={280}
        height={400}
        priority={priority}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center bg-[#f3eee8] px-5 text-center text-sm font-semibold text-[#6f665e]">
      {book.title}
    </div>
  );
}

function ShelfBookCard({ book }: { book: HomeBook }) {
  const stars = buildStars(book.rating_avg);

  return (
    <article className="w-[180px] shrink-0 rounded-[26px] border border-[#ece3d7] bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
      <Link href={`/book/${book.id}`} className="block overflow-hidden rounded-[18px] bg-[#f5efe8]">
        <div className="aspect-[0.72]">
          <CoverArtwork book={book} />
        </div>
      </Link>
      <div className="mt-3 space-y-2">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#171717]">
          <Link href={`/book/${book.id}`}>{book.title}</Link>
        </p>
        <p className="line-clamp-1 text-xs text-[#6f665e]">{book.author_name ?? "Auteur inconnu"}</p>
        <div className="flex items-center gap-1 text-[#f3a81f]">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#f3a81f]" : "text-[#ddd2c7]"}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#171717]">{formatPriceLabel(book)}</p>
          <Link href={`/book/${book.id}`} className="text-xs font-semibold text-[#a85b3f] transition hover:text-[#171717]">
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}

function RailSection({
  title,
  description,
  books,
  href,
  hrefLabel,
}: {
  title: string;
  description: string;
  books: HomeBook[];
  href: string;
  hrefLabel: string;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Selection</p>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717]">{title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">{description}</p>
        </div>
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-[#a85b3f]">
          {hrefLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {books.map((book) => (
          <ShelfBookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [books, comingSoonBooks] = await Promise.all([getPublishedBooks(), getComingSoonBooks()]);
  const [homeFeatured, flashSale] = await Promise.all([getHomeFeaturedState(books), getFlashSaleState(books)]);
  const orderedBooks = homeFeatured.orderedBooks;
  const paidBooks = orderedBooks.filter((book) => !book.is_free);
  const freeBooks = orderedBooks.filter((book) => book.is_free);
  const premiumBooks = orderedBooks.filter(
    (book) => book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only",
  );
  const popularBooks = [...orderedBooks].sort(comparePopularBooks);
  const featuredBook = homeFeatured.selectedBooks[0] ?? orderedBooks[0] ?? null;
  const heroSupportBooks = orderedBooks.filter((book) => book.id !== featuredBook?.id).slice(0, 3);
  const topBooks = (homeFeatured.selectedBooks.length > 0 ? homeFeatured.selectedBooks : popularBooks).slice(0, 8);
  const newReleases = (paidBooks.length > 0 ? paidBooks : orderedBooks).slice(0, 4);
  const comingSoon = comingSoonBooks.slice(0, 8);
  const highlightedFlashDeals = flashSale.dealBooks.filter(isHomeBook).slice(0, 8);

  return (
    <div className="space-y-8 pb-6">
      <section className="overflow-hidden rounded-[40px] border border-[#ece3d7] bg-[linear-gradient(135deg,#171717_0%,#221914_42%,#6a3d2e_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_440px]">
          <div className="space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              <Sparkles className="h-3.5 w-3.5" />
              Librairie digitale premium
            </span>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[2.45rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.4rem]">
                Des livres a lire, offrir, publier et retrouver sur tous vos ecrans.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                Holistique Books evolue vers un vrai storefront ebook: recherche rapide, rayons lisibles, lectures vedettes, titres gratuits,
                Premium et studio auteur dans la meme experience.
              </p>
            </div>

            <form
              action="/books"
              className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/8 p-3 backdrop-blur sm:flex-row sm:items-center"
            >
              <div className="flex min-h-[3.25rem] flex-1 items-center gap-3 rounded-full bg-white px-4">
                <Search className="h-4 w-4 text-[#8b8177]" />
                <input
                  type="search"
                  name="q"
                  placeholder="Titre, auteur, categorie ou intention de lecture"
                  className="h-full flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9a8f84]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#171717] transition hover:bg-[#f3eee8]"
              >
                Explorer le catalogue
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {HEADER_CATEGORY_ITEMS.filter((item) => item.value !== "all").map((item) => (
                <Link
                  key={item.value}
                  href={item.value === "new" ? "/books" : `/books?category=${encodeURIComponent(item.value)}`}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/84 transition hover:bg-white/14"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Titres disponibles</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">{orderedBooks.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Lectures gratuites</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">{freeBooks.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">Auteurs a publier</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-white">Studio</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {featuredBook ? (
              <div className="rounded-[32px] border border-white/10 bg-white p-5 text-[#171717] shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
                <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[22px] bg-[#f5efe8]">
                    <div className="aspect-[0.72]">
                      <CoverArtwork book={featuredBook} priority />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <span className="inline-flex w-fit items-center rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">
                      A la une
                    </span>
                    <div className="space-y-2">
                      <h2 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[#171717]">{featuredBook.title}</h2>
                      <p className="text-sm text-[#6f665e]">{featuredBook.author_name ?? "Auteur inconnu"}</p>
                    </div>
                    <p className="line-clamp-4 text-sm leading-7 text-[#5c534b]">
                      {featuredBook.description?.trim() ||
                        "Une lecture mise en avant pour ouvrir le catalogue avec une promesse plus claire, plus professionnelle et plus visible."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[#ece3d7] bg-[#fcfaf7] px-3 py-1.5 text-sm font-semibold text-[#171717]">
                        {formatPriceLabel(featuredBook)}
                      </span>
                      <span className="rounded-full border border-[#ece3d7] bg-white px-3 py-1.5 text-sm text-[#6f665e]">
                        {featuredBook.offer_summary_label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/book/${featuredBook.id}`}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                      >
                        Voir le livre
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/dashboard/reader/subscriptions"
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-4 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
                      >
                        Decouvrir Premium
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {heroSupportBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/8 p-3 text-white transition hover:bg-white/12"
                >
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-[14px] bg-white/10">
                    <CoverArtwork book={book} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{book.title}</p>
                    <p className="line-clamp-1 text-xs text-white/68">{book.author_name ?? "Auteur inconnu"}</p>
                    <p className="mt-2 text-sm font-semibold text-[#ffd9cd]">{formatPriceLabel(book)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Top boutique</p>
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717]">Les lectures les plus ouvertes</h2>
            </div>
            <Link href="/books" className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-[#a85b3f]">
              Voir toute la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {topBooks.map((book) => (
              <ShelfBookCard key={book.id} book={book} />
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[34px] border border-[#ece3d7] bg-[linear-gradient(180deg,#fff8f2,#ffffff)] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#ff6a4c]">
                <MonitorPlay className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Lire partout</p>
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[#171717]">Web, mobile et bibliotheque unifiee</h2>
                <p className="text-sm leading-7 text-[#6f665e]">
                  Retrouvez vos achats, vos titres gratuits et vos livres Premium dans une experience continue, quel que soit l ecran.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <div className="grid gap-3">
              {[
                {
                  icon: Globe,
                  title: "Lecteur web",
                  text: "Acces direct aux livres depuis le navigateur sans installation.",
                },
                {
                  icon: Headphones,
                  title: "Premium",
                  text: "Des catalogues accessibles par abonnement pour augmenter la retention.",
                },
                {
                  icon: PenSquare,
                  title: "Studio auteur",
                  text: "Un back-office de publication directement relie au storefront.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex items-start gap-3 rounded-[24px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171717] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
                    <p className="text-sm leading-6 text-[#6f665e]">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Nouveautes</p>
            <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717]">Les sorties a pousser cette semaine</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">
              Une grille plus retail pour mettre en avant les nouveautes et faciliter la conversion sur les titres recents.
            </p>
          </div>
          <Link href="/books" className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-[#a85b3f]">
            Parcourir les nouveautes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {newReleases.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <RailSection
        title="Titres gratuits et decouverte rapide"
        description="Un rayon specifique pour favoriser l acquisition gratuite, la circulation du catalogue et la reactivation des lecteurs."
        books={freeBooks.slice(0, 8)}
        href="/books?access=free"
        hrefLabel="Voir les livres gratuits"
      />

      <RailSection
        title="Inclus Premium"
        description="Une section dediee aux livres accessibles via abonnement, pour rendre l offre plus visible des la home."
        books={premiumBooks.slice(0, 8)}
        href="/dashboard/reader/subscriptions"
        hrefLabel="Voir Premium"
      />

      {highlightedFlashDeals.length > 0 ? (
        <RailSection
          title="Offres du moment"
          description={`Une mise en avant de vos promotions actives pour soutenir les pics de conversion avec ${flashSale.config.discountPercentage}% de remise.`}
          books={highlightedFlashDeals}
          href="/books"
          hrefLabel="Voir les offres"
        />
      ) : null}

      {comingSoon.length > 0 ? (
        <RailSection
          title="Bientot disponibles"
          description="Les sorties planifiees gardent leur place dans le storefront pour nourrir l attente et preparer les prochaines campagnes."
          books={comingSoon}
          href="/books"
          hrefLabel="Voir le catalogue"
        />
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rounded-[34px] border border-[#ece3d7] bg-[linear-gradient(135deg,#fff7ef,#ffffff)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-7">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Espace auteur
            </span>
            <div className="space-y-3">
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.5rem]">
                Publiez comme dans un vrai studio, pas juste un formulaire.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[#6f665e]">
                Catalogue, fiches livre, formats, soumission admin et suivi commercial restent relies a votre schema Supabase, avec une experience plus credible pour les auteurs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/author"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Ouvrir le studio auteur
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-white px-5 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
              >
                Creer un compte auteur
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              title: "Storefront plus clair",
              text: "Meilleure hierarchie entre recherche, rayons, promos et decouverte.",
            },
            {
              title: "Experience plus responsive",
              text: "Le parcours mobile garde les actions importantes visibles sans casser la lecture.",
            },
            {
              title: "Parcours connectes",
              text: "Le storefront public et les dashboards lecteur/auteur restent alignes dans le meme systeme produit.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[28px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#6f665e]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[34px] border border-[#ece3d7] bg-white/94 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Questions frequentes</p>
            <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-[#171717]">Une boutique plus simple a comprendre</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              {
                question: "Comment les lecteurs accedent-ils aux livres ?",
                answer: "Par achat unitaire, acces gratuit ou abonnement Premium selon l offre configuree sur chaque livre.",
              },
              {
                question: "Les auteurs peuvent-ils publier eux-memes ?",
                answer: "Oui. Le studio auteur permet de preparer la fiche, les formats et de soumettre le livre a validation.",
              },
              {
                question: "Le storefront reste lie a Supabase ?",
                answer: "Oui. Les comptes, profils, bibliotheques, commandes et catalogues restent relies a votre schema actuel.",
              },
            ].map((item) => (
              <article key={item.question} className="rounded-[22px] border border-[#ece3d7] bg-[#fcfaf7] p-4">
                <h3 className="text-sm font-semibold text-[#171717]">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-[#6f665e]">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>

        <div id="contact" className="rounded-[34px] border border-[#ece3d7] bg-[#171717] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              <BookOpen className="h-3.5 w-3.5" />
              Contact & accompagnement
            </span>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white">Besoin d aide pour vendre, publier ou configurer votre compte ?</h2>
            <p className="text-sm leading-7 text-white/72">
              Orientez les lecteurs vers la boutique et les auteurs vers le studio, avec un point de contact clair pour les demandes plus sensibles.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/faq"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#171717] transition hover:bg-[#f4eee7]"
              >
                Ouvrir la FAQ
              </Link>
              <Link
                href="/blog"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Lire le blog
              </Link>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-sm font-semibold text-white">contact@holistiquebooks.africa</p>
              <p className="mt-2 text-sm leading-7 text-white/68">Canal principal pour le support, les demandes auteur et les partenariats de diffusion.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
