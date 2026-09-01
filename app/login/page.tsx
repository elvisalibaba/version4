import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Check, PenTool, Quote, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUserProfile } from "@/lib/auth";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    verification?: string;
    reset?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre bibliothèque ou à votre espace auteur Holistique Books.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(nextPath);
  }

  const notice =
    params.verification === "failed"
      ? {
          tone: "error" as const,
          text: "Le lien de confirmation est invalide ou a expiré. Demandez un nouveau lien ou reconnectez-vous.",
        }
      : params.reset === "success"
        ? {
            tone: "success" as const,
            text: "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.",
          }
        : null;

  return (
    <section className="mx-auto max-w-6xl px-0 py-3 sm:px-6 sm:py-8 lg:py-12">
      <div className="grid overflow-hidden rounded-[28px] border border-[#d9cebd] bg-[#fffaf2] shadow-[0_30px_90px_rgba(45,35,25,.12)] lg:min-h-[680px] lg:grid-cols-[1.02fr_.98fr] lg:rounded-[42px]">
        <aside className="relative order-last hidden overflow-hidden bg-[#173d2c] p-8 text-white lg:order-none lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[62px] border-[#e8ac42]" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-64 -skew-x-12 bg-[#c95d3e]" />
          <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#f2c66f]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Votre espace privé
          </span>

          <h2 className="mt-8 max-w-md font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.04em]">
            Votre bibliothèque et vos projets, au même endroit.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
            Retrouvez vos livres, votre progression de lecture et tous les outils nécessaires pour publier avec exigence.
          </p>

          <div className="mt-9 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[.06] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8ac42] text-[#173d2c]">
                <BookOpen aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold">Vos lectures et favoris synchronisés</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[.06] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#c95d3e] text-white">
                <PenTool aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold">Un véritable studio professionnel pour les auteurs</p>
            </div>
          </div>
          </div>
          <blockquote className="relative mt-10 border-l border-[#f2c66f]/50 pl-5">
            <Quote className="h-5 w-5 text-[#f2c66f]" />
            <p className="mt-3 font-serif text-lg leading-7 text-white/88">Des voix africaines, des œuvres qui voyagent et une lecture pensée pour vous.</p>
            <p className="mt-3 flex items-center gap-2 text-[.65rem] font-bold uppercase tracking-[.18em] text-white/45"><Check className="h-3.5 w-3.5" /> Holistique Books</p>
          </blockquote>
        </aside>

        <div className="order-first flex flex-col justify-center space-y-4 p-3 sm:p-8 lg:order-none lg:p-12">
          <LoginForm nextPath={nextPath} notice={notice} />

          <div className="px-5 py-3 text-center text-sm text-[#6f665e]">
            Nouveau chez Holistique Books ?{" "}
            <Link
              href={withNextPath("/register", nextPath)}
              className="font-bold text-[#173d2c] underline decoration-[#e8ac42] underline-offset-4 transition hover:text-[#b5533d]"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
