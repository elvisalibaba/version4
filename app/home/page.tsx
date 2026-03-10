import { AboutSection } from "@/components/home/about-section";
import { AuthorCatalogSection } from "@/components/home/author-catalog-section";
import { BlogSection } from "@/components/home/blog-section";
import { ContactSection } from "@/components/home/contact-section";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturedAuthorsSection } from "@/components/home/featured-authors-section";
import { HeroSection } from "@/components/home/hero-section";
import { LibraryExtractsSection } from "@/components/home/library-extracts-section";
import { getPublishedBooks } from "@/lib/books";

export default async function HomePage() {
  const books = await getPublishedBooks();

  return (
    <>
      <HeroSection books={books} />
      <AboutSection />
      <LibraryExtractsSection books={books} />
      <FeaturedAuthorsSection books={books} />
      <AuthorCatalogSection books={books} />
      <BlogSection />
      <ContactSection />
      <CtaSection />
    </>
  );
}
