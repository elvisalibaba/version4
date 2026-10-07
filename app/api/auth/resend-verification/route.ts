import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";
import { proxyForwardHeaders } from "@/lib/api/forwarded";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiClient<{ message: string }>("auth/resend-verification", {
      method: "POST",
      body,
      headers: proxyForwardHeaders(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.payload ?? { message: "Renvoi impossible." }, { status: error.status });
    }
    return NextResponse.json({ message: "Service de vérification indisponible." }, { status: 503 });
  }
}
