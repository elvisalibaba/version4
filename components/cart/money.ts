import type { CartItem } from "@/lib/cart";

export function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

/** Une commande EasyPay se paie dans une seule devise : on regroupe par devise. */
export function subtotalsByCurrency(items: CartItem[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.currencyCode, (totals.get(item.currencyCode) ?? 0) + item.unitPrice * item.quantity);
  }
  return Array.from(totals, ([currencyCode, total]) => ({ currencyCode, total }));
}
