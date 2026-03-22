import type { CopyrightStatus } from "@/types/database";

export const COPYRIGHT_STATUSES = ["clear", "review", "blocked"] as const satisfies readonly CopyrightStatus[];

export const COPYRIGHT_STATUS_LABELS: Record<CopyrightStatus, string> = {
  clear: "Droits OK",
  review: "Verification droits",
  blocked: "Bloque droits",
};

export function getCopyrightStatusLabel(status: CopyrightStatus) {
  return COPYRIGHT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function isBookCopyrightBlocked(status: CopyrightStatus | null | undefined) {
  return status === "blocked";
}
