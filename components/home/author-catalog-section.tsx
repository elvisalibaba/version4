import Link from "next/link";
import { ArrowUpRight, BookOpen, Globe } from "lucide-react";
import type { PublishedBook } from "@/lib/books";

type AuthorCatalogSectionProps = {
  books: PublishedBook[];
};

type AuthorProfile = {
  id: string;
  name: string;
  books: PublishedBook[];
  topCategory: string;
  avatar_url: string | null;
};

function pickTopCategory(categories: string[]) {
  const counts = new Map<string, number>();
  for (const category of categories) {
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Edition premium";
}

export function AuthorCatalogSection({ books }: AuthorCatalogSectionProps) {
  const authorMap = new Map<string, { name: string; books: PublishedBook[]; avatar_url: string | null }>();

  for (const book of books) {
    const name = book.author_name?.trim();
    if (!name || name.toLowerCase() === "auteur inconnu") continue;
    const entry = authorMap.get(book.author_id) ?? { name, books: [], avatar_url: book.author_avatar_url ?? null };
    entry.books.push(book);
    if (!entry.avatar_url && book.author_avatar_url) {
      entry.avatar_url = book.author_avatar_url;
    }
    authorMap.set(book.author_id, entry);
  }

  const profiles: AuthorProfile[] = Array.from(authorMap.entries())
    .map(([id, entry]) => {
      const categories = entry.books.flatMap((book) => book.categories ?? []);
      return {
        id,
        name: entry.name,
        books: entry.books,
        topCategory: pickTopCategory(categories),
        avatar_url: entry.avatar_url,
      };
    })
    .sort((a, b) => b.books.length - a.books.length)
    .slice(0, 6);

  if (profiles.length === 0) {
    return null;
  }

  return (
    <section id="authors" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ios-kicker">Writer side</p>
          <h2 className="ios-title text-2xl font-bold">Des auteurs presentes comme de vraies signatures editoriales.</h2>
          <p className="ios-muted mt-2 max-w-2xl text-sm sm:text-base">
            Holistique Books valorise les auteurs avec une presence plus professionnelle, une lecture claire du catalogue et des points d entree qui inspirent confiance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-800">
            Voir les livres
          </Link>
          <Link href="/register" className="text-sm font-semibold text-slate-900 hover:text-rose-700">
            Ouvrir le studio auteur
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {profiles.map((author) => {
          const latestBook = [...author.books].sort((a, b) => {
            const aTime = new Date(a.published_at ?? a.created_at).getTime();
            const bTime = new Date(b.published_at ?? b.created_at).getTime();
            return bTime - aTime;
          })[0];
          const initials = author.name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const portraitUrl = author.avatar_url?.trim() || latestBook?.cover_signed_url || null;
          const authorQuery = `/books?q=${encodeURIComponent(author.name)}`;

          return (
            <article key={author.id} className="ios-surface ios-card-hover overflow-hidden rounded-[2rem]">
              <div className="grid gap-4 p-5 md:grid-cols-[140px_1fr]">
                <div className="hb-shimmer relative overflow-hidden rounded-2xl bg-slate-100">
                  {portraitUrl ? (
                    <img src={portraitUrl} alt={author.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-[180px] items-center justify-center text-2xl font-semibold text-rose-700">
                      {initials}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {author.topCategory}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="ios-title text-lg font-semibold">{author.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {author.books.length} titres publies
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-rose-100/80 px-3 py-1 text-[11px] font-semibold text-rose-700">
                    Verifie par Holistique
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Dernier titre</p>
                    <p className="mt-1 font-semibold text-slate-900">{latestBook?.title ?? "Titre en preparation"}</p>
                    <p className="text-xs text-slate-500">
                      {latestBook?.price !== undefined
                        ? latestBook.price <= 0
                          ? "Gratuit"
                          : `$${latestBook.price.toFixed(2)}`
                        : "Tarif sur demande"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1">
                      <BookOpen className="h-3.5 w-3.5 text-rose-600" />
                      Edition premium
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1">
                      <Globe className="h-3.5 w-3.5 text-rose-600" />
                      Diffusion internationale
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link href={authorQuery} className="text-sm font-semibold text-slate-900 hover:text-rose-700">
                      Voir les titres
                    </Link>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700">
                      Profil
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
