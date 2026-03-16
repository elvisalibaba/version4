import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function LoginPage() {
  const profile = await getCurrentUserProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <section className="space-y-8">
      <PageHero
        kicker="Access"
        title="Connectez-vous a votre univers de lecture et de publication."
        description="Retrouvez vos achats, votre bibliotheque, vos packs Premium et votre cockpit auteur depuis une interface plus editoriale."
        aside={
          <div className="surface-panel-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Account journey</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">Lecteur</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Bibliotheque, Premium, achats et lecture web.</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">Auteur</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Catalogue, publication, ventes et disponibilite Premium.</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-xl space-y-4">
        <LoginForm />
        <div className="surface-panel-soft px-4 py-4 text-center text-sm text-slate-600">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-violet-700 hover:text-violet-600">
            Creer un compte
          </Link>
        </div>
      </div>
    </section>
  );
}
