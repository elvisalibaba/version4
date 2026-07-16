import Link from "next/link";
import { ArrowRight, BookOpen, Check, LibraryBig, Sparkles } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPublishedBooks } from "@/lib/books";

export default async function PublicLibraryPage() {
  const [books, profile] = await Promise.all([getPublishedBooks(), getCurrentUserProfile()]);
  const freeBooks = books.filter((book) => book.is_free);
  const hasReaderLibrary = profile?.role === "reader";

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <section className="overflow-hidden bg-[#171717] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#ffc0b2]">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Bibliothèque ouverte
            </span>
            <h1 className="mt-4 text-[2.15rem] font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl">
              Lisez un livre complet, sans créer de compte.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base sm:leading-8">
              Tous les titres de cette sélection sont réellement gratuits. Touchez « Lire », et le lecteur s’ouvre immédiatement sur votre téléphone.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/78 sm:text-sm">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-3"><Check className="h-3.5 w-3.5 text-[#ff8d73]" /> Sans inscription</span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-3"><Check className="h-3.5 w-3.5 text-[#ff8d73]" /> PDF et EPUB</span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-3"><Check className="h-3.5 w-3.5 text-[#ff8d73]" /> Lecteur mobile</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[1.5rem] border border-[#eadfd4] bg-[#fffdf9] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:rounded-[2rem] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0ec] text-[#c85439]">
              <LibraryBig aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#171717]">
                {hasReaderLibrary ? "Retrouvez aussi vos livres personnels" : profile ? "Retrouvez votre espace Holistique" : "Vous souhaitez garder vos lectures ?"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#6f665e]">
                {hasReaderLibrary
                  ? "Vos achats, titres gratuits enregistrés et accès Premium sont réunis dans votre espace."
                  : profile
                    ? "Votre compte est actif. Les livres gratuits restent lisibles ici, sans étape supplémentaire."
                  : "Le compte reste facultatif. Il ajoute une bibliothèque personnelle, une progression et des notes."}
              </p>
            </div>
          </div>
          <Link
            href={hasReaderLibrary ? "/dashboard/reader/library" : profile ? "/dashboard" : "/register?role=reader&next=%2Fdashboard%2Freader%2Flibrary"}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-5 text-sm font-bold text-white sm:mt-0 sm:w-auto sm:shrink-0"
          >
            {hasReaderLibrary ? "Ouvrir ma bibliothèque" : profile ? "Ouvrir mon espace" : "Créer ma bibliothèque"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Lecture immédiate</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#171717] sm:text-3xl">Livres gratuits</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#6f665e] ring-1 ring-[#eadfd4]">
              {freeBooks.length} titre{freeBooks.length > 1 ? "s" : ""}
            </span>
          </div>

          {freeBooks.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {freeBooks.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.75rem] border border-dashed border-[#d8cabc] bg-white p-8 text-center">
              <BookOpen aria-hidden="true" className="mx-auto h-7 w-7 text-[#ff7a5c]" />
              <h3 className="mt-3 text-lg font-bold text-[#171717]">La prochaine lecture gratuite arrive bientôt</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f665e]">Explorez le catalogue complet pendant que notre sélection ouverte se prépare.</p>
              <Link href="/books" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#171717] px-5 text-sm font-bold text-white">Voir tous les livres</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
