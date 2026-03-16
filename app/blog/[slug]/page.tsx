import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogContentRenderer } from "@/components/blog/blog-content-renderer";
import { BlogCover } from "@/components/blog/blog-cover";
import { getBlogPostBySlug } from "@/lib/blog";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

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
          <BlogCover imageUrl={post.coverImageUrl} imageAlt={post.coverImageAlt} label={post.coverLabel} className="hb-post-cover" />
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
          <BlogContentRenderer content={post.content} />
        </div>
      </div>
    </section>
  );
}
