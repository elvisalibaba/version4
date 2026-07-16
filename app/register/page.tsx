import Link from "next/link";
import { BookHeart, PenTool, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { isUuidLike, normalizeAffiliateCode, normalizeAffiliateSourceType } from "@/lib/affiliate";
import { getCurrentUserProfile } from "@/lib/auth";
import { getSafeNextPath, withNextPath } from "@/lib/safe-next-path";

type RegisterPageProps = {
  searchParams: Promise<{
    role?: string;
    ref?: string;
    source?: string;
    bookId?: string;
    planId?: string;
    packId?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(nextPath);
  }

  const selectedRole = params.role === "author" ? "author" : "reader";
  const affiliateCode = normalizeAffiliateCode(params.ref);
  const affiliateSourceType = normalizeAffiliateSourceType(params.source);
  const affiliateSourceBookId = affiliateSourceType === "book" && isUuidLike(params.bookId) ? params.bookId : null;
  const candidatePlanId = params.planId ?? params.packId;
  const affiliateSourcePlanId = affiliateSourceType === "plan" && isUuidLike(candidatePlanId) ? candidatePlanId : null;

  return (
    <section className="mx-auto max-w-6xl px-0 py-3 sm:px-6 sm:py-8 lg:py-12">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-10">
        <aside className="order-last hidden overflow-hidden rounded-[36px] border border-[#eadfd4] bg-[linear-gradient(155deg,#fffaf5,#f3e9df)] p-9 shadow-[0_20px_55px_rgba(23,23,23,0.07)] lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f0dfd3] bg-white/80 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#9a583f]">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Bienvenue
          </span>
          <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#171717]">
            Votre espace de lecture commence ici.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#6f665e]">
            Créez votre compte en quelques instants. Les préférences et les détails de profil pourront évoluer avec vous.
          </p>

          <div className="mt-7 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd4] bg-white/75 p-4">
              <BookHeart aria-hidden="true" className="h-5 w-5 text-[#c05f43]" />
              <p className="text-sm font-semibold text-[#302b27]">Une bibliothèque personnelle et synchronisée</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd4] bg-white/75 p-4">
              <PenTool aria-hidden="true" className="h-5 w-5 text-[#171717]" />
              <p className="text-sm font-semibold text-[#302b27]">Un parcours dédié pour publier comme auteur</p>
            </div>
          </div>
        </aside>

        <div className="order-first space-y-4 lg:order-none">
          <RegisterForm
            initialRole={selectedRole}
            affiliateCode={affiliateCode}
            affiliateSourceType={affiliateSourceType}
            affiliateSourceBookId={affiliateSourceBookId}
            affiliateSourcePlanId={affiliateSourcePlanId}
            nextPath={nextPath}
          />

          <div className="rounded-[22px] border border-[#eadfd4] bg-white/90 px-5 py-4 text-center text-sm text-[#6f665e] shadow-[0_14px_35px_rgba(23,23,23,0.05)]">
            Vous avez déjà un compte ?{" "}
            <Link
              href={withNextPath("/login", nextPath)}
              className="font-bold text-[#171717] underline decoration-[#ff7a5c]/50 underline-offset-4 transition hover:text-[#b5533d]"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
