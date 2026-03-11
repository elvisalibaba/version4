import { AboutSection } from "@/components/home/about-section";
import { AuthorCatalogSection } from "@/components/home/author-catalog-section";
import { BlogSection } from "@/components/home/blog-section";
import { ContactSection } from "@/components/home/contact-section";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturedAuthorsSection } from "@/components/home/featured-authors-section";
import { HeroSection } from "@/components/home/hero-section";
import { LibraryExtractsSection } from "@/components/home/library-extracts-section";
import { LiveActivityToast } from "@/components/home/live-activity-toast";
import { Reveal } from "@/components/home/reveal";
import { SocialProofSection } from "@/components/home/social-proof-section";
import { TrendingSection } from "@/components/home/trending-section";
import { TrustBar } from "@/components/home/trust-bar";
import { TrustIndicators } from "@/components/home/trust-indicators";
import { getPublishedBooks } from "@/lib/books";

export default async function HomePage() {
  const books = await getPublishedBooks();

  return (
    <div className="home-mesh">
      <TrustBar />
      <Reveal>
        <HeroSection books={books} />
      </Reveal>
      <Reveal delay={120}>
        <TrustIndicators />
      </Reveal>
      <Reveal delay={180}>
        <TrendingSection books={books} />
      </Reveal>
      <Reveal delay={200}>
        <LibraryExtractsSection books={books} />
      </Reveal>
      <Reveal delay={220}>
        <AboutSection />
      </Reveal>
      <Reveal delay={240}>
        <FeaturedAuthorsSection books={books} />
      </Reveal>
      <Reveal delay={260}>
        <AuthorCatalogSection books={books} />
      </Reveal>
      <Reveal delay={280}>
        <SocialProofSection />
      </Reveal>
      <Reveal delay={300}>
        <BlogSection />
      </Reveal>
      <Reveal delay={320}>
        <ContactSection />
      </Reveal>
      <Reveal delay={340}>
        <CtaSection />
      </Reveal>
      <LiveActivityToast />
    </div>
  );
}
