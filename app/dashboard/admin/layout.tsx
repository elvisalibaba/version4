import Link from "next/link";
import { BookOpen, Users, Receipt, LayoutDashboard, Building2, ShieldCheck, GraduationCap, Megaphone, Headphones, BadgeDollarSign, Settings2, PenLine } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";

const groups = [
  {title:"Pilotage", items:[
    {label:"Tableau de bord",href:"/dashboard/admin",icon:LayoutDashboard},
    {label:"Livres",href:"/dashboard/admin/books",icon:BookOpen},
    {label:"Utilisateurs",href:"/dashboard/admin/users",icon:Users},
    {label:"Commandes",href:"/dashboard/admin/orders",icon:Receipt}]},
  {title:"Édition", items:[
    {label:"Auteurs",href:"/admin/authors",icon:PenLine},
    {label:"Maisons d’édition",href:"/dashboard/admin/publishing",icon:Building2},
    {label:"Contrats & droits",href:"/dashboard/admin/rights",icon:ShieldCheck},
    {label:"Académique RDC",href:"/dashboard/admin/education",icon:GraduationCap},
    {label:"Audio et vidéo",href:"/dashboard/admin/media",icon:Headphones}]},
  {title:"Commercial", items:[
    {label:"Publicités",href:"/dashboard/admin/marketing",icon:Megaphone},
    {label:"Abonnements",href:"/dashboard/admin/subscriptions",icon:BadgeDollarSign},
    {label:"Redevances",href:"/dashboard/admin/royalties",icon:Receipt},
    {label:"Paramètres",href:"/dashboard/admin/settings",icon:Settings2}]}
];

export default async function AdminDashboardLayout({children}:{children:React.ReactNode}){
 const admin=await requireAdmin();
 return <div className="min-h-screen bg-paper">
  <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
   <aside className="bg-night-900 text-white lg:min-h-screen">
    <div className="border-b border-white/10 px-5 py-6">
      <Link href="/dashboard/admin" className="text-2xl font-black tracking-tight">HolisticBooks<span className="text-brand-300">.</span></Link>
      <p className="mt-1 text-xs text-white/60">Administration · Supabase</p>
    </div>
    <nav className="space-y-5 px-3 py-5" aria-label="Administration">
      {groups.map(group=><div key={group.title}>
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/45">{group.title}</p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
        {group.items.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} className="flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:text-sm">
          <Icon className="h-4 w-4 shrink-0 text-brand-300"/>{item.label}
        </Link>})}</div>
      </div>)}
    </nav>
    <div className="border-t border-white/10 px-5 py-4">
      <p className="truncate text-xs text-white/70">{admin.email}</p>
      <Link className="mt-3 block text-xs font-bold text-brand-300" href="/">← Retour au site</Link>
    </div>
   </aside>
   <div className="min-w-0">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule-strong bg-white px-5 py-5 sm:px-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Administration</p><p className="text-sm text-slate-600">Base Supabase · HolisticBooks</p></div>
      <Link href="/dashboard/admin/books/new" className="rounded-sm bg-night-900 px-4 py-3 text-sm font-bold text-white">+ Nouveau livre</Link>
    </header>
    <main className="min-w-0 space-y-6 p-4 sm:p-7 lg:p-9">{children}</main>
   </div>
  </div>
 </div>;
}
