import Link from "next/link";
import { BookOpen, CircleDollarSign, Pencil, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BookReviewStatus, Database } from "@/types/database";

type Book = Pick<Database["public"]["Tables"]["books"]["Row"], "id" | "title" | "subtitle" | "status" | "review_status" | "review_note" | "updated_at" | "price" | "currency_code" | "is_single_sale_enabled" | "is_subscription_available">;

const status = {
  published: { label: "Publié", style: "bg-[#e4f1e9] text-[#246343]" }, draft: { label: "Brouillon", style: "bg-[#f5ead2] text-[#89611d]" },
  coming_soon: { label: "À venir", style: "bg-[#e6eef3] text-[#365d72]" }, archived: { label: "Archivé", style: "bg-[#ece9e3] text-[#665f56]" },
} as const;
const review: Record<BookReviewStatus, string> = { draft: "Non soumis", submitted: "En cours de vérification", approved: "Validé", rejected: "Refusé", changes_requested: "Corrections demandées" };

function price(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export default async function AuthorBooksPage() {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("id, title, subtitle, status, review_status, review_note, updated_at, price, currency_code, is_single_sale_enabled, is_subscription_available").eq("author_id", profile.id).order("updated_at", { ascending: false }).returns<Book[]>();
  const books = data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 rounded-[28px] bg-[#173d2c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Mes publications</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Mes livres</h1><p className="mt-2 text-sm text-white/65">Consultez leur état et apportez vos modifications.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/dashboard/author/sales" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold"><CircleDollarSign className="h-4 w-4" />Ventes</Link><Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#e8ac42] px-4 text-sm font-bold text-[#173d2c]"><Plus className="h-4 w-4" />Ajouter</Link></div>
      </header>

      <div className="flex items-center justify-between px-1"><p className="text-sm font-semibold text-[#766e64]">{books.length} livre{books.length > 1 ? "s" : ""}</p><div className="flex gap-3 text-xs font-bold text-[#766e64]"><span>{books.filter((book) => book.status === "published").length} publié{books.filter((book) => book.status === "published").length > 1 ? "s" : ""}</span><span>{books.filter((book) => book.status === "draft").length} brouillon{books.filter((book) => book.status === "draft").length > 1 ? "s" : ""}</span></div></div>

      <section className="overflow-hidden rounded-[28px] border border-[#ded3c2] bg-white px-5 sm:px-6">
        {books.map((book) => (
          <article key={book.id} className="border-b border-[#e8dfd2] py-5 last:border-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[.65rem] font-bold ${status[book.status].style}`}>{status[book.status].label}</span><span className="text-xs text-[#837a70]">{review[book.review_status]}</span></div><h2 className="mt-2 truncate font-serif text-xl text-[#17231d]">{book.title}</h2>{book.subtitle ? <p className="mt-1 truncate text-sm text-[#766e64]">{book.subtitle}</p> : null}<p className="mt-2 text-xs text-[#92887c]">Mis à jour le {new Date(book.updated_at).toLocaleDateString("fr-FR")} · {book.is_single_sale_enabled ? price(Number(book.price), book.currency_code) : "Non vendu à l’unité"}{book.is_subscription_available ? " · Inclus dans Premium" : ""}</p></div>
              <Link href={`/dashboard/author/books/${book.id}/edit`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d9cebd] px-4 text-sm font-bold text-[#173d2c] hover:bg-[#f5f0e7]"><Pencil className="h-3.5 w-3.5" />Modifier</Link>
            </div>
            {book.review_note ? <p className="mt-4 rounded-xl bg-[#fff4e2] px-4 py-3 text-sm text-[#76522b]"><strong>Message de l’équipe :</strong> {book.review_note}</p> : null}
          </article>
        ))}
        {!books.length ? <div className="py-20 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#b7aa9a]" /><h2 className="mt-4 font-serif text-2xl">Votre catalogue est vide</h2><p className="mt-2 text-sm text-[#766e64]">Commencez par ajouter votre premier livre.</p><Link href="/dashboard/author/add-book" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Ajouter un livre</Link></div> : null}
      </section>
    </div>
  );
}
