import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  FileWarning,
  MessageSquareText,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAuthorReviewCases } from "@/lib/author-api";
import { appealReviewCaseAction } from "./actions";

const statusLabel: Record<string, string> = {
  open: "Ouvert",
  author_action: "Action requise",
  under_review: "En revue",
  resolved: "Résolu",
  rejected: "Rejeté",
  appealed: "Recours transmis",
};

const statusClass: Record<string, string> = {
  open: "bg-sky-50 text-sky-700",
  author_action: "bg-amber-50 text-amber-800",
  under_review: "bg-indigo-50 text-indigo-700",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  appealed: "bg-violet-50 text-violet-700",
};

const typeLabel: Record<string, string> = {
  metadata: "Métadonnées",
  rights: "Droits & licences",
  content: "Contenu",
  quality: "Qualité éditoriale",
  payment: "Paiement",
  account: "Compte",
  other: "Autre",
};

export default async function AuthorReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireRole(["author"]);
  const [cases, query] = await Promise.all([getAuthorReviewCases(), searchParams]);

  const blocking = cases.filter((item) => item.severity === "blocking" && !["resolved"].includes(item.status)).length;
  const appeals = cases.filter((item) => item.status === "appealed" || item.status === "under_review").length;
  const resolved = cases.filter((item) => item.status === "resolved").length;

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(232,172,66,0.22),transparent_34%),linear-gradient(135deg,#102a20,#173d2c_58%,#244f3c)] p-6 text-white shadow-[0_28px_70px_rgba(23,61,44,0.18)] sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f4cf87]">
            <Scale className="h-3.5 w-3.5" />
            Transparence éditoriale
          </div>
          <h1 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">Décisions, corrections et recours</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
            Chaque décision concernant votre livre doit être explicable : motif, action attendue, réponse de l’auteur et résolution restent rattachés au même dossier.
          </p>
        </div>
      </header>

      {query.saved === "appeal" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Votre recours a été transmis et journalisé.
        </div>
      ) : null}

      {query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {query.error === "invalid"
            ? "Votre réponse doit contenir au moins 10 caractères."
            : "Le recours n’a pas pu être transmis. Le dossier n’est peut-être plus éligible à un recours."}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Blocages actifs", value: blocking, icon: ShieldAlert, className: "text-rose-700 bg-rose-50" },
          { label: "Recours en cours", value: appeals, icon: MessageSquareText, className: "text-violet-700 bg-violet-50" },
          { label: "Dossiers résolus", value: resolved, icon: BadgeCheck, className: "text-emerald-700 bg-emerald-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[24px] border border-[#e5ddd1] bg-white p-5 shadow-sm">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.className}`}><Icon className="h-5 w-5" /></span>
              <p className="mt-4 text-3xl font-bold text-[#17231d]">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-[#635b53]">{item.label}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-4">
        {cases.map((item) => {
          const canAppeal = ["rejected", "author_action", "resolved"].includes(item.status);

          return (
            <article key={item.id} className="overflow-hidden rounded-[28px] border border-[#e5ddd1] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-4 border-b border-[#eee5d9] bg-[#fffdf9] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${statusClass[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {statusLabel[item.status] ?? item.status}
                    </span>
                    <span className="rounded-full bg-[#f3eee7] px-2.5 py-1 text-[0.65rem] font-bold text-[#645d55]">
                      {typeLabel[item.case_type] ?? item.case_type}
                    </span>
                    {item.severity === "blocking" ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[0.65rem] font-bold text-rose-700">Bloquant</span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-serif text-2xl text-[#17231d]">{item.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#8b8177]">
                    <span>{item.case_number}</span>
                    {item.book?.title ? <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{item.book.title}</span> : null}
                    {item.reason_code ? <span>Motif : {item.reason_code}</span> : null}
                  </div>
                </div>
                <FileWarning className="h-6 w-6 shrink-0 text-[#a94b34]" />
              </div>

              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#a94b34]">Explication Holistique Books</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5f574f]">{item.explanation}</p>
                </div>

                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#173d2c]">Action attendue</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5f574f]">
                    {item.required_action || "Aucune action complémentaire n’est demandée pour le moment."}
                  </p>
                </div>

                {item.author_response ? (
                  <div className="rounded-[20px] border border-violet-100 bg-violet-50/60 p-4 lg:col-span-2">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-violet-700">Votre réponse / recours</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-violet-950/75">{item.author_response}</p>
                  </div>
                ) : null}

                {item.resolution_note ? (
                  <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-4 lg:col-span-2">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-700">Résolution</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-950/75">{item.resolution_note}</p>
                  </div>
                ) : null}

                {canAppeal ? (
                  <form action={appealReviewCaseAction} className="rounded-[22px] border border-[#eadfd1] bg-[#faf7f1] p-4 lg:col-span-2">
                    <input type="hidden" name="review_case_id" value={item.id} />
                    <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                      Répondre ou demander une nouvelle revue
                      <textarea
                        name="author_response"
                        minLength={10}
                        maxLength={10000}
                        required
                        rows={5}
                        defaultValue={item.author_response ?? ""}
                        placeholder="Expliquez votre position et les éléments corrigés ou nouveaux documents disponibles."
                        className="rounded-2xl border border-[#d9cebd] bg-white px-4 py-3 font-normal leading-6 outline-none focus:border-[#173d2c]"
                      />
                    </label>
                    <button type="submit" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white transition hover:bg-[#0f2d20]">
                      Transmettre le recours
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}

        {!cases.length ? (
          <div className="rounded-[28px] border border-dashed border-[#d8ccbc] bg-[#fffaf3] px-6 py-14 text-center">
            <AlertTriangle className="mx-auto h-7 w-7 text-[#8d8074]" />
            <h2 className="mt-3 font-serif text-xl text-[#17231d]">Aucun dossier éditorial ouvert</h2>
            <p className="mt-2 text-sm text-[#766e64]">Les décisions nécessitant votre attention apparaîtront ici avec leur motif complet.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
