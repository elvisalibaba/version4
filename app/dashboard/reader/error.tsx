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
      className="rounded-md border border-brand-200 bg-paper p-5 shadow-[0_18px_42px_rgba(14, 17, 36,0.05)] sm:rounded-md sm:p-8"
    >
      <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-50 text-brand-600">
        <AlertTriangle aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[0.7rem] font-bold text-brand-600">Espace lecteur</p>
      <h1 id="reader-dashboard-error-title" className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900 sm:text-3xl">
        Votre bibliothèque n’a pas pu être chargée.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Vos livres et vos notes restent enregistrés. Réessayez maintenant ou continuez avec les lectures gratuites.
      </p>

      <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-night-900 px-5 text-sm font-bold text-white transition hover:bg-night-800"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/library"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-rule bg-white px-5 text-sm font-bold text-slate-900 transition hover:border-rule-strong"
        >
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          Lire un livre gratuit
        </Link>
      </div>
    </section>
  );
}
