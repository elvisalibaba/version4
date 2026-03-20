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
    ? "APK Android déjà disponible pour retrouver vos livres en lecture mobile."
    : "Application mobile en approche pour poursuivre la lecture partout.";

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column: text and CTAs */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#ff9900]">
              HolistiqueBooks – Bibliothèque de transformation
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Lisez des ebooks qui élèvent l'esprit, dans une vitrine claire qui donne envie d'aller plus loin.
            </h1>
            <p className="text-lg text-gray-600">
              Commencez par {freeBooksCount} livres gratuits, puis évoluez vers une sélection premium pensée pour la croissance personnelle et spirituelle.
            </p>
            <p className="text-base text-gray-600">
              {featuredBook
                ? `À la une : ${featuredBook.title}${featuredBook.author_name ? ` par ${featuredBook.author_name}` : ""}.`
                : "Une librairie pensée pour lire profondément, progresser et revenir avec constance."}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/books"
                className="inline-flex items-center rounded-md bg-[#ff9900] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#e68900] focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                Explorer le catalogue
              </Link>
              <Link
                href="/books?access=free"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:ring-offset-2"
              >
                Voir les gratuits
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              {heroNote}
              {nextRelease?.title ? ` Prochaine sortie : ${nextRelease.title}.` : ""}
            </p>
          </div>

          {/* Right column: visual with overlapping books */}
          <div className="relative flex justify-center">
            <div className="relative h-80 w-full max-w-md sm:h-96 md:h-[28rem] lg:h-[32rem]">
              {/* Main background image */}
              <div className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden">
                <Image
                  src="/images/ce2.jpg"
                  alt="Visuel principal Holistique Books"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              {/* Overlay book 1 (back) */}
              <div className="absolute -bottom-6 -left-6 h-40 w-28 rounded-lg shadow-lg overflow-hidden sm:h-48 sm:w-32 md:h-56 md:w-40">
                <Image
                  src="/images/ce1.jpg"
                  alt="Livre inspiré Holistique Books"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              {/* Overlay book 2 (front) */}
              <div className="absolute -right-6 -top-6 h-40 w-28 rounded-lg shadow-lg overflow-hidden sm:h-48 sm:w-32 md:h-56 md:w-40">
                <Image
                  src="/images/ce3.jpg"
                  alt="Sélection de lecture Holistique Books"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}