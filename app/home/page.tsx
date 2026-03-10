import { AboutSection } from "@/components/home/about-section";
import { BlogSection } from "@/components/home/blog-section";
import { ContactSection } from "@/components/home/contact-section";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturedAuthorsSection } from "@/components/home/featured-authors-section";
import { HeroSection } from "@/components/home/hero-section";
import { LibraryExtractsSection } from "@/components/home/library-extracts-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <LibraryExtractsSection />
      <FeaturedAuthorsSection />
      <BlogSection />
      <ContactSection />
      <CtaSection />
    </>
  );
}
