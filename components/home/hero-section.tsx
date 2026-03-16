import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Gift, ShieldCheck, Smartphone } from "lucide-react";
import type { PublishedBook } from "@/lib/books";
import { MobileLaunchCountdown } from "@/components/home/mobile-launch-countdown";

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
  const mobileLaunchAt = process.env.NEXT_PUBLIC_MOBILE_LAUNCH_AT?.trim() || "2026-03-17T04:31:30+01:00";
  const mobileLaunchLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(mobileLaunchAt));

  const heroGallery = [
    {
      src: "/images/ce1.jpg",
      alt: "Lectrice avec un livre ouvert dans un decor lumineux.",
      label: "Clarte",
      className: "is-left",
    },
    {
      src: "/images/ce2.jpg",
      alt: "Moment de lecture inspire pour avancer avec intention.",
      label: "Elevation",
      className: "is-center",
    },
    {
      src: "/images/ce3.jpg",
      alt: "Experience de lecture apaisante et accessible partout.",
      label: "Action",
      className: "is-right",
    },
  ] as const;

  const proofItems = [
    {
      value: `${freeBooksCount}+`,
      label: "livres gratuits pour commencer sans hesiter",
    },
    {
      value: `${books.length}+`,
      label: "titres classes pour avancer sans vous perdre",
    },
    {
      value: nextRelease ? formatReleaseLabel(nextRelease.publication_date) : "Bientot",
      label: "prochaine sortie mise en avant des son ouverture",
    },
  ];

  const serviceItems = [
    {
      icon: Gift,
      title: "Premiers pas gratuits",
      text: "Entrez par les livres les plus faciles a commencer, sans payer le premier declic.",
    },
    {
      icon: BookOpen,
      title: "Classement plus clair",
      text: "Chaque selection guide du plus accessible aux lectures de fond, sans mur de couvertures.",
    },
    {
      icon: Smartphone,
      title: androidApkUrl ? "APK Android disponible" : "Application dans 19h",
      text: androidApkUrl
        ? "Installation directe pour lire, reprendre et avancer depuis Android."
        : `Ouverture mobile prevue le ${mobileLaunchLabel}.`,
    },
    {
      icon: ShieldCheck,
      title: "Experience sans friction",
      text: "Retrouvez vite la bonne lecture et poursuivez votre progression au bon rythme.",
    },
  ];

  const featuredSummary =
    featuredBook?.subtitle ??
    featuredBook?.description ??
    "Une lecture choisie pour donner une premiere victoire concrete puis ouvrir la porte aux titres les plus transformateurs.";

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-bookstore-hero">
          <div className="hb-bookstore-main">
            <div className="hb-bookstore-copy">
              <span className="hb-bookstore-kicker">Bibliotheque de transformation</span>
              <div className="space-y-4">
                <p className="hb-bookstore-label">Premiers pas gratuits</p>
                <h1 className="hb-bookstore-title">Commencez par un livre offert. Continuez avec les titres qui vous font vraiment avancer.</h1>
                <p className="hb-bookstore-text">
                  Pas un catalogue froid ou charge. Ici, chaque lecture est placee pour vous faire entrer vite, obtenir un premier resultat
                  et garder l elan jusqu aux lectures les plus profondes.
                </p>
                <p className="hb-bookstore-text">
                  Vous savez quoi ouvrir aujourd hui, quoi terminer cette semaine et quoi choisir ensuite pour installer une vraie progression.
                </p>
              </div>

              <div className="hb-bookstore-actions">
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
                    Voir le lancement mobile
                  </Link>
                )}
              </div>

              <div className="hb-bookstore-proof">
                {proofItems.map((item) => (
                  <div key={item.label} className="hb-bookstore-proof-item">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="hb-bookstore-focus">
                <p className="hb-bookstore-focus-kicker">A commencer cette semaine</p>
                <h2 className="hb-bookstore-focus-title">{featuredBook?.title ?? "Votre prochaine lecture phare"}</h2>
                <p className="line-clamp-3 text-sm leading-7 text-stone-600">{featuredSummary}</p>
                <div className="hb-bookstore-meta">
                  <span>{featuredBook?.categories?.[0] ?? "Selection editoriale"}</span>
                  <span>{featuredBook?.display_price_label ?? "Disponible maintenant"}</span>
                  <span>{featuredBook?.author_name ?? "HolistiqueBooks"}</span>
                </div>
                <Link href={featuredBook ? `/book/${featuredBook.id}` : "/books"} className="hb-bookstore-inline-link">
                  Voir la lecture recommandee
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div id="mobile-app" className="hb-mobile-launch-card hb-mobile-launch-card--hero">
                <div className="hb-mobile-launch-copy">
                  <span className="hb-mobile-launch-icon">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="hb-mobile-launch-title">{androidApkUrl ? "APK Android deja disponible" : "Application mobile dans 19h"}</p>
                    <p className="text-sm leading-7 text-stone-600">
                      {androidApkUrl
                        ? "Offrez une lecture immediate sur Android, avec installation rapide et acces direct a vos livres."
                        : "Le lancement mobile est cale. Dans quelques heures, l experience Android sera prete pour lire, reprendre et avancer partout."}
                    </p>
                  </div>
                </div>

                {androidApkUrl ? (
                  <a href={androidApkUrl} className="cta-secondary px-5 py-3 text-sm" target="_blank" rel="noreferrer">
                    Telecharger l APK
                  </a>
                ) : (
                  <div className="hb-mobile-launch-meta">
                    <p className="hb-mobile-launch-date">Lancement prevu le {mobileLaunchLabel}</p>
                    <MobileLaunchCountdown targetAt={mobileLaunchAt} />
                  </div>
                )}
              </div>
            </div>

            <div className="hb-bookstore-stage-shell">
              <div className="hb-bookstore-stage-panel">
                <div className="hb-bookstore-stage-head">
                  <span className="hb-featured-chip">Vitrine editoriale</span>
                  {nextRelease ? <span className="hb-featured-chip is-soft">Sortie {formatReleaseLabel(nextRelease.publication_date)}</span> : null}
                </div>

                <div className="hb-bookstore-stage">
                  <div className="hb-bookstore-stage-badges">
                    <div className="hb-stage-badge is-free">
                      <strong>{freeBooksCount}+ gratuits</strong>
                      <span>Le bon point d entree pour commencer sans attendre.</span>
                    </div>
                    {nextRelease ? (
                      <div className="hb-stage-badge is-release">
                        <strong>Bientot disponible</strong>
                        <span>{nextRelease.title}</span>
                      </div>
                    ) : null}
                  </div>

                  {heroGallery.map((image) => (
                    <figure key={image.src} className={`hb-bookstore-book ${image.className}`.trim()}>
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={360}
                        height={520}
                        sizes="(max-width: 640px) 35vw, (max-width: 1100px) 28vw, 220px"
                        priority={image.className === "is-center"}
                      />
                      <figcaption>{image.label}</figcaption>
                    </figure>
                  ))}
                </div>

                <div className="hb-bookstore-stage-footer">
                  <div className="hb-bookstore-stage-footer-copy">
                    <p className="hb-bookstore-stage-footer-kicker">Lecture recommandee</p>
                    <h2 className="hb-bookstore-stage-footer-title">{featuredBook?.title ?? "Selection HolistiqueBooks"}</h2>
                    <p className="text-sm leading-7 text-stone-600">
                      {featuredBook?.categories?.[0] ?? "Selection editoriale"} {featuredBook?.display_price_label ? `- ${featuredBook.display_price_label}` : ""}
                    </p>
                  </div>
                  <Link href={featuredBook ? `/book/${featuredBook.id}` : "/books"} className="hb-bookstore-stage-link">
                    Explorer ce livre
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="hb-bookstore-services">
            {serviceItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="hb-bookstore-service">
                <div className="hb-bookstore-service-top">
                  <span className="hb-bookstore-service-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="hb-bookstore-service-title">{title}</p>
                </div>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
