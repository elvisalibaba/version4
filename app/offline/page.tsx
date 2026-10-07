import Link from "next/link";
import { BookOpen, Home, RotateCw, WifiOff } from "lucide-react";

export const metadata = {
  title: "Mode hors ligne",
  description: "Page de secours Holistique Books lorsque le réseau est indisponible.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-[100dvh] bg-night-50 px-4 py-10 text-slate-950">
      <section className="mx-auto grid min-h-[72dvh] w-full max-w-3xl place-items-center">
        <div className="w-full rounded-md border border-rule bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-night-950 text-white">
              <WifiOff className="h-6 w-6" />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-brand-600">Mode hors ligne</p>
              <h1 className="max-w-xl font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Holistique reste ouvert, même sans réseau.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Les pages publiques déjà visitees peuvent rester disponibles. Les achats, paiements, comptes et lectures securisees reprennent des que la connexion revient.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <a
                href=""
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-night-950 px-4 text-sm font-bold text-white"
              >
                <RotateCw className="h-4 w-4" />
                Reessayer
              </a>
              <Link
                href="/home"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-white px-4 text-sm font-bold text-slate-900"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Link>
              <Link
                href="/librairie"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-white px-4 text-sm font-bold text-slate-900"
              >
                <BookOpen className="h-4 w-4" />
                Librairie
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
