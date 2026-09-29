"use client";

import { useEffect } from "react";
import { trackBookEngagement } from "@/lib/book-engagement-client";

export function BookViewTracker({ bookId }: { bookId: string }) {
  useEffect(() => {
    trackBookEngagement({
      bookId,
      eventType: "detail_view",
      source: "book_detail_page",
    });
  }, [bookId]);

  return null;
}
