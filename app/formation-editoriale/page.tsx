import type { Metadata } from "next";
import {
  BookOpen,
  Clock3,
  FileSpreadsheet,
  GraduationCap,
  Mail,
} from "lucide-react";
import { EditorialTrainingForm } from "@/components/editorial/editorial-training-form";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentUserProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Formation éditoriale",
  description:
    "Inscrivez-vous au parcours de formation éditoriale Holistique Books : diagnostic, cadrage et accompagnement de votre projet.",
};

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GraduationCap;
  title: string;
  description: string;
}) {
  return (
    <article className="form-panel">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-night-50 text-night-800">
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </article>
  );
}

export default async function EditorialTrainingPage() {
  const profile = await getCurrentUserProfile();

  const initialValues = profile
    ? {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        country: profile.country,
        city: profile.city,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <PageHero
          kicker="Formation éditoriale"
          title="Inscrivez-vous à notre parcours de formation éditoriale."
          description="Partagez votre profil, le stade de votre projet et vos objectifs. Notre équipe vous recontacte pour construire un parcours adapté."
          aside={
            <div className="rounded-md border border-rule bg-white p-5 ">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-sm bg-night-900 px-3 py-1 text-xs font-semibold text-white">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Parcours accompagné
                </span>
                <div className="space-y-2">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    3 étapes claires
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Diagnostic, cadrage éditorial et plan d’action adaptés à
                    votre niveau.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-md border border-white/60 bg-white/85 px-4 py-3">
                    Positionnement éditorial et clarté du projet.
                  </div>
                  <div className="rounded-md border border-white/60 bg-white/85 px-4 py-3">
                    Structuration du manuscrit ou du catalogue.
                  </div>
                  <div className="rounded-md border border-white/60 bg-white/85 px-4 py-3">
                    Un interlocuteur unique, du premier échange au suivi.
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <EditorialTrainingForm initialValues={initialValues} />

          <div className="space-y-5">
            <InfoCard
              icon={Clock3}
              title="Traitement rapide"
              description="Votre demande arrive directement à notre équipe éditoriale, qui vous recontacte rapidement."
            />
            <InfoCard
              icon={FileSpreadsheet}
              title="Un suivi personnalisé"
              description="Un conseiller suit votre projet à chaque étape et reste votre interlocuteur unique."
            />
            <InfoCard
              icon={BookOpen}
              title="Parcours adapté"
              description="Que vous partiez d’une idée, d’un manuscrit terminé ou d’un catalogue existant, le formulaire aide à orienter le bon accompagnement."
            />
            <InfoCard
              icon={Mail}
              title="Contact équipe"
              description="Vous pouvez aussi préciser vos attentes dans le message libre si vous avez un contexte particulier ou des délais à respecter."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
