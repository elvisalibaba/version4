import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(next);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="mx-auto max-w-xl px-0 py-3 sm:px-6 sm:py-10">
        <div className="rounded-[24px] border border-[#eadfd4] bg-[#fdfaf6] p-5 text-center shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:rounded-[36px] sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e9] text-[#b5533d]">
            <KeyRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#171717]">Ce lien n’est plus actif</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f665e]">Le lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau pour continuer.</p>
          <Link href={withNextPath("/forgot-password", nextPath)} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#171717] px-6 text-sm font-semibold text-white hover:bg-[#332c27]">
            Recevoir un nouveau lien
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-0 py-3 sm:px-6 sm:py-10">
      <ResetPasswordForm nextPath={nextPath} />
    </section>
  );
}
