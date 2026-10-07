import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  ArrowRight,
  BookOpen,
  MapPin,
  Search,
  SearchX,
  Sparkles,
  Star,
} from "lucide-react";
import { getPublicAuthors, type PublicAuthor } from "@/lib/authors";

type AuthorsPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getFeaturedCategories(authors: PublicAuthor[]) {
  const counts = new Map<string, number>();

  for (const author of authors) {
    const categories = new Set([author.top_category, ...(author.genres ?? [])].filter(Boolean));
    for (const category of categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([category]) => category);
}

function buildAuthorsHref({ q, category }: { q?: string; category?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/authors?${query}` : "/authors";
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const { q, category } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const categoryQuery = category?.trim() ?? "";
  const authors = await getPublicAuthors();
  const categories = getFeaturedCategories(authors);
  const normalizedSearch = searchQuery.toLocaleLowerCase("fr");
  const normalizedCategory = categoryQuery.toLocaleLowerCase("fr");

  const filteredAuthors = authors.filter((author) => {
    const searchableValues = [
      author.display_name,
      author.professional_headline,
      author.bio,
      author.publishing_goals,
      author.location,
      author.top_category,
      ...(author.genres ?? []),
    ].filter(Boolean) as string[];
    const categoryValues = [author.top_category, ...(author.genres ?? [])]
      .filter(Boolean)
      .map((value) => value.toLocaleLowerCase("fr"));

    const matchesSearch = normalizedSearch
      ? searchableValues.some((value) => value.toLocaleLowerCase("fr").includes(normalizedSearch))
      : true;
    const matchesCategory = normalizedCategory ? categoryValues.includes(normalizedCategory) : true;

    return matchesSearch && matchesCategory;
  });

  const totalPublishedBooks = authors.reduce((total, author) => total + author.published_books_count, 0);

  return (
    <div className="hb-fullbleed min-h-screen bg-paper">
      <PageHeader
        crumbs={[{ label: "Auteurs" }]}
        kicker="Annuaire des auteurs"
        title="Des voix à lire, des univers à explorer."
        intro={`${authors.length} auteur${authors.length !== 1 ? "s" : ""} et ${totalPublishedBooks} livre${totalPublishedBooks !== 1 ? "s" : ""} publiés par Holistique Books : biographies, spécialités et catalogues.`}
        aside={
          <form action="/authors" className="border border-rule-strong bg-white p-2">
            {categoryQuery ? <input type="hidden" name="category" value={categoryQuery} /> : null}
            <label htmlFor="author-search" className="sr-only">Rechercher un auteur, une ville ou un univers</label>
            <div className="flex min-w-0 items-center gap-2">
              <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-slate-500" />
              <input id="author-search" type="search" name="q" defaultValue={searchQuery} placeholder="Nom, ville ou univers…" className="hb-bare-input h-11 min-w-0 flex-1 text-base text-night-900 placeholder:text-slate-500" />
              <button type="submit" className="cta-primary grid h-11 w-11 shrink-0 place-items-center sm:w-auto sm:px-5">
                <Search aria-hidden="true" className="h-4 w-4 sm:hidden" />
                <span className="sr-only sm:not-sr-only sm:text-sm">Rechercher</span>
              </button>
            </div>
          </form>
        }
      />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {categories.length > 0 ? (
          <nav aria-label="Filtrer les auteurs par univers" className="-mr-3 flex gap-2 overflow-x-auto pb-2 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mr-0 sm:flex-wrap sm:pr-0">
            <Link
              href={buildAuthorsHref({ q: searchQuery || undefined })}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-sm px-4 text-xs font-bold transition ${
                !categoryQuery
                  ? "bg-night-900 text-white"
                  : "border border-rule-strong bg-white text-slate-600 hover:border-brand-600"
              }`}
            >
              Tous les univers
            </Link>
            {categories.map((authorCategory) => {
              const isActive = authorCategory.toLocaleLowerCase("fr") === normalizedCategory;
              return (
                <Link
                  key={authorCategory}
                  href={buildAuthorsHref({
                    q: searchQuery || undefined,
                    category: isActive ? undefined : authorCategory,
                  })}
                  className={`inline-flex min-h-10 shrink-0 items-center rounded-sm px-4 text-xs font-bold transition ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "border border-rule-strong bg-white text-slate-600 hover:border-brand-600 hover:text-brand-600"
                  }`}
                >
                  {authorCategory}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="mb-4 mt-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            {filteredAuthors.length} résultat{filteredAuthors.length !== 1 ? "s" : ""}
          </p>
          {searchQuery || categoryQuery ? (
            <Link href="/authors" className="inline-flex min-h-10 items-center text-sm font-bold text-brand-600">
              Effacer les filtres
            </Link>
          ) : null}
        </div>

        {filteredAuthors.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {filteredAuthors.map((author) => (
              <article
                key={author.id}
                className="group flex h-full flex-col rounded-md border border-rule bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-600/60 hover:shadow-lg sm:p-5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-md bg-paper-deep text-base font-bold text-slate-600 ring-1 ring-slate-200">
                    {author.avatar_signed_url ? (
                      <Image
                        src={author.avatar_signed_url}
                        alt={author.display_name}
                        width={72}
                        height={72}
                        sizes="72px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(author.display_name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold text-brand-600">
                      {author.top_category}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-6 text-slate-900">
                      <Link href={`/authors/${author.id}`} className="transition hover:text-brand-600">
                        {author.display_name}
                      </Link>
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                      {author.professional_headline ?? "Auteur Holistique Books"}
                    </p>
                  </div>
                </div>

                {author.location ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
                    {author.location}
                  </p>
                ) : null}

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {author.bio?.trim() ||
                    author.publishing_goals?.trim() ||
                    "Ce profil éditorial présentera bientôt la démarche et les publications de l’auteur."}
                </p>

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
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-paper px-2.5 py-1.5">
                      <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
                      Nouvelle voix
                    </span>
                  )}
                </div>

                {author.latest_book ? (
                  <div className="mt-4 rounded-md bg-paper px-3 py-2.5">
                    <p className="text-xs font-bold text-brand-600">Dernier titre</p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-900">{author.latest_book.title}</p>
                  </div>
                ) : null}

                <Link
                  href={`/authors/${author.id}`}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-between rounded-md bg-night-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Voir le profil complet
                  <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-rule bg-white px-5 py-10 text-center sm:px-8 sm:py-14">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-paper text-brand-600">
              <SearchX aria-hidden="true" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-[-0.025em] text-slate-900">
              {authors.length === 0 ? "Les premiers profils arrivent bientôt." : "Aucun auteur ne correspond à cette recherche."}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              {authors.length === 0
                ? "Les signatures apparaîtront ici dès la publication de leurs espaces éditoriaux."
                : "Essayez un autre nom, une autre ville ou retirez le filtre d’univers."}
            </p>
            <Link
              href={authors.length === 0 ? "/register?role=author" : "/authors"}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-night-900 px-5 py-3 text-sm font-bold text-white"
            >
              {authors.length === 0 ? "Créer un espace auteur" : "Voir tous les auteurs"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
