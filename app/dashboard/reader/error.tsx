"use client";

import Link from "next/link";
import { AlertTriangle, BookOpen, RefreshCw } from "lucide-react";

export default function ReaderDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      aria-labelledby="reader-dashboard-error-title"
      className="rounded-[1.5rem] border border-[#f1c9bf] bg-[#fff8f5] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)] sm:rounded-[2rem] sm:p-8"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0ec] text-[#a84b38]">
        <AlertTriangle aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#a84b38]">Espace lecteur</p>
      <h1 id="reader-dashboard-error-title" className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#171717] sm:text-3xl">
        Votre bibliothèque n’a pas pu être chargée.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f665e]">
        Vos livres et vos notes restent enregistrés. Réessayez maintenant ou continuez avec les lectures gratuites.
      </p>

      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#171717] px-5 text-sm font-bold text-white transition hover:bg-[#0f172a]"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/library"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e7ddd1] bg-white px-5 text-sm font-bold text-[#26221d] transition hover:border-[#d5c8bb]"
        >
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          Lire un livre gratuit
        </Link>
      </div>
    </section>
  );
}
