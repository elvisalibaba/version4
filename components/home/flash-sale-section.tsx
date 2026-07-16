"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/book-offers";
import type { PublishedBook } from "@/lib/books";

type FlashSaleSectionProps = {
  books: Array<PublishedBook | null>;
  discountPercentage: number;
};

export function FlashSaleSection({ books, discountPercentage }: FlashSaleSectionProps) {
  const safeDiscountPercentage = Math.min(90, Math.max(0, discountPercentage));
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
          <p className="hb-kicker">Offres du jour</p>
          <h2 className="hb-title text-2xl sm:text-3xl">Des livres de transformation a prix doux, pour agir maintenant.</h2>
          <p className="hb-muted mt-2 text-sm">
            Profitez d une fenetre courte pour investir dans des lectures qui nourrissent la clarte, la foi et la progression personnelle.
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
          {books.map((book, index) => {
            const price = book?.price ?? 0;
            const salePrice = price > 0 ? price * ((100 - safeDiscountPercentage) / 100) : price;
            const discountLabel = price > 0 ? `-${safeDiscountPercentage}%` : book?.display_price_label ?? "Offre";

            return (
              <Link key={book?.id ?? `deal-${index}`} href={book ? `/book/${book.id}` : "/librairie"} className="hb-sale-card">
                <span className="hb-sale-badge">{discountLabel}</span>
                <div className="hb-sale-cover">
                  {book?.cover_signed_url ? (
                    <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">
                      Lecture a saisir
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{book?.title ?? "Selection premium"}</p>
                  <p className="mt-1 text-xs text-slate-500">{book?.author_name ?? "Equipe Holistique"}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="hb-price">{book ? formatMoney(salePrice, book.currency_code) : "Offre"}</span>
                    {price > 0 ? <span className="text-slate-400 line-through">{book ? formatMoney(price, book.currency_code) : null}</span> : null}
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
