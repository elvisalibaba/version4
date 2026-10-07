"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { isPhysicalBookFormat } from "@/lib/book-formats";
import { addToCart, lineKey, useCart, type CartItem } from "@/lib/cart";

type Props = {
  item: Omit<CartItem, "quantity" | "addedAt">;
  /** Élément dont part l'animation (la couverture). Par défaut : le bouton. */
  sourceSelector?: string;
  className?: string;
  label?: string;
};

export function AddToCartButton({ item, sourceSelector, className = "", label = "Ajouter au panier" }: Props) {
  const items = useCart();
  const inCart = items.some((line) => lineKey(line) === lineKey(item));
  const [justAdded, setJustAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleClick() {
    const source = (sourceSelector ? document.querySelector(sourceSelector) : null) ?? buttonRef.current;
    if (!addToCart(item, source)) return;
    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={`hb-add-to-cart relative inline-flex items-center justify-center gap-2 overflow-hidden transition ${justAdded ? "is-added" : ""} ${className}`}
    >
      {justAdded ? (
        <>
          <Check className="hb-check-pop h-4 w-4" aria-hidden="true" />
          Ajouté au panier
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {inCart ? (isPhysicalBookFormat(item.format) ? "Ajouter un exemplaire" : "Déjà dans le panier") : label}
        </>
      )}
    </button>
  );
}
