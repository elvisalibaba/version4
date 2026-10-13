import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/user";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
function safePath(value: unknown, folder: "covers"|"files", userId: string, isAdmin: boolean) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.includes("..") || !new RegExp(`^${folder}/[0-9a-f-]+/[0-9a-f-]+/[^/]+$`, "i").test(value))
    throw new Error("Chemin de fichier non conforme.");
  if (!isAdmin && !value.startsWith(`${folder}/${userId}/`)) throw new Error("Ce fichier n'appartient pas à l'auteur.");
  return value;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSupabaseMode()) return NextResponse.json({ message: "Route indisponible." }, { status: 404 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ message: "Identifiant invalide." }, { status: 422 });
  const current = await getSupabaseUser();
  if (!current || !["admin", "author"].includes(current.profile.role))
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  const supabase = await createClient();
  const { data: book, error: lookupError } = await supabase.from("books").select("id,author_id,status").eq("id",id).maybeSingle();
  if (lookupError || !book) return NextResponse.json({ message: "Livre introuvable." }, { status: 404 });
  const admin = current.profile.role === "admin";
  if (!admin && book.author_id !== current.id) return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  let input: Record<string, unknown>;
  try { input = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ message: "JSON invalide." }, { status: 400 }); }
  const patch: Record<string, unknown> = {};
  const textFields: Record<string, number> = { title:250,subtitle:250,description:10000,author_display_name:250,language:12,publisher:250,isbn:30 };
  for (const [field,max] of Object.entries(textFields)) {
    if (field in input) {
      const value = asText(input[field],max);
      if (field === "title" && !value) return NextResponse.json({ message: "Titre requis." }, { status: 422 });
      patch[field] = value || (field === "language" ? "fr" : null);
    }
  }
  if ("price" in input) {
    const price=Number(input.price);
    if (!Number.isFinite(price)||price<0||price>100000000)
      return NextResponse.json({ message: "Prix invalide." }, { status: 422 });
    patch.price=price;
  }
  if ("categories" in input) patch.categories=Array.isArray(input.categories)?input.categories.filter(x=>typeof x==="string").slice(0,30):[];
  if ("tags" in input) patch.tags=Array.isArray(input.tags)?input.tags.filter(x=>typeof x==="string").slice(0,30):[];
  try {
    if ("cover_url" in input) patch.cover_url=safePath(input.cover_url,"covers",current.id,admin);
    if ("file_url" in input) {
      patch.file_url=safePath(input.file_url,"files",current.id,admin);
      if (input.file_format !== "pdf" && input.file_format !== "epub")
        return NextResponse.json({ message: "Format de fichier interdit." }, { status: 422 });
      patch.file_format=input.file_format;
    }
  } catch (error) { return NextResponse.json({message:error instanceof Error?error.message:"Fichier invalide."},{status:422}); }
  // Publication and copyright clearance are deliberately not writable through this endpoint.
  if (Object.keys(patch).length===0) return NextResponse.json({ message:"Aucun changement." },{status:422});
  const {error}=await supabase.from("books").update(patch).eq("id",id);
  if (error) return NextResponse.json({message:error.message},{status:422});
  return NextResponse.json({ok:true,id});
}
