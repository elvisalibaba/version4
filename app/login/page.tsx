import Link from "next/link";
import { BookOpen, PenTool, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUserProfile } from "@/lib/auth";

const lanes = [
  {
    icon: BookOpen,
    title: "Lecteur",
    text: "Bibliotheque, achats, historique et packs Premium depuis un espace plus compact.",
  },
  {
    icon: PenTool,
    title: "Auteur",
    text: "Catalogue, mises en ligne, ventes et pilotage du studio auteur dans une seule interface.",
  },
];

export default async function LoginPage() {
  const profile = await getCurrentUserProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="grid gap-5 lg:grid-cols-[0.92fr_minmax(0,1fr)]">
        <div className="rounded-[34px] border border-[#e7ddd1] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(249,245,239,0.95))] p-6 shadow-[0_26px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#a85b3f]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acces centralise
            </span>
            <div className="space-y-3">
              <h1 className="max-w-lg text-[2rem] font-semibold tracking-[-0.05em] text-[#171717] sm:text-[2.55rem]">
                Un point d entree unique pour lire, publier et administrer.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-[#6f665e] sm:text-[0.95rem]">
                Le compte ouvre automatiquement le bon espace selon le role stocke dans Supabase, sans multiplier les parcours.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            {lanes.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[26px] border border-[#ece3d7] bg-white/88 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#ff6a4c]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-[#171717]">{title}</h2>
                    <p className="text-sm leading-6 text-[#6f665e]">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <LoginForm />
          <div className="rounded-[24px] border border-[#e7ddd1] bg-white/92 px-4 py-4 text-center text-sm text-[#6f665e] shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-semibold text-[#171717] transition hover:text-[#ff6a4c]">
              Creer un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
