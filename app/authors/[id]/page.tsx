import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Globe,
  MapPin,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { getPublicAuthorById } from "@/lib/authors";

type AuthorProfilePageProps = {
  params: Promise<{ id: string }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getSafeWebsiteUrl(value: string | null) {
  const cleanValue = value?.trim();
  if (!cleanValue) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(cleanValue) ? cleanValue : `https://${cleanValue}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function AuthorProfilePage({ params }: AuthorProfilePageProps) {
  const { id } = await params;
  const author = await getPublicAuthorById(id);

  if (!author) {
    notFound();
  }

  const latestBook = author.latest_book;
  const websiteUrl = getSafeWebsiteUrl(author.website);
  const genres = Array.from(new Set([author.top_category, ...(author.genres ?? [])].filter(Boolean))).slice(0, 8);
  const biography =
    author.bio?.trim() ||
    "Cette signature Holistique Books construit actuellement sa présentation éditoriale.";
  const publishingGoals = author.publishing_goals?.trim();
  const latestBookPrice = latestBook
    ? latestBook.display_price_label ??
      (latestBook.price <= 0 ? "Gratuit" : `${latestBook.price.toFixed(2)} ${latestBook.currency_code ?? "USD"}`)
    : null;

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <section className="relative overflow-hidden bg-[#171717] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,92,0.23),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-12">
          <Link
            href="/authors"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl text-xs font-bold text-white/65 transition hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Tous les auteurs
          </Link>

          <div className="mt-4 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
            <div className="flex items-start gap-4 lg:block">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] bg-white/10 text-2xl font-bold text-white ring-1 ring-white/15 sm:h-32 sm:w-32 lg:h-[180px] lg:w-[180px] lg:rounded-[2rem]">
                {author.avatar_signed_url ? (
                  <Image
                    src={author.avatar_signed_url}
                    alt={author.display_name}
                    width={180}
                    height={180}
                    priority
                    sizes="(max-width: 639px) 96px, (max-width: 1023px) 128px, 180px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(author.display_name)
                )}
              </div>

              <div className="min-w-0 pt-1 lg:hidden">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#ff9b84]">Profil auteur</p>
                <h1 className="mt-1 text-[1.7rem] font-bold leading-[1.08] tracking-[-0.04em]">{author.display_name}</h1>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/68">
                  {author.professional_headline ?? author.top_category}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="hidden lg:block">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#ff9b84]">Profil auteur</p>
                <h1 className="mt-2 text-5xl font-bold leading-[1.05] tracking-[-0.05em]">{author.display_name}</h1>
                <p className="mt-3 text-lg text-white/72">{author.professional_headline ?? author.top_category}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-white/62 lg:mt-5">
                {author.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-[#ff9b84]" />
                    {author.location}
                  </span>
                ) : null}
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff7a5c]"
                  >
                    <Globe aria-hidden="true" className="h-4 w-4 text-[#ff9b84]" />
                    Site de l’auteur
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>

              <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7 lg:line-clamp-2">
                {biography}
              </p>
            </div>

            <Link
              href={`/books?author=${encodeURIComponent(author.display_name)}`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ff7a5c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e96b4e] lg:w-auto"
            >
              Voir ses livres
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section aria-label="Chiffres du profil" className="grid grid-cols-3 divide-x divide-[#e5d9ce] overflow-hidden rounded-2xl border border-[#eadfd4] bg-white shadow-sm">
          <div className="px-2 py-4 text-center sm:px-5 sm:py-5">
            <BookOpen aria-hidden="true" className="mx-auto h-4 w-4 text-[#c85439]" />
            <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717] sm:text-2xl">{author.books_count}</p>
            <p className="mt-0.5 text-[0.62rem] font-semibold text-[#81766d] sm:text-xs">Livres</p>
          </div>
          <div className="px-2 py-4 text-center sm:px-5 sm:py-5">
            <TrendingUp aria-hidden="true" className="mx-auto h-4 w-4 text-[#c85439]" />
            <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717] sm:text-2xl">{formatCount(author.total_views)}</p>
            <p className="mt-0.5 text-[0.62rem] font-semibold text-[#81766d] sm:text-xs">Découvertes</p>
          </div>
          <div className="px-2 py-4 text-center sm:px-5 sm:py-5">
            <Star aria-hidden="true" className="mx-auto h-4 w-4 fill-current text-[#ff7a5c]" />
            <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#171717] sm:text-2xl">
              {author.average_rating ?? "—"}
            </p>
            <p className="mt-0.5 text-[0.62rem] font-semibold text-[#81766d] sm:text-xs">Note moyenne</p>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:mt-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-8">
          <div className="space-y-5">
            <section className="rounded-[1.65rem] border border-[#eadfd4] bg-white p-5 shadow-sm sm:p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0eb] text-[#c85439]">
                <Quote aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#c85439]">À propos</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#171717]">L’univers de {author.display_name}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#625a53]">{biography}</p>

              {publishingGoals && publishingGoals !== biography ? (
                <div className="mt-5 border-t border-[#eee5dc] pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f5544]">Démarche éditoriale</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#625a53]">{publishingGoals}</p>
                </div>
              ) : null}

              {genres.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <span key={genre} className="rounded-full bg-[#f8f5f0] px-3 py-2 text-xs font-bold text-[#665e57]">
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <div className="rounded-[1.65rem] border border-[#2c2824] bg-[#171717] p-5 text-white sm:p-6">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-[#ff9b84]" />
              <p className="mt-4 text-lg font-bold">Découvrir toutes les signatures</p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Continuez l’exploration avec les autres univers éditoriaux de la maison.
              </p>
              <Link href="/authors" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#ff9b84]">
                Voir tous les auteurs
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {latestBook ? (
            <section className="overflow-hidden rounded-[1.65rem] border border-[#eadfd4] bg-white shadow-sm">
              <div className="border-b border-[#eee5dc] px-5 py-4 sm:px-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#c85439]">À ouvrir en premier</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#171717]">Le dernier titre publié</h2>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:p-6">
                <Link
                  href={`/book/${latestBook.id}`}
                  className="mx-auto block w-32 overflow-hidden rounded-2xl bg-[#eee7df] shadow-[0_18px_35px_rgba(23,23,23,0.14)] sm:mx-0 sm:w-[150px]"
                  aria-label={`Voir ${latestBook.title}`}
                >
                  <div className="aspect-[0.72]">
                    {latestBook.cover_signed_url ? (
                      <Image
                        src={latestBook.cover_signed_url}
                        alt={`Couverture de ${latestBook.title}`}
                        width={300}
                        height={420}
                        sizes="(max-width: 639px) 128px, 150px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-3 text-center text-xs font-bold text-[#756b62]">
                        {latestBook.title}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex min-w-0 flex-col">
                  <span className="w-fit rounded-full bg-[#fff0eb] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#a94731]">
                    {latestBook.is_free ? "Lecture gratuite" : latestBook.offer_summary_label ?? "Nouvelle publication"}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.035em] text-[#171717]">{latestBook.title}</h3>
                  {latestBook.subtitle ? <p className="mt-2 text-sm font-semibold text-[#756b62]">{latestBook.subtitle}</p> : null}
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#625a53]">
                    {latestBook.description?.trim() || "Découvrez la plus récente publication de cet auteur."}
                  </p>

                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#eee5dc] pt-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold text-[#8a8178]">Accès</p>
                      <p className="mt-0.5 text-lg font-bold text-[#171717]">{latestBookPrice}</p>
                    </div>
                    <Link
                      href={latestBook.is_free ? `/book/${latestBook.id}?read=1` : `/book/${latestBook.id}`}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#ff7a5c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e96b4e]"
                    >
                      {latestBook.is_free ? "Lire maintenant" : "Voir le livre"}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="grid min-h-[300px] place-items-center rounded-[1.65rem] border border-[#eadfd4] bg-white p-8 text-center shadow-sm">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0eb] text-[#c85439]">
                  <BookOpen aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-bold text-[#171717]">Le prochain livre se prépare.</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f665e]">
                  Le profil est ouvert ; sa première publication apparaîtra ici dès sa mise en ligne.
                </p>
              </div>
            </section>
          )}
        </div>

        <section className="mt-8 lg:mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#c85439]">Catalogue complet</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.035em] text-[#171717] sm:text-3xl">
                Tous les livres de {author.display_name}
              </h2>
            </div>
            {author.books.length > 0 ? (
              <Link
                href={`/books?author=${encodeURIComponent(author.display_name)}`}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#c85439]"
              >
                Ouvrir dans la librairie
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {author.books.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {author.books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.65rem] border border-[#eadfd4] bg-white p-6 text-center shadow-sm sm:p-8">
              <p className="font-bold text-[#171717]">Aucun livre publié pour le moment</p>
              <p className="mt-2 text-sm leading-6 text-[#6f665e]">Revenez bientôt pour découvrir la première publication.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
