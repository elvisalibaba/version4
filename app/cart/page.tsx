import Link from "next/link";
import { ArrowRight, BookOpen, LockKeyhole, ShoppingBag, Sparkles } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function CartPage() {
  const profile = await getCurrentUserProfile();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-white shadow-2xl shadow-slate-300/40">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-12 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Espace panier
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">Un panier plus elegant, pret pour vos prochaines lectures.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Retrouvez ici vos selections, vos livres gratuits et vos futurs achats dans une interface plus claire et plus moderne.
              </p>
            </div>

            {profile ? (
              <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100 backdrop-blur">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <p className="font-semibold">Session active</p>
                  <p>
                    Connecte en tant que <span className="font-semibold">{profile.name || profile.email}</span>. Vous pouvez acceder a vos lectures et a votre compte.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex max-w-xl items-start gap-3 rounded-2xl border border-amber-300/30 bg-white/10 px-4 py-4 text-sm text-slate-100 backdrop-blur">
                <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold">Connexion recommandee</p>
                  <p>
                    Les livres a 0$ sont gratuits a condition d avoir un compte. Connectez-vous puis cliquez sur <span className="font-semibold">Read</span> pour les lire.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/books"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-50"
              >
                <BookOpen className="h-4 w-4" />
                Parcourir les livres
              </Link>
              {profile ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Mon compte
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 self-start">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-white">Statut du panier</p>
              <p className="mt-2 text-3xl font-bold">0 livre</p>
              <p className="mt-2 text-sm text-slate-300">Votre panier est vide pour le moment. Explorez la librairie pour ajouter vos prochaines lectures.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm font-semibold text-amber-200">Acces rapide</p>
                <p className="mt-2 text-sm text-slate-300">Connectez-vous pour retrouver vos achats, votre bibliotheque et vos livres gratuits au meme endroit.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm font-semibold text-amber-200">Lecture instantanee</p>
                <p className="mt-2 text-sm text-slate-300">Les contenus gratuits restent accessibles apres connexion, sans parcours complique.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
