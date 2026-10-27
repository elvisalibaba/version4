import { NextResponse } from "next/server";

/** Publishing and moderation are now handled by Laravel Filament. */
export async function POST() {
  return NextResponse.json({ message: "Utilisez l'administration Laravel pour cette opération." }, { status: 410 });
}
