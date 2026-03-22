import Link from "next/link";
import { ArrowRight, Heart, LibraryBig, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type FavoriteEntry = {
  book_id: string;
  created_at: string;
  books:
    | Pick<
        Database["public"]["Tables"]["books"]["Row"],
        "id" | "title" | "description" | "cover_url" | "categories" | "price" | "currency_code" | "status" | "copyright_status"
      >
    | Pick<
        Database["public"]["Tables"]["books"]["Row"],
        "id" | "title" | "description" | "cover_url" | "categories" | "price" | "currency_code" | "status" | "copyright_status"
      >[]
    | null;
};

function firstOf<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function ReaderFavoritesPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("book_favorites")
    .select("book_id, created_at, books:book_id(id, title, description, cover_url, categories, price, currency_code, status, copyright_status)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteEntry[]>();

  if (error) {
    console.warn("[ReaderFavorites] Unable to load favorite books.", error.message);
  }

  const items = (data ?? []) as FavoriteEntry[];
  const totalFavorites = items.length;
  const favoriteCategories = new Set(
    items.flatMap((item) => {
      const book = firstOf(item.books);
      return book?.categories ?? [];
    }),
  );
  const averagePrice =
    totalFavorites > 0
      ? items.reduce((sum, item) => sum + (firstOf(item.books)?.price ?? 0), 0) / totalFavorites
      : 0;

  return (
    <section className="space-y-6">
      <DashboardTopbar
        kicker="Favoris"
        title={`Vos livres a suivre, ${profile.name ?? profile.email}`}
        description="Retrouvez ici les titres que vous avez marques pour les relire, acheter plus tard ou reprendre tranquillement."
        actions={
          <>
            <Link href="/books" className="cta-primary px-5 py-3 text-sm">
              Explorer les livres
            </Link>
            <Link href="/dashboard/reader/library" className="cta-secondary px-5 py-3 text-sm">
              Voir la bibliotheque
            </Link>
          </>
        }
      />

      <div className="metric-grid">
        <StatCard icon={Heart} label="Favoris" value={totalFavorites} description="Titres sauvegardes" tone="rose" />
        <StatCard icon={Sparkles} label="Categories" value={favoriteCategories.size} description="Univers suivis" tone="violet" />
        <StatCard icon={LibraryBig} label="Prix moyen" value={totalFavorites ? averagePrice.toFixed(2) : "--"} description="Repere catalogue" tone="amber" />
      </div>

      <section className="surface-panel p-6">
        <div className="section-header">
          <div className="space-y-2">
            <p className="section-kicker">Saved books</p>
            <h2 className="section-title text-2xl">Mes favoris</h2>
            <p className="section-description">Un espace simple pour retrouver les livres qui vous interessent le plus.</p>
          </div>
          <span className="catalog-badge">{totalFavorites} titre(s)</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {items.length > 0 ? (
            items.map((item) => {
              const book = firstOf(item.books);
              const isTemporarilyUnavailable = !book || book.status !== "published" || book.copyright_status === "blocked";

              return (
                <article
                  key={item.book_id}
                  className="rounded-[1.75rem] border border-[#ece3d7] bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(252,250,247,0.96))] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,_#a85b3f,_#171717)] text-lg font-bold text-white shadow-md">
                      {(book?.title ?? "HB").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold text-slate-950">{book?.title ?? "Livre indisponible"}</p>
                        <span className="catalog-badge">{isTemporarilyUnavailable ? "Suspendu" : "Favori"}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {book?.description ?? "Ce livre est garde dans votre selection personnelle."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Ajoute le {new Date(item.created_at).toLocaleDateString("fr-FR")}</span>
                        {book?.categories?.[0] ? <span>{book.categories[0]}</span> : null}
                        {book ? <span>{book.price.toFixed(2)} {book.currency_code}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {isTemporarilyUnavailable ? "Temporairement indisponible" : "Pret a reprendre"}
                    </p>
                    {isTemporarilyUnavailable ? (
                      <span className="cta-secondary px-4 py-2 text-sm">En attente de reactivation</span>
                    ) : (
                      <Link href={`/book/${item.book_id}`} className="cta-primary px-4 py-2 text-sm">
                        Ouvrir le livre
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="Aucun favori pour le moment"
              description="Utilisez le bouton coeur sur une fiche livre ou dans le catalogue pour construire votre liste."
              action={
                <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
                  Explorer le catalogue
                </Link>
              }
            />
          )}
        </div>
      </section>
    </section>
  );
}
