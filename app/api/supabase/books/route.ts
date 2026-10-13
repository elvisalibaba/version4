import { NextResponse } from "next/server";
import { isSupabaseMode } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/user";

function string(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function csv(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((part): part is string => typeof part === "string").map(part => part.trim().slice(0, 100)).filter(Boolean).slice(0, 30)
    : [];
}

/** Protected write API. Uses the user's RLS-scoped Supabase session, never service_role. */
export async function POST(request: Request) {
  if (!isSupabaseMode()) return NextResponse.json({ message: "Route indisponible." }, { status: 404 });
  const current = await getSupabaseUser();
  if (!current || !["author", "admin"].includes(current.profile.role))
    return NextResponse.json({ message: "Autorisation refusée." }, { status: 403 });
  let input: Record<string, unknown>;
  try { input = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ message: "Corps JSON invalide." }, { status: 400 }); }
  const title = string(input.title, 250);
  const price = Number(input.price ?? 0);
  if (!title || !Number.isFinite(price) || price < 0 || price > 100000000)
    return NextResponse.json({ message: "Titre et prix valides requis." }, { status: 422 });
  const supabase = await createClient();
  const authorId = current.profile.role === "author" ? current.id : null;
  const draft = {
    title,
    subtitle: string(input.subtitle, 250) || null,
    description: string(input.description, 10000) || null,
    author_id: authorId,
    author_display_name: string(input.author_display_name, 250) || current.name || "Auteur non précisé",
    price,
    currency_code: "USD",
    language: string(input.language, 12) || "fr",
    publisher: string(input.publisher, 250) || null,
    isbn: string(input.isbn, 30) || null,
    categories: csv(input.categories),
    tags: csv(input.tags),
    status: "draft",
    review_status: "draft",
    copyright_status: "review",
    reading_access_mode: "platform_only",
    allow_download: false,
    allow_print: false,
    allow_copy: false,
  };
  const { data, error } = await supabase.from("books").insert(draft).select("id").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 422 });
  return NextResponse.json({ id: data.id, message: "Brouillon enregistré dans Supabase." }, { status: 201 });
}
