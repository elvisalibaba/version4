import { apiServer } from "@/lib/api/server";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_featured?: boolean;
  content_types?: string[] | null;
  books_count?: number;
};

export async function getPublicCategories() {
  try {
    const response = await apiServer<{ data: PublicCategory[] }>("categories", { authenticated: false });
    return response.data ?? [];
  } catch {
    return [];
  }
}
