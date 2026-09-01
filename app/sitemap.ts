import type { MetadataRoute } from "next";
import { getPublicAuthors } from "@/lib/authors";
import { getBlogPreview } from "@/lib/blog";
import { getPublishedBooks } from "@/lib/books";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticRoutes = [
  "/home",
  "/books",
  "/library",
  "/authors",
  "/blog",
  "/services",
  "/ressources",
  "/formation-editoriale",
  "/qui-sommes-nous",
  "/faq",
  "/conditions",
  "/confidentialite",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, authors, posts] = await Promise.all([getPublishedBooks(), getPublicAuthors(), getBlogPreview(1000)]);
  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: path === "/home" || path === "/books" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/home" ? 1 : path === "/books" ? 0.9 : 0.7,
    })),
    ...books.map((book) => ({
      url: absoluteUrl(`/book/${book.id}`),
      lastModified: new Date(book.published_at || book.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...authors.map((author) => ({
      url: absoluteUrl(`/authors/${author.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
