import { AuthorTrustSection } from "@/components/home/author-trust-section";
import { ContactSection } from "@/components/home/contact-section";
import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { PacksSection } from "@/components/home/packs-section";
import { PartnersSection } from "@/components/home/partners-section";
import { Reveal } from "@/components/home/reveal";
import { ServicesSection } from "@/components/home/services-section";
import { WhyChooseSection } from "@/components/home/why-choose-section";
import { getPublishedBooks } from "@/lib/books";

export default async function HomePage() {
  const books = await getPublishedBooks();

  return (
    <div className="home-mesh">
      <Reveal>
        <HeroSection books={books} />
      </Reveal>
      <Reveal delay={120}>
        <WhyChooseSection />
      </Reveal>
      <Reveal delay={180}>
        <AuthorTrustSection books={books} />
      </Reveal>
      <Reveal delay={200}>
        <ServicesSection />
      </Reveal>
      <Reveal delay={220}>
        <PacksSection />
      </Reveal>
      <Reveal delay={240}>
        <PartnersSection />
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
