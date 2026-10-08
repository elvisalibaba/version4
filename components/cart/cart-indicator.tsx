"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, onCartAdded, useCart } from "@/lib/cart";

/** Pastille qui rebondit à chaque ajout. */
export function CartCountBadge({ className = "" }: { className?: string }) {
  const count = cartCount(useCart());
  const [bump, setBump] = useState(0);

  useEffect(() => onCartAdded(() => setBump((value) => value + 1)), []);

  if (count === 0) return null;

  return (
    <span
      key={bump}
      className={`hb-cart-badge grid min-w-[1.15rem] place-items-center rounded-full bg-brand-deep px-1 text-[0.68rem] font-bold leading-[1.15rem] text-white ${bump ? "is-bumping" : ""} ${className}`}
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Lien panier du header, cible de l'animation « vol vers le panier ». */
export function CartIndicator() {
  const count = cartCount(useCart());

  return (
    <Link
      href="/cart"
      data-cart-target
      className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-ink px-3 text-sm font-semibold text-white transition-colors hover:bg-ink-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2 sm:px-4"
      aria-label={count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
    >
      <ShoppingCart aria-hidden="true" className="h-4 w-4" />
      <span aria-hidden="true" className="hidden sm:inline">Panier</span>
      {count > 0 ? <span aria-hidden="true" className="tabular-nums">· {count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
