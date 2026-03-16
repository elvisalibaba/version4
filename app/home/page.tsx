import { AuthorCatalogSection } from "@/components/home/author-catalog-section";
import { BookShelfSection } from "@/components/home/book-shelf-section";
import { ContactSection } from "@/components/home/contact-section";
import { DiscoveryFilterSection } from "@/components/home/discovery-filter-section";
import { FeaturedBooksGridSection } from "@/components/home/featured-books-grid-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { HeroSection } from "@/components/home/hero-section";
import { MarketPositionSection } from "@/components/home/market-position-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Reveal } from "@/components/home/reveal";
import { TrustBar } from "@/components/home/trust-bar";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";

type HomeBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

function comparePopularBooks(a: HomeBook, b: HomeBook) {
  return (
    (b.purchases_count ?? 0) - (a.purchases_count ?? 0) ||
    (b.views_count ?? 0) - (a.views_count ?? 0) ||
    (b.rating_avg ?? 0) - (a.rating_avg ?? 0) ||
    (b.published_at ?? "").localeCompare(a.published_at ?? "")
  );
}

export default async function HomePage() {
  const [books, comingSoonBooks] = await Promise.all([getPublishedBooks(), getComingSoonBooks()]);
  const paidBooks = books.filter((book) => !book.is_free);
  const freeBooks = books.filter((book) => book.is_free);
  const popularRanked = [...books].sort(comparePopularBooks);
  const popularSelection = [
    ...popularRanked.slice(0, 4),
    ...[...freeBooks].sort(comparePopularBooks).slice(0, 2),
  ].filter((book, index, array) => array.findIndex((entry) => entry.id === book.id) === index);
  const popularFallback = (popularSelection.length > 0 ? popularSelection : books.slice(0, 6)).slice(0, 6);
  const newReleases = paidBooks.slice(0, 5);
  const newReleasesFallback = newReleases.length > 0 ? newReleases : books.slice(0, 5);
  const comingSoon = comingSoonBooks.slice(0, 5);
  const flashSale = await getFlashSaleState(books);

  return (
    <div className="hb-fullbleed">
      <div className="home-mesh">
        <Reveal>
          <HeroSection books={books} comingSoonBooks={comingSoonBooks} />
        </Reveal>
        <Reveal delay={80}>
          <TrustBar />
        </Reveal>
        <Reveal delay={110}>
          <DiscoveryFilterSection books={books} />
        </Reveal>
        <Reveal delay={140}>
          <FeaturedBooksGridSection
            id="popular-books"
            title="Popular Book"
            books={popularFallback}
          />
        </Reveal>
        <Reveal delay={180}>
          <BookShelfSection
            title="Nouveautes a ouvrir cette semaine"
            subtitle="Des titres recents mis en scene comme de vraies nouveautes de librairie pour creer un premier achat plus facilement."
            books={newReleasesFallback}
            size="compact"
          />
        </Reveal>
        {comingSoon.length > 0 ? (
          <Reveal delay={220}>
            <BookShelfSection
              title="Bientot disponibles"
              subtitle="Des sorties deja pretes a relancer l envie de lire, d acheter et de revenir sur la plateforme."
              books={comingSoon}
              variant="comingSoon"
            />
          </Reveal>
        ) : null}
        <Reveal delay={240}>
          <AuthorCatalogSection books={books} />
        </Reveal>
        <Reveal delay={260}>
          <FlashSaleSection books={flashSale.dealBooks} discountPercentage={flashSale.config.discountPercentage} />
        </Reveal>
        <Reveal delay={280}>
          <NewsletterSection />
        </Reveal>
        <Reveal delay={300}>
          <ContactSection />
        </Reveal>
        <Reveal delay={320}>
          <MarketPositionSection />
        </Reveal>
      </div>
    </div>
  );
}
