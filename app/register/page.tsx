import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { isUuidLike, normalizeAffiliateCode, normalizeAffiliateSourceType } from "@/lib/affiliate";

type RegisterPageProps = {
  searchParams: Promise<{
    role?: string;
    ref?: string;
    source?: string;
    bookId?: string;
    planId?: string;
    packId?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { role, ref, source, bookId, planId, packId } = await searchParams;
  const selectedRole = role === "author" ? "author" : "reader";
  const affiliateCode = normalizeAffiliateCode(ref);
  const affiliateSourceType = normalizeAffiliateSourceType(source);
  const affiliateSourceBookId = affiliateSourceType === "book" && isUuidLike(bookId) ? bookId : null;
  const candidatePlanId = planId ?? packId;
  const affiliateSourcePlanId = affiliateSourceType === "plan" && isUuidLike(candidatePlanId) ? candidatePlanId : null;

  return (
    <section className="bg-[#eaeded]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-[440px] space-y-4">
          <RegisterForm
            initialRole={selectedRole}
            affiliateCode={affiliateCode}
            affiliateSourceType={affiliateSourceType}
            affiliateSourceBookId={affiliateSourceBookId}
            affiliateSourcePlanId={affiliateSourcePlanId}
          />
          <div className="rounded-2xl border border-[#d5d9d9] bg-white px-5 py-4 text-center text-sm text-[#565959] shadow-sm">
            Vous avez deja un compte ?{" "}
            <Link href="/login" className="font-semibold text-[#007185] transition hover:text-[#c7511f] hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
