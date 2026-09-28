import "server-only";

import { apiServer } from "@/lib/api/server";

const IMAGE_LINE_REGEX = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt: string; caption?: string | null };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  dateLabel: string;
  author: string;
  readTime: string;
  coverLabel: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  content: BlogContentBlock[];
};

export type CreateBlogPostInput = {
  slug?: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  author: string;
  readTime: string;
  coverLabel: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  content: BlogContentBlock[];
};

type ApiBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  author: string;
  read_time: string;
  cover_label: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  published_at: string;
  content_blocks: unknown[];
};

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${date}T12:00:00Z`))
    .replaceAll(".", "")
    .replaceAll(",", "");
}

function normalizeBlocks(content: unknown): BlogContentBlock[] {
  if (!Array.isArray(content)) return [];
  return content.flatMap((entry) => {
    if (typeof entry === "string") return entry.trim() ? [{ type: "paragraph" as const, text: entry.trim() }] : [];
    if (!entry || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    if (value.type === "paragraph" && typeof value.text === "string" && value.text.trim()) {
      return [{ type: "paragraph" as const, text: value.text.trim() }];
    }
    if (value.type === "image" && typeof value.url === "string" && value.url.trim()) {
      return [{
        type: "image" as const,
        url: value.url.trim(),
        alt: typeof value.alt === "string" ? value.alt.trim() : "",
        caption: typeof value.caption === "string" && value.caption.trim() ? value.caption.trim() : null,
      }];
    }
    return [];
  });
}

function mapPost(row: ApiBlogPost): BlogPost {
  const date = row.published_at.slice(0, 10);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tag: row.tag,
    date,
    dateLabel: dateLabel(date),
    author: row.author,
    readTime: row.read_time,
    coverLabel: row.cover_label,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    content: normalizeBlocks(row.content_blocks),
  };
}

export function parseBlogContentInput(raw: string) {
  return raw
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map<BlogContentBlock>((value) => {
      const image = value.match(IMAGE_LINE_REGEX);
      if (image) return { type: "image", alt: image[1] ?? "", url: image[2], caption: image[3] ?? null };
      return { type: "paragraph", text: value };
    });
}

export async function getAllBlogPosts() {
  try {
    const response = await apiServer<{ data: ApiBlogPost[] }>("blog", { authenticated: false });
    return (response.data ?? []).map(mapPost);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const response = await apiServer<{ data: ApiBlogPost }>(`blog/${encodeURIComponent(slug)}`, { authenticated: false });
    return mapPost(response.data);
  } catch {
    return null;
  }
}

export async function getBlogPreview(count = 4) {
  return (await getAllBlogPosts()).slice(0, count);
}

export async function createBlogPost(_input: CreateBlogPostInput): Promise<BlogPost> {
  throw new Error("La gestion du blog a été déplacée vers l’administration Laravel.");
}

export async function deleteBlogPost(_slug: string) {
  throw new Error("La gestion du blog a été déplacée vers l’administration Laravel.");
}
