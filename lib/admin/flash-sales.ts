import { getPublishedBooks } from "@/lib/books";
import { getFlashSaleState } from "@/lib/flash-sales";
import type { AdminNotice, AdminOption } from "@/types/admin";

export async function getAdminFlashSaleData() {
  const publishedBooks = await getPublishedBooks();
  const state = await getFlashSaleState(publishedBooks);

  const eligibleOptions: AdminOption[] = state.eligibleBooks.map((book) => ({
    value: book.id,
    label: `${book.title} - ${book.author_name}`,
  }));

  const notices: AdminNotice[] = [
    {
      id: "flash-sale-storage",
      tone: "success",
      title: "Flash sale compatible Vercel",
      description:
        "La configuration flash sale cible maintenant Supabase, ce qui evite les ecritures locales fragiles en production et garde la home synchronisee entre plusieurs postes.",
    },
  ];

  if (!state.hasCustomSelection) {
    notices.push({
      id: "flash-sale-fallback",
      tone: "info",
      title: "Mode fallback actif",
      description:
        "Aucune selection manuelle n'est definie. La home affiche donc les premiers livres eligibles a la vente unitaire, comme avant l'ajout du back-office.",
    });
  }

  if (state.invalidBookIds.length > 0) {
    notices.push({
      id: "flash-sale-invalid",
      tone: "danger",
      title: "References invalides detectees",
      description: `Certains identifiants ne sont plus eligibles pour la flash sale: ${state.invalidBookIds.join(", ")}. Videz ou nettoyez la selection si necessaire.`,
    });
  }

  return {
    ...state,
    eligibleOptions,
    notices,
  };
}
