import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { PageHero } from "@/components/ui/page-hero";

export default function RegisterPage() {
  return (
    <section className="space-y-8">
      <PageHero
        kicker="Join"
        title="Entrez dans un ecosysteme ebook pense pour les lecteurs et les auteurs."
        description="Le compte reste branche sur votre logique Supabase actuelle, avec un onboarding plus riche, plus professionnel et plus utile pour l equipe admin."
      />
      <div className="mx-auto max-w-5xl space-y-4">
        <RegisterForm />
        <div className="surface-panel-soft px-4 py-4 text-center text-sm text-slate-600">
          Vous avez deja un compte ?{" "}
          <Link href="/login" className="font-semibold text-violet-700 hover:text-violet-600">
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
}
