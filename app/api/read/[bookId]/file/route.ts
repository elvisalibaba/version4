import { NextResponse } from "next/server";
import { trackBookEngagement } from "@/lib/book-engagement";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { resolveReadAccess } from "../_access";

type RouteProps = { params: Promise<{ bookId: string }> };

function contentTypeFrom(fileType: "epub" | "pdf") {
  return fileType === "pdf" ? "application/pdf" : "application/epub+zip";
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { bookId } = await params;
  const supabase = await createClient();
  const readerChannel = _request.headers.get("x-holistique-reader");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (readerChannel !== "web" && readerChannel !== "app") {
    return NextResponse.json({ error: "Lecture réservée au lecteur Holistique Books." }, { status: 403 });
  }

  const access = await resolveReadAccess(bookId, user?.id ?? null);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  await trackBookEngagement({
    bookId,
    eventType: "file_access",
    source: "secure_reader_file_stream",
    requestHeaders: _request.headers,
    metadata: {
      file_type: access.fileType,
      access_mode: user ? "account" : "guest_free",
    },
  });

  const storageClient = user ? supabase : createServiceRoleClient();
  const { data: signedData, error: signedError } = await storageClient.storage.from("books").createSignedUrl(access.filePath, 60);
  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: "Impossible de charger le fichier." }, { status: 500 });
  }

  const fileRes = await fetch(signedData.signedUrl);
  if (!fileRes.ok) {
    return NextResponse.json({ error: "Lecture indisponible." }, { status: 500 });
  }

  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": contentTypeFrom(access.fileType),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Accept-Ranges": "none",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
}
