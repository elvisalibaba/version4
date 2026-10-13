import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
export const dynamic = "force-dynamic";
export default async function AdminSettingsPage(){
 await requireAdmin();
 const sections=[
  {name:"Supabase",values:[["Adresse du projet",!!(process.env.NEXT_PUBLIC_HOLISTIC_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL)],["Clé publique",!!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)]]},
  {name:"EasyPay",values:[["Clé publique",!!process.env.EASYPAY_PUBLISHABLE_KEY],["Correlation ID",!!process.env.EASYPAY_CORRELATION_ID],["Mode",!!process.env.EASYPAY_MODE]]},
  {name:"CinetPay",values:[["Identifiant du site",!!process.env.CINETPAY_SITE_ID],["Clé API",!!process.env.CINETPAY_API_KEY],["Secret de validation",!!process.env.CINETPAY_SECRET_KEY]]}
 ];
 return <section className="space-y-6">
  <div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Configuration Vercel</p><h1 className="mt-2 text-3xl font-black">Services de la plateforme</h1><p className="mt-2 text-sm text-slate-600">Présence des variables serveur uniquement. Aucun secret affiché.</p></div>
  <div className="grid gap-4 md:grid-cols-3">{sections.map(section=><article key={section.name} className="rounded-md border border-rule bg-white p-5">
   <h2 className="text-lg font-black">{section.name}</h2>
   <div className="mt-4 space-y-3">{section.values.map(([name,exists])=><div key={String(name)} className="flex items-center justify-between gap-2 text-sm"><span className="text-slate-600">{name}</span><span className={exists?"font-bold text-emerald-700":"font-bold text-amber-700"}>{exists?"Présente":"Absente"}</span></div>)}</div>
  </article>)}</div>
  <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
   <h2 className="font-black">Paiements pas encore migrés vers Supabase</h2>
   <p className="mt-2 text-sm leading-6 text-slate-700">Les identifiants existent sur Vercel. Cependant, les routes historiques envoient les opérations à Laravel. Elles doivent être remplacées par une vérification serveur du prestataire, une écriture transactionnelle Supabase et un octroi des droits de lecture avant de pouvoir accepter les paiements. Elles sont volontairement désactivées en mode Supabase.</p>
  </div>
  <Link href="/dashboard/admin" className="text-sm font-bold text-brand-600">← Tableau de bord</Link>
 </section>;
}
