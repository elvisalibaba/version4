import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Star,
} from "lucide-react";
import { MobileAppHeroCard } from "@/components/home/mobile-app-hero-card";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";
import { getHomeFeaturedState } from "@/lib/home-positioning";
import { getMobileAppConfig } from "@/lib/mobile-app";
import { createClient } from "@/lib/supabase/server";

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

const featuredCollections = [
  {
    title: "Découvrez les supports de lecture Holistique",
    description: "Lecture web, parcours mobile et espace personnel dans un environnement sans distraction.",
    cta: "Explorer les accès",
    href: "/dashboard/reader",
  },
  {
    title: "Ne soyez jamais à court d'histoires avec Holistique Plus",
    description: "Faites monter la rétention avec une offre d'abonnement visible dès la home.",
    cta: "En savoir plus",
    href: "/dashboard/reader/subscriptions",
  },
];

const readingProducts = [
  {
    title: "Lecteur Web",
    subtitle: "Lisez instantanément dans votre navigateur",
    price: "Accès inclus",
    note: "Sans installation",
  },
  {
    title: "Holistique Plus",
    subtitle: "Abonnement lecture pour titres éligibles",
    price: "Offre Premium",
    note: "Bibliothèque enrichie",
  },
  {
    title: "Studio Auteur",
    subtitle: "Publiez, suivez et pilotez vos titres",
    price: "Espace pro",
    note: "Catalogue et ventes",
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
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center bg-gray-100 px-5 text-center text-sm font-semibold text-gray-600">
      {book.title}
    </div>
  );
}

