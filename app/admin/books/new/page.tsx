import Link from "next/link";
import { ArrowLeft, BookPlus } from "lucide-react";
import { createAdminBooksAction } from "@/app/admin/actions";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

export default async function NewAdminBooksPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("author_profiles").select("id, display_name").order("display_name");
  const authors = data ?? [];

  return <div className="space-y-5 pb-10">
    <header className="rounded-[28px] bg-[#173d2c] p-6 text-white sm:p-8"><Link href="/admin/books" className="inline-flex items-center gap-2 text-sm font-bold text-white/65"><ArrowLeft className="h-4 w-4" />Gestion des livres</Link><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-[#f2c66f]">Publication directe</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Ajouter jusqu’à cinq livres</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Les livres renseignés seront publiés immédiatement et marqués comme validés. Laissez les blocs inutilisés vides.</p></header>

    <form action={createAdminBooksAction} encType="multipart/form-data" className="space-y-4">
      {Array.from({ length: 5 }, (_, index) => <fieldset key={index} className="rounded-[26px] border border-[#ded3c2] bg-white p-5"><legend className="px-2 font-serif text-xl text-[#17231d]">Livre {index + 1}{index > 0 ? <span className="ml-2 text-xs font-sans font-normal text-[#837a70]">facultatif</span> : null}</legend><div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5 xl:col-span-2"><span className="text-xs font-bold text-[#766e64]">Titre {index === 0 ? "*" : ""}</span><input name={`title_${index}`} required={index === 0} className="h-11 rounded-xl border border-[#d9cebd] px-3" /></label>
        <label className="grid gap-1.5"><span className="text-xs font-bold text-[#766e64]">Auteur *</span><select name={`author_id_${index}`} required={index === 0} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3"><option value="">Choisir</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.display_name}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="text-xs font-bold text-[#766e64]">Nom affiché</span><input name={`author_name_${index}`} className="h-11 rounded-xl border border-[#d9cebd] px-3" /></label>
        <label className="grid gap-1.5 xl:col-span-2"><span className="text-xs font-bold text-[#766e64]">Description</span><textarea name={`description_${index}`} rows={3} className="rounded-xl border border-[#d9cebd] px-3 py-2" /></label>
        <label className="grid gap-1.5"><span className="text-xs font-bold text-[#766e64]">Catégorie</span><select name={`categories_${index}`} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3"><option value="">Choisir</option>{BOOK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2"><label className="grid gap-1.5"><span className="text-xs font-bold text-[#766e64]">Prix</span><input name={`price_${index}`} type="number" min="0" step="0.01" defaultValue="0" className="h-11 rounded-xl border border-[#d9cebd] px-3" /></label><label className="grid gap-1.5"><span className="text-xs font-bold text-[#766e64]">Devise</span><input name={`currency_code_${index}`} defaultValue="USD" className="h-11 rounded-xl border border-[#d9cebd] px-3" /></label></div>
        <label className="grid gap-1.5 xl:col-span-2"><span className="text-xs font-bold text-[#766e64]">Importer la couverture {index === 0 ? "*" : ""}</span><input name={`cover_file_${index}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" required={index === 0} className="rounded-xl border border-[#d9cebd] bg-[#fffaf2] px-3 py-2 text-sm" /><span className="text-[.65rem] text-[#92887c]">JPG, PNG, WebP ou AVIF</span></label>
        <label className="grid gap-1.5 xl:col-span-2"><span className="text-xs font-bold text-[#766e64]">Importer le fichier numérique {index === 0 ? "*" : ""}</span><input name={`ebook_file_${index}`} type="file" accept=".epub,.pdf,.mobi,application/epub+zip,application/pdf" required={index === 0} className="rounded-xl border border-[#d9cebd] bg-[#fffaf2] px-3 py-2 text-sm" /><span className="text-[.65rem] text-[#92887c]">EPUB, PDF ou MOBI</span></label>
        <input type="hidden" name={`language_${index}`} value="fr" /><label className="flex items-center gap-2 text-sm font-semibold text-[#5f574f]"><input type="checkbox" name={`premium_${index}`} className="h-4 w-4" />Inclure dans Premium</label>
      </div></fieldset>)}
      <div className="sticky bottom-3 flex justify-end rounded-2xl border border-[#ded3c2] bg-[#fffaf2]/95 p-3 shadow-xl backdrop-blur"><button className="inline-flex h-12 items-center gap-2 rounded-full bg-[#173d2c] px-6 text-sm font-bold text-white"><BookPlus className="h-4 w-4" />Publier les livres renseignés</button></div>
    </form>
  </div>;
}
