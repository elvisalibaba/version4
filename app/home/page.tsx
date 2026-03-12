import { BookShelfSection } from "@/components/home/book-shelf-section";
import { BlogSection } from "@/components/home/blog-section";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { FreeBooksMarqueeSection } from "@/components/home/free-books-marquee-section";
import { HeroSection } from "@/components/home/hero-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { QuoteBandSection } from "@/components/home/quote-band-section";
import { Reveal } from "@/components/home/reveal";
import { FeaturedAuthorsSection } from "@/components/home/featured-authors-section";
import { getPublishedBooks } from "@/lib/books";

export default async function HomePage() {
  const books = await getPublishedBooks();
  const newReleases = books.slice(0, 5);
  const bestSellers = books.slice(5, 10);
  const bestSellersFallback = bestSellers.length > 0 ? bestSellers : books.slice(0, 5);
  const comingSoon = books.slice(10, 15);
  const comingSoonFallback = comingSoon.length > 0 ? comingSoon : books.slice(0, 5);

  return (
    <div className="hb-fullbleed">
      <div className="home-mesh">
        <Reveal>
          <HeroSection books={books} />
        </Reveal>
        <Reveal delay={120}>
          <BookShelfSection title="Nouveautes" subtitle="Nouveaux livres sortis ce mois-ci." books={newReleases} />
        </Reveal>
        <Reveal delay={160}>
          <QuoteBandSection />
        </Reveal>
        <Reveal delay={200}>
          <BookShelfSection title="Bestsellers" subtitle="Les titres qui dominent nos ventes." books={bestSellersFallback} />
        </Reveal>
        <Reveal delay={210}>
          <FreeBooksMarqueeSection books={books} />
        </Reveal>
        <Reveal delay={220}>
          <BookShelfSection title="Bientot disponible" subtitle="A paraitre prochainement." books={comingSoonFallback} />
        </Reveal>
        <Reveal delay={230}>
          <FlashSaleSection books={books} />
        </Reveal>
        <Reveal delay={260}>
          <FeaturedAuthorsSection books={books} />
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
