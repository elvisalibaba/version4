import Link from "next/link";
import { formatMoney } from "@/lib/book-offers";
import { saveBookFormatAction } from "@/app/admin/actions";
import { listAdminFormats, getAdminFormatEditorOptions } from "@/lib/supabase/admin/formats";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";

type FormatsPageProps = {
  searchParams: Promise<{
    q?: string;
    format?: "ebook" | "paperback" | "hardcover" | "audiobook";
    publication?: string;
    stock?: string;
    page?: string;
  }>;
};

export default async function AdminFormatsPage({ searchParams }: FormatsPageProps) {
  const { q, format, publication, stock, page } = await searchParams;
  const [data, editorOptions] = await Promise.all([
    listAdminFormats({
      page: page ? Number(page) : 1,
      search: q,
      format: format ?? "",
      publication: publication ?? "",
      stock: stock ?? "",
    }),
    getAdminFormatEditorOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Formats"
        description="Gestion des book_formats, de leur publication, de leur pricing, du cout d impression et des assets relies."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Formats" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <AdminPanel title="Creer un format" description="Ajout d un nouveau format pour un livre existant, avec cout d impression si le format est physique.">
        <form action={saveBookFormatAction} className="grid gap-4 xl:grid-cols-6">
          <input type="hidden" name="redirect_to" value="/admin/formats" />
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Livre</span>
            <select name="book_id" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              {editorOptions.books.map((book) => (
                <option key={book.value} value={book.value}>
                  {book.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Format</span>
            <select name="format" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900">
              <option value="ebook">ebook</option>
              <option value="paperback">paperback</option>
              <option value="hardcover">hardcover</option>
              <option value="audiobook">audiobook</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prix</span>
            <input type="number" step="0.01" name="price" defaultValue="0" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Devise</span>
            <input type="text" name="currency_code" defaultValue="USD" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cout impression</span>
            <input type="number" step="0.01" name="printing_cost" defaultValue="" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="cta-primary w-full px-5 py-3 text-sm">
              Creer
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Filtres" description="Recherche par livre ou auteur, filtre par format, publication et stock.">
        <AdminFilterBar action="/admin/formats">
          <AdminSearchInput defaultValue={q} placeholder="Livre ou auteur" />
          <AdminSelect name="format" label="Format" defaultValue={format} options={data.filterOptions.formats} />
          <AdminSelect
            name="publication"
            label="Publication"
            defaultValue={publication}
            options={[
              { label: "Publie", value: "published" },
              { label: "Brouillon", value: "unpublished" },
            ]}
          />
          <AdminSelect
            name="stock"
            label="Stock"
            defaultValue={stock}
            options={[
              { label: "En stock", value: "in_stock" },
              { label: "Rupture", value: "out_of_stock" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/formats" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Tous les formats" description="Lecture des formats par livre, auteur, cout d impression et disponibilite.">
        <AdminDataTable columns={["Livre", "Auteur", "Format", "Prix", "Cout impression", "Stock", "Publication", "Action"]}>
          {data.items.map((entry) => (
            <tr key={entry.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/formats/${entry.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {entry.book_title}
                </Link>
                <p className="text-sm text-slate-500">{formatAdminDateTime(entry.created_at)}</p>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.author_name}</td>
              <td className="px-4 py-3">
                <StatusBadge kind="format" value={entry.format} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatMoney(entry.price, entry.currency_code)}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.printing_cost !== null ? formatMoney(entry.printing_cost, entry.currency_code) : "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.stock_quantity ?? "-"}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{entry.is_published ? "Publie" : "Brouillon"}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/formats/${entry.id}`} className="cta-secondary px-4 py-2 text-xs">
                  Detail
                </Link>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/formats"
            pagination={data.pagination}
            params={{ q: q ?? "", format: format ?? "", publication: publication ?? "", stock: stock ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
