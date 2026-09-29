import { headers } from "next/headers";
import { apiServer } from "@/lib/api/server";

export type BookEngagementEventType = "detail_view" | "catalog_click" | "reader_open" | "file_access";

type TrackBookEngagementParams = {
  bookId: string;
  eventType: BookEngagementEventType;
  source: string;
  metadata?: Record<string, unknown>;
  requestHeaders?: Headers;
};

let hasWarned = false;

export async function trackBookEngagement({
  bookId,
  eventType,
  source,
  metadata = {},
  requestHeaders,
}: TrackBookEngagementParams) {
  try {
    const headerStore = requestHeaders ?? (await headers());
    await apiServer(`books/${encodeURIComponent(bookId)}/engagement`, {
      method: "POST",
      body: {
        event_type: eventType,
        source,
        metadata: {
          ...metadata,
          user_agent: headerStore.get("user-agent"),
          referer: headerStore.get("referer"),
        },
      },
    });
  } catch (error) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn("[Engagement] Laravel analytics unavailable; page rendering continues.", error);
    }
  }
}
