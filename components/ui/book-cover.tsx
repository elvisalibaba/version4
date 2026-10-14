"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { COVER_TRANSFORMS_ENABLED, coverImageLoader } from "@/lib/covers";

const PLACEHOLDER_TONES = [
  "bg-ink text-white",
  "bg-brand-deep text-white",
  "bg-brand text-black",
  "bg-brand-tint text-ink",
];

/** Teinte déterministe dérivée de l'identifiant du livre. */
export function placeholderTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length];
}

type BookCoverProps = {
  src: string | null | undefined;
  alt: string;
  /** Identifiant, titre et auteur pour la couverture de repli. */
  seed: string;
  title: string;
  author?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Repli personnalisé ; sinon titre et auteur sur fond coloré. */
  fallback?: ReactNode;
};

/**
 * Couverture d'un livre, toujours affichée dans un parent positionné (relative) et dimensionné.
 * Jamais via l'optimiseur Vercel : loader Supabase si les transformations sont actives,
 * sinon image d'origine. Repli élégant si l'image manque ou ne se charge pas.
 */
export function BookCover({ src, alt, seed, title, author, sizes, priority, className, fallback }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return fallback ?? (
      <span className={cx("flex h-full w-full flex-col justify-end p-4", placeholderTone(seed))}>
        <strong className="line-clamp-4 font-display text-lg font-extrabold leading-snug tracking-[-0.02em]">{title}</strong>
        <span className="mt-2 line-clamp-1 text-xs opacity-80">{author ?? "Holistique Books"}</span>
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cx("object-cover", className)}
      onError={() => setFailed(true)}
      {...(COVER_TRANSFORMS_ENABLED ? { loader: coverImageLoader } : { unoptimized: true })}
    />
  );
}
