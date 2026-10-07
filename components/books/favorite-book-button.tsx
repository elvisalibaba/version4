"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";

type FavoriteBookButtonProps = {
  bookId: string;
  initialIsFavorite?: boolean;
  label?: string;
  className?: string;
  compact?: boolean;
};

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function FavoriteBookButton({
  bookId,
  initialIsFavorite = false,
  label,
  className,
  compact = false,
}: FavoriteBookButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, startTransition] = useTransition();
  const accessibleLabel = label ?? (isFavorite ? "Retirer ce livre des favoris" : "Ajouter ce livre aux favoris");

  function buildNextPath() {
    const search = searchParams?.toString();
    return `${pathname || `/book/${bookId}`}${search ? `?${search}` : ""}`;
  }

  function handleToggle() {
    startTransition(async () => {
      const me = await fetch("/api/auth/me", { cache: "no-store" });
      if (!me.ok) {
        router.push(`/login?next=${encodeURIComponent(buildNextPath())}`);
        return;
      }

      const response = await fetch(`/api/backend/favorites/${encodeURIComponent(bookId)}`, {
        method: isFavorite ? "DELETE" : "POST",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.error("[Favorites] Laravel API rejected favorite update.", response.status);
        return;
      }

      setIsFavorite((current) => !current);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isFavorite}
      aria-label={compact ? accessibleLabel : undefined}
      className={joinClassNames(
        compact
          ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-white text-slate-700 transition hover:border-rule-strong hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-10 items-center gap-2 rounded-sm border border-rule-strong bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-night-900 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60",
        isFavorite ? "border-brand-600 bg-paper text-brand-600" : undefined,
        className,
      )}
    >
      <Heart aria-hidden="true" className={joinClassNames("h-4 w-4", isFavorite ? "fill-current" : undefined)} />
      {!compact ? <span>{label ?? (isFavorite ? "Ajouté aux favoris" : "Aimer ce livre")}</span> : null}
    </button>
  );
}
