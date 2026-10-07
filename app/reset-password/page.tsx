import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    next?: string;
    token?: string;
    email?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const token = params.token?.trim() ?? "";
  const email = params.email?.trim() ?? "";

  if (!token || !email) {
    return (
      <section className="mx-auto max-w-xl px-0 py-3 sm:px-6 sm:py-10">
        <div className="rounded-md border border-rule bg-paper p-5 text-center sm:rounded-md sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-paper text-brand-600">
            <KeyRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Ce lien n’est plus actif</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Le lien de réinitialisation est incomplet ou à expiré. Demandez-en un nouveau pour continuer.
          </p>
          <Link href={withNextPath("/forgot-password", nextPath)} className="mt-6 inline-flex h-11 items-center justify-center rounded-sm bg-night-900 px-6 text-sm font-semibold text-white hover:bg-slate-800">
            Recevoir un nouveau lien
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-0 py-3 sm:px-6 sm:py-10">
      <ResetPasswordForm nextPath={nextPath} token={token} email={email} />
    </section>
  );
}
