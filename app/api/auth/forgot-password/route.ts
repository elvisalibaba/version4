import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await apiClient("auth/forgot-password", { method: "POST", body }));
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Demande impossible." }, { status: error.status });
    return NextResponse.json({ message: "Le serveur Laravel est momentanément indisponible." }, { status: 503 });
  }
}
