import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Gift, Smartphone } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type HeroSectionProps = {
  books: PublishedBook[];
  comingSoonBooks?: PublishedBook[];
};

function formatReleaseLabel(publicationDate?: string | null) {
  if (!publicationDate) return "Annonce bientot";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${publicationDate}T12:00:00Z`));
}

export function HeroSection({ books, comingSoonBooks = [] }: HeroSectionProps) {
  const freeBooksCount = books.filter((book) => book.is_free).length;
  const featuredBook = books.find((book) => !book.is_free) ?? books[0] ?? null;
  const nextRelease = comingSoonBooks[0] ?? null;
  const androidApkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() || null;
  const heroGallery = [
    {
      src: "/images/ce1.jpg",
      alt: "Lectrice avec un livre ouvert dans un decor lumineux.",
      label: "Clarte immediate",
      className: "is-primary",
    },
    {
      src: "/images/ce2.jpg",
      alt: "Moment de lecture inspire pour avancer avec intention.",
      label: "Lecture qui eleve",
      className: "is-secondary",
    },
    {
      src: "/images/ce3.jpg",
      alt: "Experience de lecture apaisante et accessible partout.",
      label: "Rythme plus serein",
      className: "is-tertiary",
    },
  ] as const;
  const stats = [
    {
      icon: Gift,
      value: `${freeBooksCount}+`,
      label: "premiers pas gratuits",
    },
    {
      icon: BookOpen,
      value: `${books.length}+`,
      label: "livres disponibles maintenant",
    },
    {
      icon: Smartphone,
      value: comingSoonBooks.length > 0 ? `${comingSoonBooks.length}` : "0",
      label: "sorties bientot disponibles",
    },
  ];

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-marketing-hero">
          <div className="hb-marketing-copy">
            <span className="hb-marketing-kicker">Bibliotheque de transformation</span>
            <div className="space-y-5">
              <h1 className="hb-marketing-title">Prenez un premier livre gratuit. Gagnez une clarte qui change vraiment votre saison.</h1>
              <p className="hb-marketing-text">
                Ici, le lecteur ne se perd pas dans un grand catalogue. Il trouve vite un livre utile, facile a commencer,
                simple a terminer et assez fort pour donner envie d aller plus loin.
              </p>
              <p className="hb-marketing-text">
                Nous organisons l experience pour convertir des curieux en lecteurs engages: d abord un premier resultat,
                ensuite des lectures de fond, puis l acces mobile pour lire partout sans friction.
              </p>
            </div>

            <div className="hb-marketing-actions">
              <Link href="/books" className="cta-primary px-5 py-3 text-sm">
                Choisir mon premier livre
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#premiers-pas-gratuits" className="cta-secondary px-5 py-3 text-sm">
                Commencer gratuitement
              </Link>
              {androidApkUrl ? (
                <a href={androidApkUrl} className="cta-secondary px-5 py-3 text-sm" target="_blank" rel="noreferrer">
                  Telecharger l APK
                </a>
              ) : (
                <Link href="#mobile-app" className="cta-secondary px-5 py-3 text-sm">
                  APK Android
                </Link>
              )}
            </div>

            <div className="hb-marketing-stats">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="hb-marketing-stat">
                  <span className="hb-marketing-stat-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hb-marketing-side">
            <div className="hb-hero-visual-card">
              <div className="hb-hero-visual-copy">
                <span className="hb-featured-chip">Une bibliotheque qui attire des la premiere seconde</span>
                <div>
                  <p className="hb-mobile-launch-title">Un hero plus vivant, plus desirant, plus editorial.</p>
                  <p className="text-sm leading-7 text-slate-600">
                    Ces visuels installent une promesse simple: ici, on vient pour commencer facilement, respirer un peu
                    plus et repartir avec une lecture qui laisse une vraie trace.
                  </p>
                </div>
              </div>

              <div className="hb-hero-visual-grid">
                {heroGallery.map((image) => (
                  <figure key={image.src} className={`hb-hero-visual-frame ${image.className}`.trim()}>
                    <Image src={image.src} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" priority={image.className === "is-primary"} />
                    <figcaption>{image.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="hb-featured-book-card">
              <div className="hb-featured-book-head">
                <span className="hb-featured-chip">Livre a lire cette semaine</span>
                {nextRelease ? <span className="hb-featured-chip is-soft">Sortie {formatReleaseLabel(nextRelease.publication_date)}</span> : null}
              </div>

              <div className="hb-featured-book-body">
                <div className="hb-featured-book-cover">
                  {featuredBook?.cover_signed_url ? (
                    <img src={featuredBook.cover_signed_url} alt={featuredBook.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="hb-book-fallback">{featuredBook?.title ?? "Selection HolistiqueBooks"}</div>
                  )}
                </div>

                <div className="hb-featured-book-copy">
                  <p className="hb-featured-book-category">{featuredBook?.categories?.[0] ?? "Selection editoriale"}</p>
                  <h2 className="hb-featured-book-title">{featuredBook?.title ?? "Votre prochaine lecture"}</h2>
                  <p className="line-clamp-4 text-sm leading-7 text-slate-600">
                    {featuredBook?.subtitle ??
                      featuredBook?.description ??
                      "Une lecture choisie pour provoquer un premier declic concret et installer l envie de continuer des les premieres pages."}
                  </p>
                  <div className="hb-featured-book-meta">
                    <span>{featuredBook?.author_name ?? "Auteur HolistiqueBooks"}</span>
                    <span>{featuredBook?.display_price_label ?? "Disponible maintenant"}</span>
                  </div>
                  <Link href={featuredBook ? `/book/${featuredBook.id}` : "/books"} className="cta-primary px-5 py-3 text-sm">
                    Voir ce livre
                  </Link>
                </div>
              </div>

              {nextRelease ? (
                <div className="hb-upcoming-callout">
                  <p className="hb-upcoming-kicker">Bientot disponible</p>
                  <div>
                    <p className="font-semibold text-slate-950">{nextRelease.title}</p>
                    <p className="text-sm text-slate-500">Publication visee le {formatReleaseLabel(nextRelease.publication_date)}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div id="mobile-app" className="hb-mobile-launch-card">
              <div className="hb-mobile-launch-copy">
                <span className="hb-mobile-launch-icon">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="hb-mobile-launch-title">APK Android deja disponible</p>
                  <p className="text-sm leading-7 text-slate-600">
                    Offrez une lecture immediate sur Android: installation rapide, acces direct aux livres et experience
                    plus pratique pour lire, reprendre et avancer partout.
                  </p>
                </div>
              </div>

              {androidApkUrl ? (
                <a href={androidApkUrl} className="cta-secondary px-5 py-3 text-sm" target="_blank" rel="noreferrer">
                  Telecharger l APK
                </a>
              ) : (
                <span className="hb-mobile-helper">Ajoutez `NEXT_PUBLIC_ANDROID_APK_URL` pour brancher le telechargement direct.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
