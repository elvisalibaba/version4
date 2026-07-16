import Link from "next/link";
import { ArrowRight, BookOpen, LockKeyhole, ShoppingBag, Sparkles } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function CartPage() {
  const profile = await getCurrentUserProfile();

  return (
    <section className="space-y-8">
      <PageHero
        kicker="Cart"
        title="Un panier editorial plus premium, pret pour vos prochaines lectures."
        description="Le fonctionnement actuel reste intact, mais la presentation devient plus claire pour distinguer lecture gratuite, achats et acces compte."
        actions={
          <>
            <Link href="/books" className="cta-primary px-5 py-3 text-sm">
              <BookOpen className="h-4 w-4" />
              Parcourir les livres
            </Link>
            <Link href={profile ? "/dashboard" : "/login"} className="cta-secondary px-5 py-3 text-sm">
              {profile ? "Mon compte" : "Se connecter"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
        aside={
          <div className="surface-panel-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">Cart status</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Panier</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">0 livre</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">Lecture instantanee</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Les contenus gratuits restent accessibles apres connexion, sans friction inutile.</p>
              </div>
            </div>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel p-6">
          <div className="flex items-start gap-3 rounded-[1.5rem] bg-violet-50/80 p-4">
            {profile ? <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />}
            <div>
              <p className="font-semibold text-slate-950">{profile ? "Session active" : "Connexion recommandee"}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {profile
                  ? `Connecte en tant que ${profile.name || profile.email}. Vous pouvez acceder a vos lectures et a votre compte.`
                  : "Les livres a 0$ sont gratuits a condition d avoir un compte. Connectez-vous puis cliquez sur Read pour les lire."}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-dashed border-violet-200 bg-white/80 p-6">
            <p className="text-lg font-semibold text-slate-950">Votre panier est vide pour le moment.</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              La structure checkout peut evoluer ensuite, mais cette couche garde la logique actuelle intacte et pose deja une presentation plus premium.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-panel-soft p-5">
            <p className="premium-badge">
              <Sparkles className="h-3.5 w-3.5" />
              Fast access
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Retrouvez vos achats, votre bibliotheque et vos titres gratuits au meme endroit des que votre session est active.
            </p>
          </div>

          <div className="surface-panel-soft p-5">
            <p className="text-sm font-semibold text-slate-950">Prochaine etape</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Cette zone est maintenant prete pour accueillir un vrai recapitulatif checkout plus tard, sans remettre en cause la logique metier actuelle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
