"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearPaidOrderFromCart } from "@/lib/cart";

const REFRESH_EVERY_MS = 5000;
const MAX_REFRESHES = 12;

/** Vide le panier une fois payé et rafraîchit la page tant que le paiement est en vérification. */
export function PaymentReturnEffects({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status === "paid") clearPaidOrderFromCart(orderId);
  }, [orderId, status]);

  useEffect(() => {
    if (status !== "pending") return;
    let refreshes = 0;
    const timer = window.setInterval(() => {
      refreshes += 1;
      router.refresh();
      if (refreshes >= MAX_REFRESHES) window.clearInterval(timer);
    }, REFRESH_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [status, router]);

  return null;
}
