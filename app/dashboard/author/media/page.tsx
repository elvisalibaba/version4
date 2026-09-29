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
        kicker="Author Studio"
        title="Audio & vidéo"
        description="Toutes les éditions multimédia rattachées à vos œuvres, avec leur état de préparation et de publication."
        actions={<Link href="/dashboard/author/books" className="cta-secondary px-5 py-3 text-sm"><BookOpen className="h-4 w-4" /> Mes livres</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-[28px] border border-[#d8e5dd] bg-[#eef7f2] p-6">
          <Headphones className="h-6 w-6 text-[#173d2c]" />
          <p className="mt-5 text-3xl font-bold text-[#173d2c]">{audio.length}</p>
          <h2 className="mt-1 font-semibold text-[#17231d]">Éditions audio</h2>
          <p className="mt-2 text-sm leading-6 text-[#627168]">Narration, durée, chapitres et extraits audio centralisés par œuvre.</p>
        </article>
        <article className="rounded-[28px] border border-[#eadbd7] bg-[#fff3ef] p-6">
          <Clapperboard className="h-6 w-6 text-[#a94b34]" />
          <p className="mt-5 text-3xl font-bold text-[#a94b34]">{video.length}</p>
          <h2 className="mt-1 font-semibold text-[#17231d]">Éditions vidéo</h2>
          <p className="mt-2 text-sm leading-6 text-[#766e64]">Interviews, masterclass, adaptations et contenus enrichis associés aux titres.</p>
        </article>
      </div>

      <section className="surface-panel p-6">
        {editions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {editions.map(({ book, edition }) => (
              <article key={edition.id} className="rounded-[24px] border border-[#ece3d7] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f5efe6] text-[#a94b34]">
                    {edition.media_type === "audiobook" ? <Radio className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </span>
                  <span className="catalog-badge">{edition.status}</span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#8a7d72]">{edition.media_type}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#17231d]">{edition.title || book.title}</h2>
                <p className="mt-2 text-sm text-[#766e64]">{book.title}</p>
                {edition.narrator ? <p className="mt-2 text-xs text-[#887f74]">Narration : {edition.narrator}</p> : null}
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
