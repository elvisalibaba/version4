import Link from "next/link";
import {
  DonationFlowError,
  type DonationTransactionStatus,
  verifyCinetPayDonationTransaction,
} from "@/lib/payments/cinetpay-donations";

type SearchParams = Promise<{
  transactionId?: string;
  transaction_id?: string;
  cpm_trans_id?: string;
}>;

export const dynamic = "force-dynamic";

function getStatusCopy(status: DonationTransactionStatus) {
  switch (status) {
    case "paid":
      return {
        title: "Don confirme",
        description: "Merci. La transaction est validee par CinetPay et confirmee cote serveur.",
        accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "failed":
      return {
        title: "Don non finalise",
        description: "La transaction a ete refusee ou interrompue. Vous pouvez relancer un don en toute securite.",
        accent: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        title: "Verification en cours",
        description: "Le statut du don est encore en attente de confirmation CinetPay.",
        accent: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export default async function DonationReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const transactionId = params.transactionId ?? params.transaction_id ?? params.cpm_trans_id ?? null;

  if (!transactionId) {
    return (
      <section className="page-hero-shell space-y-8 py-12">
        <div className="surface-panel space-y-6 p-8">
          <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Retour CinetPay</p>
            <h1 className="mt-2 text-3xl font-semibold">Transaction introuvable</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7">Aucun identifiant de transaction n a ete recu dans l URL de retour.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/don" className="cta-primary px-5 py-3 text-sm">
              Revenir au don
            </Link>
            <Link href="/home" className="cta-secondary px-5 py-3 text-sm">
              Retour accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  let verification: Awaited<ReturnType<typeof verifyCinetPayDonationTransaction>> | null = null;
  let verificationError: string | null = null;

  try {
    verification = await verifyCinetPayDonationTransaction(transactionId);
  } catch (error) {
    verificationError =
      error instanceof DonationFlowError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Verification du don impossible.";
  }

  if (!verification) {
    return (
      <section className="page-hero-shell space-y-8 py-12">
        <div className="surface-panel space-y-6 p-8">
          <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Retour CinetPay</p>
            <h1 className="mt-2 text-3xl font-semibold">Verification indisponible</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7">{verificationError ?? "Verification du don impossible."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/don" className="cta-primary px-5 py-3 text-sm">
              Reessayer le don
            </Link>
            <Link href="/home" className="cta-secondary px-5 py-3 text-sm">
              Retour accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const statusCopy = getStatusCopy(verification.status);

  return (
    <section className="page-hero-shell space-y-8 py-12">
      <div className="surface-panel space-y-6 p-8">
        <div className={`rounded-[1.6rem] border px-5 py-4 ${statusCopy.accent}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">CinetPay donation return</p>
          <h1 className="mt-2 text-3xl font-semibold">{statusCopy.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7">{statusCopy.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transaction</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-950">{verification.transactionId}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Statut</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{verification.status}</p>
          </div>
          <div className="rounded-[1.4rem] border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Montant</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {verification.amount !== null && verification.currency
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: verification.currency,
                  }).format(verification.amount)
                : "Indisponible"}
            </p>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p>
            Statut fournisseur: <span className="font-semibold text-slate-900">{verification.providerStatus}</span>
            {" "}
            | Methode: <span className="font-semibold text-slate-900">{verification.paymentMethod ?? "N/A"}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/don" className="cta-primary px-5 py-3 text-sm">
            Faire un autre don
          </Link>
          <Link href="/home" className="cta-secondary px-5 py-3 text-sm">
            Retour accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
