import Link from "next/link";
import { BlogCover } from "@/components/blog/blog-cover";
import { getBlogPreview } from "@/lib/blog";

export async function BlogSection() {
  const posts = await getBlogPreview(4);
  const [highlight, ...rest] = posts;

  if (!highlight) return null;

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-blog-header">
        <div>
            <p className="hb-kicker">Conseils de transformation</p>
            <h2 className="hb-title text-2xl sm:text-3xl">Idees, habitudes et perspectives pour avancer.</h2>
            <p className="hb-muted mt-2 max-w-2xl text-sm sm:text-base">
              Des contenus pour aider lecteurs et auteurs a transformer une intention en changement concret.
            </p>
          </div>
          <Link href="/blog" className="hb-link text-sm font-semibold">
            Lire le journal
          </Link>
        </div>

        <div className="hb-blog-grid">
          <article className="hb-blog-feature">
            <BlogCover imageUrl={highlight.coverImageUrl} imageAlt={highlight.coverImageAlt} label={highlight.coverLabel} className="hb-blog-cover" />
            <div className="hb-blog-body">
              <span className="hb-blog-tag">{highlight.tag}</span>
              <h3 className="hb-title text-xl sm:text-2xl">{highlight.title}</h3>
              <p className="hb-muted text-sm leading-6">{highlight.excerpt}</p>
              <div className="hb-blog-meta">
                <span>{highlight.dateLabel}</span>
                <span className="hb-dot" />
                <span>{highlight.readTime}</span>
              </div>
              <Link href={`/blog/${highlight.slug}`} className="hb-button-primary hb-blog-cta">
                Lire l article
              </Link>
            </div>
          </article>

          <div className="hb-blog-list">
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
      </div>
    </section>
  );
}
