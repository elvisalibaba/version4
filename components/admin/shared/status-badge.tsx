import type { ReactNode } from "react";

type StatusBadgeKind = "role" | "book" | "payment" | "subscription" | "access" | "boolean" | "format" | "review";

const badgeStyles: Record<StatusBadgeKind, Record<string, string>> = {
  role: {
    admin: "bg-rose-100 text-rose-700",
    author: "bg-sky-100 text-sky-700",
    reader: "bg-slate-100 text-slate-700",
  },
  book: {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-slate-100 text-slate-700",
    archived: "bg-amber-100 text-amber-700",
    coming_soon: "bg-violet-100 text-violet-700",
  },
  payment: {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
    refunded: "bg-slate-200 text-slate-700",
  },
  subscription: {
    active: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-200 text-slate-700",
    expired: "bg-amber-100 text-amber-700",
    past_due: "bg-rose-100 text-rose-700",
  },
  access: {
    purchase: "bg-sky-100 text-sky-700",
    subscription: "bg-violet-100 text-violet-700",
    free: "bg-emerald-100 text-emerald-700",
  },
  boolean: {
    true: "bg-emerald-100 text-emerald-700",
    false: "bg-slate-100 text-slate-700",
  },
  format: {
    ebook: "bg-violet-100 text-violet-700",
    paperback: "bg-amber-100 text-amber-700",
    hardcover: "bg-sky-100 text-sky-700",
    audiobook: "bg-rose-100 text-rose-700",
  },
  review: {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    changes_requested: "bg-violet-100 text-violet-700",
  },
};

type StatusBadgeProps = {
  kind: StatusBadgeKind;
  value: string | boolean | null | undefined;
  label?: ReactNode;
};

export function StatusBadge({ kind, value, label }: StatusBadgeProps) {
  const normalizedValue = typeof value === "boolean" ? String(value) : (value ?? "unknown");
  const tone = badgeStyles[kind][normalizedValue] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${tone}`}>
      {label ?? String(normalizedValue).replaceAll("_", " ")}
    </span>
  );
}
