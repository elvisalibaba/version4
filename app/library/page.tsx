import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, LibraryBig, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPublishedBooks } from "@/lib/books";

export const metadata: Metadata = {
  title: "Bibliothèque numérique gratuite",
  description: "Lisez gratuitement des livres numériques africains sur Holistique Books, sans paiement et directement dans votre navigateur.",
  alternates: { canonical: "/library" },
};

type Props = { searchParams: Promise<{ q?: string; category?: string }> };
type LibraryBook = Awaited<ReturnType<typeof getPublishedBooks>>[number];

const categories = [
  { label: "Tous les livres", value: "" },
  { label: "Romans", value: "Roman" },
  { label: "Spiritualité", value: "Spiritualite" },
  { label: "Business", value: "Business" },
  { label: "Développement", value: "Developpement personnel" },
  { label: "Jeunesse", value: "Jeunesse" },
  { label: "Voix africaines", value: "Auteurs africains" },
];

function BookTile({ book, priority = false }: { book: LibraryBook; priority?: boolean }) {
  return (
    <article className="group min-w-0">
      <Link href={`/book/${book.id}?read=1`} className="relative block overflow-hidden rounded-md bg-paper-deep transition duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="aspect-[0.69]">
          {book.cover_signed_url ? <Image src={book.cover_signed_url} alt={book.cover_alt_text || `Couverture de ${book.title}`} width={420} height={610} priority={priority} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center bg-white p-5 text-center font-display text-sm font-extrabold text-white">{book.title}</div>}
        </div>
        <span className="absolute left-2.5 top-2.5 rounded-sm bg-brand-600 px-2.5 py-1 text-[0.62rem] font-extrabold text-white ">Gratuit</span>
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-night-900/95 py-3 text-xs font-extrabold text-white transition duration-300 group-hover:translate-y-0"><BookOpen className="h-4 w-4" /> Lire maintenant</span>
      </Link>
      <h2 className="mt-3 line-clamp-2 text-sm font-extrabold leading-5 text-slate-900 sm:text-base"><Link href={`/book/${book.id}?read=1`} className="hover:text-brand-600">{book.title}</Link></h2>
      <p className="mt-1 line-clamp-1 text-xs text-slate-600">{book.author_name || "Auteur Holistique"}</p>
      <Link href={`/book/${book.id}?read=1`} className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 sm:hidden">Lire maintenant <ArrowRight className="h-3.5 w-3.5" /></Link>
    </article>
  );
}

export default async function PublicLibraryPage({ searchParams }: Props) {
  const [{ q, category }, books, profile] = await Promise.all([searchParams, getPublishedBooks(), getCurrentUserProfile()]);
  const query = q?.trim().toLocaleLowerCase("fr") ?? "";
  const activeCategory = category?.trim() ?? "";
  const allFreeBooks = books.filter((book) => book.is_free);
  const freeBooks = allFreeBooks.filter((book) => {
    const matchesQuery = !query || [book.title, book.author_name, book.description].some((value) => value?.toLocaleLowerCase("fr").includes(query));
    const matchesCategory = !activeCategory || book.categories.includes(activeCategory);
    return matchesQuery && matchesCategory;
  });
  const featured = freeBooks[0] ?? allFreeBooks[0] ?? null;
  const hasReaderLibrary = profile?.role === "reader";

  return (
    <div className="hb-fullbleed min-h-screen bg-paper text-slate-900">
      <PageHeader
        crumbs={[{ label: "Bibliothèque ouverte" }]}
        kicker="Bibliothèque ouverte · accès libre"
        title="Des livres entiers, libres d’être lus."
        intro="Découvrez de nouvelles voix et lisez gratuitement sur téléphone, tablette ou ordinateur. Aucun paiement nécessaire."
        aside={
          <form className="border border-rule-strong bg-white p-2">
            <div className="flex items-center gap-2">
              <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-slate-500" />
              <label htmlFor="library-search" className="sr-only">Rechercher un livre ou un auteur</label>
              <input id="library-search" type="search" name="q" defaultValue={q ?? ""} placeholder="Un livre, un auteur…" className="hb-bare-input h-11 min-w-0 flex-1 text-base text-night-900 placeholder:text-slate-500" />
              {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
              <button className="cta-primary h-11 px-4 text-sm">Chercher</button>
            </div>
            <p className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1 pt-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" /> Sans inscription</span>
              <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" /> Lecture immédiate</span>
            </p>
          </form>
        }
      />

      <nav aria-label="Filtrer par catégorie" className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-8">
          {categories.map((item) => {
            const active = item.value === activeCategory;
            const href = item.value ? `/library?category=${encodeURIComponent(item.value)}` : "/library";
            return <Link key={item.label} href={href} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm px-4 text-sm font-bold transition ${active ? "bg-night-900 text-white" : "border border-rule-strong bg-white text-slate-700 hover:border-brand-600"}`}>{item.label}{!active ? <ChevronRight className="h-3.5 w-3.5" /> : null}</Link>;
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="grid gap-5 rounded-md border border-rule-strong bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><LibraryBig className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-extrabold">{hasReaderLibrary ? "Continuez vos lectures personnelles" : profile ? "Votre espace Holistique est prêt" : "Envie de conserver votre progression ?"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{hasReaderLibrary ? "Retrouvez vos achats, favoris, lectures gratuites et accès Premium dans votre bibliothèque personnelle." : "La lecture gratuite reste sans compte. Créez votre espace uniquement pour synchroniser progression, favoris et notes."}</p></div></div>
          <Link href={hasReaderLibrary ? "/dashboard/reader/library" : profile ? "/dashboard" : "/register?role=reader&next=%2Fdashboard%2Freader%2Flibrary"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-night-900 px-5 text-sm font-extrabold text-white">{hasReaderLibrary ? "Ma bibliothèque" : profile ? "Mon espace" : "Créer mon espace"}<ArrowRight className="h-4 w-4" /></Link>
        </section>

        {featured && !query && !activeCategory ? <section className="mt-14 grid overflow-hidden rounded-md bg-night-900 text-white sm:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]"><Link href={`/book/${featured.id}?read=1`} className="block bg-slate-300"><div className="aspect-[0.69] sm:h-full sm:aspect-auto">{featured.cover_signed_url ? <Image src={featured.cover_signed_url} alt={featured.title} width={560} height={810} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-6 text-center font-bold text-slate-700">{featured.title}</div>}</div></Link><div className="p-7 sm:p-9 lg:p-12"><p className="text-xs font-extrabold text-brand-300">Notre lecture du moment</p><h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-0.04em] lg:text-4xl">{featured.title}</h2><p className="mt-2 font-bold text-white/62">{featured.author_name}</p><p className="mt-5 line-clamp-4 max-w-3xl text-sm leading-7 text-white/68">{featured.description || "Découvrez gratuitement cette publication dans la bibliothèque Holistique Books."}</p><Link href={`/book/${featured.id}?read=1`} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-sm bg-brand-600 px-6 text-sm font-extrabold text-white">Commencer la lecture <BookOpen className="h-4 w-4" /></Link></div></section> : null}

        <section className="mt-14 sm:mt-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold text-brand-600">Lecture immédiate</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">{query || activeCategory ? "Résultats de votre recherche" : "Tous les livres gratuits"}</h2><p className="mt-2 text-sm text-slate-600">{freeBooks.length} titre{freeBooks.length !== 1 ? "s" : ""} disponible{freeBooks.length !== 1 ? "s" : ""}</p></div>{query || activeCategory ? <Link href="/library" className="text-sm font-bold text-brand-600">Effacer les filtres</Link> : null}</div>
          {freeBooks.length > 0 ? <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5 xl:grid-cols-6">{freeBooks.map((book, index) => <BookTile key={book.id} book={book} priority={index < 2} />)}</div> : <div className="mt-8 rounded-md border border-dashed border-slate-400 bg-white p-10 text-center"><BookOpen className="mx-auto h-8 w-8 text-brand-600" /><h3 className="mt-4 font-display text-xl font-extrabold">Aucun livre trouvé</h3><p className="mt-2 text-sm text-slate-600">Essayez une autre recherche ou consultez toutes les lectures gratuites.</p><Link href="/library" className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-night-900 px-5 text-sm font-bold text-white">Voir toute la bibliothèque</Link></div>}
        </section>
      </main>
    </div>
  );
}
