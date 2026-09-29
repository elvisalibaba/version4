import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCurrentUserProfile } from "@/lib/auth";
import { getSafeNextPath } from "@/lib/safe-next-path";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; next?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const profile = await getCurrentUserProfile();

  if (profile) redirect(nextPath);

  const email = params.email?.trim() ?? "";
  if (!email) redirect("/register");

  return (
    <section className="mx-auto max-w-3xl px-0 py-4 sm:px-6 sm:py-10 lg:py-14">
      <VerifyEmailForm email={email} nextPath={nextPath} />
    </section>
  );
}
