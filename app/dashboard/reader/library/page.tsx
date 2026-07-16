import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Gem, LibraryBig, Sparkles } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getLibraryAccessLabel } from "@/lib/access-labels";
import { requireRole } from "@/lib/auth";
import { isSubscriptionCurrentlyActive } from "@/lib/book-access";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MaybeArray<T> = T | T[] | null;

type LibraryBook = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  price: number;
  categories: string[];
  rating_avg: number | null;
  status: Database["public"]["Tables"]["books"]["Row"]["status"];
  copyright_status: Database["public"]["Tables"]["books"]["Row"]["copyright_status"];
};

type LibrarySubscription = {
  status: Database["public"]["Tables"]["user_subscriptions"]["Row"]["status"];
  expires_at: string | null;
  subscription_plans: MaybeArray<{ name: string }>;
};

type LibraryEntry = {
  book_id: string;
  purchased_at: string;
  access_type: Database["public"]["Tables"]["library"]["Row"]["access_type"];
  subscription_id: string | null;
  books: MaybeArray<LibraryBook>;
  user_subscriptions: MaybeArray<LibrarySubscription>;
};

function firstOf<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export default async function ReaderLibraryPage() {
  const profile = await requireRole(["reader"]);
  const supabase = await createClient();

  const { data: library } = await supabase
    .from("library")
    .select(
      "book_id, purchased_at, access_type, subscription_id, books:book_id(id, title, description, cover_url, price, categories, rating_avg, status, copyright_status), user_subscriptions:subscription_id(status, expires_at, subscription_plans!user_subscriptions_plan_id_fkey(name))",
    )
    .eq("user_id", profile.id)
    .order("purchased_at", { ascending: false })
    .returns<LibraryEntry[]>();

  const items = (library ?? []) as LibraryEntry[];
  const coverEntries = await Promise.all(
    items.map(async (item) => {
      const book = firstOf(item.books);
      const coverPath = book?.cover_url?.trim();
      if (!book || !coverPath) return [item.book_id, null] as const;
      if (isExternalUrl(coverPath)) return [item.book_id, coverPath] as const;

      const { data } = await supabase.storage.from("books").createSignedUrl(coverPath, 60 * 60);
      return [item.book_id, data?.signedUrl ?? null] as const;
    }),
  );
  const coverByBookId = new Map(coverEntries);

  const purchaseBooks = items.filter((item) => item.access_type === "purchase").length;
  const subscriptionBooks = items.filter((item) => item.access_type === "subscription").length;
  const freeBooks = items.filter((item) => item.access_type === "free").length;
  const readableItems = items.filter((item) => {
    const book = firstOf(item.books);
    const subscription = firstOf(item.user_subscriptions);
    return Boolean(
      book &&
        book.status === "published" &&
        book.copyright_status !== "blocked" &&
        (item.access_type !== "subscription" || isSubscriptionCurrentlyActive(subscription)),
    );
  });
  const continueItem = readableItems[0] ?? null;
  const continueBook = continueItem ? firstOf(continueItem.books) : null;

  return (
    <section className="space-y-5 sm:space-y-6">
      <DashboardTopbar
        kicker="Espace lecteur"
        title="Ma bibliothèque"
        description="Vos achats, lectures gratuites et titres Holistique Plus, prêts à reprendre sur téléphone."
        actions={
          <Link href="/books" className="cta-primary px-5 py-3 text-sm">
            <Compass className="h-4 w-4" />
            Explorer les livres
          </Link>
        }
      />

      {continueBook ? (
        <section className="overflow-hidden rounded-[1.75rem] bg-[#171717] p-4 text-white shadow-[0_22px_55px_rgba(23,23,23,0.16)] sm:rounded-[2rem] sm:p-6">
          <div className="grid grid-cols-[82px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-6">
            <div className="aspect-[0.72] overflow-hidden rounded-xl bg-white/10 shadow-lg">
              {coverByBookId.get(continueItem.book_id) ? (
                <Image src={coverByBookId.get(continueItem.book_id)!} alt={continueBook.title} width={180} height={250} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-2 text-center text-[0.65rem] font-bold text-white/55">{continueBook.title}</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#ffc0b2]">À portée de main</p>
              <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-tight sm:text-2xl">{continueBook.title}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
                {continueBook.description?.trim() || "Votre prochaine session de lecture peut commencer maintenant."}
              </p>
              <Link href={`/book/${continueBook.id}?read=1`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ff7a5c] px-4 text-sm font-bold text-white sm:hidden">
                <BookOpen className="h-4 w-4" /> Lire
              </Link>
            </div>
            <Link href={`/book/${continueBook.id}?read=1`} className="hidden min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#ff7a5c] px-6 text-sm font-bold text-white sm:inline-flex">
              <BookOpen className="h-4 w-4" /> Reprendre la lecture
            </Link>
          </div>
        </section>
      ) : null}

      <div className="metric-grid">
        <StatCard icon={LibraryBig} label="Tous mes livres" value={items.length} description="Titres enregistrés" tone="violet" />
        <StatCard icon={BookOpen} label="Mes achats" value={purchaseBooks} description="Accès permanents" tone="sky" />
        <StatCard icon={Gem} label="Holistique Plus" value={subscriptionBooks} description="Accès par abonnement" tone="amber" />
        <StatCard icon={Sparkles} label="Gratuits" value={freeBooks} description="Titres offerts" tone="emerald" />
      </div>

      <section className="rounded-[1.75rem] border border-[#eadfd4] bg-[#fffdf9] p-4 sm:rounded-[2rem] sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a85b3f]">Collection personnelle</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717] sm:text-2xl">Tous mes livres</h2>
          </div>
          <span className="rounded-full bg-[#f8f5f0] px-3 py-1.5 text-xs font-bold text-[#6f665e]">{items.length}</span>
        </div>

        {items.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {items.map((item) => {
              const book = firstOf(item.books);
              const subscription = firstOf(item.user_subscriptions);
              const hasActiveSubscription = item.access_type !== "subscription" || isSubscriptionCurrentlyActive(subscription);
              const planName = firstOf(subscription?.subscription_plans ?? null)?.name ?? null;
              const isUnavailable = !book || book.status !== "published" || book.copyright_status === "blocked";
              const canRead = !isUnavailable && hasActiveSubscription;
              const coverUrl = coverByBookId.get(item.book_id);

              return (
                <article key={item.book_id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-[1.35rem] border border-[#efe6dc] bg-white p-3 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-4 sm:p-4">
                  <div className="aspect-[0.72] overflow-hidden rounded-xl bg-[#eee5da]">
                    {coverUrl && book ? (
                      <Image src={coverUrl} alt={book.title} width={180} height={250} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center px-2 text-center text-[0.65rem] font-bold text-[#8a8178]">{book?.title ?? "HB"}</div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                        isUnavailable || !hasActiveSubscription
                          ? "bg-[#fff0ec] text-[#a84b38]"
                          : item.access_type === "free"
                            ? "bg-[#e8f7ef] text-[#18794e]"
                            : item.access_type === "subscription"
                              ? "bg-[#f1edff] text-[#6551b9]"
                              : "bg-[#eaf3ff] text-[#2a659f]"
                      }`}>
                        {isUnavailable ? "Indisponible" : getLibraryAccessLabel(item.access_type, hasActiveSubscription)}
                      </span>
                      {planName ? <span className="text-[0.65rem] font-semibold text-[#8a8178]">{planName}</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[#171717] sm:text-base">{book?.title ?? "Titre indisponible"}</h3>
                    <p className="mt-1 hidden line-clamp-2 text-xs leading-5 text-[#7d7267] sm:block">
                      {book?.description?.trim() || "Prêt à être relu quand vous le souhaitez."}
                    </p>
                    <p className="mt-2 text-[0.65rem] text-[#9a8f84]">Ajouté le {new Date(item.purchased_at).toLocaleDateString("fr-FR")}</p>

                    <div className="mt-auto pt-3">
                      {canRead && book ? (
                        <Link href={`/book/${book.id}?read=1`} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-3 text-xs font-bold text-white sm:w-auto">
                          Lire maintenant <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : item.access_type === "subscription" && !hasActiveSubscription ? (
                        <Link href="/dashboard/reader/subscriptions" className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#fff0ec] px-3 text-xs font-bold text-[#a84b38] sm:w-auto">Réactiver Plus</Link>
                      ) : (
                        <span className="inline-flex min-h-10 items-center text-xs font-semibold text-[#9a8f84]">Lecture temporairement suspendue</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Votre bibliothèque est prête"
              description="Commencez par un livre gratuit, sans engagement, puis retrouvez-le ici après connexion."
              action={<Link href="/library" className="cta-secondary px-5 py-3 text-sm">Voir les livres gratuits</Link>}
            />
          </div>
        )}
      </section>
    </section>
  );
}
