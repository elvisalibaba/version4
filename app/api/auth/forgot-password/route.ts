import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await apiClient("auth/forgot-password", { method: "POST", body });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json(error.payload ?? { message: "Demande impossible." }, { status: error.status });
    return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
  }
}
