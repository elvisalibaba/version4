import { NextResponse } from "next/server";
import { apiClient, ApiError } from "@/lib/api/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await apiClient<{
      message: string;
      verification_required: boolean;
      email: string;
    }>("auth/register", { method: "POST", body });

    return NextResponse.json(
      {
        message: result.message,
        verification_required: result.verification_required,
        email: result.email,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.payload ?? { message: "Inscription impossible." }, { status: error.status });
    }
    return NextResponse.json({ message: "Service d’inscription indisponible." }, { status: 503 });
  }
}
