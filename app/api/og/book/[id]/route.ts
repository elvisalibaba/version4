import { NextResponse } from "next/server";
import { isValidBookId } from "@/lib/book-cover-url";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!isValidBookId(id)) return new NextResponse(null, { status: 404 });
 // Legacy social previews remain valid; the canonical endpoint is /api/covers/[id].
 return NextResponse.redirect(new URL(`/api/covers/${id}`, request.url), 307);
}
