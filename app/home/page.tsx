import { BookShelfSection } from "@/components/home/book-shelf-section";
import { BlogSection } from "@/components/home/blog-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { FreeBooksMarqueeSection } from "@/components/home/free-books-marquee-section";
import { HeroSection } from "@/components/home/hero-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { QuoteBandSection } from "@/components/home/quote-band-section";
import { Reveal } from "@/components/home/reveal";
import { FeaturedAuthorsSection } from "@/components/home/featured-authors-section";
import { TrustBar } from "@/components/home/trust-bar";
import { getComingSoonBooks, getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";

export default async function HomePage() {
  const [books, comingSoonBooks] = await Promise.all([getPublishedBooks(), getComingSoonBooks()]);
  const newReleases = books.filter((book) => !book.is_free).slice(0, 5);
  const newReleasesFallback = newReleases.length > 0 ? newReleases : books.slice(0, 5);
  const deepDiveBooks = [...books]
    .filter((book) => !book.is_free)
    .sort((a, b) => (b.page_count ?? 0) - (a.page_count ?? 0) || (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, 5);
  const deepDiveFallback = deepDiveBooks.length > 0 ? deepDiveBooks : books.slice(0, 5);
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
        <Reveal delay={120}>
          <FreeBooksMarqueeSection books={books} />
        </Reveal>
        <Reveal delay={160}>
          <BookShelfSection
            title="Nouveautes a ouvrir cette semaine"
            subtitle="Des titres recents, utiles et faciles a recommander pour creer un premier declic rapidement."
            books={newReleasesFallback}
            size="compact"
          />
        </Reveal>
        <Reveal delay={200}>
          <BookShelfSection
            title="Pour aller plus loin"
            subtitle="Des livres plus complets pour les lecteurs deja convaincus, prets a approfondir un sujet en profondeur."
            books={deepDiveFallback}
            size="compact"
          />
        </Reveal>
        {comingSoon.length > 0 ? (
          <Reveal delay={220}>
            <BookShelfSection
              title="Bientot disponibles"
              subtitle="Des sorties deja prêtes a relancer l envie de lire, d acheter et de revenir sur la plateforme."
              books={comingSoon}
              variant="comingSoon"
            />
          </Reveal>
        ) : null}
        <Reveal delay={230}>
          <FlashSaleSection books={flashSale.dealBooks} discountPercentage={flashSale.config.discountPercentage} />
        </Reveal>
        <Reveal delay={260}>
          <FeaturedAuthorsSection books={books} />
        </Reveal>
        <Reveal delay={270}>
          <QuoteBandSection />
        </Reveal>
        <Reveal delay={280}>
          <BlogSection />
        </Reveal>
        <Reveal delay={300}>
          <NewsletterSection />
        </Reveal>
      </div>
    </div>
  );
}
