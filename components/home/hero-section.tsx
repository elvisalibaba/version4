import Image from "next/image";
import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
  comingSoonBooks?: PublishedBook[];
};

export function HeroSection({ books, comingSoonBooks = [] }: HeroSectionProps) {
  const freeBooksCount = books.filter((book) => book.is_free).length;
  const featuredBook = books.find((book) => !book.is_free) ?? books[0] ?? null;
  const nextRelease = comingSoonBooks[0] ?? null;
  const androidApkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() || null;
  const heroNote = androidApkUrl
    ? "APK Android deja disponible pour retrouver vos livres en lecture mobile."
    : "Application mobile en approche pour poursuivre la lecture partout.";

  return (
    <section className="hb-section hb-template-hero-section">
      <div className="hb-section-shell">
        <div className="hb-template-hero-banner">
          <div className="hb-template-hero-copy">
            <p className="hb-template-hero-kicker">HolistiqueBooks - Bibliotheque de transformation</p>
            <h1 className="hb-template-hero-title">Lisez des ebooks qui elevent l esprit, dans une vitrine claire qui donne envie d aller plus loin.</h1>
            <p className="hb-template-hero-text">
              Commencez par {freeBooksCount} livres gratuits, puis evoluez vers une selection premium pensee pour la croissance personnelle et spirituelle.
            </p>
            <p className="hb-template-hero-text">
              {featuredBook
                ? `A la une: ${featuredBook.title}${featuredBook.author_name ? ` par ${featuredBook.author_name}` : ""}.`
                : "Une librairie pensee pour lire profondement, progresser et revenir avec constance."}
            </p>
            <div className="hb-template-hero-actions">
              <Link href="/books" className="hb-template-hero-button">
                Explorer le catalogue
              </Link>
              <Link href="/books?access=free" className="hb-template-hero-link">
                Voir les gratuits
              </Link>
            </div>
            <p className="hb-template-hero-note">
              {heroNote}
              {nextRelease?.title ? ` Prochaine sortie: ${nextRelease.title}.` : ""}
            </p>
          </div>

          <div className="hb-template-hero-visual">
            <div className="hb-template-hero-scene">
              <div className="hb-template-hero-photo">
                <Image
                  src="/images/ce2.jpg"
                  alt="Visuel principal Holistique Books"
                  fill
                  sizes="(max-width: 960px) 100vw, 48vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="hb-template-hero-book is-back">
                <Image src="/images/ce1.jpg" alt="Livre inspire Holistique Books" fill sizes="180px" className="object-cover" />
              </div>
              <div className="hb-template-hero-book is-front">
                <Image src="/images/ce3.jpg" alt="Selection de lecture Holistique Books" fill sizes="180px" className="object-cover" />
              </div>
            </div>
          </div>

          <div className="hb-template-hero-dots" aria-hidden="true">
            <span className="is-active" />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
