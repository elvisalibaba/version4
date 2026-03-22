"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

  function buildNextPath() {
    const search = searchParams?.toString();
    return `${pathname || `/book/${bookId}`}${search ? `?${search}` : ""}`;
  }

  function handleToggle() {
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?next=${encodeURIComponent(buildNextPath())}`);
        return;
      }

      if (isFavorite) {
        const { error } = await supabase.from("book_favorites").delete().eq("user_id", user.id).eq("book_id", bookId);
        if (error) {
          console.error("[Favorites] Failed to remove favorite book.", error.message);
          return;
        }

        setIsFavorite(false);
        router.refresh();
        return;
      }

      const { error } = await supabase.from("book_favorites").insert({ user_id: user.id, book_id: bookId });
      if (error) {
        if (error.message.toLowerCase().includes("duplicate")) {
          setIsFavorite(true);
          router.refresh();
          return;
        }
        console.error("[Favorites] Failed to add favorite book.", error.message);
        return;
      }

      setIsFavorite(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isFavorite}
      className={joinClassNames(
        compact
          ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ece3d7] bg-white text-slate-700 transition hover:border-[#d7c8b8] hover:text-[#a85b3f] disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex h-11 items-center gap-2 rounded-full border border-[#ece3d7] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#d7c8b8] hover:text-[#a85b3f] disabled:cursor-not-allowed disabled:opacity-60",
        isFavorite ? "border-[#a85b3f] bg-[#fff1ea] text-[#a85b3f]" : undefined,
        className,
      )}
    >
      <Heart className={joinClassNames("h-4 w-4", isFavorite ? "fill-current" : undefined)} />
      {!compact ? <span>{label ?? (isFavorite ? "Ajoute aux favoris" : "Aimer ce livre")}</span> : null}
    </button>
  );
}
