import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic="force-dynamic";
const modules={
 publishing:{title:"Maisons d’édition",table:"publishing_houses",columns:["name","status","email","created_at"],labels:["Maison","Statut","Email","Création"]},
 rights:{title:"Contrats et droits",table:"rights_contracts",columns:["contract_number","rights_holder_name","status","created_at"],labels:["Référence","Titulaire","État","Création"]},
 media:{title:"Éditions audio et vidéo",table:"media_editions",columns:["title","media_type","status","created_at"],labels:["Édition","Type","Statut","Création"]},
 marketing:{title:"Campagnes publicitaires",table:"ad_campaigns",columns:["name","advertiser_name","status","created_at"],labels:["Campagne","Annonceur","Statut","Création"]},
 subscriptions:{title:"Abonnements",table:"subscription_plans",columns:["name","price","currency_code","is_active"],labels:["Formule","Prix","Devise","Active"]},
 royalties:{title:"Redevances auteurs",table:"author_royalty_transactions",columns:["source","net_royalty","currency_code","status"],labels:["Origine","Montant","Devise","Statut"]},
 education:{title:"Référentiel académique RDC",table:"academic_taxonomies",columns:["name","audience","kind","is_official"],labels:["Classification","Public","Niveau","Officiel"]}
} as const;
type Key=keyof typeof modules;
const render=(v:unknown)=>{
 if(v===null||v===undefined)return "—";
 if(typeof v==="boolean")return v?"Oui":"Non";
 if(typeof v==="number")return v.toLocaleString("fr-FR");
 if(typeof v==="string"&&/^\d{4}-\d\d-\d\dT/.test(v))return new Date(v).toLocaleDateString("fr-FR");
 return String(v);
};
export default async function AdminSectionPage({params}:{params:Promise<{section:string}>}){
 const {section}=await params;
 if(!(section in modules))notFound();
 await requireAdmin();
 const item=modules[section as Key];
 const db=await createClient();
 const {data,count,error}=await db.from(item.table).select("id,"+item.columns.join(","),{count:"exact"}).limit(100);
 return <section className="space-y-5">
  <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Administration Supabase</p><h1 className="mt-2 text-3xl font-black">{item.title}</h1><p className="mt-2 text-sm text-slate-600">Données éditoriales et commerciales de HolisticBooks, en consultation sécurisée.</p></div>
  <div className="flex items-center justify-between gap-3 rounded-md border border-rule bg-white p-4"><p className="text-sm font-semibold">{count??"—"} enregistrements</p><Link href="/dashboard/admin" className="text-xs font-bold text-brand-600">← Tableau de bord</Link></div>
  {error?<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</p>:null}
  <div className="overflow-x-auto rounded-md border border-rule bg-white"><table className="w-full min-w-[640px] text-left text-sm">
   <thead className="bg-paper"><tr>{item.labels.map(label=><th key={label} className="p-4">{label}</th>)}</tr></thead>
   <tbody>{((data??[]) as unknown as Array<Record<string,unknown>>).map((row,i)=><tr key={String(row.id??i)} className="border-t border-rule">
    {item.columns.map(column=><td key={column} className="max-w-[300px] break-words p-4">{render(row[column])}</td>)}
   </tr>)}</tbody>
  </table>{!data?.length&&!error?<p className="p-5 text-sm text-slate-600">Aucune donnée enregistrée.</p>:null}</div>
  <p className="text-xs text-slate-500">Les opérations sensibles, notamment la validation des droits et les décaissements, ne sont pas autorisées sur cette vue en lecture seule.</p>
 </section>;
}
