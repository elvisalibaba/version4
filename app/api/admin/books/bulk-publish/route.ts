import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { runAdminTransition } from "@/lib/admin/book-transitions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BOOKS = 50;

/**
 * « Valider et publier la sélection » : même référence des droits pour le lot.
 * Chaque livre est publié dans sa propre transaction (hb_admin_transition_book, action admin_publish) ;
 * un échec n'empêche pas les autres et le résumé détaille chaque livre.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ message: "Origine non autorisée." }, { status: 403 });
  const user = await getSupabaseUser();
  if (!user || user.profile.role !== "admin") return NextResponse.json({ message: "Accès réservé aux administrateurs." }, { status: 403 });

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    input = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }
  const ids = Array.isArray(input.ids) ? [...new Set(input.ids.filter((id): id is string => typeof id === "string" && UUID.test(id)))] : [];
  const rightsReference = typeof input.rightsReference === "string" ? input.rightsReference.trim() : "";
  const note = typeof input.note === "string" ? input.note : "";
  if (!ids.length) return NextResponse.json({ message: "Sélectionnez au moins un livre." }, { status: 422 });
  if (ids.length > MAX_BOOKS) return NextResponse.json({ message: `${MAX_BOOKS} livres au maximum par lot.` }, { status: 422 });
  if (!rightsReference) return NextResponse.json({ message: "La référence des droits est obligatoire." }, { status: 422 });

  const client = await createClient();
  const { data: titles } = await client.from("books").select("id,title").in("id", ids);
  const titleOf = new Map(((titles ?? []) as Array<{ id: string; title: string }>).map((book) => [book.id, book.title]));

  const results: Array<{ id: string; title: string; ok: boolean; message: string }> = [];
  for (const id of ids) {
    const result = await runAdminTransition(client, { bookId: id, action: "admin_publish", note, rightsReference });
    results.push({
      id,
      title: titleOf.get(id) ?? id,
      ok: result.ok,
      message: result.ok ? "Publié" : result.message,
    });
  }
  const published = results.filter((result) => result.ok).length;
  return NextResponse.json(
    { published, failed: results.length - published, results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
