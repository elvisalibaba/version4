import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/data-source";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic="force-dynamic";
export default async function AdminPage(){
 if(!isSupabaseMode())redirect("/dashboard/admin");
 await requireAdmin();
 const c=await createClient();
 const entities=["books","author_profiles","profiles","orders","publishing_houses","media_editions","rights_contracts","ad_campaigns"];
 const counts=await Promise.all(entities.map(async name=>{
   const {count,error}=await c.from(name).select("id",{count:"exact",head:true});
   return {name,count:error?"Erreur":count??0};
 }));
 return <div className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div><h2 className="text-3xl font-bold text-night-900">Plateforme HolisticBooks</h2>
      <p className="mt-2 text-slate-600">Statistiques en temps réel issues de Supabase. Les paiements et la lecture protégée restent suspendus avant validation.</p></div>
    <Link href="/admin/books/new" className="rounded-sm bg-brand-600 px-5 py-3 text-sm font-bold text-white">Ajouter un livre</Link>
  </div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {counts.map(item=><div key={item.name} className="rounded-md border border-rule bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{item.name.replaceAll("_"," ")}</p>
      <p className="mt-2 text-3xl font-bold text-night-900">{item.count}</p>
    </div>)}
  </div>
  <section className="rounded-md border border-rule bg-white p-6">
    <h3 className="text-lg font-bold">Fonctions disponibles</h3>
    <p className="mt-2 text-sm text-slate-600">Catalogue, couverture, fichiers privés et inventaire des comptes. Les opérations financières et le lecteur anti-téléchargement sont bloqués tant que leur validation serveur n&apos;est pas complète.</p>
    <div className="mt-4 flex gap-4 text-sm font-semibold">
      <Link className="text-brand-600 underline" href="/admin/books">Gérer le catalogue</Link>
      <Link className="text-brand-600 underline" href="/admin/authors">Auteurs</Link>
    </div>
  </section>
 </div>;
}
