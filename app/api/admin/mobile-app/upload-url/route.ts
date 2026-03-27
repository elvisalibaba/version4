import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/auth/get-admin-api-session";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function sanitizeStorageFileName(fileName: string) {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return safe.replace(/^-|-$/g, "") || "file";
}

export async function POST(request: Request) {
  const admin = await getAdminApiSession();

  if (!admin) {
    return NextResponse.json(
      { error: "Authentification admin requise." },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { fileName?: string }
    | null;
  const rawFileName = payload?.fileName?.trim() ?? "";

  if (!rawFileName) {
    return NextResponse.json(
      { error: "Nom de fichier APK manquant." },
      { status: 400 },
    );
  }

  const safeFileName = sanitizeStorageFileName(
    rawFileName.toLowerCase().endsWith(".apk")
      ? rawFileName
      : `${rawFileName}.apk`,
  );
  const path = `apps/holistique-stores/${Date.now()}-${safeFileName}`;

  try {
    const service = createServiceRoleClient();
    const { data, error } = await service.storage
      .from("books")
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data?.token) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Impossible de preparer l upload direct de l APK.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      bucket: "books",
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Preparation de l upload APK impossible.",
      },
      { status: 500 },
    );
  }
}
