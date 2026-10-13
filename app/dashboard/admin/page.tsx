import Link from "next/link";
import { BookOpen, Users, Receipt, Clock3, ShieldCheck, Building2, Megaphone, Headphones, CreditCard, ArrowRight, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";
const amount=(v:number,c:string)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:c,maximumFractionDigits:2}).format(v);
const fmtDate=(s:string|null)=>s?new Date(s).toLocaleDateString("fr-FR"):"—";
export default async function AdminDashboardPage(){
 await requireAdmin();
 const db=await createClient();
 const [books,published,pending,users,authors,orders,paid,publishers,rights,media,ads,lastBooks,lastOrders,lastUsers,lastPaid]=await Promise.all([
  db.from("books").select("id",{count:"exact",head:true}),
  db.from("books").select("id",{count:"exact",head:true}).eq("status","published"),
  db.from("books").select("id",{count:"exact",head:true}).eq("review_status","submitted"),
  db.from("profiles").select("id",{count:"exact",head:true}),
  db.from("author_profiles").select("id",{count:"exact",head:true}),
  db.from("orders").select("id",{count:"exact",head:true}),
  db.from("orders").select("id",{count:"exact",head:true}).eq("payment_status","paid"),
  db.from("publishing_houses").select("id",{count:"exact",head:true}),
  db.from("rights_contracts").select("id",{count:"exact",head:true}),
  db.from("media_editions").select("id",{count:"exact",head:true}),
  db.from("ad_campaigns").select("id",{count:"exact",head:true}),
  db.from("books").select("id,title,author_display_name,review_status,status,created_at").order("created_at",{ascending:false}).limit(7),
  db.from("orders").select("id,total_price,currency_code,payment_status,created_at").order("created_at",{ascending:false}).limit(6),
  db.from("profiles").select("id,name,email,role,created_at").order("created_at",{ascending:false}).limit(6),
  db.from("orders").select("total_price,currency_code").eq("payment_status","paid").order("created_at",{ascending:false}).limit(100)
 ]);
 const stats=[
  {title:"Livres",count:books.error?null:books.count,desc:"Catalogue complet",url:"/dashboard/admin/books",icon:BookOpen},
  {title:"Publications",count:published.error?null:published.count,desc:"Livres publiés",url:"/dashboard/admin/books",icon:ShieldCheck},
  {title:"À valider",count:pending.error?null:pending.count,desc:"Éditions en attente",url:"/dashboard/admin/books",icon:Clock3},
  {title:"Utilisateurs",count:users.error?null:users.count,desc:"Profils enregistrés",url:"/dashboard/admin/users",icon:Users},
  {title:"Auteurs",count:authors.error?null:authors.count,desc:"Profils auteurs",url:"/admin/authors",icon:Users},
  {title:"Commandes",count:orders.error?null:orders.count,desc:"Transactions",url:"/dashboard/admin/orders",icon:Receipt},
  {title:"Payées",count:paid.error?null:paid.count,desc:"Statut en base",url:"/dashboard/admin/orders",icon:CreditCard},
  {title:"Maisons d’édition",count:publishers.error?null:publishers.count,desc:"Structures partenaires",url:"/dashboard/admin/publishing",icon:Building2},
 ];
 const modules=[
  {title:"Droits & contrats",count:rights.error?null:rights.count,url:"/dashboard/admin/rights",icon:ShieldCheck},
  {title:"Audio & vidéo",count:media.error?null:media.count,url:"/dashboard/admin/media",icon:Headphones},
  {title:"Publicités",count:ads.error?null:ads.count,url:"/dashboard/admin/marketing",icon:Megaphone},
  {title:"Référentiel RDC",count:null,url:"/dashboard/admin/education",icon:BookOpen},
 ];
 const revenues=new Map<string,number>();
 for(const row of lastPaid.data??[]){const c=row.currency_code??"USD";revenues.set(c,(revenues.get(c)??0)+Number(row.total_price??0));}
 return <>
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-xs font-bold uppercase tracking-[.15em] text-brand-600">Pilotage général</p><h1 className="mt-2 text-3xl font-black tracking-tight text-night-900 sm:text-4xl">Tableau de bord</h1><p className="mt-2 text-sm text-slate-600">Vue professionnelle des activités de HolisticBooks.</p></div>
   <span className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800"><Activity className="h-4 w-4"/>Données Supabase</span>
  </div>
  <section aria-label="Indicateurs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
   {stats.map(s=>{const Icon=s.icon;return <Link key={s.title} href={s.url} className="group rounded-md border border-rule-strong bg-white p-5 transition hover:border-brand-300 hover:shadow-sm">
    <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-brand-600"/><ArrowRight className="h-4 w-4 text-slate-400"/></div>
    <p className="mt-5 text-3xl font-black tabular-nums text-night-900">{s.count===null?"—":Number(s.count).toLocaleString("fr-FR")}</p>
    <h2 className="mt-2 text-sm font-bold">{s.title}</h2><p className="mt-1 text-xs text-slate-500">{s.count===null?"Données non accessibles":s.desc}</p>
   </Link>})}
  </section>
  <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
   <div className="rounded-md border border-rule-strong bg-white p-5 sm:p-6">
    <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-black">Derniers livres</h2><Link href="/dashboard/admin/books" className="text-xs font-bold text-brand-600">Voir le catalogue →</Link></div>
    {lastBooks.error?<p className="mt-5 text-sm text-red-700">Lecture impossible : permissions Supabase à vérifier.</p>:
     <div className="mt-4 divide-y divide-rule">{(lastBooks.data??[]).map(b=><div key={b.id} className="flex items-center justify-between gap-3 py-3">
       <div className="min-w-0"><Link href={`/dashboard/admin/books/${b.id}`} className="line-clamp-1 text-sm font-bold text-night-900 hover:text-brand-600">{b.title}</Link><p className="mt-1 text-xs text-slate-500">{b.author_display_name??"Auteur non précisé"} · {fmtDate(b.created_at)}</p></div>
       <span className="rounded-sm bg-paper px-2 py-1 text-xs font-bold">{b.review_status??b.status}</span>
     </div>)}{!lastBooks.data?.length?<p className="py-4 text-sm text-slate-500">Aucun livre.</p>:null}</div>}
   </div>
   <div className="rounded-md bg-night-900 p-5 text-white sm:p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Suivi commercial</p><h2 className="mt-3 text-xl font-black">Commandes Supabase</h2>
    <p className="mt-2 text-xs leading-5 text-white/65">Montants des 100 dernières commandes marquées payées. Indicateur limité, non certifié comme chiffre d’affaires.</p>
    <div className="mt-6 space-y-2">{lastPaid.error?<p className="text-sm text-red-200">Données financières indisponibles.</p>:[...revenues.entries()].map(([currency,total])=><p key={currency} className="text-2xl font-black">{amount(total,currency)}</p>)}
    {!lastPaid.error&&revenues.size===0?<p className="text-xl font-bold">Aucun paiement enregistré</p>:null}</div>
    <Link href="/dashboard/admin/orders" className="mt-6 inline-block text-sm font-bold text-brand-300">Examiner les commandes →</Link>
    <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/60">Les variables EasyPay et CinetPay existent sur Vercel, mais la validation du paiement dans Supabase doit encore être migrée.</p>
   </div>
  </section>
  <section className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-md border border-rule-strong bg-white p-5">
    <div className="flex justify-between gap-2"><h2 className="text-lg font-black">Commandes récentes</h2><Link href="/dashboard/admin/orders" className="text-xs font-bold text-brand-600">Toutes →</Link></div>
    {lastOrders.error?<p className="mt-4 text-sm text-red-700">Accès impossible.</p>:
     <div className="mt-4 divide-y divide-rule">{(lastOrders.data??[]).map(o=><div key={o.id} className="flex items-center justify-between gap-3 py-3">
      <div><p className="text-xs font-bold">#{o.id.slice(0,8)}</p><p className="mt-1 text-xs text-slate-500">{fmtDate(o.created_at)}</p></div>
      <div className="text-right"><p className="text-sm font-bold">{amount(Number(o.total_price??0),o.currency_code??"USD")}</p><p className="text-xs text-slate-500">{o.payment_status}</p></div>
     </div>)}{!lastOrders.data?.length?<p className="py-4 text-sm text-slate-500">Aucune commande.</p>:null}</div>}
   </div>
   <div className="rounded-md border border-rule-strong bg-white p-5">
    <div className="flex justify-between gap-2"><h2 className="text-lg font-black">Nouveaux utilisateurs</h2><Link href="/dashboard/admin/users" className="text-xs font-bold text-brand-600">Tous →</Link></div>
    {lastUsers.error?<p className="mt-4 text-sm text-red-700">Accès impossible.</p>:
     <div className="mt-4 divide-y divide-rule">{(lastUsers.data??[]).map(u=><div key={u.id} className="flex items-center justify-between gap-3 py-3">
       <div className="min-w-0"><p className="truncate text-sm font-bold">{u.name??u.email??"Utilisateur"}</p><p className="truncate text-xs text-slate-500">{u.email??"—"}</p></div>
       <span className="rounded-sm bg-paper px-2 py-1 text-xs font-bold">{u.role}</span>
     </div>)}{!lastUsers.data?.length?<p className="py-4 text-sm text-slate-500">Aucun utilisateur.</p>:null}</div>}
   </div>
  </section>
  <section><h2 className="text-xl font-black">Gestion avancée</h2><p className="mt-2 text-sm text-slate-600">Accès aux modules éditoriaux et commerciaux du nouveau backend Supabase.</p>
   <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{modules.map(m=>{const Icon=m.icon;return <Link key={m.url} href={m.url} className="rounded-md border border-rule-strong bg-white p-5 hover:border-brand-300">
    <Icon className="h-5 w-5 text-brand-600"/><p className="mt-4 text-sm font-bold">{m.title}</p><p className="mt-1 text-xs text-slate-500">{m.count===null?"Consulter les données":m.count+" enregistrements"}</p>
   </Link>})}</div>
  </section>
 </>;
}
