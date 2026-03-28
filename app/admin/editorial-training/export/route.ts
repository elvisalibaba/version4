import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/auth/get-admin-api-session";
import {
  buildEditorialTrainingCsv,
  isEditorialTrainingPreferredFormat,
} from "@/lib/editorial-training";
import { listAllAdminEditorialTrainingRequests } from "@/lib/supabase/admin/editorial-training";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminApiSession();

  if (!admin) {
    return NextResponse.json(
      { error: "Authentification admin requise." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const rawFormat = url.searchParams.get("format")?.trim() ?? "";
  const preferredFormat = isEditorialTrainingPreferredFormat(rawFormat)
    ? rawFormat
    : "";

  const rows = await listAllAdminEditorialTrainingRequests({
    search,
    preferredFormat,
  });

  const csv = buildEditorialTrainingCsv(rows);
  const fileDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="editorial-training-requests-${fileDate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
