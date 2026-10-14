import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/user";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREVIEW_TTL_SECONDS = 5 * 60;
const noStore = { "Cache-Control": "private, no-store" };

/**
 * Aperçu du manuscrit pour son auteur (ou un admin) : URL signée de 5 minutes.
 * Le Storage n'autorise plus la lecture directe de files/ ; le contrôle
 * author_id est fait ici, côté serveur, avant toute signature.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  if (!UUID.test(bookId)) return NextResponse.json({ message: "Identifiant invalide." }, { status: 422, headers: noStore });

  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ message: "Connexion requise." }, { status: 401, headers: noStore });

  const service = createServiceRoleClient();
  const { data: book, error } = await service
    .from("books")
    .select("author_id,file_url")
    .eq("id", bookId)
    .maybeSingle();
  if (error) return NextResponse.json({ message: "Aperçu indisponible." }, { status: 503, headers: noStore });

  const isAdmin = user.profile.role === "admin";
  // Même réponse pour « inexistant » et « pas à vous » : pas d'énumération des livres.
  if (!book || (book.author_id !== user.id && !isAdmin)) {
    return NextResponse.json({ message: "Livre introuvable." }, { status: 404, headers: noStore });
  }

  const path = book.file_url;
  if (typeof path !== "string" || !path.startsWith(`files/${book.author_id}/`) || path.includes("..")) {
    return NextResponse.json({ message: "Aucun fichier valide pour ce livre." }, { status: 422, headers: noStore });
  }

  const { data: signed, error: signError } = await service.storage
    .from("books")
    .createSignedUrl(path, PREVIEW_TTL_SECONDS);
  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ message: "Fichier indisponible." }, { status: 404, headers: noStore });
  }

  return NextResponse.json(
    { url: signed.signedUrl, expiresIn: PREVIEW_TTL_SECONDS },
    { headers: noStore },
  );
}
