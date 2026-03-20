import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Gift,
  Headphones,
  MonitorPlay,
  PenSquare,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { HEADER_CATEGORY_ITEMS } from "@/lib/book-categories";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";
import { getHomeFeaturedState } from "@/lib/home-positioning";

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

const featuredCollections = [
  {
    title: "Decouvrez les supports de lecture Holistique",
    description: "Lecture web, parcours mobile et espace personnel dans un environnement sans distraction.",
    cta: "Explorer les acces",
    href: "/dashboard/reader",
  },
  {
    title: "Ne soyez jamais a court d histoires avec Holistique Plus",
    description: "Faites monter la retention avec une offre d abonnement visible des la home.",
    cta: "En savoir plus",
    href: "/dashboard/reader/subscriptions",
  },
];

const readingProducts = [
  {
    title: "Lecteur Web",
    subtitle: "Lisez instantanement dans votre navigateur",
    price: "Acces inclus",
    note: "Sans installation",
  },
  {
    title: "Holistique Plus",
    subtitle: "Abonnement lecture pour titres eligibles",
    price: "Offre Premium",
    note: "Bibliotheque enrichie",
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
    <div className="grid h-full w-full place-items-center bg-[#f3eee8] px-5 text-center text-sm font-semibold text-[#6f665e]">
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
    <article className="w-[182px] shrink-0 rounded-[26px] border border-[#ece3d7] bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
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
        <div className="flex items-center gap-1">
          {stars.map((filled, index) => (
            <Star
              key={`${book.id}-${index}`}
              className={`h-3.5 w-3.5 ${filled ? "fill-current text-[#f3a81f]" : "text-[#ddd2c7]"}`}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#171717]">{formatPriceLabel(book)}</p>
          {premiumLabel ? <p className="text-[0.72rem] font-medium text-[#6f665e]">{premiumLabel}</p> : null}
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
          <ShelfBookCard key={book.id} book={book} showPremiumHint={showPremiumHint} />
        ))}
      </div>
    </section>
  );
}

