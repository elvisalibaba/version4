import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/content-storage";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

const BLOG_POSTS_FILE_PATH = "data/blog-posts.json";
const IMAGE_LINE_REGEX = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogPostInsert = Database["public"]["Tables"]["blog_posts"]["Insert"];

export type BlogContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "image";
      url: string;
      alt: string;
      caption?: string | null;
    };

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

type StoredBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  dateLabel?: string;
  author: string;
  readTime: string;
  coverLabel: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  content: unknown[];
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

function formatBlogDateLabel(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replaceAll(".", "")
    .replaceAll(",", "");
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return new Date().toISOString().slice(0, 10);
}

function sortBlogPosts(posts: BlogPost[]) {
  return [...posts].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return right.title.localeCompare(left.title, "fr");
  });
}

function normalizeBlogContentBlocks(content: unknown): BlogContentBlock[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .map<BlogContentBlock | null>((entry) => {
      if (typeof entry === "string") {
        const text = entry.trim();
        return text ? { type: "paragraph", text } : null;
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Record<string, unknown>;

      if (candidate.type === "paragraph" && typeof candidate.text === "string" && candidate.text.trim()) {
        return {
          type: "paragraph",
          text: candidate.text.trim(),
        };
      }

      if (candidate.type === "image" && typeof candidate.url === "string" && candidate.url.trim()) {
        return {
          type: "image",
          url: candidate.url.trim(),
          alt: typeof candidate.alt === "string" ? candidate.alt.trim() : "",
          caption: typeof candidate.caption === "string" && candidate.caption.trim() ? candidate.caption.trim() : null,
        };
      }

      return null;
    })
    .filter((block): block is BlogContentBlock => Boolean(block));
}

function mapStoredPostToBlogPost(post: StoredBlogPost): BlogPost {
  const normalizedDate = normalizeDate(post.date);

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tag: post.tag,
    date: normalizedDate,
    dateLabel: post.dateLabel?.trim() || formatBlogDateLabel(normalizedDate),
    author: post.author,
    readTime: post.readTime,
    coverLabel: post.coverLabel,
    coverImageUrl: post.coverImageUrl?.trim() || null,
    coverImageAlt: post.coverImageAlt?.trim() || null,
    content: normalizeBlogContentBlocks(post.content),
  };
}

function mapRowToBlogPost(row: BlogPostRow): BlogPost {
  const date = normalizeDate(row.published_at);

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tag: row.tag,
    date,
    dateLabel: formatBlogDateLabel(date),
    author: row.author,
    readTime: row.read_time,
    coverLabel: row.cover_label,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    content: normalizeBlogContentBlocks(row.content_blocks),
  };
}

function mapBlogPostToInsert(post: BlogPost): BlogPostInsert {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tag: post.tag,
    author: post.author,
    read_time: post.readTime,
    cover_label: post.coverLabel,
    cover_image_url: post.coverImageUrl,
    cover_image_alt: post.coverImageAlt,
    published_at: post.date,
    content_blocks: post.content as unknown as Record<string, unknown>[],
  };
}

function mapBlogPostToStored(post: BlogPost): StoredBlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tag: post.tag,
    date: post.date,
    dateLabel: post.dateLabel,
    author: post.author,
    readTime: post.readTime,
    coverLabel: post.coverLabel,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    content: post.content,
  };
}

function getBlogClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function readLegacyBlogPosts() {
  const posts = await readJsonFile<StoredBlogPost[]>(BLOG_POSTS_FILE_PATH, []);
  return sortBlogPosts(posts.map(mapStoredPostToBlogPost));
}

async function writeLegacyBlogPosts(posts: BlogPost[]) {
  await writeJsonFile(
    BLOG_POSTS_FILE_PATH,
    posts.map(mapBlogPostToStored),
  );
}

async function readSupabaseBlogPosts() {
  const supabase = getBlogClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<BlogPostRow[]>();

  if (error) {
    return null;
  }

  return (data ?? []).map(mapRowToBlogPost);
}

async function seedSupabaseFromLegacy(legacyPosts: BlogPost[]) {
  const supabase = getBlogClient();

  if (!supabase || legacyPosts.length === 0) {
    return false;
  }

  const payload = legacyPosts.map(mapBlogPostToInsert);
  const { error } = await supabase.from("blog_posts").upsert(payload, { onConflict: "slug" });

  return !error;
}

async function readBlogPosts() {
  const [supabasePosts, legacyPosts] = await Promise.all([readSupabaseBlogPosts(), readLegacyBlogPosts()]);

  if (!supabasePosts) {
    return legacyPosts;
  }

  if (supabasePosts.length === 0) {
    if (legacyPosts.length > 0) {
      await seedSupabaseFromLegacy(legacyPosts);
    }

    return legacyPosts;
  }

  const supabaseSlugs = new Set(supabasePosts.map((post) => post.slug));
  const mergedPosts = [...supabasePosts, ...legacyPosts.filter((post) => !supabaseSlugs.has(post.slug))];

  return sortBlogPosts(mergedPosts);
}

export function parseBlogContentInput(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map<BlogContentBlock>((line) => {
      const match = line.match(IMAGE_LINE_REGEX);

      if (match?.[2]) {
        return {
          type: "image",
          url: match[2].trim(),
          alt: match[1]?.trim() || "",
          caption: match[3]?.trim() || null,
        };
      }

      return {
        type: "paragraph",
        text: line,
      };
    });
}

export async function getAllBlogPosts() {
  return readBlogPosts();
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await readBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getBlogPreview(count = 4) {
  const posts = await readBlogPosts();
  return posts.slice(0, count);
}

export async function createBlogPost(input: CreateBlogPostInput) {
  const posts = await readBlogPosts();
  const slugBase = normalizeSlug(input.slug?.trim() || input.title);
  const usedSlugs = new Set(posts.map((post) => post.slug));

  let slug = slugBase || `article-${Date.now()}`;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${slugBase || "article"}-${suffix}`;
    suffix += 1;
  }

  const date = normalizeDate(input.date);
  const post: BlogPost = {
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    tag: input.tag.trim(),
    date,
    dateLabel: formatBlogDateLabel(date),
    author: input.author.trim(),
    readTime: input.readTime.trim(),
    coverLabel: input.coverLabel.trim() || "Magazine editorial",
    coverImageUrl: input.coverImageUrl?.trim() || null,
    coverImageAlt: input.coverImageAlt?.trim() || null,
    content: normalizeBlogContentBlocks(input.content),
  };

  const supabase = getBlogClient();
  if (supabase) {
    const { error } = await supabase.from("blog_posts").insert(mapBlogPostToInsert(post));
    if (!error) {
      return post;
    }
  }

  const legacyPosts = await readLegacyBlogPosts();
  await writeLegacyBlogPosts([post, ...legacyPosts.filter((entry) => entry.slug !== post.slug)]);
  return post;
}

export async function deleteBlogPost(slug: string) {
  const supabase = getBlogClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("slug", slug)
      .select("*")
      .returns<BlogPostRow[]>()
      .maybeSingle();

    if (!error && data) {
      return mapRowToBlogPost(data);
    }
  }

  const posts = await readLegacyBlogPosts();
  const targetPost = posts.find((post) => post.slug === slug) ?? null;

  if (!targetPost) {
    return null;
  }

  await writeLegacyBlogPosts(posts.filter((post) => post.slug !== slug));
  return targetPost;
}
