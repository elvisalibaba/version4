import Link from "next/link";
import { listAdminUsers } from "@/lib/supabase/admin/users";
import { formatAdminDateTime } from "@/lib/supabase/admin/shared";
import { AdminFilterBar } from "@/components/admin/filters/admin-filter-bar";
import { AdminSearchInput } from "@/components/admin/filters/admin-search-input";
import { AdminSelect } from "@/components/admin/filters/admin-select";
import { AdminDataTable } from "@/components/admin/tables/admin-data-table";
import { AdminPagination } from "@/components/admin/tables/admin-pagination";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminPanel } from "@/components/admin/shared/admin-panel";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { AdminNotice } from "@/components/admin/shared/admin-notice";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: "reader" | "author" | "admin";
    page?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const { q, role, page } = await searchParams;
  const data = await listAdminUsers({
    page: page ? Number(page) : 1,
    search: q,
    role: role ?? "",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Utilisateurs"
        description="Supervision des profils lecteurs, auteurs et admins a partir de profiles, avec les compteurs d activite relies au schema existant."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Utilisateurs" },
        ]}
      />

      {data.notices.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {data.notices.map((notice) => (
            <AdminNotice key={notice.id} tone={notice.tone} title={notice.title} description={notice.description} />
          ))}
        </div>
      ) : null}

      <AdminPanel title="Filtres" description="Recherche par nom, email ou role, avec pagination serveur.">
        <AdminFilterBar action="/admin/users">
          <AdminSearchInput defaultValue={q} placeholder="Nom, email ou role" />
          <AdminSelect
            name="role"
            label="Role"
            defaultValue={role}
            options={[
              { label: "Lecteur", value: "reader" },
              { label: "Auteur", value: "author" },
              { label: "Admin", value: "admin" },
            ]}
          />
          <div className="flex gap-3">
            <button type="submit" className="cta-primary px-5 py-3 text-sm">
              Appliquer
            </button>
            <Link href="/admin/users" className="cta-secondary px-5 py-3 text-sm">
              Reinitialiser
            </Link>
          </div>
        </AdminFilterBar>
      </AdminPanel>

      <AdminPanel title="Tous les utilisateurs" description="Chaque ligne centralise role, historique commercial et engagement de lecture.">
        <AdminDataTable columns={["Utilisateur", "Role", "Creation", "Bibliotheque", "Commandes", "Abonnement", "Engagement"]}>
          {data.items.map((user) => (
            <tr key={user.id} className="border-t border-violet-100/70">
              <td className="px-4 py-3">
                <Link href={`/admin/users/${user.id}`} className="font-semibold text-slate-950 hover:text-violet-700">
                  {user.name ?? "Sans nom"}
                </Link>
                <p className="text-sm text-slate-500">{user.email}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge kind="role" value={user.role} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatAdminDateTime(user.created_at)}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{user.libraryCount}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-950">{user.orderCount}</td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {user.activeSubscription ? (
                  <>
                    <StatusBadge kind="subscription" value={user.activeSubscription.status} />
                    <div className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{user.activeSubscription.planName}</div>
                  </>
                ) : (
                  "Aucun"
                )}
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">
                {user.ratingsCount} notes - {user.highlightsCount} highlights
              </td>
            </tr>
          ))}
        </AdminDataTable>

        <div className="mt-4">
          <AdminPagination
            basePath="/admin/users"
            pagination={data.pagination}
            params={{ q: q ?? "", role: role ?? "" }}
          />
        </div>
      </AdminPanel>
    </div>
  );
}
