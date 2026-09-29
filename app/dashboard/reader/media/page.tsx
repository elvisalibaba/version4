import Link from "next/link";
import { BookOpen, Clapperboard, Headphones, LibraryBig } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { ProtectedMediaPlayer } from "@/components/reader/protected-media-player";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth";
import { getReaderLibrary } from "@/lib/reader-api";

export default async function ReaderMediaPage() {
  await requireRole(["reader"]);
  const library = await getReaderLibrary();
  const media = library.flatMap((entry) =>
    (entry.book.media_editions ?? [])
      .filter((edition) => edition.status === "published" && ["audiobook", "video"].includes(edition.media_type))
      .map((edition) => ({ entry, edition })),
  );

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Espace lecteur"
        title="Audio & vidéo"
        description="Les éditions multimédia disponibles dans votre bibliothèque, synchronisées avec le même compte Holistique Books."
        actions={<Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm"><LibraryBig className="h-4 w-4" /> Bibliothèque</Link>}
      />

      <section className="surface-panel p-6">
        {media.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {media.map(({ entry, edition }) => (
              <article key={edition.id} className="rounded-[24px] border border-[#ece3d7] bg-white p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f4eee5] text-[#173d2c]">
                  {edition.media_type === "audiobook" ? <Headphones className="h-5 w-5" /> : <Clapperboard className="h-5 w-5" />}
                </span>
                <p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[.16em] text-[#a94b34]">{edition.media_type === "audiobook" ? "Livre audio" : "Vidéo"}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#17231d]">{edition.title || entry.book.title}</h2>
                <p className="mt-1 text-sm text-[#766e64]">{entry.book.author_display_name || "Holistique Books"}</p>
                {edition.duration_seconds ? <p className="mt-2 text-xs text-[#887f74]">Durée : {Math.max(1, Math.round(edition.duration_seconds / 60))} min</p> : null}
                <div className="mt-5">
                  <ProtectedMediaPlayer
                    editionId={edition.id}
                    mediaType={edition.media_type as "audiobook" | "video"}
                    title={edition.title || entry.book.title}
                  />
                </div>
                <Link href={`/book/${entry.book.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#173d2c]">
                  <BookOpen className="h-4 w-4" /> Fiche de l’œuvre
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun média disponible pour le moment"
            description="Les livres audio et vidéos compris dans vos achats ou abonnements apparaîtront ici dès leur publication."
            action={<Link href="/books" className="cta-secondary px-5 py-3 text-sm">Explorer le catalogue</Link>}
          />
        )}
      </section>
    </section>
  );
}
