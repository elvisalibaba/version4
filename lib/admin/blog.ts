import type { BlogPost } from "@/lib/blog";
import { getAllBlogPosts } from "@/lib/blog";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  buildPagination,
  getPaginationRange,
  normalizeSearchTerm,
  parsePageParam,
  parsePageSizeParam,
} from "@/lib/supabase/admin/shared";
import type { AdminOption } from "@/types/admin";

export type AdminBlogPostListItem = BlogPost & {
  paragraphCount: number;
};

type ListAdminBlogPostsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
};

export async function listAdminBlogPosts(options: ListAdminBlogPostsOptions = {}) {
  const posts = await getAllBlogPosts();
  const page = parsePageParam(options.page ? String(options.page) : undefined);
  const pageSize = parsePageSizeParam(options.pageSize ? String(options.pageSize) : undefined, ADMIN_DEFAULT_PAGE_SIZE);
  const search = normalizeSearchTerm(options.search).toLowerCase();
  const tag = normalizeSearchTerm(options.tag);

  const filtered = posts.filter((post) => {
    if (tag && post.tag !== tag) return false;
    if (!search) return true;

    const searchableText = [
      post.title,
      post.excerpt,
      post.author,
      post.tag,
      post.slug,
      ...post.content.map((block) => (block.type === "paragraph" ? block.text : `${block.alt} ${block.caption ?? ""} ${block.url}`)),
    ]
      .join(" ")
      .toLowerCase();
    return searchableText.includes(search);
  });

  const { from, to } = getPaginationRange(page, pageSize);
  const items = filtered.slice(from, to + 1).map<AdminBlogPostListItem>((post) => ({
    ...post,
    paragraphCount: post.content.filter((block) => block.type === "paragraph").length,
  }));

  const tags = Array.from(new Set(posts.map((post) => post.tag))).sort((left, right) => left.localeCompare(right, "fr"));
  const filterOptions: { tags: AdminOption[] } = {
    tags: tags.map((entry) => ({ label: entry, value: entry })),
  };

  return {
    items,
    pagination: buildPagination(filtered.length, page, pageSize),
    filterOptions,
    stats: {
      totalPosts: posts.length,
      filteredPosts: filtered.length,
      totalTags: tags.length,
      latestPostDate: posts[0]?.date ?? null,
    },
  };
}
