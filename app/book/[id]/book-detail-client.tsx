"use client";

import { useState } from "react";
import { ReaderPopup } from "@/components/reader/reader-popup";

type BookDetailClientProps = {
  bookId: string;
  title: string;
  description: string | null;
  price: number;
};

export function BookDetailClient({ bookId, title, description, price }: BookDetailClientProps) {
  const [readerOpen, setReaderOpen] = useState(false);
  const isFree = price <= 0;

  return (
    <>
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-slate-600">{description ?? "No description"}</p>
        <p className="text-xl font-semibold text-emerald-700">{isFree ? "Gratuit (0$)" : `$${price.toFixed(2)}`}</p>
        <div className="flex gap-3">
          {!isFree && <button className="rounded-md bg-slate-900 px-4 py-2 text-white">Add to Cart</button>}
          <button className="rounded-md bg-emerald-600 px-4 py-2 text-white" onClick={() => setReaderOpen(true)}>
            {isFree ? "Lire gratuitement" : "Read"}
          </button>
        </div>
        {isFree && <p className="text-sm text-slate-500">Compte lecteur requis pour ouvrir la lecture.</p>}
      </section>
      <ReaderPopup bookId={bookId} open={readerOpen} onClose={() => setReaderOpen(false)} />
    </>
  );
}
