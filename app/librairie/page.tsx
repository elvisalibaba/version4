import Link from "next/link";
import { BookOpen, Heart, Sparkles, Star, Users } from "lucide-react";

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

export default function LibrairiePage() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="ios-kicker">Librairie</p>
        <h1 className="ios-title text-3xl font-bold sm:text-4xl">Une librairie premium pour tous les lecteurs.</h1>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Explorez nos genres, nos selections editoriales et les auteurs mis en avant par notre equipe.
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
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {genres.map((genre) => (
              <Link key={genre} href="/books" className="ios-chip rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700">
                {genre}
              </Link>
            ))}
          </div>
        </div>

        <div className="ios-surface rounded-[2rem] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Selections</h2>
          <div className="mt-5 space-y-3">
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
    </section>
  );
}
