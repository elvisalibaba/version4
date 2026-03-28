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
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Formation editoriale",
  description:
    "Inscription a la formation editoriale Holistique Books avec enregistrement des demandes pour l equipe admin.",
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
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1db] text-[#b96e12]">
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialValues:
    | {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        country?: string | null;
        city?: string | null;
      }
    | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, country, city")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      initialValues = {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        country: profile.country,
        city: profile.city,
      };
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <PageHero
          kicker="Formation editoriale"
          title="Inscrivez-vous a notre parcours de formation editoriale."
          description="Partagez votre profil, le stade de votre projet et vos objectifs. L equipe admin recoit automatiquement votre demande pour suivi et export CSV."
          aside={
            <div className="rounded-[1.8rem] border border-[#ece3d7] bg-[radial-gradient(circle_at_top_right,rgba(255,189,105,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,237,0.96))] p-5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Parcours accompagne
                </span>
                <div className="space-y-2">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    3 etapes claires
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Diagnostic, cadrage editorial et plan d execution adaptes a
                    votre niveau.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-[1.2rem] border border-white/60 bg-white/85 px-4 py-3">
                    Positionnement editorial et clarte du projet.
                  </div>
                  <div className="rounded-[1.2rem] border border-white/60 bg-white/85 px-4 py-3">
                    Structuration du manuscrit ou du catalogue.
                  </div>
                  <div className="rounded-[1.2rem] border border-white/60 bg-white/85 px-4 py-3">
                    Suivi centralise pour l equipe admin et operationnelle.
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
              description="Les demandes arrivent directement dans l espace admin pour que l equipe puisse vous recontacter sans perdre les informations envoyees."
            />
            <InfoCard
              icon={FileSpreadsheet}
              title="Suivi exploitable"
              description="Toutes les inscriptions peuvent etre exportees en CSV pour le pilotage commercial, editorial ou operationnel."
            />
            <InfoCard
              icon={BookOpen}
              title="Parcours adapte"
              description="Que vous partiez d une idee, d un manuscrit termine ou d un catalogue existant, le formulaire aide a orienter le bon accompagnement."
            />
            <InfoCard
              icon={Mail}
              title="Contact equipe"
              description="Vous pouvez aussi preciser vos attentes dans le message libre si vous avez un contexte particulier ou des delais a respecter."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
