import Link from "next/link";
import { BlogCover } from "@/components/blog/blog-cover";
import { getAllBlogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-blog-header">
          <div>
            <p className="hb-kicker">Magazine editorial</p>
            <h1 className="hb-title text-3xl sm:text-4xl">Le blog Holistique Books</h1>
            <p className="hb-muted mt-2 max-w-3xl text-sm sm:text-base">
              Analyses, outils et retours terrain pour aider auteurs, editeurs et lecteurs a rester en avance.
            </p>
          </div>
          <span className="hb-pill">{posts.length} articles</span>
        </div>

        {featured ? (
          <div className="hb-blog-grid">
            <article className="hb-blog-feature">
              <BlogCover
                imageUrl={featured.coverImageUrl}
                imageAlt={featured.coverImageAlt}
                label={featured.coverLabel}
                className="hb-blog-cover"
              />
              <div className="hb-blog-body">
                <span className="hb-blog-tag">{featured.tag}</span>
                <h2 className="hb-title text-2xl sm:text-3xl">{featured.title}</h2>
                <p className="hb-muted text-sm leading-6">{featured.excerpt}</p>
                <div className="hb-blog-meta">
                  <span>{featured.dateLabel}</span>
                  <span className="hb-dot" />
                  <span>{featured.readTime}</span>
                </div>
                <Link href={`/blog/${featured.slug}`} className="hb-button-primary hb-blog-cta">
                  Lire l article
                </Link>
              </div>
            </article>

            <div className="hb-blog-list hb-blog-list-grid">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="hb-blog-card">
                  <BlogCover imageUrl={post.coverImageUrl} imageAlt={post.coverImageAlt} label={post.coverLabel} className="hb-blog-card-cover" />
                  <div className="hb-blog-card-body">
                    <span className="hb-blog-tag">{post.tag}</span>
                    <h3 className="hb-blog-card-title">{post.title}</h3>
                    <p className="hb-muted text-sm">{post.excerpt}</p>
                    <div className="hb-blog-meta">
                      <span>{post.dateLabel}</span>
                      <span className="hb-dot" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
