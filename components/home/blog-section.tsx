import Link from "next/link";
import { getBlogPreview } from "@/lib/blog";

export function BlogSection() {
  const posts = getBlogPreview(4);
  const [highlight, ...rest] = posts;

  if (!highlight) return null;

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-blog-header">
        <div>
            <p className="hb-kicker">Magazine editorial</p>
            <h2 className="hb-title text-2xl sm:text-3xl">Conseils, tendances et inspiration</h2>
            <p className="hb-muted mt-2 max-w-2xl text-sm sm:text-base">
              Une veille editoriale premium pour aider auteurs et lecteurs a mieux comprendre le marche du livre africain.
            </p>
          </div>
          <Link href="/blog" className="hb-link text-sm font-semibold">
            Voir le blog
          </Link>
        </div>

        <div className="hb-blog-grid">
          <article className="hb-blog-feature">
            <div className="hb-blog-cover" data-image-slot={`blog-${highlight.slug}`}>
              <span className="hb-blog-cover-label">{highlight.coverLabel}</span>
            </div>
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
                <div className="hb-blog-card-cover" data-image-slot={`blog-${post.slug}`}>
                  <span className="hb-blog-cover-label">{post.coverLabel}</span>
                </div>
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
