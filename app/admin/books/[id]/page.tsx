import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopyrightStatusLabel } from "@/lib/book-copyright";
import { getBookFormatLabel } from "@/lib/book-formats";
import { formatMoney } from "@/lib/book-offers";
import { getAdminBookDetail } from "@/lib/supabase/admin/books";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { deleteHighlightAction, deleteRatingAction, reviewBookSubmissionAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string; saved?: string }>;
};

function getReviewFlash(reviewResult: string | undefined) {
  switch (reviewResult) {
    case "approved_published":
      return {
        tone: "success" as const,
        title: "Livre valide et formats numeriques publies",
        description: "La soumission a ete approuvee, le statut du livre a ete mis a jour et les formats numeriques disponibles ont ete actives.",
      };
    case "approved":
      return {
        tone: "success" as const,
        title: "Livre valide",
        description: "La soumission a ete approuvee. Le livre est maintenant autorise cote admin.",
      };
    case "changes_requested":
      return {
        tone: "warning" as const,
        title: "Corrections demandees",
        description: "Le livre a ete renvoye a l auteur avec une note de revue pour correction.",
      };
    case "rejected":
      return {
        tone: "danger" as const,
        title: "Soumission refusee",
        description: "Le livre a ete refuse et reste hors ligne tant qu une nouvelle soumission n est pas faite.",
      };
    case "copyright_blocked":
      return {
        tone: "danger" as const,
        title: "Publication refusee par blocage droits",
        description: "Ce livre est marque comme bloque pour droit d auteur. Levez d abord le blocage avant de le valider.",
      };
    default:
      return null;
  }
}

function getSaveFlash(saveResult: string | undefined) {
  switch (saveResult) {
    case "updated":
      return {
        tone: "success" as const,
        title: "Livre mis a jour",
        description: "Les champs admin du livre ont ete enregistres.",
      };
    case "copyright_blocked":
      return {
        tone: "danger" as const,
        title: "Livre bloque pour droits d auteur",
        description: "Le livre reste visible cote admin mais il n est plus diffusable tant que le blocage n est pas leve.",
      };
    default:
      return null;
  }
}

