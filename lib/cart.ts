"use client";

import { useSyncExternalStore } from "react";
import { isPhysicalBookFormat, type CheckoutBookFormat } from "@/lib/book-formats";

/**
 * Panier côté navigateur (localStorage). La commande réelle n'est créée côté
 * API qu'au moment du paiement : le panier ne contient donc aucun prix qui
 * fasse foi, seulement un affichage indicatif recalculé par le backend.
 */
export type CartItem = {
  bookId: string;
  format: CheckoutBookFormat;
  title: string;
  authorName: string | null;
  coverUrl: string | null;
  unitPrice: number;
  currencyCode: string;
  quantity: number;
  addedAt: number;
};

export type CartAddedDetail = { item: CartItem; sourceRect: DOMRect | null };

const STORAGE_KEY = "hb_cart_v1";
export const PENDING_ORDER_KEY = "hb_cart_pending_order";
const ADDED_EVENT = "hb-cart-added";
const MAX_QUANTITY = 100;
const MAX_LINES = 50;
const EMPTY: CartItem[] = [];

const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? (parsed as CartItem[]).filter((item) => item && typeof item.bookId === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Navigation privée ou stockage plein : le panier reste en mémoire.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function lineKey(item: Pick<CartItem, "bookId" | "format">) {
  return `${item.bookId}:${item.format}`;
}

export function addToCart(input: Omit<CartItem, "quantity" | "addedAt">, sourceElement?: Element | null) {
  const items = read();
  const key = lineKey(input);
  const existing = items.find((item) => lineKey(item) === key);
  // Un livre numérique ne s'achète qu'une fois : seule la quantité des formats imprimés augmente.
  const stackable = isPhysicalBookFormat(input.format);

  let added: CartItem;
  if (existing) {
    added = { ...existing, ...input, quantity: stackable ? Math.min(existing.quantity + 1, MAX_QUANTITY) : 1 };
    write(items.map((item) => (lineKey(item) === key ? added : item)));
  } else {
    if (items.length >= MAX_LINES) return null;
    added = { ...input, quantity: 1, addedAt: Date.now() };
    write([...items, added]);
  }

  window.dispatchEvent(
    new CustomEvent<CartAddedDetail>(ADDED_EVENT, {
      detail: { item: added, sourceRect: sourceElement?.getBoundingClientRect() ?? null },
    }),
  );
  return added;
}

export function setCartQuantity(key: string, quantity: number) {
  const items = read();
  write(
    items.map((item) =>
      lineKey(item) === key
        ? { ...item, quantity: isPhysicalBookFormat(item.format) ? Math.max(1, Math.min(quantity, MAX_QUANTITY)) : 1 }
        : item,
    ),
  );
}

export function removeFromCart(key: string) {
  write(read().filter((item) => lineKey(item) !== key));
}

export function removeCartLines(keys: string[]) {
  const set = new Set(keys);
  write(read().filter((item) => !set.has(lineKey(item))));
}

export function onCartAdded(handler: (detail: CartAddedDetail) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<CartAddedDetail>).detail);
  window.addEventListener(ADDED_EVENT, listener);
  return () => window.removeEventListener(ADDED_EVENT, listener);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Au retour d'un paiement confirmé : retire du panier les lignes de cette commande. */
export function clearPaidOrderFromCart(orderId: string) {
  try {
    const raw = window.localStorage.getItem(PENDING_ORDER_KEY);
    const pending = raw ? (JSON.parse(raw) as { orderId?: string; keys?: string[] }) : null;
    if (pending?.orderId !== orderId || !Array.isArray(pending.keys)) return;
    removeCartLines(pending.keys);
    window.localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // Rien à nettoyer.
  }
}
