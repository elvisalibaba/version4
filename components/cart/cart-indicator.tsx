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
      className={`hb-cart-badge grid min-w-[1.15rem] place-items-center rounded-sm bg-brand-600 px-1 text-[0.68rem] font-bold leading-[1.15rem] text-white ${bump ? "is-bumping" : ""} ${className}`}
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
      className="relative grid h-11 w-11 place-items-center rounded-sm text-night-900 transition hover:bg-paper-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      aria-label={count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
    >
      <span className="relative">
        <ShoppingCart aria-hidden="true" className="h-5 w-5" />
        <CartCountBadge className="absolute -right-2.5 -top-2" />
      </span>
    </Link>
  );
}
