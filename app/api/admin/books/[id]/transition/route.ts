import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { runAdminTransition, TRANSITION_ACTIONS, type TransitionAction } from "@/lib/admin/book-transitions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ message: "Origine non autorisée." }, { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ message: "Identifiant invalide." }, { status: 422 });
  const user = await getSupabaseUser();
  if (!user || user.profile.role !== "admin") return NextResponse.json({ message: "Accès réservé aux administrateurs." }, { status: 403 });

  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    input = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
  }
  if (typeof input.action !== "string" || !TRANSITION_ACTIONS.has(input.action as TransitionAction)) {
    return NextResponse.json({ message: "Action non reconnue." }, { status: 422 });
  }
  if ((input.note !== undefined && typeof input.note !== "string") || (input.rightsReference !== undefined && typeof input.rightsReference !== "string")) {
    return NextResponse.json({ message: "Commentaire ou référence invalide." }, { status: 422 });
  }

  const result = await runAdminTransition(await createClient(), {
    bookId: id,
    action: input.action as TransitionAction,
    note: typeof input.note === "string" ? input.note : "",
    rightsReference: typeof input.rightsReference === "string" ? input.rightsReference : "",
  });
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json({ ok: true, book: result.book }, { headers: { "Cache-Control": "no-store" } });
}
