import Link from "next/link";
import { Library, Sparkles, WandSparkles } from "lucide-react";
import { PublishLabForm } from "@/components/author/publish-lab-form";
import { requireRole } from "@/lib/auth";

export default async function AddBookPage() {
  await requireRole(["author"]);

  return (
    <section className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-7 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Publishing Lab
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Ajouter un nouveau livre</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
            Renseignez les metadonnees, importez les fichiers et publiez un livre avec une fiche complete.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/author/books"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              <Library className="h-4 w-4" />
              Retour au catalogue
            </Link>
            <Link
              href="/dashboard/author/sales"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <WandSparkles className="h-4 w-4" />
              Voir les ventes
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <PublishLabForm />
      </div>
    </section>
  );
}
