import { NextResponse } from "next/server";
import { trackBookEngagement } from "@/lib/book-engagement";
import { createClient } from "@/lib/supabase/server";
import { resolveReadAccess } from "./_access";

type RouteProps = { params: Promise<{ bookId: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const { bookId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour lire ce livre." }, { status: 401 });
  }
  const access = await resolveReadAccess(bookId, user.id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  await trackBookEngagement({
    bookId,
    eventType: "reader_open",
    source: "secure_reader_entry",
    requestHeaders: _request.headers,
    metadata: {
      file_type: access.fileType,
    },
  });

  return NextResponse.json({
    fileType: access.fileType,
    readerUrl: `/api/read/${bookId}/file`,
  });
}
