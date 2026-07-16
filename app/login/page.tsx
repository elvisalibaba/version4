import Link from "next/link";
import { BookOpen, PenTool, ShieldCheck } from "lucide-react";
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
      <div className="grid gap-4 sm:gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10">
        <aside className="order-last hidden overflow-hidden rounded-[24px] border border-[#eadfd4] bg-[linear-gradient(155deg,#fffaf5,#f5ede4)] p-5 shadow-[0_20px_55px_rgba(23,23,23,0.07)] sm:p-8 lg:order-none lg:block lg:rounded-[36px] lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f0dfd3] bg-white/80 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a583f]">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Votre espace privé
          </span>

          <h2 className="mt-5 font-serif text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#171717] sm:text-3xl">
            Lire, retrouver et publier sans quitter votre univers éditorial.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#6f665e]">
            Un compte unique relie votre bibliothèque et, si vous publiez, votre studio auteur.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd4] bg-white/75 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0e9] text-[#c05f43]">
                <BookOpen aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-[#302b27]">Vos lectures au même endroit</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd4] bg-white/75 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#171717] text-white">
                <PenTool aria-hidden="true" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-[#302b27]">Un studio dédié aux auteurs</p>
            </div>
          </div>
        </aside>

        <div className="order-first space-y-4 lg:order-none">
          <LoginForm nextPath={nextPath} notice={notice} />

          <div className="rounded-[22px] border border-[#eadfd4] bg-white/90 px-5 py-4 text-center text-sm text-[#6f665e] shadow-[0_14px_35px_rgba(23,23,23,0.05)]">
            Nouveau chez Holistique Books ?{" "}
            <Link
              href={withNextPath("/register", nextPath)}
              className="font-bold text-[#171717] underline decoration-[#ff7a5c]/50 underline-offset-4 transition hover:text-[#b5533d]"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
