import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, LibraryBig, Search, Sparkles } from "lucide-react";
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
      <Link href={`/book/${book.id}?read=1`} className="relative block overflow-hidden rounded-[1.15rem] bg-[#e7ddd1] shadow-[0_15px_35px_rgba(38,30,24,.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(38,30,24,.2)]">
        <div className="aspect-[0.69]">
          {book.cover_signed_url ? <Image src={book.cover_signed_url} alt={book.cover_alt_text || `Couverture de ${book.title}`} width={420} height={610} priority={priority} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#e9c56c,#c65a3e)] p-5 text-center font-display text-sm font-extrabold text-white">{book.title}</div>}
        </div>
        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#f5b942] px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-[#2c271f] shadow-sm">Gratuit</span>
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-[#173f38]/95 py-3 text-xs font-extrabold text-white backdrop-blur transition duration-300 group-hover:translate-y-0"><BookOpen className="h-4 w-4" /> Lire maintenant</span>
      </Link>
      <h2 className="mt-3 line-clamp-2 text-sm font-extrabold leading-5 text-[#1d1a17] sm:text-base"><Link href={`/book/${book.id}?read=1`} className="hover:text-[#c34d35]">{book.title}</Link></h2>
      <p className="mt-1 line-clamp-1 text-xs text-[#756a60]">{book.author_name || "Auteur Holistique"}</p>
      <Link href={`/book/${book.id}?read=1`} className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#176052] sm:hidden">Lire maintenant <ArrowRight className="h-3.5 w-3.5" /></Link>
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
  const heroCovers = allFreeBooks.slice(0, 3);
  const hasReaderLibrary = profile?.role === "reader";

  return (
    <div className="min-h-screen bg-[#f8f4ed] text-[#1d1a17]">
      <section className="relative overflow-hidden bg-[#e85d3f] text-white">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#f5b942]/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_0.78fr] lg:items-center lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-[#ffe2a4]"><Sparkles className="h-3.5 w-3.5" /> Bibliothèque ouverte</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1] tracking-[-0.055em] sm:text-6xl">Des livres entiers.<br />Libres d’être lus.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">Découvrez de nouvelles voix africaines et lisez gratuitement sur téléphone, tablette ou ordinateur. Aucun paiement nécessaire.</p>
            <form className="mt-8 flex max-w-xl items-center rounded-2xl bg-white p-1.5 shadow-[0_22px_55px_rgba(100,35,20,.24)]">
              <Search className="ml-3 h-5 w-5 shrink-0 text-[#8a7d71]" />
              <input type="search" name="q" defaultValue={q ?? ""} placeholder="Rechercher un livre ou un auteur…" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-[#1d1a17] outline-none placeholder:text-[#998d81]" />
              {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
              <button className="h-12 rounded-xl bg-[#173f38] px-5 text-sm font-extrabold text-white">Chercher</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/78"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#f8ce6c]" /> Sans inscription</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#f8ce6c]" /> PDF et EPUB</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#f8ce6c]" /> Lecture immédiate</span></div>
          </div>
          <div className="relative hidden h-[360px] lg:block">
            {heroCovers.map((book, index) => {
              const positions = ["left-[30%] top-0 z-30 rotate-[-2deg]", "left-[5%] top-12 z-10 rotate-[-10deg]", "right-[0] top-11 z-20 rotate-[9deg]"];
              return <Link key={book.id} href={`/book/${book.id}?read=1`} className={`absolute w-[185px] overflow-hidden rounded-xl bg-[#e6d9ca] shadow-[0_30px_65px_rgba(88,26,15,.4)] transition hover:z-40 hover:-translate-y-2 hover:rotate-0 ${positions[index]}`}><div className="aspect-[0.69]">{book.cover_signed_url ? <Image src={book.cover_signed_url} alt={book.title} width={370} height={540} priority className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-4 text-center font-bold text-[#51483f]">{book.title}</div>}</div></Link>;
            })}
          </div>
        </div>
      </section>

      <nav aria-label="Filtrer par catégorie" className="border-b border-[#ded2c6] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-8">
          {categories.map((item) => {
            const active = item.value === activeCategory;
            const href = item.value ? `/library?category=${encodeURIComponent(item.value)}` : "/library";
            return <Link key={item.label} href={href} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition ${active ? "bg-[#173f38] text-white" : "border border-[#e0d5ca] bg-white text-[#5b5148] hover:border-[#e85d3f]"}`}>{item.label}{!active ? <ChevronRight className="h-3.5 w-3.5" /> : null}</Link>;
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section className="grid gap-5 rounded-[2rem] border border-[#ded2c6] bg-[#fffdf9] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f2ed] text-[#176052]"><LibraryBig className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-extrabold">{hasReaderLibrary ? "Continuez vos lectures personnelles" : profile ? "Votre espace Holistique est prêt" : "Envie de conserver votre progression ?"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f655c]">{hasReaderLibrary ? "Retrouvez vos achats, favoris, lectures gratuites et accès Premium dans votre bibliothèque personnelle." : "La lecture gratuite reste sans compte. Créez votre espace uniquement pour synchroniser progression, favoris et notes."}</p></div></div>
          <Link href={hasReaderLibrary ? "/dashboard/reader/library" : profile ? "/dashboard" : "/register?role=reader&next=%2Fdashboard%2Freader%2Flibrary"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#173f38] px-5 text-sm font-extrabold text-white">{hasReaderLibrary ? "Ma bibliothèque" : profile ? "Mon espace" : "Créer mon espace"}<ArrowRight className="h-4 w-4" /></Link>
        </section>

        {featured && !query && !activeCategory ? <section className="mt-14 grid overflow-hidden rounded-[2rem] bg-[#173f38] text-white sm:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]"><Link href={`/book/${featured.id}?read=1`} className="block bg-[#e4d9cb]"><div className="aspect-[0.69] sm:h-full sm:aspect-auto">{featured.cover_signed_url ? <Image src={featured.cover_signed_url} alt={featured.title} width={560} height={810} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-6 text-center font-bold text-[#51483f]">{featured.title}</div>}</div></Link><div className="p-7 sm:p-9 lg:p-12"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f5b942]">Notre lecture du moment</p><h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-0.04em] lg:text-4xl">{featured.title}</h2><p className="mt-2 font-bold text-white/62">{featured.author_name}</p><p className="mt-5 line-clamp-4 max-w-3xl text-sm leading-7 text-white/68">{featured.description || "Découvrez gratuitement cette publication dans la bibliothèque Holistique Books."}</p><Link href={`/book/${featured.id}?read=1`} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5b942] px-6 text-sm font-extrabold text-[#282219]">Commencer la lecture <BookOpen className="h-4 w-4" /></Link></div></section> : null}

        <section className="mt-14 sm:mt-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">Lecture immédiate</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">{query || activeCategory ? "Résultats de votre recherche" : "Tous les livres gratuits"}</h2><p className="mt-2 text-sm text-[#756a61]">{freeBooks.length} titre{freeBooks.length !== 1 ? "s" : ""} disponible{freeBooks.length !== 1 ? "s" : ""}</p></div>{query || activeCategory ? <Link href="/library" className="text-sm font-bold text-[#b9432d]">Effacer les filtres</Link> : null}</div>
          {freeBooks.length > 0 ? <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5 xl:grid-cols-6">{freeBooks.map((book, index) => <BookTile key={book.id} book={book} priority={index < 2} />)}</div> : <div className="mt-8 rounded-[2rem] border border-dashed border-[#ccbbaa] bg-white p-10 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#e85d3f]" /><h3 className="mt-4 font-display text-xl font-extrabold">Aucun livre trouvé</h3><p className="mt-2 text-sm text-[#756a61]">Essayez une autre recherche ou consultez toutes les lectures gratuites.</p><Link href="/library" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#173f38] px-5 text-sm font-bold text-white">Voir toute la bibliothèque</Link></div>}
        </section>
      </main>
    </div>
  );
}
