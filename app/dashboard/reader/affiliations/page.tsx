import { Copy, CircleDollarSign, Users } from "lucide-react";
import { DashboardTopbar } from "@/components/ui/dashboard-topbar";
import { StatCard } from "@/components/ui/stat-card";
import { requireRole } from "@/lib/auth";
import { buildAffiliateRegisterPath } from "@/lib/affiliate";
import { getReaderAffiliate } from "@/lib/reader-api";

export default async function ReaderAffiliationsPage() {
  await requireRole(["reader"]);
  const data = await getReaderAffiliate();
  const wallet = data.wallet;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = new URL(buildAffiliateRegisterPath({ role: "reader", code: wallet.affiliate_code }), appBaseUrl).toString();
  const credits = [...data.subscription_commissions, ...data.order_commissions];

  return (
    <section className="space-y-6">
      <DashboardTopbar kicker="Affiliation" title="Mon portefeuille d’affiliation" description="Votre code de parrainage, vos commissions et vos comptes de retrait." />
      <div className="metric-grid">
        <StatCard icon={CircleDollarSign} label="Solde" value={`${Number(wallet.wallet_balance).toFixed(2)} ${wallet.currency_code}`} description="Disponible" tone="emerald" />
        <StatCard icon={CircleDollarSign} label="Crédité" value={`${Number(wallet.lifetime_credited).toFixed(2)} ${wallet.currency_code}`} description="Cumul" tone="amber" />
        <StatCard icon={Users} label="Commissions" value={credits.length} description="Transactions récentes" tone="violet" />
      </div>
      <section className="surface-panel p-6">
        <p className="section-kicker">Votre lien</p>
        <h2 className="section-title mt-2 text-2xl">Code {wallet.affiliate_code}</h2>
        <div className="mt-4 rounded-md border border-rule bg-white p-4 text-sm break-all">{shareUrl}</div>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Copy className="h-4 w-4" /> Partagez ce lien pour attribuer les inscriptions et achats.</p>
      </section>
      <section className="surface-panel p-6">
        <p className="section-kicker">Activité</p>
        <h2 className="section-title mt-2 text-2xl">Commissions récentes</h2>
        <div className="mt-4 space-y-3">
          {credits.slice(0, 12).map((item, index) => <pre key={String((item as { id?: unknown }).id ?? index)} className="overflow-x-auto rounded-md border border-rule bg-paper p-4 text-xs">{JSON.stringify(item, null, 2)}</pre>)}
          {!credits.length ? <p className="text-sm text-slate-600">Aucune commission enregistrée pour le moment.</p> : null}
        </div>
      </section>
    </section>
  );
}
