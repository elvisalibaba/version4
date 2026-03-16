import Link from "next/link";
import { BookOpen, Heart, Sparkles, Star, Users } from "lucide-react";
import { getPublishedBooks } from "@/lib/books";

const genres = [
  "Litterature generale",
  "Romans d'amour",
  "Romans policiers, polars",
  "Biographies, memoires",
  "Nouvelles",
  "Romans jeunesse",
  "Essais litteraires et documents",
  "Livres de developpement personnel",
];

const selections = [
  { title: "Top des ventes", icon: Star },
  { title: "Livres gratuits", icon: Sparkles },
  { title: "Coups de coeur", icon: Heart },
  { title: "Tous les auteurs", icon: Users },
];

export default async function LibrairiePage() {
  const books = await getPublishedBooks();
  const showcase = books.slice(0, 12);

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="ios-kicker">Librairie</p>
        <h1 className="ios-title text-3xl font-bold sm:text-4xl">Des lectures de transformation pour clarifier, guerir et progresser.</h1>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Explorez des livres choisis pour la croissance personnelle, la foi, la discipline, la vision et le leadership.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="ios-surface rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <BookOpen className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Genres</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {genres.map((genre) => (
              <Link key={genre} href="/books" className="ios-chip rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700">
                {genre}
              </Link>
            ))}
          </div>
        </div>

        <div className="ios-surface rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Selections</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {selections.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href="/books" className="ios-surface-strong flex items-center gap-3 rounded-2xl p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="ios-kicker">Selection du moment</p>
            <h2 className="ios-title text-2xl font-bold sm:text-3xl">Les livres qui aident vraiment a avancer.</h2>
          </div>
          <Link href="/books" className="text-sm font-semibold text-rose-700 hover:text-rose-600">
            Voir tout
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {showcase.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="ios-surface ios-card-hover rounded-2xl p-3">
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-slate-100">
                {book.cover_signed_url ? (
                  <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold text-slate-500">
                    {book.title}
                  </div>
                )}
              </div>
              <p className="mt-2 truncate text-xs font-semibold text-slate-700">{book.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
