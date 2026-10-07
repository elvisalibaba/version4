"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { getBookFormatLabel } from "@/lib/book-formats";
import { cartCount, onCartAdded, prefersReducedMotion, useCart, type CartItem } from "@/lib/cart";
import { formatMoney, subtotalsByCurrency } from "@/components/cart/money";

const AUTO_CLOSE_MS = 7000;

/** Cible visible : l'icône du header, sinon l'onglet Panier de la barre mobile. */
function findCartTarget(): Element | null {
  const candidates = Array.from(document.querySelectorAll("[data-cart-target]"));
  return candidates.find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }) ?? null;
}

/** La couverture « vole » jusqu'au panier puis le panneau de confirmation s'ouvre. */
function flyToCart(item: CartItem, from: DOMRect | null): Promise<void> {
  const target = findCartTarget();
  if (!from || !target || prefersReducedMotion()) return Promise.resolve();

  const to = target.getBoundingClientRect();
  const width = Math.min(from.width, 120);
  const height = width * 1.5;
  const startX = from.left + from.width / 2 - width / 2;
  const startY = from.top + Math.min(from.height, height) / 2 - height / 2;
  const deltaX = to.left + to.width / 2 - (startX + width / 2);
  const deltaY = to.top + to.height / 2 - (startY + height / 2);

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = "hb-cart-ghost";
  Object.assign(ghost.style, { left: `${startX}px`, top: `${startY}px`, width: `${width}px`, height: `${height}px` });
  if (item.coverUrl) {
    const img = document.createElement("img");
    img.src = item.coverUrl;
    img.alt = "";
    ghost.appendChild(img);
  }
  document.body.appendChild(ghost);

  const animation = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate(${deltaX * 0.45}px, ${deltaY * 0.45 - 60}px) scale(0.6) rotate(-6deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12) rotate(-12deg)`, opacity: 0.35, offset: 1 },
    ],
    { duration: 720, easing: "cubic-bezier(0.55, 0, 0.3, 1)", fill: "forwards" },
  );

  return animation.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}

export function CartFeedback() {
  const items = useCart();
  const pathname = usePathname();
  const [added, setAdded] = useState<CartItem | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const close = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  }, []);

  useEffect(
    () =>
      onCartAdded(({ item, sourceRect }) => {
        void flyToCart(item, sourceRect).then(() => {
          setAdded(item);
          setOpen(true);
          window.clearTimeout(closeTimer.current);
          closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
        });
      }),
    [],
  );

  // On ferme le panneau quand on change de page.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const count = cartCount(items);
  const subtotals = subtotalsByCurrency(items);

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {open && added ? `${added.title} a été ajouté au panier. ${count} article${count > 1 ? "s" : ""} dans le panier.` : ""}
      </p>
      <div
        className={`hb-cart-sheet ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Article ajouté au panier"
        aria-hidden={!open}
        inert={!open}
        onMouseEnter={() => window.clearTimeout(closeTimer.current)}
        onMouseLeave={() => {
          if (open) closeTimer.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS / 2);
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <p className="flex items-center gap-2 text-[0.95rem] font-bold text-emerald-700">
            <CheckCircle2 className="hb-check-pop h-5 w-5" aria-hidden="true" />
            Ajouté au panier
          </p>
          <button type="button" onClick={close} className="-mr-1.5 grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {added ? (
          <div className="flex gap-4 px-5 py-4">
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded border border-slate-200 bg-night-900">
              {added.coverUrl ? <Image src={added.coverUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{added.title}</p>
              {added.authorName ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{added.authorName}</p> : null}
              <p className="mt-1 text-xs text-slate-500">{getBookFormatLabel(added.format)} · Qté {added.quantity}</p>
              <p className="mt-1.5 text-sm font-bold text-slate-900">{formatMoney(added.unitPrice, added.currencyCode)}</p>
            </div>
          </div>
        ) : null}

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <p className="flex items-baseline justify-between text-sm text-slate-700">
            <span>Sous-total ({count} article{count > 1 ? "s" : ""})</span>
            <span className="text-right font-bold text-slate-900">
              {subtotals.map((entry) => formatMoney(entry.total, entry.currencyCode)).join(" + ") || "—"}
            </span>
          </p>
          <div className="mt-4 grid gap-2">
            <Link href="/cart" onClick={close} className="cta-primary inline-flex min-h-11 items-center justify-center text-sm">
              Voir le panier et payer
            </Link>
            <button type="button" onClick={close} className="cta-secondary inline-flex min-h-11 items-center justify-center text-sm">
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
