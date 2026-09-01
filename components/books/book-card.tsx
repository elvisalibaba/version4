"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { FavoriteBookButton } from "@/components/books/favorite-book-button";

type Book = { id: string; title: string; description: string | null; price: number; currency_code?: string; display_price_label?: string; cover_signed_url?: string | null; author_name?: string; rating_avg?: number | null; ratings_count?: number | null; is_free?: boolean; is_favorite?: boolean; offer_summary_label?: string };

export function BookCard({ book }: { book: Book }) {
  const href = `/book/${book.id}`;
  const price = book.display_price_label ?? (book.price <= 0 ? "Gratuit" : `${book.price.toFixed(2)} ${book.currency_code ?? "USD"}`);

  return (
    <article className="group min-w-0">
      <div className="relative mx-auto w-full max-w-[270px] sm:max-w-none">
        <Link href={href} aria-label={`Découvrir ${book.title}`} className="relative block aspect-[2/3] overflow-hidden rounded-[.35rem_1rem_1rem_.35rem] bg-[#1b3f2e] shadow-[0_18px_35px_rgba(47,37,27,.18)] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-[.4deg] group-hover:shadow-[0_25px_45px_rgba(47,37,27,.24)]">
          {book.cover_signed_url ? <Image src={book.cover_signed_url} alt={book.title} fill sizes="(max-width: 640px) 70vw, (max-width: 1024px) 30vw, 220px" className="object-cover" /> : <div className="flex h-full flex-col justify-between bg-[linear-gradient(145deg,#173d2c_0%,#27634a_62%,#d06a45_62%)] p-6 text-white"><span className="text-[.6rem] font-bold uppercase tracking-[.22em] text-[#f3c66e]">Holistique Books</span><strong className="font-serif text-2xl leading-tight">{book.title}</strong><span className="text-xs">{book.author_name ?? "Auteur Holistique"}</span></div>}
          <span className="absolute inset-y-0 left-0 w-2 bg-black/15 shadow-[3px_0_7px_rgba(0,0,0,.18)]" />
        </Link>
        <div className="absolute right-3 top-3"><FavoriteBookButton bookId={book.id} initialIsFavorite={book.is_favorite} compact /></div>
        <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[.65rem] font-bold uppercase tracking-wide shadow-sm ${book.is_free ? "bg-[#e8ac42] text-[#173d2c]" : "bg-white/95 text-[#173d2c]"}`}>{book.offer_summary_label ?? (book.is_free ? "Lecture gratuite" : "eBook")}</span>
      </div>
      <div className="mx-auto mt-5 max-w-[270px] sm:max-w-none">
        <p className="text-[.68rem] font-bold uppercase tracking-[.16em] text-[#b85135]">{book.author_name ?? "Auteur Holistique"}</p>
        <h3 className="mt-1.5 line-clamp-2 font-serif text-xl leading-tight text-[#17231d]"><Link href={href} className="hover:text-[#b85135]">{book.title}</Link></h3>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#ddd1c0] pt-3">
          <span className="flex items-center gap-1 text-sm font-bold"><Star className="h-3.5 w-3.5 fill-[#e8ac42] text-[#e8ac42]" />{book.rating_avg ? book.rating_avg.toFixed(1) : "Nouveau"}</span>
          <Link href={href} className="flex items-center gap-1 text-sm font-bold text-[#173d2c]">{price}<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </article>
  );
}
