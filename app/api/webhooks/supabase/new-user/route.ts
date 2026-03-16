import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  sendAdminNewUserSignupNotification,
  type SupabaseInsertWebhookPayload,
} from "@/lib/notifications/new-user-signup";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function unauthorizedResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 401 });
}

function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function secretsMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isValidInsertPayload(payload: unknown): payload is SupabaseInsertWebhookPayload<ProfileRow> {
  if (typeof payload !== "object" || payload === null) return false;

  const candidate = payload as Record<string, unknown>;
  return candidate.type === "INSERT" && candidate.table === "profiles" && candidate.schema === "public" && typeof candidate.record === "object" && candidate.record !== null;
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.SUPABASE_DB_WEBHOOK_SECRET;
    if (!configuredSecret) {
      return NextResponse.json({ error: "SUPABASE_DB_WEBHOOK_SECRET is missing." }, { status: 500 });
    }

    const incomingSecret = request.headers.get("x-webhook-secret");
    if (!incomingSecret || !secretsMatch(configuredSecret, incomingSecret)) {
      return unauthorizedResponse("Webhook secret invalid.");
    }

    const payload = await request.json();
    if (!isValidInsertPayload(payload)) {
      return badRequestResponse("Unexpected Supabase webhook payload.");
    }

    await sendAdminNewUserSignupNotification(payload.record);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "New user webhook failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
