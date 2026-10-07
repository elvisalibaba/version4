import Link from "next/link";
import { BookOpen, Clapperboard, Headphones, Radio, Video } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { getAuthorBooks } from "@/lib/author-api";

export default async function AuthorMediaPage() {
  await requireRole(["author"]);
  const books = await getAuthorBooks();
  const editions = books.flatMap((book) =>
    (book.media_editions ?? []).map((edition) => ({ book, edition })),
  );
  const audio = editions.filter(({ edition }) => edition.media_type === "audiobook");
  const video = editions.filter(({ edition }) => edition.media_type === "video");

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Espace auteur"
        title="Audio & vidéo"
        description="Toutes les éditions multimédia rattachées à vos œuvres, avec leur état de préparation et de publication."
        actions={<Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm"><BookOpen className="h-4 w-4" /> Mes livres</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-md border border-emerald-50 bg-emerald-50 p-6">
          <Headphones className="h-6 w-6 text-night-900" />
          <p className="mt-5 text-3xl font-bold text-night-900">{audio.length}</p>
          <h2 className="mt-1 font-semibold text-night-900">Éditions audio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Narration, durée, chapitres et extraits audio centralisés par œuvre.</p>
        </article>
        <article className="rounded-md border border-brand-100 bg-brand-50 p-6">
          <Clapperboard className="h-6 w-6 text-brand-600" />
          <p className="mt-5 text-3xl font-bold text-brand-600">{video.length}</p>
          <h2 className="mt-1 font-semibold text-night-900">Éditions vidéo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Interviews, masterclass, adaptations et contenus enrichis associés aux titres.</p>
        </article>
      </div>

      <section className="surface-panel p-6">
        {editions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {editions.map(({ book, edition }) => (
              <article key={edition.id} className="rounded-md border border-rule bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-paper-deep text-brand-600">
                    {edition.media_type === "audiobook" ? <Radio className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </span>
                  <span className="catalog-badge">{edition.status}</span>
                </div>
                <p className="mt-4 text-xs font-bold text-slate-500">{edition.media_type}</p>
                <h2 className="mt-2 text-lg font-semibold text-night-900">{edition.title || book.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{book.title}</p>
                {edition.narrator ? <p className="mt-2 text-xs text-slate-500">Narration : {edition.narrator}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune édition multimédia"
            description="Les versions audio et vidéo préparées par la maison d’édition apparaîtront ici sans créer un deuxième catalogue."
            action={<Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm">Voir mes œuvres</Link>}
          />
        )}
      </section>
    </section>
  );
}
