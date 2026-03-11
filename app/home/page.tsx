import { BookShelfSection } from "@/components/home/book-shelf-section";
import { ContactSection } from "@/components/home/contact-section";
import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { Reveal } from "@/components/home/reveal";
import { ServicesSection } from "@/components/home/services-section";
import { getPublishedBooks } from "@/lib/books";

export default async function HomePage() {
  const books = await getPublishedBooks();
  const newest = books.slice(0, 12);
  const topSales = books.slice(4, 16);
  const picks = books.slice(12, 24);
  const freeBooks = books.filter((book) => book.price <= 0).slice(0, 12);

  return (
    <div className="home-mesh">
      <Reveal>
        <HeroSection books={books} />
      </Reveal>
      <Reveal delay={120}>
        <ServicesSection />
      </Reveal>
      <Reveal delay={180}>
        <BookShelfSection title="Nouveautes" subtitle="Les nouvelles sorties a lire maintenant." books={newest} />
      </Reveal>
      <Reveal delay={200}>
        <BookShelfSection title="Top ventes" subtitle="Les livres les plus demandes par nos lecteurs." books={topSales} />
      </Reveal>
      <Reveal delay={220}>
        <BookShelfSection
          title="Livres gratuits"
          subtitle="Telechargez et lisez gratuitement une selection d ouvrages."
          books={freeBooks.length > 0 ? freeBooks : picks}
        />
      </Reveal>
      <Reveal delay={240}>
        <BookShelfSection title="Coups de coeur" subtitle="Nos recommandations editoriales du moment." books={picks} />
      </Reveal>
      <Reveal delay={260}>
        <ContactSection />
      </Reveal>
      <Reveal delay={280}>
        <CtaSection />
      </Reveal>
    </div>
  );
}
