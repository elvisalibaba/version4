import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TransitionAction =
  | "admin_publish" | "approve" | "request_changes" | "reject" | "publish" | "coming_soon" | "unpublish"
  | "archive" | "reset_draft" | "rights_clear" | "rights_review" | "rights_block";

export const TRANSITION_ACTIONS = new Set<TransitionAction>([
  "admin_publish", "approve", "request_changes", "reject", "publish", "coming_soon", "unpublish",
  "archive", "reset_draft", "rights_clear", "rights_review", "rights_block",
]);

export type TransitionResult =
  | { ok: true; book: unknown }
  | { ok: false; status: number; message: string };

/**
 * Appelle la RPC hb_admin_transition_book (contrôle admin en base) avec la session de l'admin.
 * L'erreur Postgres réelle est journalisée côté serveur ; l'interface reçoit un message utile :
 * « Accès refusé » uniquement pour un vrai refus de rôle (42501).
 */
export async function runAdminTransition(
  client: SupabaseClient | { rpc: SupabaseClient["rpc"] },
  params: { bookId: string; action: TransitionAction; note: string; rightsReference: string },
): Promise<TransitionResult> {
  const { data, error } = await client.rpc("hb_admin_transition_book", {
    p_book_id: params.bookId,
    p_action: params.action,
    p_note: params.note.trim().slice(0, 2000) || null,
    p_rights_reference: params.rightsReference.trim().slice(0, 500) || null,
  });
  if (!error) return { ok: true, book: data };

  console.error("[Admin] hb_admin_transition_book", {
    bookId: params.bookId,
    action: params.action,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  // Règles métier (22023) : le message de la base est déjà rédigé pour l'admin.
  if (error.code === "22023") return { ok: false, status: 422, message: error.message };
  if (error.code === "P0002") return { ok: false, status: 404, message: "Livre introuvable." };
  if (error.code === "42501" && /administrateur/i.test(error.message)) {
    return { ok: false, status: 403, message: "Accès refusé : votre compte n'a pas le rôle administrateur." };
  }
  if (error.code === "42501") {
    return { ok: false, status: 500, message: `Erreur de droits en base (${error.message}). L'équipe technique a été prévenue.` };
  }
  return { ok: false, status: 500, message: `Action impossible (${error.code ?? "erreur"} : ${error.message}).` };
}
