import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Star } from "lucide-react";
import { AboutSection } from "@/components/home/about-section";
import { AllAuthorsSection } from "@/components/home/all-authors-section";
import { ReadingSolutionsSection } from "@/components/home/reading-solutions-section";
import { getPublicAuthors } from "@/lib/authors";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";
import { getHomeFeaturedState } from "@/lib/home-positioning";

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

const featuredCollections = [
  {
    title: "Une bibliothèque ouverte, dès la première page",
    description: "Lisez les titres gratuits immédiatement sur votre téléphone, sans inscription ni paiement.",
    cta: "Lire sans compte",
    href: "/library",
  },
  {
    title: "Allez plus loin avec Holistique Plus",
    description: "Retrouvez une sélection élargie de titres dans une formule conçue pour les lecteurs réguliers.",
    cta: "Découvrir Holistique Plus",
    href: "/dashboard/reader/subscriptions",
  },
];

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
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center bg-[#f5f0e8] px-4 text-center text-sm font-semibold text-[#8a7e72]">
      {book.title}
    </div>
  );
}

function ShelfBookCard({ book, showPremiumHint = false }: { book: HomeBook; showPremiumHint?: boolean }) {
  const stars = buildStars(book.rating_avg);
  const bookHref = book.status === "coming_soon" ? "/books" : book.is_free ? `/book/${book.id}?read=1` : `/book/${book.id}`;
  const premiumLabel =
    showPremiumHint && (book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only")
      ? "ou inclus Premium"
      : null;

  return (
    <article className="group w-[148px] shrink-0 rounded-2xl border border-[#efe4d9] bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-[182px] sm:p-3">
      <Link href={bookHref} className="block overflow-hidden rounded-xl bg-[#f5f0e8]">
        <div className="aspect-[0.72]">
          <CoverArtwork book={book} />
        </div>
      </Link>
      <div className="mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#171717]">
          <Link href={bookHref} className="hover:text-[#ff7a5c] transition-colors">
            {book.title}
          </Link>
        </p>
        <p className="line-clamp-1 text-xs text-[#8a7e72]">{book.author_name ?? "Auteur inconnu"}</p>
        <div className="flex items-center gap-0.5">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#ff7a5c]" : "text-[#e5ddd2]"}`}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#171717]">{formatPriceLabel(book)}</p>
          {premiumLabel ? <p className="text-xs font-medium text-[#8a7e72]">{premiumLabel}</p> : null}
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
  showPremiumHint = false,
}: {
  title: string;
  description: string;
  books: HomeBook[];
  href: string;
  hrefLabel: string;
  showPremiumHint?: boolean;
}) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-[#171717]">{title}</h2>
          <p className="text-sm text-[#8a7e72]">{description}</p>
        </div>
        <Link
          href={href}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a5c] transition-colors hover:text-[#e56a4c]"
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="-mr-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mr-0 sm:gap-4 sm:pr-0">
        {books.map((book) => (
          <div key={book.id} className="snap-start">
            <ShelfBookCard book={book} showPremiumHint={showPremiumHint} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PromoFeature({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="group rounded-2xl border border-[#efe4d9] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#171717]">{title}</h3>
        <p className="text-sm leading-6 text-[#6f665e]">{description}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff7a5c] transition-colors hover:text-[#e56a4c]"
        >
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [books, comingSoonBooks, authors] = await Promise.all([
    getPublishedBooks(),
    getComingSoonBooks(),
    getPublicAuthors(),
  ]);
  const [homeFeatured, flashSale] = await Promise.all([getHomeFeaturedState(books), getFlashSaleState(books)]);

  const orderedBooks = homeFeatured.orderedBooks;
  const freeBooks = orderedBooks.filter((book) => book.is_free);
  const paidBooks = orderedBooks.filter((book) => !book.is_free);
  const premiumBooks = orderedBooks.filter(
    (book) => book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only",
  );
  const categoryRomans = orderedBooks.filter((book) => book.categories?.includes("Roman")).slice(0, 10);
  const categorySpirituality = orderedBooks.filter((book) => book.categories?.includes("Spiritualite")).slice(0, 10);
  const categoryAfricanAuthors = orderedBooks
    .filter((book) => book.categories?.includes("Auteurs africains"))
    .slice(0, 10);
  const popularBooks = [...orderedBooks].sort(comparePopularBooks);
  const featuredBook = homeFeatured.selectedBooks[0] ?? orderedBooks[0] ?? null;
  const spotlightBooks = popularBooks.slice(0, 18);
  const newReleases = (paidBooks.length > 0 ? paidBooks : orderedBooks).slice(0, 12);
  const comingSoon = comingSoonBooks.slice(0, 12);
  const highlightedFlashDeals = flashSale.dealBooks.filter(isHomeBook).slice(0, 12);
  const dailyDeal = highlightedFlashDeals[0] ?? featuredBook;

  return (
    <div className="hb-home-page min-h-screen bg-[#fdfaf6]">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-[#171717]">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ff7a5c] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#ff7a5c] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:gap-12">
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-[2.15rem] font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl md:text-5xl lg:text-[3.2rem]">
                Lire des œuvres qui comptent. Publier avec ambition.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#d0c8bc] sm:text-lg sm:leading-8">
                Holistique Books réunit une librairie en ligne moderne et un accompagnement éditorial exigeant pour
                rapprocher chaque livre de son public.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  href="/books"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a5c] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_45px_rgba(255,122,92,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ff6a4c] hover:shadow-[0_22px_50px_rgba(255,122,92,0.35)] sm:w-auto"
                >
                  Explorer la boutique
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/dashboard/author"
                  className="inline-flex w-full items-center justify-center rounded-full border-2 border-white/20 bg-transparent px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10 sm:w-auto"
                >
                  Publier un livre
                </Link>
              </div>

              <form action="/books" className="hidden w-full max-w-2xl flex-col gap-3 sm:flex sm:flex-row sm:gap-0">
                <div className="flex min-w-0 flex-1 items-center rounded-full border-2 border-transparent bg-white/15 backdrop-blur-md transition-all duration-300 focus-within:border-[#ff7a5c]/50 focus-within:bg-white/20 sm:rounded-l-full sm:rounded-r-none">
                  <Search className="ml-4 h-5 w-5 text-[#a0958a]" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Rechercher par titre, auteur ou catégorie"
                    className="flex-1 bg-transparent px-4 py-3 text-white placeholder-[#a0958a] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-[#ff7a5c] px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-[#ff6a4c] sm:rounded-l-none sm:rounded-r-full"
                >
                  Rechercher
                </button>
              </form>
            </div>

            <div className="relative hidden h-80 overflow-hidden rounded-3xl shadow-2xl md:block lg:h-96">
              <Image
                src="/images/ce2.jpg"
                alt="Sélection éditoriale Holistique Books"
                fill
                sizes="(max-width: 767px) 0px, (max-width: 1279px) 42vw, 460px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171717]/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl space-y-9 px-3 py-7 sm:space-y-12 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        {/* Today's Deal */}
        {dailyDeal && (
          <section className="group overflow-hidden rounded-2xl border border-[#efe4d9] bg-white shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-4 p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔥</span>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff7a5c]">Offre du jour</span>
              </div>
              {flashSale.config.discountPercentage > 0 && (
                <span className="rounded-full bg-[#ff7a5c]/10 px-2.5 py-0.5 text-xs font-bold text-[#ff7a5c]">
                  -{flashSale.config.discountPercentage}%
                </span>
              )}
            </div>

            <div className="border-t border-[#efe4d9]" />

            <div className="flex gap-4 p-3 sm:gap-5 sm:p-4">
              <div className="w-16 shrink-0 overflow-hidden rounded-lg bg-[#f5f0e8] sm:w-20">
                <div className="aspect-[0.72]">
                  <CoverArtwork book={dailyDeal} priority />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold leading-snug text-[#171717]">
                    <Link href={`/book/${dailyDeal.id}`} className="hover:text-[#ff7a5c] transition-colors line-clamp-2">
                      {dailyDeal.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#8a7e72]">{dailyDeal.author_name ?? "Auteur inconnu"}</p>
                  <p className="text-xs leading-5 text-[#6f665e] line-clamp-2">
                    {dailyDeal.description?.trim() || "Un titre incontournable à prix réduit aujourd'hui seulement."}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-[#ff7a5c]">{formatPriceLabel(dailyDeal)}</span>
                  <Link
                    href={`/book/${dailyDeal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#ff7a5c] transition-colors"
                  >
                    Voir l&apos;offre
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Best Sellers */}
        <RailSection
          title="Meilleures ventes"
          description="Les livres les plus populaires du moment"
          books={spotlightBooks}
          href="/books"
          hrefLabel="Voir tous les best-sellers"
        />

        {/* New Releases */}
        <RailSection
          title="Nouveautés"
          description="Les dernières parutions à découvrir"
          books={newReleases}
          href="/books"
          hrefLabel="Voir toutes les nouveautés"
          showPremiumHint
        />

        {/* Premium Picks */}
        <RailSection
          title="Lectures incluses Premium"
          description="Accédez à ces titres avec votre abonnement"
          books={premiumBooks.slice(0, 14)}
          href="/dashboard/reader/subscriptions"
          hrefLabel="Découvrir Premium"
          showPremiumHint
        />

        {/* Free Books */}
        <RailSection
          title="Livres gratuits"
          description="Commencez votre voyage sans frais"
          books={freeBooks.slice(0, 14)}
          href="/books?access=free"
          hrefLabel="Voir tous les livres gratuits"
        />

        {/* Thematic rails */}
        <RailSection
          title="Romans & fiction"
          description="Plongez dans des histoires captivantes"
          books={categoryRomans}
          href="/books?category=Roman"
          hrefLabel="Voir tous les romans"
        />

        <RailSection
          title="Spiritualité & croissance"
          description="Des lectures pour nourrir l'esprit"
          books={categorySpirituality}
          href="/books?category=Spiritualite"
          hrefLabel="Explorer la collection"
        />

        {comingSoon.length > 0 && (
          <RailSection
            title="À paraître"
            description="Préparez-vous pour ces futures sorties"
            books={comingSoon}
            href="/books"
            hrefLabel="Voir les précommandes"
          />
        )}

        {/* Promo cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {featuredCollections.map((item) => (
            <PromoFeature key={item.title} {...item} />
          ))}
        </div>

        <AboutSection />

        <ReadingSolutionsSection />

        {/* African Authors */}
        <RailSection
          title="Auteurs africains"
          description="Des voix qui comptent"
          books={categoryAfricanAuthors}
          href="/books?category=Auteurs%20africains"
          hrefLabel="Voir la sélection"
        />

        <AllAuthorsSection authors={authors} />

        {/* FAQ & Contact */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#efe4d9] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-[#171717]">Questions fréquentes</h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  question: "Comment les lecteurs accèdent-ils aux livres ?",
                  answer:
                    "Par achat unitaire, accès gratuit ou abonnement Premium selon l'offre configurée sur chaque livre.",
                },
                {
                  question: "Les auteurs peuvent-ils publier eux-mêmes ?",
                  answer:
                    "Oui. Le studio auteur permet de préparer la fiche, les formats et de soumettre le livre à validation.",
                },
                {
                  question: "Puis-je retrouver mes livres sur plusieurs appareils ?",
                  answer:
                    "Oui. Lorsque vous choisissez de créer un compte, votre bibliothèque et vos accès restent liés à votre espace personnel.",
                },
              ].map((item, index) => (
                <div
                  key={item.question}
                  className={index !== 2 ? "border-b border-[#efe4d9] pb-5" : ""}
                >
                  <h3 className="font-bold text-[#171717]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f665e]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#171717] p-6 text-white shadow-lg sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff7a5c]/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold">Besoin d&apos;aide ?</h2>
              <p className="mt-3 text-[#d0c8bc] leading-7">
                Consultez les réponses essentielles sur la lecture, les paiements et la publication, ou découvrez nos conseils éditoriaux.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/faq"
                  className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#171717] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Ouvrir la FAQ
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center rounded-full border-2 border-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                >
                  Lire le blog
                </Link>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-lg font-bold">contact@holistiquebooks.africa</p>
                <p className="mt-2 text-sm text-[#a0958a]">
                  Canal principal pour le support, les demandes auteur et les partenariats de diffusion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
