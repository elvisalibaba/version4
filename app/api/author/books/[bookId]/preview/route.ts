import { NextResponse } from "next/server";

/** The old manuscript preview cannot expose private files from a retired provider. */
export async function GET() {
  return NextResponse.json({
    message: "Utilisez l'espace auteur Laravel pour consulter ce manuscrit.",
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
