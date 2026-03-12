import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";

type BlogPostPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="hb-section">
      <div className="hb-section-shell">
        <Link href="/blog" className="hb-link hb-post-back">
          Retour au blog
        </Link>

        <div className="hb-post-hero">
          <div className="hb-post-cover" data-image-slot={`blog-${post.slug}`}>
            <span className="hb-blog-cover-label">{post.coverLabel}</span>
          </div>
          <div className="hb-post-meta">
            <span className="hb-blog-tag">{post.tag}</span>
            <h1 className="hb-title text-3xl sm:text-4xl">{post.title}</h1>
            <p className="hb-muted text-sm sm:text-base">{post.excerpt}</p>
            <div className="hb-post-info">
              <span>Par {post.author}</span>
              <span className="hb-dot" />
              <span>{post.dateLabel}</span>
              <span className="hb-dot" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        <div className="hb-post-content">
          {post.content.map((paragraph, index) => (
            <p key={`${post.slug}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