function PromoFeature({ title, description, cta, href }: { title: string; description: string; cta: string; href: string }) {
  return (
    <article className="rounded-[30px] border border-[#ece3d7] bg-[linear-gradient(180deg,#fff9f4,#ffffff)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
      <div className="space-y-3">
        <h3 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[#171717]">{title}</h3>
        <p className="text-sm leading-7 text-[#6f665e]">{description}</p>
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-[#a85b3f]">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [books, comingSoonBooks] = await Promise.all([getPublishedBooks(), getComingSoonBooks()]);
  const [homeFeatured, flashSale] = await Promise.all([getHomeFeaturedState(books), getFlashSaleState(books)]);

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
    <div className="space-y-8 pb-6">
      <section className="overflow-hidden rounded-[40px] border border-[#ece3d7] bg-[linear-gradient(135deg,#171717_0%,#241a14_42%,#74402f_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_430px]">
          <div className="space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              <Sparkles className="h-3.5 w-3.5" />
              Le printemps est dans l air, et sur vos pages
            </span>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-[2.5rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.5rem]">
                Les histoires fleurissent sur Holistique Books.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                Une home structuree comme un vrai storefront ebook: promo principale, meilleures ventes, offre du jour, abonnement, rails
                thematiques, avant-premieres et espace auteur.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#ffd9cd]">L offre se termine bientot</p>
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-white">
                  Le storefront premium est en ligne avec recherche, rayons et lecture directe.
                </h2>
                <p className="text-sm leading-7 text-white/72">
                  Mettez en avant vos livres, vos offres Premium, vos avant-premieres et votre studio auteur dans une seule vitrine claire.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/books"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#171717] transition hover:bg-[#f4eee7]"
                >
                  Explorer la boutique
                </Link>
                <Link
                  href="/dashboard/author"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Publier un livre
                </Link>
              </div>
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
                  placeholder="Rechercher sur Holistique Books"
                  className="h-full flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9a8f84]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#171717] transition hover:bg-[#f3eee8]"
              >
                Rechercher
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
                    <span className="inline-flex w-fit rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">
                      Notre recommandation du mois
                    </span>
                    <div className="space-y-2">
                      <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#171717]">{featuredBook.title}</h2>
                      <p className="text-sm text-[#6f665e]">{featuredBook.author_name ?? "Auteur inconnu"}</p>
                    </div>
                    <p className="line-clamp-4 text-sm leading-7 text-[#5c534b]">
                      {featuredBook.description?.trim() ||
                        "Un titre mis en avant dans une carte hero plus proche des grandes boutiques ebook."}
                    </p>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-[#171717]">{formatPriceLabel(featuredBook)}</p>
                      <p className="text-sm text-[#6f665e]">{featuredBook.offer_summary_label}</p>
                    </div>
                    <Link
                      href={`/book/${featuredBook.id}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                    >
                      Voir le livre
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            {featuredCollections.map((item) => (
              <PromoFeature key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <RailSection
        title="Meilleurs livres dans la boutique"
        description="Une premiere ligne de livres comme sur les grandes librairies ebook: bestsellers, livres du moment et titres a forte traction."
        books={spotlightBooks}
        href="/books"
        hrefLabel="Voir la liste complete"
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[34px] border border-[#ece3d7] bg-[linear-gradient(135deg,#fff8f2,#ffffff)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Lire partout</p>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-[#171717]">
              Decouvrez les supports de lecture Holistique
            </h2>
            <p className="text-sm leading-7 text-[#6f665e]">
              Aucune distraction, aucune friction: juste vous, votre livre, votre bibliotheque et votre espace personnel.
            </p>
            <Link href="/dashboard/reader" className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-[#a85b3f]">
              Acheter des acces
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[34px] border border-[#ece3d7] bg-[linear-gradient(135deg,#171717,#2b211b)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#ffd9cd]">Abonnement</p>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-white">
              Ne soyez jamais a court d histoires avec Holistique Plus
            </h2>
            <p className="text-sm leading-7 text-white/72">
              Parce que votre pile a lire est deja trop longue, et que l abonnement doit vraiment donner envie de rester.
            </p>
            <Link
              href="/dashboard/reader/subscriptions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#ffd9cd]"
            >
              En savoir plus
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <RailSection
        title="Nouveautes a ne pas manquer"
        description="Une ligne complete de sorties recentes pour garder le storefront vivant et proche des usages des grandes plateformes."
        books={newReleases}
        href="/books"
        hrefLabel="Voir les nouveautes"
        showPremiumHint
      />

      <section className="space-y-5 rounded-[34px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#a85b3f]">Acces & produits</p>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[#171717]">Sans reflet, leger et concu pour lire plus souvent</h2>
          <p className="max-w-3xl text-sm leading-7 text-[#6f665e]">
            Une section carte produit inspirée des marketplaces de lecture, adaptee a vos vrais acces: web, Premium et studio auteur.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {readingProducts.map((product) => (
            <article key={product.title} className="rounded-[28px] border border-[#ece3d7] bg-[#fcfaf7] p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#8b8177]">{product.title}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-[#171717]">{product.subtitle}</h3>
              <p className="mt-4 text-lg font-semibold text-[#171717]">{product.price}</p>
              <p className="mt-1 text-sm text-[#6f665e]">{product.note}</p>
            </article>
          ))}
        </div>
      </section>

      {dailyDeal ? (
        <section className="rounded-[36px] border border-[#ece3d7] bg-[linear-gradient(135deg,#fff8f2,#ffffff)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[24px] bg-[#f5efe8]">
              <div className="aspect-[0.72]">
                <CoverArtwork book={dailyDeal} />
              </div>
            </div>
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
                L offre du jour
              </span>
              <div className="space-y-2">
                <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#171717]">{dailyDeal.title}</h2>
                <p className="text-sm text-[#6f665e]">par {dailyDeal.author_name ?? "Auteur inconnu"}</p>
              </div>
              <p className="max-w-4xl text-sm leading-7 text-[#5c534b]">
                {dailyDeal.description?.trim() ||
                  "Un bloc spotlight plus direct pour mettre en avant une offre courte, une promo active ou un livre cle du moment."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#ece3d7] bg-white px-3 py-1.5 text-sm font-semibold text-[#171717]">
                  {formatPriceLabel(dailyDeal)}
                </span>
                <span className="rounded-full bg-[#171717] px-3 py-1.5 text-sm font-semibold text-white">
                  {flashSale.config.discountPercentage}% de remise active
                </span>
              </div>
              <Link
                href={`/book/${dailyDeal.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Voir l offre
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <RailSection
        title="Lectures incluses Premium"
        description="Une ligne dediee aux titres lisibles dans le cadre de l abonnement, avec un indice clair directement sur chaque carte."
        books={premiumBooks.slice(0, 14)}
        href="/dashboard/reader/subscriptions"
        hrefLabel="Voir Premium"
        showPremiumHint
      />

      <RailSection
        title="Lectures offertes et decouverte rapide"
        description="Un rayon dedie aux livres gratuits pour augmenter l entree dans la plateforme et la reprise de lecture."
        books={freeBooks.slice(0, 14)}
        href="/books?access=free"
        hrefLabel="Voir les livres gratuits"
      />

      <RailSection
        title="Roman et fiction"
        description="Une ligne thematique proche des rayons Kobo pour ancrer l exploration dans des categories nettes."
        books={categoryRomans}
        href="/books?category=Roman"
        hrefLabel="Voir les romans"
      />

      <RailSection
        title="Spiritualite et croissance"
        description="Une collection plus editoriale pour mettre en avant les titres de profondeur, de foi et de transformation."
        books={categorySpirituality}
        href="/books?category=Spiritualite"
        hrefLabel="Voir la collection"
      />

      {comingSoon.length > 0 ? (
        <RailSection
          title="Disponible bientot"
          description="Les titres a paraitre gardent une vraie presence storefront pour nourrir l attente et preparer les campagnes."
          books={comingSoon}
          href="/books"
          hrefLabel="Voir les a venir"
        />
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rounded-[34px] border border-[#ece3d7] bg-[linear-gradient(135deg,#fff7ef,#ffffff)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] sm:p-7">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
              <Gift className="h-3.5 w-3.5" />
              S offrir du temps pour soi
            </span>
            <div className="space-y-3">
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.45rem]">
                Offrez une carte-cadeau ou recommandez une lecture en un clic.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[#6f665e]">
                Une grande bannière de conversion, a la manière des grands stores, pour vendre des acces, des offres ou des campagnes cadeau.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/don"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
              >
                Envoyer une carte-cadeau
              </Link>
              <Link
                href="/books"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-white px-5 text-sm font-semibold text-[#26221d] transition hover:border-[#d5c8bb]"
              >
                Revenir a la boutique
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[28px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171717] text-white">
                <BookOpen className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">Collections editoriales</h3>
                <p className="text-sm leading-7 text-[#6f665e]">
                  Creez des sous-univers comme Kobo le fait avec ses vitrines thematiques et ses selections de marque.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-[28px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171717] text-white">
                <Headphones className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">Formats immersifs</h3>
                <p className="text-sm leading-7 text-[#6f665e]">
                  La structure accepte aussi demain des livres audio, des exclusivites et des collections partenaires.
                </p>
              </div>
            </div>
          </article>
          <article className="rounded-[28px] border border-[#ece3d7] bg-white/94 p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171717] text-white">
                <PenSquare className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#171717]">Publiez votre roman</h3>
                <p className="text-sm leading-7 text-[#6f665e]">
                  Le storefront public et le studio auteur parlent maintenant le meme langage produit.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <RailSection
        title="Auteurs africains et voix a suivre"
        description="Un rayon distinct pour les catalogues a forte identite et les selections de voix francophones et africaines."
        books={categoryAfricanAuthors}
        href="/books?category=Auteurs%20africains"
        hrefLabel="Voir la selection"
      />

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
                answer: "Oui. Comptes, profils, bibliotheques, commandes et catalogues restent relies a votre schema actuel.",
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
              <MonitorPlay className="h-3.5 w-3.5" />
              Contact & accompagnement
            </span>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
              Besoin d aide pour configurer le storefront, lire ou publier ?
            </h2>
            <p className="text-sm leading-7 text-white/72">
              Orientez les lecteurs vers la boutique et les auteurs vers le studio, avec un point de contact visible comme sur les grandes plateformes.
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
