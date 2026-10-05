import Link from "next/link";
import {
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  Landmark,
  Receipt,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getAuthorFinanceSummary,
  getAuthorFinanceStatement,
  getAuthorPayoutAccounts,
  getAuthorPayouts,
  getAuthorRoyalties,
} from "@/lib/author-api";
import { createPayoutAccountAction, requestPayoutAction } from "./actions";

function money(value: number | string | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

const payoutStatus: Record<string, string> = {
  requested: "Demandé",
  approved: "Approuvé",
  processing: "En traitement",
  paid: "Payé",
  failed: "Échec",
  rejected: "Refusé",
  cancelled: "Annulé",
};

const royaltyStatus: Record<string, string> = {
  pending: "En attente",
  payable: "Disponible",
  paid: "Payé",
  reversed: "Annulé",
};

const sourceLabel: Record<string, string> = {
  ebook: "E-book",
  print: "Imprimé",
  subscription: "Abonnement",
  institutional: "Institutionnel",
  other: "Autre",
};

export default async function AuthorFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireRole(["author"]);

  const [summary, statement, payoutAccounts, payouts, royalties, query] = await Promise.all([
    getAuthorFinanceSummary(),
    getAuthorFinanceStatement(),
    getAuthorPayoutAccounts(),
    getAuthorPayouts(),
    getAuthorRoyalties(20),
    searchParams,
  ]);

  const account = summary.account;
  const currency = account?.currency_code ?? "USD";
  const verifiedAccounts = payoutAccounts.filter((item) => item.is_verified);
  const available = Number(account?.available_balance ?? 0);
  const minimum = Number(account?.minimum_payout ?? 10);
  const canRequestPayout = verifiedAccounts.length > 0 && available >= minimum;

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(232,172,66,0.28),transparent_35%),linear-gradient(135deg,#102a20,#173d2c_55%,#214d39)] p-6 text-white shadow-[0_28px_70px_rgba(23,61,44,0.18)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f4cf87]">
              <WalletCards className="h-3.5 w-3.5" />
              Centre financier auteur
            </div>
            <h1 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">Royalties, paiements et retraits</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Suivez ce que chaque vente vous rapporte et gérez vos moyens de versement depuis un seul espace sécurisé.
            </p>
          </div>
          <Link href="/dashboard/author/sales" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-sm font-bold transition hover:bg-white/10">
            <Receipt className="h-4 w-4" />
            Voir les ventes
          </Link>
        </div>
      </header>

      {query.saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {query.saved === "payout" ? "Votre demande de versement a été enregistrée." : "Le moyen de paiement a été enregistré."}
        </div>
      ) : null}
      {query.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {query.error === "payout"
            ? "Le versement n’a pas pu être demandé. Vérifiez le solde, le seuil minimum et la vérification du compte."
            : "Le moyen de paiement n’a pas pu être enregistré. Vérifiez les informations saisies."}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Solde disponible",
            value: money(account?.available_balance, currency),
            detail: "Retirable après validation",
            icon: CircleDollarSign,
          },
          {
            label: "Royalties en attente",
            value: money(summary.royalties.pending, currency),
            detail: "Période de sécurisation",
            icon: Clock3,
          },
          {
            label: "Gains cumulés",
            value: money(account?.lifetime_earnings ?? summary.royalties.lifetime, currency),
            detail: "Depuis votre première vente",
            icon: WalletCards,
          },
          {
            label: "Déjà versé",
            value: money(account?.lifetime_paid, currency),
            detail: `Seuil minimum : ${money(minimum, currency)}`,
            icon: BadgeCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[24px] border border-[#e5ddd1] bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5efe5] text-[#a94b34]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#2b6b4a]">MySQL</span>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-[-0.04em] text-[#17231d]">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-[#4f4740]">{item.label}</p>
              <p className="mt-1 text-xs text-[#8b8177]">{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-[#e5ddd1] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Transparence des royalties</p>
            <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Comment votre revenu est calculé</h2>
          </div>
          <p className="text-xs text-[#887f74]">
            Période : {new Date(statement.period.from).toLocaleDateString("fr-FR")} au {new Date(statement.period.to).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Ventes brutes", statement.totals.gross_amount, "text-[#17231d]"],
            ["Coûts impression", statement.totals.printing_cost, "text-[#8a5a11]"],
            ["Commission plateforme", statement.totals.platform_fee, "text-[#8a5a11]"],
            ["Retenues", statement.totals.tax_withholding, "text-[#8a5a11]"],
            ["Net auteur", statement.totals.net_royalty, "text-[#237a43]"],
          ].map(([label, value, className]) => (
            <article key={String(label)} className="rounded-[20px] border border-[#eee5d9] bg-[#fffdf9] p-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8b8177]">{label}</p>
              <p className={`mt-2 text-xl font-bold ${className}`}>{money(Number(value), currency)}</p>
            </article>
          ))}
        </div>

        {statement.by_book.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e9e0d4] text-[0.68rem] uppercase tracking-[0.12em] text-[#8b8177]">
                  <th className="pb-3 font-bold">Livre</th>
                  <th className="pb-3 font-bold">Transactions</th>
                  <th className="pb-3 font-bold">Brut</th>
                  <th className="pb-3 font-bold">Commission</th>
                  <th className="pb-3 font-bold">Net auteur</th>
                </tr>
              </thead>
              <tbody>
                {statement.by_book.map((item) => (
                  <tr key={`${item.book_id}-${item.currency_code}`} className="border-b border-[#f0e9df] last:border-0">
                    <td className="py-3 pr-4 font-semibold text-[#17231d]">{item.book?.title ?? "Livre"}</td>
                    <td className="py-3 pr-4 text-[#645d55]">{item.transactions_count}</td>
                    <td className="py-3 pr-4 text-[#645d55]">{money(item.gross_amount, item.currency_code)}</td>
                    <td className="py-3 pr-4 text-[#8a5a11]">{money(item.platform_fee, item.currency_code)}</td>
                    <td className="py-3 font-bold text-[#237a43]">{money(item.net_royalty, item.currency_code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#faf7f1] px-4 py-3 text-sm text-[#766e64]">Aucune transaction de royalty sur cette période.</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <section className="rounded-[28px] border border-[#e5ddd1] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Encaissement</p>
              <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Mes moyens de versement</h2>
              <p className="mt-2 text-sm leading-6 text-[#766e64]">
                Mobile Money pour le marché africain ou virement bancaire. Les identifiants sensibles sont chiffrés côté Laravel.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-[#2d6c4b]" />
          </div>

          <div className="mt-5 grid gap-3">
            {payoutAccounts.map((item) => (
              <article key={item.id} className="flex flex-col gap-3 rounded-[20px] border border-[#ece3d7] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2ede5] text-[#173d2c]">
                    {item.method === "mobile_money" ? <Smartphone className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="font-semibold text-[#17231d]">{item.account_name}</p>
                    <p className="mt-1 text-xs text-[#7b7268]">
                      {item.provider || (item.method === "mobile_money" ? "Mobile Money" : "Compte bancaire")} · {item.country_code} · {item.currency_code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {item.is_default ? <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-[0.65rem] font-bold text-[#315a92]">Par défaut</span> : null}
                  <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${item.is_verified ? "bg-[#e9f7ee] text-[#237a43]" : "bg-[#fff3df] text-[#9a6616]"}`}>
                    {item.is_verified ? "Vérifié" : "À vérifier"}
                  </span>
                </div>
              </article>
            ))}
            {!payoutAccounts.length ? (
              <div className="rounded-[20px] border border-dashed border-[#d8ccbc] bg-[#fffaf3] p-5 text-sm text-[#766e64]">
                Aucun moyen de versement enregistré pour le moment.
              </div>
            ) : null}
          </div>

          <form action={createPayoutAccountAction} className="mt-6 rounded-[22px] border border-[#e8ded0] bg-[#faf7f1] p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-[#17231d]">Ajouter un moyen de versement</h3>
              <p className="mt-1 text-xs leading-5 text-[#7b7268]">Pour la RDC, vous pouvez notamment enregistrer Airtel Money, Orange Money ou un compte bancaire.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Type
                <select name="method" defaultValue="mobile_money" required className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]">
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Virement bancaire</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Opérateur / Banque
                <input name="provider" placeholder="Orange Money, Airtel Money, Rawbank..." className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Nom du titulaire
                <input name="account_name" required placeholder="Nom complet" className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Numéro / IBAN / Référence
                <input name="account_identifier" required placeholder="+243..., IBAN ou n° de compte" className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Pays
                <input name="country_code" defaultValue="CD" maxLength={2} required className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal uppercase outline-none focus:border-[#173d2c]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Devise
                <select name="currency_code" defaultValue={currency} required className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]">
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-[#4f4740]">
              <input type="checkbox" name="is_default" defaultChecked={!payoutAccounts.length} className="h-4 w-4 accent-[#173d2c]" />
              Utiliser comme moyen de versement par défaut
            </label>
            <button type="submit" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white transition hover:bg-[#0f2d20]">
              Enregistrer le moyen de paiement
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[#e5ddd1] bg-[#fffaf2] p-5 sm:p-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Retrait</p>
            <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Demander un versement</h2>
            <p className="mt-2 text-sm leading-6 text-[#766e64]">
              Disponible : <strong>{money(available, currency)}</strong>. Seuil minimum : <strong>{money(minimum, currency)}</strong>.
            </p>

            <form action={requestPayoutAction} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Compte vérifié
                <select name="payout_account_id" required disabled={!verifiedAccounts.length} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none disabled:opacity-50">
                  <option value="">Sélectionner...</option>
                  {verifiedAccounts.map((item) => (
                    <option key={item.id} value={item.id}>{item.provider || item.account_name} · {item.currency_code}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                Montant
                <input name="amount" type="number" min={minimum} max={available || undefined} step="0.01" required disabled={!canRequestPayout} placeholder={String(minimum)} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none disabled:opacity-50" />
              </label>
              {!verifiedAccounts.length ? (
                <p className="rounded-xl bg-[#fff0d6] px-3 py-2 text-xs leading-5 text-[#8a5a11]">Un moyen de paiement doit d’abord être vérifié par l’administration avant tout retrait.</p>
              ) : available < minimum ? (
                <p className="rounded-xl bg-[#f1f3f2] px-3 py-2 text-xs leading-5 text-[#66716a]">Votre solde disponible n’a pas encore atteint le seuil de versement.</p>
              ) : null}
              <button type="submit" disabled={!canRequestPayout} className="inline-flex h-11 items-center justify-center rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c] transition hover:bg-[#efba59] disabled:cursor-not-allowed disabled:opacity-45">
                Demander le versement
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-[#e5ddd1] bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#17231d]">Derniers versements</h2>
            <div className="mt-4 grid gap-3">
              {payouts.slice(0, 6).map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#eee5d9] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-[#17231d]">{money(item.amount, item.currency_code)}</strong>
                    <span className="rounded-full bg-[#f3efe8] px-2.5 py-1 text-[0.63rem] font-bold text-[#615a52]">{payoutStatus[item.status] ?? item.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#887f74]">{new Date(item.requested_at).toLocaleDateString("fr-FR")}</p>
                </article>
              ))}
              {!payouts.length ? <p className="text-sm text-[#887f74]">Aucun versement demandé.</p> : null}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-[28px] border border-[#e5ddd1] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#a94b34]">Grand livre</p>
            <h2 className="mt-2 font-serif text-2xl text-[#17231d]">Historique des royalties</h2>
          </div>
          <p className="text-xs text-[#887f74]">Les montants proviennent directement des ventes validées dans MySQL.</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e9e0d4] text-[0.68rem] uppercase tracking-[0.12em] text-[#8b8177]">
                <th className="pb-3 font-bold">Livre</th>
                <th className="pb-3 font-bold">Source</th>
                <th className="pb-3 font-bold">Brut</th>
                <th className="pb-3 font-bold">Taux</th>
                <th className="pb-3 font-bold">Royalty nette</th>
                <th className="pb-3 font-bold">Statut</th>
                <th className="pb-3 text-right font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {royalties.map((item) => (
                <tr key={item.id} className="border-b border-[#f0e9df] last:border-0">
                  <td className="py-4 pr-4 font-semibold text-[#17231d]">{item.book?.title ?? "Livre"}</td>
                  <td className="py-4 pr-4 text-[#645d55]">{sourceLabel[item.source] ?? item.source}</td>
                  <td className="py-4 pr-4 text-[#645d55]">{money(item.gross_amount, item.currency_code)}</td>
                  <td className="py-4 pr-4 text-[#645d55]">{Math.round(Number(item.royalty_rate) * 100)}%</td>
                  <td className="py-4 pr-4 font-bold text-[#245f43]">{money(item.net_royalty, item.currency_code)}</td>
                  <td className="py-4 pr-4"><span className="rounded-full bg-[#f4f0ea] px-2.5 py-1 text-[0.65rem] font-bold text-[#615a52]">{royaltyStatus[item.status] ?? item.status}</span></td>
                  <td className="py-4 text-right text-xs text-[#887f74]">{new Date(item.earned_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!royalties.length ? <p className="py-12 text-center text-sm text-[#887f74]">Aucune royalty enregistrée pour le moment.</p> : null}
        </div>
      </section>
    </div>
  );
}
