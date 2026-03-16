import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { BookEngagementEventType, UserRole } from "@/types/database";

type TrackBookEngagementParams = {
  bookId: string;
  eventType: BookEngagementEventType;
  source: string;
  metadata?: Record<string, unknown>;
  requestHeaders?: Headers;
};

function sanitizeMetadata(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

const ENGAGEMENT_SETUP_ERROR_CODES = new Set(["42703", "42883", "42P01", "PGRST202", "PGRST204"]);
const ENGAGEMENT_SETUP_ERROR_MARKERS = ["track_book_engagement", "book_engagement_events", "views_count"];

let hasWarnedAboutEngagementSetup = false;
let hasWarnedAboutEngagementRuntime = false;

type EngagementErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function normalizeErrorMessage(error: EngagementErrorLike | null | undefined) {
  return [error?.message, error?.details, error?.hint].filter(Boolean).join(" | ");
}

function isEngagementSetupIssue(error: EngagementErrorLike | null | undefined) {
  if (!error) {
    return false;
  }

  if (error.code && ENGAGEMENT_SETUP_ERROR_CODES.has(error.code)) {
    return true;
  }

  const message = normalizeErrorMessage(error).toLowerCase();
  return ENGAGEMENT_SETUP_ERROR_MARKERS.some((marker) => message.includes(marker));
}

function getEngagementServiceClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function writeEngagementFallback(params: {
  bookId: string;
  eventType: BookEngagementEventType;
  source: string;
  metadata: Record<string, unknown>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const service = getEngagementServiceClient();

  if (!service) {
    return false;
  }

  let userId: string | null = null;
  let userRole: UserRole | null = null;

  try {
    const {
      data: { user },
    } = await params.supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (userId) {
    const { data: profile } = await service.from("profiles").select("role").eq("id", userId).maybeSingle();
    userRole = profile?.role ?? null;
  }

  const { error: insertError } = await service.from("book_engagement_events").insert({
    book_id: params.bookId,
    user_id: userId,
    event_type: params.eventType,
    source: params.source,
    user_role: userRole,
    is_authenticated: Boolean(userId),
    metadata: params.metadata,
  });

  if (insertError) {
    return false;
  }

  if (params.eventType === "detail_view") {
    const { data: book } = await service.from("books").select("views_count").eq("id", params.bookId).maybeSingle();
    if (typeof book?.views_count === "number") {
      await service.from("books").update({ views_count: book.views_count + 1 }).eq("id", params.bookId);
    }
  }

  return true;
}

function warnAboutEngagementRuntime(context: { code?: string; error?: string }) {
  if (hasWarnedAboutEngagementRuntime) {
    return;
  }

  hasWarnedAboutEngagementRuntime = true;
  console.warn("Book engagement tracking is temporarily unavailable. Page rendering continues without analytics.", context);
}

export async function trackBookEngagement({
  bookId,
  eventType,
  source,
  metadata = {},
  requestHeaders,
}: TrackBookEngagementParams) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let payload: Record<string, unknown> | null = null;

  try {
    supabase = await createClient();
    const headerStore = requestHeaders ?? (await headers());

    payload = sanitizeMetadata({
      ...metadata,
      user_agent: headerStore.get("user-agent"),
      referer: headerStore.get("referer"),
    });

    const { error } = await supabase.rpc("track_book_engagement", {
      p_book_id: bookId,
      p_event_type: eventType,
      p_source: source,
      p_metadata: payload,
    });

    if (!error) {
      return;
    }

    if (
      payload &&
      (await writeEngagementFallback({
        bookId,
        eventType,
        source,
        metadata: payload,
        supabase,
      }))
    ) {
      return;
    }

    if (isEngagementSetupIssue(error)) {
      if (!hasWarnedAboutEngagementSetup) {
        hasWarnedAboutEngagementSetup = true;
        console.warn(
          "Book engagement tracking is unavailable. Apply Supabase migration 0013_user_profiles_and_book_engagement.sql to enable analytics.",
          {
            code: error.code,
            error: normalizeErrorMessage(error),
          },
        );
      }

      return;
    }

    warnAboutEngagementRuntime({
      code: error.code,
      error: normalizeErrorMessage(error),
    });
  } catch (error) {
    if (
      supabase &&
      payload &&
      (await writeEngagementFallback({
        bookId,
        eventType,
        source,
        metadata: payload,
        supabase,
      }))
    ) {
      return;
    }

    warnAboutEngagementRuntime({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
