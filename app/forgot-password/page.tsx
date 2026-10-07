import { BookOpen, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUserProfile } from "@/lib/auth";
import { getSafeNextPath } from "@/lib/safe-next-path";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next);
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(nextPath);
  }

  return (
    <section className="mx-auto max-w-5xl px-0 py-3 sm:px-6 sm:py-8 lg:py-12">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-10">
        <aside className="order-last hidden rounded-xl border border-slate-200 bg-slate-50 p-9 shadow-md lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-600">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Accès protégé
          </span>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-900">
            Un nouveau mot de passe, sans perdre votre bibliothèque.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Le lien reçu par email vous ramènera dans un espace sécurisé pour choisir un nouveau mot de passe.
          </p>
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/75 p-4">
            <BookOpen aria-hidden="true" className="h-5 w-5 text-brand-600" />
            <p className="text-sm font-semibold text-slate-800">Vos livres et vos repères restent inchangés</p>
          </div>
        </aside>

        <div className="order-first lg:order-none">
          <ForgotPasswordForm nextPath={nextPath} />
        </div>
      </div>
    </section>
  );
}
