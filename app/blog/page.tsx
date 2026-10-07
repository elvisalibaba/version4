import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowRight, Clock } from "lucide-react";
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
    <div className="hb-fullbleed min-h-screen bg-paper-deep text-night-900">
      <PageHeader
        crumbs={[{ label: "Magazine" }]}
        kicker="Le magazine de la maison"
        title="Les idées qui font vivre les livres."
        intro="Écriture, édition, culture et métiers du livre : des repères utiles, ancrés dans les réalités africaines et ouverts sur le monde."
      />

      <nav aria-label="Thèmes du magazine" className="border-b border-rule-strong bg-paper">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8 [scrollbar-width:none]">
          <Link href="/blog" className={`shrink-0 rounded-sm px-4 py-2 text-sm font-bold ${!tag ? "bg-night-900 text-white" : "border border-rule-strong bg-white"}`}>Tout lire</Link>
          {tags.map((item) => <Link key={item} href={`/blog?tag=${encodeURIComponent(item)}`} className={`shrink-0 rounded-sm px-4 py-2 text-sm font-bold ${tag === item ? "bg-brand-600 text-white" : "border border-rule-strong bg-white hover:border-night-900"}`}>{item}</Link>)}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {featured ? (
          <>
            <article className="group grid overflow-hidden rounded-md bg-paper lg:grid-cols-[1.15fr_.85fr]">
              <BlogCover imageUrl={featured.coverImageUrl} imageAlt={featured.coverImageAlt} label={featured.coverLabel} className="min-h-[290px] lg:min-h-[480px]" />
              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <p className="text-xs font-bold text-brand-600">À la une · {featured.tag}</p>
                <h2 className="mt-4 font-bold text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">{featured.title}</h2>
                <p className="mt-5 line-clamp-4 leading-7 text-slate-600">{featured.excerpt}</p>
                <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-600"><span>{featured.dateLabel}</span><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{featured.readTime}</span></div>
                <Link href={`/blog/${featured.slug}`} className="mt-8 inline-flex w-fit items-center gap-2 rounded-sm bg-night-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-night-700">Lire l’article <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>

            {rest.length > 0 ? <div className="mt-14 flex items-end justify-between"><div><p className="text-xs font-bold text-brand-600">À poursuivre</p><h2 className="mt-2 font-bold text-3xl sm:text-4xl">Dernières histoires & ressources</h2></div></div> : null}
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article key={post.slug} className="group overflow-hidden rounded-md border border-rule-strong bg-paper transition hover:-translate-y-1 hover:shadow-md">
                  <Link href={`/blog/${post.slug}`}><BlogCover imageUrl={post.coverImageUrl} imageAlt={post.coverImageAlt} label={post.coverLabel} className="aspect-[16/10]" /></Link>
                  <div className="p-6"><p className="text-xs font-bold text-brand-600">{post.tag}</p><h3 className="mt-3 font-bold text-2xl leading-tight"><Link href={`/blog/${post.slug}`} className="hover:text-brand-600">{post.title}</Link></h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p><div className="mt-5 flex items-center justify-between border-t border-rule-strong pt-4 text-xs font-semibold text-slate-600"><span>{post.dateLabel}</span><span>{post.readTime}</span></div></div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-slate-400 px-6 py-20 text-center"><h2 className="font-bold text-3xl">Aucun article dans ce thème</h2><Link href="/blog" className="mt-5 inline-flex font-bold text-brand-600">Voir tous les articles</Link></div>
        )}
      </section>

      <section className="bg-night-900 px-4 py-14 text-white"><div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-sm text-night-200">Écrire, publier, transmettre</p><h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Votre manuscrit mérite un vrai accompagnement.</h2></div><Link href="/services" className="cta-primary shrink-0 px-6 py-3.5 text-sm">Découvrir nos services</Link></div></section>
    </div>
  );
}
