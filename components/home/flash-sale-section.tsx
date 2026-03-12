"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublishedBook } from "@/lib/books";

type FlashSaleSectionProps = {
  books: PublishedBook[];
};

export function FlashSaleSection({ books }: FlashSaleSectionProps) {
  const dealBooks: Array<PublishedBook | null> = books.length > 0 ? books.slice(6, 9) : Array.from({ length: 3 }, () => null);
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const diff = Math.max(0, next.getTime() - now.getTime());

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (value: number) => value.toString().padStart(2, "0");
      setTimeLeft({
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo(
    () => [
      { label: "Heures", value: timeLeft.hours },
      { label: "Mins", value: timeLeft.minutes },
      { label: "Secs", value: timeLeft.seconds },
    ],
    [timeLeft],
  );

  return (
    <section className="hb-section">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="hb-flash-panel hb-flash-center">
          <p className="hb-kicker">Flash sale</p>
          <h2 className="hb-title text-2xl sm:text-3xl">Offres eclair sur nos meilleurs titres.</h2>
          <p className="hb-muted mt-2 text-sm">
            Des promotions limitees pour enrichir votre bibliotheque. Profitez-en avant la fin du compte a rebours.
          </p>
          <div className="hb-countdown mt-5">
            {countdown.map((item) => (
              <div key={item.label} className="hb-countdown-card">
                <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {dealBooks.map((book, index) => {
            const price = book?.price ?? 0;
            const salePrice = price > 0 ? price * 0.8 : price;
            const discountLabel = price > 0 ? "20% off" : "Offre";

            return (
              <Link key={book?.id ?? `deal-${index}`} href={book ? `/book/${book.id}` : "/librairie"} className="hb-sale-card">
                <span className="hb-sale-badge">{discountLabel}</span>
                <div className="hb-sale-cover">
                  {book?.cover_signed_url ? (
                    <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">
                      Offre du jour
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{book?.title ?? "Selection premium"}</p>
                  <p className="mt-1 text-xs text-slate-500">{book?.author_name ?? "Equipe Holistique"}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="hb-price">{price <= 0 ? "Gratuit" : `$${salePrice.toFixed(2)}`}</span>
                    {price > 0 ? <span className="text-slate-400 line-through">${price.toFixed(2)}</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
