import { apiServer } from "@/lib/api/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";

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
  if (isSupabaseMode()) {
    const c=await createClient();
    const [taxonomies, bookLinks]=await Promise.all([
      c.from("academic_taxonomies").select("id,parent_id,audience,kind,code,name,slug,description,sort_order,is_official,source_url,metadata").eq("is_active",true).order("sort_order"),
      c.from("book_academic_taxonomy").select("academic_taxonomy_id,book_id")
    ]);
    if (taxonomies.error) throw new Error(taxonomies.error.message);
    if (bookLinks.error) throw new Error(bookLinks.error.message);
    const counts=new Map<string,Set<string>>();
    for(const link of bookLinks.data??[]){
      const ids=counts.get(link.academic_taxonomy_id)??new Set<string>();
      ids.add(link.book_id);counts.set(link.academic_taxonomy_id,ids);
    }
    const byId=new Map<string,EducationNode>();
    const roots:EducationNode[]=[];
    for(const node of taxonomies.data??[]){
      byId.set(node.id,{...node,books_count:counts.get(node.id)?.size??0,children:[]} as EducationNode);
    }
    for(const node of byId.values()){
      const parent=node.parent_id?byId.get(node.parent_id):null;
      if(parent)parent.children.push(node);else roots.push(node);
    }
    return {data:roots,meta:{
      school_nodes:(taxonomies.data??[]).filter(x=>x.audience==="school").length,
      university_nodes:(taxonomies.data??[]).filter(x=>x.audience==="university").length,
      official_nodes:(taxonomies.data??[]).filter(x=>x.is_official).length
    }};
  }
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
