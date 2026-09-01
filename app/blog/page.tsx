import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { BlogCover } from "@/components/blog/blog-cover";
import { getAllBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le magazine",
  description: "Regards, méthodes et conversations autour du livre et des voix africaines.",
  alternates: { canonical: "/blog" },
};

type BlogPageProps = { searchParams: Promise<{ tag?: string }> };

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag } = await searchParams;
  const allPosts = await getAllBlogPosts();
  const tags = [...new Set(allPosts.map((post) => post.tag).filter(Boolean))];
  const posts = tag ? allPosts.filter((post) => post.tag === tag) : allPosts;
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-[#17231d]">
      <section className="relative overflow-hidden bg-[#173d2c] text-white">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[70px] border-[#e9ad42]/80" />
        <div className="absolute bottom-0 left-[42%] h-24 w-44 -skew-x-12 bg-[#c95d3e]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f2c66f]">Le magazine Holistique</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.96] tracking-[-0.04em] sm:text-7xl">Les idées qui font vivre les livres.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Écriture, édition, culture et métiers du livre : des ressources utiles, ancrées dans les réalités africaines et ouvertes sur le monde.</p>
          </div>
          <div className="self-end border-l border-white/20 pl-6">
            <BookOpen className="h-7 w-7 text-[#f2c66f]" />
            <p className="mt-4 text-sm leading-6 text-white/70">Un espace pour comprendre les coulisses de l’édition et donner plus de portée aux nouvelles voix.</p>
            <p className="mt-4 text-sm font-bold">{allPosts.length} article{allPosts.length > 1 ? "s" : ""} publié{allPosts.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      <nav aria-label="Thèmes du magazine" className="border-b border-[#d9cebd] bg-[#fffaf2]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8 [scrollbar-width:none]">
          <Link href="/blog" className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!tag ? "bg-[#173d2c] text-white" : "border border-[#d9cebd] bg-white"}`}>Tout lire</Link>
          {tags.map((item) => <Link key={item} href={`/blog?tag=${encodeURIComponent(item)}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tag === item ? "bg-[#c95d3e] text-white" : "border border-[#d9cebd] bg-white hover:border-[#173d2c]"}`}>{item}</Link>)}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {featured ? (
          <>
            <article className="group grid overflow-hidden rounded-[2rem] bg-[#fffaf2] shadow-[0_20px_70px_rgba(62,45,28,.10)] lg:grid-cols-[1.15fr_.85fr]">
              <BlogCover imageUrl={featured.coverImageUrl} imageAlt={featured.coverImageAlt} label={featured.coverLabel} className="min-h-[290px] lg:min-h-[480px]" />
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b64f34]">À la une · {featured.tag}</p>
                <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">{featured.title}</h2>
                <p className="mt-5 line-clamp-4 leading-7 text-[#655e55]">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-[#776f65]"><span>{featured.dateLabel}</span><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{featured.readTime}</span></div>
                <Link href={`/blog/${featured.slug}`} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#173d2c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#23573f]">Lire l’article <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>

            {rest.length > 0 ? <div className="mt-14 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b64f34]">À poursuivre</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Dernières histoires & ressources</h2></div></div> : null}
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article key={post.slug} className="group overflow-hidden rounded-3xl border border-[#ded3c2] bg-[#fffaf2] transition hover:-translate-y-1 hover:shadow-xl">
                  <Link href={`/blog/${post.slug}`}><BlogCover imageUrl={post.coverImageUrl} imageAlt={post.coverImageAlt} label={post.coverLabel} className="aspect-[16/10]" /></Link>
                  <div className="p-6"><p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#b64f34]">{post.tag}</p><h3 className="mt-3 font-serif text-2xl leading-tight"><Link href={`/blog/${post.slug}`} className="hover:text-[#b64f34]">{post.title}</Link></h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6a6259]">{post.excerpt}</p><div className="mt-5 flex items-center justify-between border-t border-[#e7ddcf] pt-4 text-xs font-semibold text-[#7a7268]"><span>{post.dateLabel}</span><span>{post.readTime}</span></div></div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#cbbda9] px-6 py-20 text-center"><h2 className="font-serif text-3xl">Aucun article dans ce thème</h2><Link href="/blog" className="mt-5 inline-flex font-bold text-[#b64f34]">Voir tous les articles</Link></div>
        )}
      </section>

      <section className="bg-[#e8ac42] px-4 py-14 text-[#17231d]"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em]">Écrire, publier, transmettre</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Votre manuscrit mérite un vrai accompagnement.</h2></div><Link href="/services" className="shrink-0 rounded-full bg-[#173d2c] px-6 py-3.5 text-sm font-bold text-white">Découvrir nos services</Link></div></section>
    </main>
  );
}
