import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, Plus, Search } from "lucide-react";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { BulkDeleteBooksForm } from "@/components/admin/books/bulk-delete-books-form";
import { getCopyrightStatusLabel } from "@/lib/book-copyright";
import { formatMoney } from "@/lib/book-offers";
import { listAdminBooks } from "@/lib/supabase/admin/books";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";

type Props = { searchParams: Promise<{ q?: string; status?: "draft" | "published" | "archived" | "coming_soon"; reviewStatus?: "draft" | "submitted" | "approved" | "rejected" | "changes_requested"; copyrightStatus?: "clear" | "review" | "blocked"; language?: string; authorId?: string; category?: string; singleSaleEnabled?: string; subscriptionAvailable?: string; sort?: "views" | "purchases" | "rating" | "recent"; page?: string; created?: string; deleted?: string; delete_error?: string }> };

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: { label: string; value: string }[] }) {
  return <label className="grid gap-1.5"><span className="text-[.65rem] font-bold uppercase tracking-[.15em] text-[#766e64]">{label}</span><select name={name} defaultValue={value ?? ""} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 text-sm text-[#17231d]"><option value="">Tous</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export default async function AdminBooksPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await listAdminBooks({ page: params.page ? Number(params.page) : 1, search: params.q, status: params.status ?? "", reviewStatus: params.reviewStatus ?? "", copyrightStatus: params.copyrightStatus ?? "", language: params.language ?? "", authorId: params.authorId ?? "", category: params.category ?? "", singleSaleEnabled: params.singleSaleEnabled ?? "", subscriptionAvailable: params.subscriptionAvailable ?? "", sort: params.sort ?? "recent" });
  const hasFilters = Object.entries(params).some(
    ([key, value]) => !["page", "created", "deleted", "delete_error"].includes(key) && Boolean(value),
  );

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" />Vue d’ensemble</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Catalogue</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Gestion des livres</h1><p className="mt-2 max-w-xl text-sm text-white/65">Recherchez un livre, vérifiez son état et ouvrez sa fiche.</p></div><div className="flex flex-wrap items-center gap-2"><span className="w-fit rounded-full border border-white/20 px-4 py-2 text-sm font-bold">{data.pagination.total} livre{data.pagination.total > 1 ? "s" : ""}</span><Link href="/admin/books/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-4 text-sm font-bold text-[#173d2c]"><Plus className="h-4 w-4" />Ajouter jusqu’à 5 livres</Link></div></header>

      {params.created ? <p className="rounded-2xl border border-[#b9ddcb] bg-[#effaf4] px-4 py-3 text-sm font-semibold text-[#266347]">{params.created} livre{params.created === "1" ? "" : "s"} publié{params.created === "1" ? "" : "s"} directement.</p> : null}
      {params.deleted ? <p className="rounded-2xl border border-[#b9ddcb] bg-[#effaf4] px-4 py-3 text-sm font-semibold text-[#266347]">{params.deleted} livre{params.deleted === "1" ? "" : "s"} supprimé{params.deleted === "1" ? "" : "s"} définitivement.</p> : null}
      {params.delete_error ? <p className="rounded-2xl border border-[#e5b9b4] bg-[#fff2f0] px-4 py-3 text-sm font-semibold text-[#8d3028]">{params.delete_error === "selection" ? "Sélectionnez au moins un livre à supprimer." : "La suppression n’a pas pu être terminée. Réessayez."}</p> : null}

      {data.notices.length ? <div className="grid gap-3 md:grid-cols-2">{data.notices.map((notice) => <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />)}</div> : null}

      <form action="/admin/books" className="rounded-[24px] border border-[#ded3c2] bg-white p-4">
        <div className="flex gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#887f74]" /><input name="q" defaultValue={params.q} placeholder="Rechercher par titre, auteur ou ISBN" className="h-12 w-full rounded-full border border-[#d9cebd] bg-[#fffaf2] pl-10 pr-4 text-base outline-none focus:border-[#173d2c]" /></div><button className="h-12 shrink-0 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white">Rechercher</button></div>
        <details className="group mt-3 border-t border-[#e8dfd2] pt-3" open={hasFilters && !params.q}><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#5f574f] [&::-webkit-details-marker]:hidden"><span>Filtres avancés</span><ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Select name="status" label="Publication" value={params.status} options={data.filterOptions.statuses} /><Select name="reviewStatus" label="Vérification" value={params.reviewStatus} options={data.filterOptions.reviewStatuses} /><Select name="copyrightStatus" label="Droits" value={params.copyrightStatus} options={data.filterOptions.copyrightStatuses} /><Select name="authorId" label="Auteur" value={params.authorId} options={data.filterOptions.authors} /><Select name="category" label="Catégorie" value={params.category} options={data.filterOptions.categories} /><Select name="language" label="Langue" value={params.language} options={data.filterOptions.languages} /><Select name="sort" label="Trier par" value={params.sort ?? "recent"} options={[{ label: "Plus récents", value: "recent" }, { label: "Plus vus", value: "views" }, { label: "Plus vendus", value: "purchases" }, { label: "Mieux notés", value: "rating" }]} /><div className="flex items-end gap-2"><button className="h-11 rounded-full bg-[#173d2c] px-4 text-sm font-bold text-white">Appliquer</button><Link href="/admin/books" className="inline-flex h-11 items-center rounded-full border border-[#d9cebd] px-4 text-sm font-bold">Effacer</Link></div></div></details>
      </form>

      <section className="overflow-hidden rounded-[28px] border border-[#ded3c2] bg-white">
        <BulkDeleteBooksForm count={data.items.length}>
        {data.items.map((book) => (
          <article key={book.id} className="border-b border-[#e8dfd2] px-5 py-5 last:border-0 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4"><input type="checkbox" name="book_ids" value={book.id} aria-label={`Sélectionner ${book.title}`} className="mt-1 h-5 w-5 shrink-0 rounded border-[#b9ad9c] accent-[#173d2c]" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge kind="book" value={book.status} /><StatusBadge kind="review" value={book.review_status} />{book.copyright_status !== "clear" ? <StatusBadge kind="copyright" value={book.copyright_status} label={getCopyrightStatusLabel(book.copyright_status)} /> : null}</div><h2 className="mt-3 truncate font-serif text-xl text-[#17231d]">{book.title}</h2><p className="mt-1 truncate text-sm text-[#766e64]">{book.author_name}{book.subtitle ? ` · ${book.subtitle}` : ""}</p><p className="mt-2 text-xs text-[#92887c]">{formatMoney(book.price, book.currency_code)} · {book.views_count} vues · {book.purchases_count} achats · {formatAdminDateTime(book.published_at || book.created_at)}</p></div></div>
              <div className="flex shrink-0 gap-2"><Link href={`/admin/books/${book.id}`} className="inline-flex h-10 items-center rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c] hover:bg-[#f5f0e7]">Consulter</Link><Link href={`/admin/books/${book.id}/edit`} className="inline-flex h-10 items-center rounded-full bg-[#173d2c] px-4 text-sm font-bold text-white">Modifier</Link></div>
            </div>
          </article>
        ))}
        {!data.items.length ? <div className="py-20 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#b7aa9a]" /><h2 className="mt-4 font-serif text-2xl">Aucun livre trouvé</h2><p className="mt-2 text-sm text-[#766e64]">Modifiez la recherche ou effacez les filtres.</p></div> : null}
        </BulkDeleteBooksForm>
      </section>

      <AdminPagination basePath="/admin/books" pagination={data.pagination} params={{ q: params.q ?? "", status: params.status ?? "", reviewStatus: params.reviewStatus ?? "", copyrightStatus: params.copyrightStatus ?? "", language: params.language ?? "", authorId: params.authorId ?? "", category: params.category ?? "", sort: params.sort ?? "recent" }} />
    </div>
  );
}
