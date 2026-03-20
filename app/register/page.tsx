import Link from "next/link";
import { CheckCircle2, PenSquare, ShieldCheck, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

const benefitCards = [
  {
    icon: ShieldCheck,
    title: "Inscription plus fiable",
    text: "Le parcours est recentre sur les champs utiles pour reduire les blocages et clarifier les erreurs.",
  },
  {
    icon: PenSquare,
    title: "Onboarding auteur plus propre",
    text: "Le studio auteur demarre avec un vrai profil public, sans forcer toute la fiche des le premier ecran.",
  },
  {
    icon: Sparkles,
    title: "Interface plus premium",
    text: "Typographie, rythme vertical et densite ont ete reduits pour un rendu plus proche d un outil pro.",
  },
];

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.88fr_minmax(0,1fr)]">
        <div className="rounded-[34px] border border-[#201915] bg-[linear-gradient(180deg,#171717,#2d221c)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Compte unique
            </span>
            <div className="space-y-3">
              <h1 className="max-w-xl text-[2.1rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.8rem]">
                Un espace lecteur et auteur plus simple, plus net et plus credible.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-[0.95rem]">
                Le compte respecte votre logique Supabase actuelle tout en rendant la creation de profil plus legere, plus responsive et plus stable en production.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {benefitCards.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[26px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffd9cd]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <p className="text-sm leading-6 text-white/68">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <RegisterForm />
          <div className="rounded-[24px] border border-[#e7ddd1] bg-white/92 px-4 py-4 text-center text-sm text-[#6f665e] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            Vous avez deja un compte ?{" "}
            <Link href="/login" className="font-semibold text-[#171717] transition hover:text-[#ff6a4c]">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
