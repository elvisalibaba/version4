import { apiServer } from "@/lib/api/server";

export type EducationNode = {
  id: string;
  parent_id: string | null;
  audience: "school" | "university";
  kind: "root" | "level" | "class" | "stream" | "section" | "option" | "group" | "cycle" | "domain" | "field" | "mention";
  code: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_official: boolean;
  source_url: string | null;
  metadata: Record<string, unknown> | null;
  books_count: number;
  children: EducationNode[];
};

export type EducationCatalogResponse = {
  data: EducationNode[];
  meta: {
    school_nodes: number;
    university_nodes: number;
    official_nodes: number;
  };
};

export async function getEducationCatalog(): Promise<EducationCatalogResponse> {
  try {
    return await apiServer<EducationCatalogResponse>("education/catalog", {
      authenticated: false,
    });
  } catch (error) {
    console.error("[Education] Laravel API unavailable.", error);
    return {
      data: [],
      meta: { school_nodes: 0, university_nodes: 0, official_nodes: 0 },
    };
  }
}

export function flattenEducation(nodes: EducationNode[]): EducationNode[] {
  return nodes.flatMap((node) => [node, ...flattenEducation(node.children)]);
}

export function findEducationNode(nodes: EducationNode[], slug?: string | null) {
  if (!slug) return null;
  return flattenEducation(nodes).find((node) => node.slug === slug || node.code === slug) ?? null;
}
