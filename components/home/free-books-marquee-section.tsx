import Link from "next/link";
import type { PublishedBook } from "@/lib/books";

type FreeBooksMarqueeSectionProps = {
  books: PublishedBook[];
};

function getStageLabel(pageCount?: number | null) {
  if (!pageCount) {
    return {
      label: "Lecture libre",
      description: "Parfait pour entrer dans l univers HolistiqueBooks et repartir avec une premiere idee utile.",
    };
  }

  if (pageCount <= 120) {
    return {
      label: "Demarrage rapide",
      description: "Le bon choix pour lire vite, finir vite et ressentir un premier resultat concret.",
    };
  }

  if (pageCount <= 220) {
    return {
      label: "Progression guidee",
      description: "Ideal pour prolonger l elan, consolider les idees et passer a l action avec plus de profondeur.",
    };
  }

  return {
    label: "Lecture de fond",
    description: "Pour les lecteurs deja engages qui veulent une transformation plus durable et structuree.",
  };
}

function compareStarterBooks(a: PublishedBook, b: PublishedBook) {
  const pagesA = a.page_count ?? 999;
  const pagesB = b.page_count ?? 999;

  if (pagesA !== pagesB) return pagesA - pagesB;

  const dateA = a.published_at ?? a.created_at ?? "";
  const dateB = b.published_at ?? b.created_at ?? "";

  return dateB.localeCompare(dateA);
}

export function FreeBooksMarqueeSection({ books }: FreeBooksMarqueeSectionProps) {
  const freeBooks = books.filter((book) => book.is_free);
  const rankedBooks = [...freeBooks].sort(compareStarterBooks);
  const starterBooks = rankedBooks.slice(0, 5);
  const quickStartCount = freeBooks.filter((book) => (book.page_count ?? 999) <= 120).length;
  const guidedCount = freeBooks.filter((book) => (book.page_count ?? 999) > 120 && (book.page_count ?? 999) <= 220).length;

  if (starterBooks.length === 0) return null;

  return (
    <section id="premiers-pas-gratuits" className="hb-section">
      <div className="hb-section-shell">
        <div className="hb-free-path-panel">
          <div className="hb-free-path-copy">
            <div className="space-y-4">
              <span className="hb-shelf-kicker">Premiers pas gratuits</span>
              <h2 className="section-title text-3xl sm:text-4xl">Prenez un premier livre gratuit et ressentez la difference des les premieres pages.</h2>
              <p className="section-description">
                Nous ne cherchons pas a montrer le plus gros catalogue possible. Nous mettons d abord en avant les livres
                les plus faciles a commencer, a terminer et a recommander, pour transformer une visite en vraie habitude de lecture.
              </p>
            </div>

            <div className="hb-free-strategy-grid">
              <div className="hb-free-strategy-card">
                <strong>1. Finir un premier livre</strong>
                <span>Un lecteur qui termine vite un premier titre gratuit a beaucoup plus de chances de revenir pour la suite.</span>
              </div>
              <div className="hb-free-strategy-card">
                <strong>2. Installer la confiance</strong>
                <span>Les titres intermediaires prennent le relais pour prouver la valeur avant les lectures plus longues.</span>
              </div>
              <div className="hb-free-strategy-card">
                <strong>3. Monter en profondeur</strong>
                <span>Les livres plus denses arrivent ensuite, quand l envie de continuer et l engagement sont deja la.</span>
              </div>
            </div>

            <div className="hb-free-summary-row">
              <span className="hb-shelf-count">{freeBooks.length} livres gratuits</span>
              <span className="hb-free-summary-pill">{quickStartCount} demarrage rapide</span>
              <span className="hb-free-summary-pill">{guidedCount} progression guidee</span>
              <Link href="/books" className="cta-secondary px-5 py-3 text-sm">
                Commencer gratuitement
              </Link>
            </div>
          </div>

          <div className="hb-free-books-grid">
            {starterBooks.map((book, index) => {
              const stage = getStageLabel(book.page_count);

              return (
                <Link key={book.id} href={`/book/${book.id}`} className={`hb-free-book-card ${index === 0 ? "is-featured" : ""}`.trim()}>
                  <div className="hb-free-book-cover">
                    {book.cover_signed_url ? (
                      <img src={book.cover_signed_url} alt={book.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="hb-book-fallback">{book.title}</div>
                    )}
                  </div>

                  <div className="hb-free-book-body">
                    <div className="hb-free-book-topline">
                      <span className="hb-free-book-stage">{stage.label}</span>
                      <span className="hb-free-book-pages">{book.page_count ? `${book.page_count} pages` : "Pages non renseignees"}</span>
                    </div>
                    <h3 className="hb-free-book-title">{book.title}</h3>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-600">{book.subtitle ?? book.description ?? stage.description}</p>
                    <div className="hb-free-book-footer">
                      <span>{book.author_name ?? "Auteur inconnu"}</span>
                      <span>Gratuit</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
