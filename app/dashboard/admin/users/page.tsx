import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function AdminUsersPage({searchParams}:{searchParams:Promise<{q?:string;role?:string}>}){
 await requireAdmin();const {q="",role=""}=await searchParams;
 const filter=q.replace(/[%_,]/g," ").trim().slice(0,80);
 const roleFilter=["reader","author","admin"].includes(role)?role:"";
 const db=await createClient();
 let query=db.from("profiles").select("id,name,email,role,created_at,country",{count:"exact"});
 if(filter)query=query.or(`name.ilike.%${filter}%,email.ilike.%${filter}%`);
 if(roleFilter)query=query.eq("role",roleFilter);
 const {data,count,error}=await query.order("created_at",{ascending:false}).limit(100);
 return <section className="space-y-5">
  <div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Comptes Supabase</p><h1 className="mt-2 text-3xl font-black">Utilisateurs</h1><p className="mt-2 text-sm text-slate-600">{count??"—"} profils.</p></div>
  <form action="/dashboard/admin/users" className="flex flex-wrap items-end gap-3 rounded-md border border-rule bg-white p-4">
   <label className="min-w-40 flex-1 text-xs font-bold">Recherche<input name="q" defaultValue={q} placeholder="Nom ou email" className="mt-2 block h-11 w-full rounded-md border border-rule-strong px-3 text-sm"/></label>
   <label className="text-xs font-bold">Rôle<select name="role" defaultValue={roleFilter} className="mt-2 block h-11 rounded-md border border-rule-strong bg-white px-3 text-sm"><option value="">Tous</option><option value="reader">Lecteur</option><option value="author">Auteur</option><option value="admin">Administrateur</option></select></label>
   <button className="h-11 rounded-sm bg-night-900 px-5 text-sm font-bold text-white" type="submit">Filtrer</button>
  </form>
  {error?<p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-800">Accès aux utilisateurs indisponible.</p>:null}
  <div className="overflow-x-auto rounded-md border border-rule bg-white"><table className="w-full min-w-[680px] text-left text-sm">
   <thead className="bg-paper"><tr><th className="p-4">Nom</th><th className="p-4">Email</th><th className="p-4">Rôle</th><th className="p-4">Pays</th><th className="p-4">Inscription</th></tr></thead>
   <tbody>{(data??[]).map(u=><tr key={u.id} className="border-t border-rule"><td className="p-4 font-bold">{u.name??"Non renseigné"}</td><td className="p-4">{u.email??"—"}</td><td className="p-4">{u.role}</td><td className="p-4">{u.country??"—"}</td><td className="p-4">{u.created_at?new Date(u.created_at).toLocaleDateString("fr-FR"):"—"}</td></tr>)}</tbody></table>
   {!error&&!data?.length?<p className="p-5 text-sm text-slate-600">Aucun utilisateur.</p>:null}
  </div>
  <Link href="/dashboard/admin" className="text-sm font-bold text-brand-600">← Tableau de bord</Link>
 </section>;
}