export default async function AdminBookDetailPage({ params, searchParams }: BookDetailPageProps) {
  const { id } = await params;
  const { review, saved } = await searchParams;
  const data = await getAdminBookDetail(id);
  const reviewFlash = getReviewFlash(review);
  const saveFlash = getSaveFlash(saved);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.book.title}
        description="Detail complet du livre, de ses formats, de ses commandes, de sa bibliotheque et de ses signaux d engagement."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Livres", href: "/admin/books" },
          { label: data.book.title },
        ]}
        actions={
          <>
            <Link href={`/admin/books/${data.book.id}/edit`} className="cta-primary px-5 py-3 text-sm">
              Editer le livre
            </Link>
            <Link href={`/admin/authors/${data.book.author_id}`} className="cta-secondary px-5 py-3 text-sm">
              Voir l auteur
            </Link>
          </>
        }
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      {reviewFlash ? <AdminNotice tone={reviewFlash.tone} title={reviewFlash.title} description={reviewFlash.description} /> : null}
      {saveFlash ? <AdminNotice tone={saveFlash.tone} title={saveFlash.title} description={saveFlash.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel title="Metadonnees" description="Colonnes principales de la table books.">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-950">Auteur affiche</dt>
              <dd className="text-slate-500">{data.book.author_name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Etat</dt>
              <dd className="mt-2">
                <StatusBadge kind="book" value={data.book.status} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Revue</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge kind="review" value={data.book.review_status} />
                {data.book.reviewer_name ? <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Par {data.book.reviewer_name}</span> : null}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Droits d auteur</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge kind="copyright" value={data.book.copyright_status} label={getCopyrightStatusLabel(data.book.copyright_status)} />
                {data.book.copyright_blocker_name ? (
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Par {data.book.copyright_blocker_name}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Prix vitrine</dt>
              <dd className="text-slate-500">{formatMoney(data.book.price, data.book.currency_code)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Langue</dt>
              <dd className="text-slate-500">{data.book.language.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Categories</dt>
              <dd className="text-slate-500">{data.book.categories.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Tags</dt>
              <dd className="text-slate-500">{data.book.tags.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Vente / abonnement</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                <StatusBadge
                  kind="boolean"
                  value={data.book.is_single_sale_enabled}
                  label={data.book.is_single_sale_enabled ? "Single sale on" : "Single sale off"}
                />
                <StatusBadge
                  kind="boolean"
                  value={data.book.is_subscription_available}
                  label={data.book.is_subscription_available ? "Subscription on" : "Subscription off"}
                />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Note de revue</dt>
              <dd className="text-slate-500">{data.book.review_note ?? "Aucune note admin pour le moment."}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-950">Note droits</dt>
              <dd className="text-slate-500">{data.book.copyright_note ?? "Aucune note juridique pour le moment."}</dd>
            </div>
          </dl>
        </AdminPanel>

        <AdminPanel title="Timeline editoriale" description="Historique visible dans le schema actuel. Aucun log editorial complet n existe encore.">
          <div className="space-y-4">
            {data.editorialTimeline.map((item) => (
              <div key={item.label} className="rounded-[1.3rem] border border-violet-200/60 bg-violet-50/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm text-slate-900">{formatAdminDateTime(item.value)}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Revue admin" description="Validation professionnelle de la soumission auteur, avec acceptation, demande de corrections ou refus.">
        <form action={reviewBookSubmissionAction} className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <input type="hidden" name="book_id" value={data.book.id} />
          <input type="hidden" name="redirect_to" value={`/admin/books/${data.book.id}`} />
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Note admin</span>
            <textarea
              name="review_note"
              rows={5}
              defaultValue={data.book.review_note ?? ""}
              placeholder="Retour professionnel a transmettre a l auteur"
              className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </label>
          <div className="grid gap-4">
            {data.book.copyright_status === "blocked" ? (
              <div className="rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Publication verrouillee: ce livre est bloque pour droits d auteur. Passez d abord par l edition admin pour lever le blocage ou documenter la correction.
              </div>
            ) : null}
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Statut cible si accepte</span>
              <select name="target_status" defaultValue={data.book.status === "coming_soon" ? "coming_soon" : "published"} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
                <option value="published">published</option>
                <option value="coming_soon">coming_soon</option>
                <option value="draft">draft</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="publish_ebook_format" defaultChecked />
              Publier aussi les formats numeriques (Holistique Store / eBook)
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="decision"
                value="approve"
                disabled={data.book.copyright_status === "blocked"}
                className="cta-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Valider le livre
              </button>
              <button type="submit" name="decision" value="request_changes" className="cta-secondary px-5 py-3 text-sm">
                Demander des corrections
              </button>
              <button type="submit" name="decision" value="reject" className="cta-secondary px-5 py-3 text-sm text-rose-700">
                Refuser la soumission
              </button>
            </div>
          </div>
        </form>
      </AdminPanel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vues detail</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.engagement.detailViews}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ouvertures lecteur</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.engagement.readerOpens}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Acces fichier</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.engagement.fileAccesses}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Events authentifies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.engagement.authenticatedEvents}</p>
        </AdminPanel>
        <AdminPanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lecteurs uniques</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{data.engagement.uniqueUsers}</p>
        </AdminPanel>
      </div>

      <AdminPanel title="Activite de consultation" description="Trace detail_view, reader_open et file_access pour mieux comprendre qui ouvre reellement le livre et comment.">
        <AdminDataTable columns={["Utilisateur", "Evenement", "Source", "Date"]}>
          {data.engagementEvents.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                {entry.user_id ? (
                  <Link href={`/admin/users/${entry.user_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {entry.user_name}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500">{entry.user_name}</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.event_type}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.source ?? "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.created_at)}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <AdminPanel title="Formats du livre" description="book_formats relies a ce titre, avec publication, prix specifique et cout d impression quand applicable.">
        <AdminDataTable columns={["Format", "Prix", "Cout impression", "Publication", "Stock", "Fichier"]}>
          {data.formats.map((format) => (
            <tr key={format.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/formats/${format.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {getBookFormatLabel(format.format)}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(format.price, format.currency_code)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{format.printing_cost !== null ? formatMoney(format.printing_cost, format.currency_code) : "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{format.is_published ? "Publie" : "Brouillon"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{format.stock_quantity ?? "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{format.file_url ?? "-"}</td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Commandes liees" description="Lignes order_items associees a ce livre.">
          <AdminDataTable columns={["Commande", "Statut", "Format", "Prix", "Date"]}>
            {data.orders.map((item) => (
              <tr key={item.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  {item.order_meta ? (
                    <Link href={`/admin/orders/${item.order_meta.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                      {item.order_meta.id.slice(0, 8)}
                    </Link>
                  ) : (
                    "Commande inconnue"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="payment" value={item.order_meta?.payment_status ?? "pending"} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="format" value={item.book_format} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(item.price, item.currency_code)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(item.order_meta?.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Disponibilite abonnement" description="Plans Premium liant actuellement ce livre.">
          <AdminDataTable columns={["Plan", "Etat livre", "Ajout"]}>
            {data.subscriptionMappings.map((mapping) => (
              <tr key={mapping.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/subscriptions/plans/${mapping.plan_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {mapping.plan_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    kind="boolean"
                    value={data.book.is_subscription_available}
                    label={data.book.is_subscription_available ? "Eligible" : "Warning"}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(mapping.created_at)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Bibliotheque" description="Entrees library deja rattachees a ce livre.">
          <AdminDataTable columns={["Utilisateur", "Type", "Date", "Subscription"]}>
            {data.libraryEntries.map((entry) => (
              <tr key={entry.id} className="border-t border-violet-100/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${entry.user_id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                    {entry.user_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="access" value={entry.access_type} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(entry.purchased_at)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{entry.subscription_id ? entry.subscription_id.slice(0, 8) : "-"}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Notes et highlights" description="Lecture et moderation liees a ce livre.">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</h3>
              <div className="mt-3 space-y-3">
                {data.ratings.map((rating) => (
                  <div key={rating.id} className="rounded-[1.2rem] border border-violet-200/60 bg-violet-50/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{rating.user_name}</p>
                        <p className="text-sm text-slate-500">
                          {rating.rating}/5 - {formatAdminDateTime(rating.created_at)}
                        </p>
                      </div>
                      <form action={deleteRatingAction}>
                        <input type="hidden" name="rating_id" value={rating.id} />
                        <input type="hidden" name="redirect_to" value={`/admin/books/${data.book.id}`} />
                        <ConfirmSubmitButton
                          label="Supprimer"
                          confirmMessage="Supprimer cette note abusive ?"
                          className="cta-secondary px-4 py-2 text-xs text-rose-700"
                        />
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Highlights</h3>
              <div className="mt-3 space-y-3">
                {data.highlights.map((highlight) => (
                  <div key={highlight.id} className="rounded-[1.2rem] border border-violet-200/60 bg-violet-50/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{highlight.user_name}</p>
                        <p className="text-sm text-slate-500">
                          Page {highlight.page} - {highlight.color} - {formatAdminDateTime(highlight.created_at)}
                        </p>
                        {highlight.text ? <p className="mt-2 text-sm text-slate-700">{highlight.text}</p> : null}
                      </div>
                      <form action={deleteHighlightAction}>
                        <input type="hidden" name="highlight_id" value={highlight.id} />
                        <input type="hidden" name="redirect_to" value={`/admin/books/${data.book.id}`} />
                        <ConfirmSubmitButton
                          label="Supprimer"
                          confirmMessage="Supprimer ce highlight problematique ?"
                          className="cta-secondary px-4 py-2 text-xs text-rose-700"
                        />
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
