import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import type { PublicAuthor } from "@/lib/authors";

type AllAuthorsSectionProps = {
  authors: PublicAuthor[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AllAuthorsSection({ authors }: AllAuthorsSectionProps) {
  if (authors.length === 0) {
    return (
      <section className="rounded-md border border-rule bg-white p-5 sm:p-7">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-paper text-brand-600">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-[-0.025em] text-slate-900">Les prochaines voix arrivent.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Les profils apparaîtront ici dès que leurs premiers livres auront rejoint le catalogue éditorial.
        </p>
        <Link
          href="/register?role=author"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-night-900 px-4 py-3 text-sm font-bold text-white"
        >
          Rejoindre les auteurs
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-authors-title" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-brand-600">Signatures Holistique</p>
          <h2
            id="home-authors-title"
            className="text-2xl font-bold tracking-[-0.035em] text-slate-900 sm:text-3xl"
          >
            Rencontrez les voix derrière les livres.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Biographies, univers, derniers titres et catalogue complet : chaque auteur possède un véritable espace éditorial.
          </p>
        </div>
        <Link
          href="/authors"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-rule-strong bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:border-brand-600 hover:text-brand-600 sm:w-auto"
        >
          Voir tous les auteurs
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex items-center justify-between sm:hidden">
        <p className="text-xs font-semibold text-slate-500">Sélection de {Math.min(authors.length, 8)} profils</p>
        <p className="text-xs font-bold text-brand-600">Glissez →</p>
      </div>

      <div className="-mr-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mr-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pr-0 lg:grid-cols-4">
        {authors.slice(0, 8).map((author) => {
          const latestBook = author.latest_book;

          return (
            <Link
              key={author.id}
              href={`/authors/${author.id}`}
              className="group flex min-w-[82%] snap-start flex-col rounded-md border border-rule bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-600/60 hover:shadow-lg sm:min-w-0 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-paper-deep text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                  {author.avatar_signed_url ? (
                    <Image
                      src={author.avatar_signed_url}
                      alt={author.display_name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(author.display_name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-brand-600">
                    {author.top_category}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-base font-bold leading-5 text-slate-900 transition group-hover:text-brand-600">
                    {author.display_name}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                    {author.professional_headline ?? "Auteur Holistique Books"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-sm bg-paper px-2.5 py-1.5">
                  <BookOpen aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
                  {author.books_count} livre{author.books_count !== 1 ? "s" : ""}
                </span>
                {author.average_rating !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-paper px-2.5 py-1.5">
                    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current text-brand-600" />
                    {author.average_rating}/5
                  </span>
                ) : null}
                {author.location ? (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-sm bg-paper px-2.5 py-1.5">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                    <span className="truncate">{author.location}</span>
                  </span>
                ) : null}
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                {author.bio?.trim() ||
                  author.publishing_goals?.trim() ||
                  "Découvrez la démarche et les publications de cette signature Holistique Books."}
              </p>

              <div className="mt-auto pt-4">
                {latestBook ? (
                  <div className="flex items-center gap-3 rounded-md bg-paper p-2.5">
                    <div className="grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-paper-deep text-center text-[0.55rem] font-bold text-slate-600">
                      {latestBook.cover_signed_url ? (
                        <Image
                          src={latestBook.cover_signed_url}
                          alt={`Couverture de ${latestBook.title}`}
                          width={40}
                          height={56}
                          sizes="40px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen aria-hidden="true" className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-brand-600">Dernier titre</p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-4 text-slate-900">{latestBook.title}</p>
                    </div>
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-600" />
                  </div>
                ) : (
                  <span className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-600">
                    Découvrir le profil
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
