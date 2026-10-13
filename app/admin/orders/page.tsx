import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function AdminOrders(){
 await requireAdmin();const c=await createClient();
 const {data,error}=await c.from("orders").select("id,user_id,total_price,currency_code,payment_status,created_at").order("created_at",{ascending:false}).limit(100);
 return <section className="space-y-5"><h2 className="text-3xl font-bold">Commandes</h2>
  <p className="text-sm text-slate-600">Consultation uniquement. Une commande ne doit pas être marquée payée sans confirmation authentifiée du prestataire de paiement.</p>
  {error?<p className="text-red-700">{error.message}</p>:null}
  <div className="overflow-x-auto rounded-md border border-rule bg-white"><table className="w-full min-w-[650px] text-left text-sm">
   <thead><tr className="bg-paper-deep"><th className="p-4">Commande</th><th className="p-4">Client</th><th className="p-4">Montant</th><th className="p-4">Statut</th><th className="p-4">Date</th></tr></thead>
   <tbody>{(data??[]).map(row=><tr key={row.id} className="border-t border-rule">
    <td className="p-4">{row.id.slice(0,8)}</td><td className="p-4">{row.user_id.slice(0,8)}</td>
    <td className="p-4">{row.total_price} {row.currency_code}</td><td className="p-4">{row.payment_status}</td>
    <td className="p-4">{new Date(row.created_at).toLocaleDateString("fr-FR")}</td>
   </tr>)}</tbody></table></div>
 </section>;
}
