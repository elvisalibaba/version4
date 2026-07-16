import { getPublishedBooks } from "@/lib/books";
import { getHomeFeaturedState } from "@/lib/home-positioning";
import type { AdminNotice, AdminOption } from "@/types/admin";

export async function getAdminHomePositioningData() {
  const publishedBooks = await getPublishedBooks();
  const state = await getHomeFeaturedState(publishedBooks);

  const eligibleOptions: AdminOption[] = [...state.eligibleBooks]
    .sort((left, right) => left.title.localeCompare(right.title, "fr"))
    .map((book) => ({
      value: book.id,
      label: `${book.title} - ${book.author_name}`,
    }));

  const notices: AdminNotice[] = [
    {
      id: "home-positioning-storage",
      tone: "success",
      title: "Positionnement home centralise",
      description:
        "La mise en avant des livres sur la home est geree via Supabase, avec fallback local de securite pour eviter les pertes de configuration.",
    },
  ];

  if (!state.hasCustomSelection) {
    notices.push({
      id: "home-positioning-fallback",
      tone: "info",
      title: "Ordre automatique actif",
      description:
        "Aucune selection manuelle n est definie. La home conserve donc l ordre public standard tant qu aucun livre n est epingle.",
    });
  }

  if (state.invalidBookIds.length > 0) {
    notices.push({
      id: "home-positioning-invalid",
      tone: "danger",
      title: "References invalides detectees",
      description: `Certains identifiants n existent plus dans le catalogue publie: ${state.invalidBookIds.join(", ")}.`,
    });
  }

  return {
    ...state,
    eligibleOptions,
    notices,
  };
}
