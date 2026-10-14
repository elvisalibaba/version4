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
  if (!admin && book.status === "published") return NextResponse.json({ message: "Un ouvrage publié doit passer par une nouvelle révision éditoriale." }, { status: 409 });
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
    if ("cover_url" in input && input.cover_bucket === "covers") {
      // Bucket public « covers » : clé sous le dossier du livre (contrôlée aussi par le trigger en base).
      const key=input.cover_url;
      if (typeof key !== "string" || !new RegExp(`^${id}/cover-[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`, "i").test(key))
        throw new Error("Chemin de couverture non conforme.");
      patch.cover_url=key;
      patch.cover_bucket="covers";
      patch.cover_thumbnail_url=null;
    } else if ("cover_url" in input) patch.cover_url=safePath(input.cover_url,"covers",current.id,admin);
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
  if (typeof patch.file_url === "string") {
    const {data:latest,error:readError}=await supabase.from("books").select("price,currency_code").eq("id",id).single();
    if(readError || !latest) return NextResponse.json({message:"Fichier enregistré, lecture des métadonnées impossible."},{status:409});
    const {data:existing}=await supabase.from("book_formats").select("id").eq("book_id",id).eq("format","ebook").maybeSingle();
    const formatRecord={
      book_id:id,format:"ebook",file_url:patch.file_url,
      price:Number(latest.price),currency_code:latest.currency_code,
      downloadable:false,is_published:false
    };
    const result=existing
      ? await supabase.from("book_formats").update(formatRecord).eq("id",existing.id)
      : await supabase.from("book_formats").insert(formatRecord);
    if(result.error) return NextResponse.json({message:"Livre sauvegardé, mais format privé non référencé : "+result.error.message},{status:409});
  }
  return NextResponse.json({ok:true,id});
}
