"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import {
  buildReviewsPath,
  reviewErrorMessage,
  type BookReview,
  type ReviewSort,
  type ReviewsResponse,
} from "@/lib/reviews";

function StarPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={"Note sélectionnée : " + value + " sur 5"}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          disabled={disabled}
          aria-label={star + " étoile" + (star > 1 ? "s" : "")}
          className="rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={
              "h-7 w-7 " +
              (star <= value
                ? "fill-[#e8ac42] text-[#e8ac42]"
                : "text-[#cfc4b8]")
            }
          />
        </button>
      ))}
    </div>
  );
}

export function BookReviews({
  bookId,
  isAuthenticated,
  ratingAvg,
  ratingsCount,
}: {
  bookId: string;
  isAuthenticated: boolean;
  ratingAvg: number | null | undefined;
  ratingsCount: number | null | undefined;
}) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const currentReview = response?.current_user_review ?? null;
  const canReview = response?.can_review !== false;
  const total = response?.summary?.reviews_count ?? response?.meta?.total ?? ratingsCount ?? 0;
  const lastPage = Math.max(1, response?.meta?.last_page ?? 1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request = await fetch(
        buildReviewsPath(bookId, { sort, page, perPage: 8 }),
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );
      const payload = await request.json().catch(() => null);

      if (!request.ok) {
        throw new Error(
          reviewErrorMessage(payload, "Impossible de charger les avis."),
        );
      }

      setResponse(payload as ReviewsResponse);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de charger les avis.",
      );
    } finally {
      setLoading(false);
    }
  }, [bookId, page, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!currentReview) {
      setRating(5);
      setText("");
      return;
    }

    setRating(currentReview.rating);
    setText(currentReview.text ?? "");
  }, [currentReview]);

  const average = useMemo(() => {
    const value = Number(response?.summary?.rating_avg ?? ratingAvg ?? 0);
    return Number.isFinite(value) && total > 0 ? value : null;
  }, [ratingAvg, response?.summary?.rating_avg, total]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const endpoint = currentReview
      ? "/api/backend/reviews/" + encodeURIComponent(currentReview.id)
      : "/api/backend/books/" + encodeURIComponent(bookId) + "/reviews";

    try {
      const request = await fetch(endpoint, {
        method: currentReview ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          rating,
          text: text.trim() || null,
        }),
      });
      const payload = await request.json().catch(() => null);

      if (!request.ok) {
        throw new Error(
          reviewErrorMessage(
            payload,
            "Impossible d’enregistrer votre avis.",
          ),
        );
      }

      setPage(1);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible d’enregistrer votre avis.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function removeReview() {
    if (
      !currentReview ||
      !window.confirm("Supprimer définitivement votre avis ?")
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const request = await fetch(
        "/api/backend/reviews/" + encodeURIComponent(currentReview.id),
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      if (!request.ok) {
        const payload = await request.json().catch(() => null);
        throw new Error(
          reviewErrorMessage(
            payload,
            "Impossible de supprimer votre avis.",
          ),
        );
      }

      setRating(5);
      setText("");
      setPage(1);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Impossible de supprimer votre avis.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      className="mt-12 border-t border-[#ded2c6] pt-10"
      id="avis"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c34d35]">
            Avis des lecteurs
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.04em]">
              Ce qu’en pensent les lecteurs
            </h2>
            {average !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4ead8] px-3 py-1.5 text-sm font-extrabold text-[#6f5427]">
                <Star className="h-4 w-4 fill-[#e8ac42] text-[#e8ac42]" />
                {average.toFixed(1)}/5 · {total} avis
              </span>
            ) : null}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#6f665e]">
          Trier
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as ReviewSort);
              setPage(1);
            }}
            className="min-h-10 rounded-xl border border-[#ddd1c6] bg-white px-3 text-[#403a34]"
          >
            <option value="recent">Plus récents</option>
            <option value="helpful">Plus utiles</option>
          </select>
        </label>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4">
          {loading ? (
            <div className="flex min-h-32 items-center justify-center rounded-[1.5rem] border border-[#e5d9cd] bg-white text-sm text-[#756a61]">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Chargement des avis…
            </div>
          ) : response?.data.length ? (
            response.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#d8c9bb] bg-[#fffaf4] p-7 text-center">
              <Star className="mx-auto h-7 w-7 text-[#d7a94d]" />
              <h3 className="mt-3 font-display text-xl font-extrabold">
                Aucun avis pour le moment
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#756a61]">
                Soyez le premier lecteur à partager une note sur ce livre.
              </p>
            </div>
          )}

          {!loading && lastPage > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#ddd1c6] bg-white px-4 text-sm font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <span className="text-xs font-semibold text-[#756a61]">
                Page {page} / {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() =>
                  setPage((value) => Math.min(lastPage, value + 1))
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#ddd1c6] bg-white px-4 text-sm font-bold disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[1.6rem] border border-[#ded2c6] bg-[#fffdf9] p-5 lg:sticky lg:top-28">
          {isAuthenticated && !canReview && !currentReview ? (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c34d35]">
                Votre livre
              </p>
              <h3 className="mt-2 font-display text-xl font-extrabold">
                Vous êtes l’auteur de ce livre
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#756a61]">
                Pour garder des avis fiables, les auteurs ne peuvent pas noter leurs propres livres.
              </p>
            </div>
          ) : isAuthenticated ? (
            <form onSubmit={submit}>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c34d35]">
                {currentReview ? "Votre avis" : "Donner votre avis"}
              </p>
              <h3 className="mt-2 font-display text-xl font-extrabold">
                {currentReview
                  ? "Modifier votre note"
                  : "Comment avez-vous trouvé ce livre ?"}
              </h3>

              <div className="mt-4">
                <StarPicker
                  value={rating}
                  onChange={setRating}
                  disabled={submitting || deleting}
                />
              </div>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Votre commentaire est optionnel…"
                className="mt-4 w-full resize-y rounded-2xl border border-[#ddd1c6] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#173f38] focus:ring-4 focus:ring-[#173f38]/10"
              />
              <p className="mt-1 text-right text-[0.68rem] text-[#8d8279]">
                {text.length}/5000
              </p>

              {error ? (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-[#fff0eb] px-3 py-2 text-sm text-[#8f3f2e]"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || deleting}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#173f38] px-5 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {submitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : currentReview ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {submitting
                  ? "Enregistrement…"
                  : currentReview
                    ? "Mettre à jour"
                    : "Publier mon avis"}
              </button>

              {currentReview ? (
                <button
                  type="button"
                  onClick={() => void removeReview()}
                  disabled={submitting || deleting}
                  className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-[#a14936] disabled:opacity-50"
                >
                  {deleting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer mon avis
                </button>
              ) : null}
            </form>
          ) : (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c34d35]">
                Votre avis
              </p>
              <h3 className="mt-2 font-display text-xl font-extrabold">
                Partagez votre expérience
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#756a61]">
                Connectez-vous pour noter ce livre et publier un commentaire.
              </p>
              <Link
                href={
                  "/login?next=" +
                  encodeURIComponent("/book/" + bookId + "#avis")
                }
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#173f38] px-5 text-sm font-extrabold text-white"
              >
                Se connecter
              </Link>
            </div>
          )}
        </aside>
      </div>

      {error && !isAuthenticated ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-[#fff0eb] px-3 py-2 text-sm text-[#8f3f2e]"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ReviewCard({ review }: { review: BookReview }) {
  return (
    <article className="rounded-[1.5rem] border border-[#e2d7cb] bg-white p-5 shadow-[0_10px_30px_rgba(50,39,29,.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-extrabold text-[#27221d]">
              {review.author.name}
            </p>
            {review.verified_purchase ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f3ee] px-2.5 py-1 text-[0.65rem] font-extrabold text-[#176052]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Achat vérifié
              </span>
            ) : null}
            {review.is_mine ? (
              <span className="rounded-full bg-[#f3ece3] px-2.5 py-1 text-[0.65rem] font-bold text-[#766759]">
                Votre avis
              </span>
            ) : null}
          </div>

          <div
            className="mt-2 flex items-center gap-1"
            aria-label={review.rating + " sur 5"}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={
                  "h-4 w-4 " +
                  (star <= review.rating
                    ? "fill-[#e8ac42] text-[#e8ac42]"
                    : "text-[#d8cec3]")
                }
              />
            ))}
          </div>
        </div>

        <time
          className="text-xs font-semibold text-[#8a7f75]"
          dateTime={review.created_at}
        >
          {new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(review.created_at))}
        </time>
      </div>

      {review.text ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5f554d]">
          {review.text}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-[#94877c]">
          Note sans commentaire.
        </p>
      )}

      {review.helpful_count > 0 ? (
        <p className="mt-3 text-xs font-semibold text-[#81756b]">
          {review.helpful_count} lecteur
          {review.helpful_count > 1 ? "s" : ""} ont trouvé cet avis utile.
        </p>
      ) : null}
    </article>
  );
}