function ShelfBookCard({ book, showPremiumHint = false }: { book: HomeBook; showPremiumHint?: boolean }) {
  const stars = buildStars(book.rating_avg);
  const premiumLabel =
    showPremiumHint && (book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only")
      ? "ou inclus Premium"
      : null;

  return (
    <article className="w-[182px] shrink-0 rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition">
      <Link href={`/book/${book.id}`} className="block overflow-hidden rounded-md bg-gray-100">
        <div className="aspect-[0.72]">
          <CoverArtwork book={book} />
        </div>
      </Link>
      <div className="mt-3 space-y-2">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
          <Link href={`/book/${book.id}`}>{book.title}</Link>
        </p>
        <p className="line-clamp-1 text-xs text-gray-600">{book.author_name ?? "Auteur inconnu"}</p>
        <div className="flex items-center gap-1">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#ff9900]" : "text-gray-300"}`}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">{formatPriceLabel(book)}</p>
          {premiumLabel ? <p className="text-xs font-medium text-gray-500">{premiumLabel}</p> : null}
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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff9900] hover:underline">
          {hrefLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {books.map((book) => (
          <ShelfBookCard key={book.id} book={book} showPremiumHint={showPremiumHint} />
        ))}
      </div>
    </section>
  );
}

function PromoFeature({ title, description, cta, href }: { title: string; description: string; cta: string; href: string }) {
  return (
    <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff9900] hover:underline">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [books, comingSoonBooks, mobileAppConfig, supabase] = await Promise.all([
    getPublishedBooks(),
    getComingSoonBooks(),
    getMobileAppConfig(),
    createClient(),
  ]);
  const [homeFeatured, flashSale] = await Promise.all([getHomeFeaturedState(books), getFlashSaleState(books)]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const orderedBooks = homeFeatured.orderedBooks;
  const freeBooks = orderedBooks.filter((book) => book.is_free);
  const paidBooks = orderedBooks.filter((book) => !book.is_free);
  const premiumBooks = orderedBooks.filter(
    (book) => book.offer_mode === "sale_and_subscription" || book.offer_mode === "subscription_only",
  );
  const categoryRomans = orderedBooks.filter((book) => book.categories?.includes("Roman")).slice(0, 10);
  const categorySpirituality = orderedBooks.filter((book) => book.categories?.includes("Spiritualite")).slice(0, 10);
  const categoryAfricanAuthors = orderedBooks.filter((book) => book.categories?.includes("Auteurs africains")).slice(0, 10);
  const popularBooks = [...orderedBooks].sort(comparePopularBooks);
  const featuredBook = homeFeatured.selectedBooks[0] ?? orderedBooks[0] ?? null;
  const spotlightBooks = popularBooks.slice(0, 18);
  const newReleases = (paidBooks.length > 0 ? paidBooks : orderedBooks).slice(0, 12);
  const comingSoon = comingSoonBooks.slice(0, 12);
  const highlightedFlashDeals = flashSale.dealBooks.filter(isHomeBook).slice(0, 12);
  const dailyDeal = highlightedFlashDeals[0] ?? featuredBook;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero section : large banner with CTA and search */}
      <div className="bg-gradient-to-r from-[#232f3e] to-[#1a2a3a] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:gap-10">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Les histoires fleurissent sur Holistique Books.
              </h1>
              <p className="text-lg text-gray-200">
                Une librairie en ligne pensée pour les lecteurs exigeants et les auteurs ambitieux.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  href="/books"
                  className="inline-flex w-full items-center justify-center rounded-md bg-[#ff9900] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#e68900] sm:w-auto"
                >
                  Explorer la boutique
                </Link>
                <Link
                  href="/dashboard/author"
                  className="inline-flex w-full items-center justify-center rounded-md border border-white/30 bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Publier un livre
                </Link>
              </div>
              <MobileAppHeroCard config={mobileAppConfig} isAuthenticated={isAuthenticated} />
              <form action="/books" className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:gap-0">
                <div className="flex min-w-0 flex-1 items-center rounded-md border border-gray-300 bg-white sm:rounded-l-md sm:rounded-r-none">
                  <Search className="h-5 w-5 text-gray-400 ml-3" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Rechercher par titre, auteur ou catégorie"
                    className="flex-1 px-3 py-2 text-gray-900 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-[#ff9900] px-5 py-2 font-semibold text-white transition hover:bg-[#e68900] sm:rounded-l-none sm:rounded-r-md"
                >
                  Rechercher
                </button>
              </form>
            </div>
            {/* Optional hero image */}
            <div className="relative hidden h-72 md:block lg:h-80">
              <Image
                src="/images/ce2.jpg"
                alt="Hero"
                fill
                className="object-cover rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Today's Deal */}
        {dailyDeal && (
          <section className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <h2 className="text-xl font-bold text-gray-900">Offre du jour</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="rounded-md overflow-hidden bg-gray-100">
                <div className="aspect-[0.72]">
                  <CoverArtwork book={dailyDeal} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{dailyDeal.title}</h3>
                <p className="text-gray-600">par {dailyDeal.author_name ?? "Auteur inconnu"}</p>
                <p className="text-gray-700">{dailyDeal.description?.trim() || "Un titre incontournable à prix réduit aujourd'hui seulement."}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-[#ff9900]">{formatPriceLabel(dailyDeal)}</span>
                  {flashSale.config.discountPercentage > 0 && (
                    <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
                      -{flashSale.config.discountPercentage}%
                    </span>
                  )}
                </div>
                <Link
                  href={`/book/${dailyDeal.id}`}
                  className="inline-flex items-center gap-2 rounded-md bg-[#ff9900] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e68900] transition"
                >
                  Voir l&apos;offre
                  <ArrowRight className="h-4 w-4" />
                </Link>
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

        {/* Reading products */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Nos solutions de lecture</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {readingProducts.map((product) => (
              <div key={product.title} className="bg-white rounded-md border border-gray-200 p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase text-[#ff9900]">{product.title}</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{product.subtitle}</h3>
                <p className="mt-4 text-xl font-semibold text-gray-900">{product.price}</p>
                <p className="text-sm text-gray-500">{product.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* African Authors */}
        <RailSection
          title="Auteurs africains"
          description="Des voix qui comptent"
          books={categoryAfricanAuthors}
          href="/books?category=Auteurs%20africains"
          hrefLabel="Voir la sélection"
        />

        {/* FAQ & Contact */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Questions fréquentes</h2>
            <div className="mt-4 space-y-4">
              {[
                {
                  question: "Comment les lecteurs accèdent-ils aux livres ?",
                  answer: "Par achat unitaire, accès gratuit ou abonnement Premium selon l'offre configurée sur chaque livre.",
                },
                {
                  question: "Les auteurs peuvent-ils publier eux-mêmes ?",
                  answer: "Oui. Le studio auteur permet de préparer la fiche, les formats et de soumettre le livre à validation.",
                },
                {
                  question: "Le storefront reste lié à Supabase ?",
                  answer: "Oui. Comptes, profils, bibliothèques, commandes et catalogues restent reliés à votre schéma actuel.",
                },
              ].map((item) => (
                <div key={item.question} className="border-b border-gray-200 pb-3 last:border-0">
                  <h3 className="font-semibold text-gray-900">{item.question}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#232f3e] rounded-md p-6 text-white shadow-sm">
            <h2 className="text-xl font-bold">Besoin d&apos;aide ?</h2>
            <p className="mt-2 text-gray-200">
              Orientez les lecteurs vers la boutique et les auteurs vers le studio, avec un point de contact visible comme sur les grandes plateformes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/faq"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#232f3e] hover:bg-gray-100 transition"
              >
                Ouvrir la FAQ
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Lire le blog
              </Link>
            </div>
            <div className="mt-6 border-t border-white/20 pt-4">
              <p className="text-sm font-semibold">contact@holistiquebooks.africa</p>
              <p className="mt-1 text-sm text-gray-300">Canal principal pour le support, les demandes auteur et les partenariats de diffusion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
