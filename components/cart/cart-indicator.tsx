"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartCount, onCartAdded, useCart } from "@/lib/cart";

/** Pastille rouge qui rebondit à chaque ajout. */
export function CartCountBadge({ className = "" }: { className?: string }) {
  const count = cartCount(useCart());
  const [bump, setBump] = useState(0);

  useEffect(() => onCartAdded(() => setBump((value) => value + 1)), []);

  if (count === 0) return null;

  return (
    <span
      key={bump}
      className={`hb-cart-badge grid min-w-[1.15rem] place-items-center rounded-full bg-brand-600 px-1 text-[0.68rem] font-bold leading-[1.15rem] text-white ${bump ? "is-bumping" : ""} ${className}`}
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
      className="relative flex h-11 items-center gap-1.5 rounded-md px-2 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label={count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
    >
      <span className="relative">
        <ShoppingCart className="h-6 w-6" />
        <CartCountBadge className="absolute -right-2 -top-1.5" />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Panier</span>
    </Link>
  );
}
