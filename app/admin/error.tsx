"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <section
      role="alert"
      aria-labelledby="admin-error-title"
      className="rounded-[1.35rem] border border-rose-200 bg-[linear-gradient(180deg,#fffafa,#fff5f5)] p-5 shadow-[0_18px_44px_rgba(159,18,57,0.08)] sm:rounded-[2rem] sm:p-8"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
        <TriangleAlert aria-hidden="true" className="h-6 w-6" />
      </span>

      <h1 id="admin-error-title" className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
        Cette vue administrateur n’a pas pu être chargée
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
        Vos données n’ont pas été modifiées. Réessayez le chargement ou revenez à la vue d’ensemble de l’administration.
      </p>

      {error.digest ? <p className="mt-3 text-xs text-slate-500">Référence technique : {error.digest}</p> : null}

      <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2 sm:rounded-full"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e4d7c6] bg-white px-5 text-sm font-semibold text-[#26221d] transition hover:border-[#ccbba7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146eb4] focus-visible:ring-offset-2 sm:rounded-full"
        >
          Vue d’ensemble
        </Link>
      </div>
    </section>
  );
}
