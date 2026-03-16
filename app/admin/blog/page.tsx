import Link from "next/link";
import { CalendarDays, FileText, FolderKanban, Tags } from "lucide-react";
import { createBlogPostAction, deleteBlogPostAction } from "@/app/admin/actions";
import { AdminKpiCard } from "@/components/admin/dashboard/admin-kpi-card";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { ConfirmSubmitButton } from "@/components/admin/forms/confirm-submit-button";
import { AdminNotice } from "@/components/admin/shared/admin-notice";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { listAdminBlogPosts } from "@/lib/admin/blog";
import { formatAdminDate } from "@/lib/supabase/admin/shared";

type AdminBlogPageProps = {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    page?: string;
  }>;
};

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const { q, tag, page } = await searchParams;
  const data = await listAdminBlogPosts({
    page: page ? Number(page) : 1,
    search: q,
    tag: tag ?? "",
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog editorial"
        description="Ajout, suppression et enrichissement des articles visibles sur le blog public et dans la home, avec stockage compatible Vercel."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Blog" },
        ]}
        actions={
          <Link href="/blog" className="cta-secondary px-5 py-3 text-sm">
            Voir le blog public
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={FileText} label="Articles" value={data.stats.totalPosts} hint={`${data.stats.filteredPosts} visibles avec les filtres`} />
        <AdminKpiCard icon={Tags} label="Tags" value={data.stats.totalTags} hint="Taxonomie editoriale actuelle" tone="sky" />
        <AdminKpiCard
          icon={CalendarDays}
          label="Derniere publication"
          value={data.stats.latestPostDate ? formatAdminDate(data.stats.latestPostDate) : "-"}
          hint="Date de publication la plus recente"
          tone="emerald"
        />
        <AdminKpiCard icon={FolderKanban} label="Persistance" value="Supabase" hint="Compatible Vercel et multi-postes" tone="amber" />
      </div>

      <AdminNotice
        tone="success"
        title="Blog compatible production"
        description="Les billets admin sont maintenant penses pour un stockage Supabase, plus fiable sur Vercel. Vous pouvez aussi ajouter une image de couverture et des images dans le contenu."
      />

      <AdminPanel title="Ajouter un article" description="Le slug est optionnel. Ajoutez une image de couverture via URL, puis utilisez une ligne `![Alt](https://image-url)` dans le contenu pour inserer une image inline.">
        <form action={createBlogPostAction} className="grid gap-4 xl:grid-cols-2">
          <input type="hidden" name="redirect_to" value="/admin/blog" />
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titre</span>
            <input type="text" name="title" required className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slug</span>
            <input type="text" name="slug" placeholder="genere automatiquement" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tag</span>
            <input type="text" name="tag" required className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Auteur</span>
            <input type="text" name="author" required defaultValue="Equipe Holistique" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</span>
            <input type="date" name="date" defaultValue={today} className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Temps de lecture</span>
            <input type="text" name="read_time" defaultValue="5 min" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Libelle cover</span>
            <input type="text" name="cover_label" defaultValue="Magazine editorial" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Image cover URL</span>
            <input type="url" name="cover_image_url" placeholder="https://..." className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alt image cover</span>
            <input type="text" name="cover_image_alt" placeholder="Description de l image" className="min-h-11 rounded-2xl border border-violet-200 bg-white px-4 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Excerpt</span>
            <textarea name="excerpt" required rows={3} className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900" />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contenu</span>
            <textarea
              name="content"
              required
              rows={10}
              placeholder={"Un paragraphe par ligne\n![Alt image](https://image-url)\n![Alt image](https://image-url \"Caption optionnelle\")"}
              className="rounded-[1.4rem] border border-violet-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </label>
          <div className="xl:col-span-2">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Publier l article
            </button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Filtres" description="Recherche par titre, auteur, tag, slug ou contenu.">
        <AdminFilterBar action="/admin/blog">
          <AdminSearchInput defaultValue={q} placeholder="Titre, auteur, tag ou slug" />
          <AdminSelect name="tag" label="Tag" defaultValue={tag} options={data.filterOptions.tags} />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/blog" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Articles publies" description="Chaque suppression retire aussi l'article des pages publiques apres revalidation.">
        <AdminDataTable columns={["Article", "Tag", "Publication", "Lecture", "Action"]}>
          {data.items.map((post) => (
            <tr key={post.slug} className="border-t border-violet-100/70 align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-950">{post.title}</p>
                <p className="mt-1 text-sm text-slate-500">{post.excerpt}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                  <span>{post.author}</span>
                  <span>{post.paragraphCount} paragraphes</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{post.tag}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {formatAdminDate(post.date)}
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{post.slug}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{post.readTime}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/blog/${post.slug}`} className="cta-secondary px-4 py-2 text-xs">
                    Voir
                  </Link>
                  <form action={deleteBlogPostAction}>
                    <input type="hidden" name="slug" value={post.slug} />
                    <input type="hidden" name="redirect_to" value="/admin/blog" />
                    <ConfirmSubmitButton
                      label="Supprimer"
                      confirmMessage={`Supprimer l'article ${post.title} ?`}
                      className="cta-secondary px-4 py-2 text-xs text-rose-700"
                    />
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination basePath="/admin/blog" pagination={data.pagination} params={{ q: q ?? "", tag: tag ?? "" }} />
        </div>
      </AdminPanel>
    </div>
  );
}
