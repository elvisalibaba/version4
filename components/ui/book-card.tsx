"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cx } from "@/components/ui/cx";
import { PriceTag } from "@/components/ui/price-tag";
import { RatingStars } from "@/components/ui/rating-stars";
import { trackBookEngagement } from "@/lib/book-engagement-client";
import { CHECKOUT_BOOK_FORMATS, findPreferredFormat, getBookFormatLabel, isCheckoutBookFormat, sortFormatsByPriority, type CheckoutBookFormat } from "@/lib/book-formats";
import { addToCart } from "@/lib/cart";
import type { BookFormatType } from "@/types/api";

type CardFormat = { format: BookFormatType; price: number | string; currency_code?: string; is_published?: boolean };

export type BookCardBook = {
  id: string;
  title: string;
  author_name?: string | null;
  cover_signed_url?: string | null;
  price: number;
  currency_code?: string;
  rating_avg?: number | null;
  ratings_count?: number | null;
  is_free?: boolean;
  is_single_sale_enabled?: boolean;
  is_subscription_available?: boolean;
  has_sample?: boolean;
  work_type?: string | null;
  book_formats?: CardFormat[];
  formats?: CardFormat[];
  media_editions?: Array<{ media_type: string }>;
};

const PLACEHOLDER_TONES = [
  "bg-ink text-white",
  "bg-brand-deep text-white",
  "bg-brand text-black",
  "bg-brand-tint text-ink",
];

function placeholderTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length];
}

function publishedFormats(book: BookCardBook) {
  return (book.book_formats ?? book.formats ?? []).filter((format) => format.is_published !== false);
}

function formatBadge(book: BookCardBook) {
  if (book.work_type === "magazine") return "Magazine";
  const formats = sortFormatsByPriority(publishedFormats(book));
  if (formats[0]) return getBookFormatLabel(formats[0].format);
  if (book.media_editions?.some((edition) => edition.media_type === "audiobook")) return "Audio";
  return null;
}

function accessBadge(book: BookCardBook) {
  if (book.is_free) return { label: "Gratuit", tone: "success" as const };
  if (book.is_subscription_available) return { label: "Inclus dans l’abonnement", tone: "brand" as const };
  if (book.has_sample) return { label: "Extrait gratuit", tone: "brand" as const };
  return null;
}

function cartFormat(book: BookCardBook) {
  if (book.is_free || book.is_single_sale_enabled === false) return null;
  const candidates = publishedFormats(book).filter((format): format is CardFormat & { format: CheckoutBookFormat } => isCheckoutBookFormat(format.format) && Number(format.price) > 0);
  return findPreferredFormat(candidates, CHECKOUT_BOOK_FORMATS);
}

/** Carte livre du catalogue : couverture, format, titre, auteur, note, accès, prix et ajout au panier. */
export function BookCard({ book, priority = false, tone = "light" }: { book: BookCardBook; priority?: boolean; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const href = book.is_free ? `/book/${book.id}?read=1` : `/book/${book.id}`;
  const coverId = `cover-${book.id}`;
  const format = formatBadge(book);
  const access = accessBadge(book);
  const purchasable = cartFormat(book);
  const subscriptionOnly = !book.is_free && book.is_single_sale_enabled === false && book.is_subscription_available;
  const trackClick = () => trackBookEngagement({ bookId: book.id, eventType: "catalog_click", source: "book_card" });

  return (
    <article className="group flex min-w-0 flex-col">
      <Link
        id={coverId}
        href={href}
        onClick={trackClick}
        tabIndex={-1}
        aria-hidden="true"
        className="hb-card-cover relative block aspect-[2/3] overflow-hidden rounded-xl shadow-[var(--shadow-cover)]"
      >
        {book.cover_signed_url ? (
          <Image src={book.cover_signed_url} alt="" fill priority={priority} sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px" className="object-cover" />
        ) : (
          <span className={cx("flex h-full flex-col justify-end p-4", placeholderTone(book.id))}>
            <strong className="line-clamp-4 font-display text-lg font-extrabold leading-snug tracking-[-0.02em]">{book.title}</strong>
            <span className="mt-2 line-clamp-1 text-xs opacity-80">{book.author_name ?? "Holistique Books"}</span>
          </span>
        )}
        {format ? <Badge tone="light" className="absolute left-3 top-3 shadow-sm">{format}</Badge> : null}
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <h3 className={cx("line-clamp-2 font-display text-[0.98rem] font-bold leading-snug", dark ? "text-white" : "text-ink")}>
          <Link href={href} onClick={trackClick} className="rounded-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep">
            {book.title}
          </Link>
        </h3>
        <p className={cx("line-clamp-1 text-[0.82rem]", dark ? "text-muted-dark" : "text-muted")}>{book.author_name ?? "Holistique Books"}</p>
        <RatingStars value={book.rating_avg} count={book.ratings_count} tone={tone} />
        {access ? <Badge tone={access.tone} className="mt-0.5 self-start normal-case tracking-normal">{access.label}</Badge> : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <PriceTag
            amount={purchasable ? Number(purchasable.price) : book.price}
            currencyCode={purchasable?.currency_code ?? book.currency_code}
            isFree={book.is_free}
            label={subscriptionOnly ? "Abonnement" : null}
            tone={tone}
          />
          {purchasable ? (
            <AddToCartIconButton
              sourceId={coverId}
              tone={tone}
              item={{
                bookId: book.id,
                format: purchasable.format,
                title: book.title,
                authorName: book.author_name ?? null,
                coverUrl: book.cover_signed_url ?? null,
                unitPrice: Number(purchasable.price),
                currencyCode: purchasable.currency_code ?? book.currency_code ?? "USD",
              }}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function AddToCartIconButton({ item, sourceId, tone }: { item: Parameters<typeof addToCart>[0]; sourceId: string; tone: "light" | "dark" }) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const source = document.getElementById(sourceId) ?? event.currentTarget;
    if (!addToCart(item, source)) return;
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Ajouter « ${item.title} » au panier (${getBookFormatLabel(item.format)})`}
      className={cx(
        "grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        tone === "dark"
          ? "border-white/30 text-white hover:bg-brand hover:text-black focus-visible:ring-brand-soft focus-visible:ring-offset-ink"
          : "border-brand-tint text-brand-deep hover:bg-brand-deep hover:text-white focus-visible:ring-brand-deep",
      )}
    >
      {added ? <Check aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
}
