import Link from "next/link";
import {
  BookOpen,
  Building2,
  Globe2,
  Printer,
  Rocket,
  Save,
  Store,
  Truck,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAuthorBooks, getAuthorDistribution } from "@/lib/author-api";
import { updateBookDistributionAction } from "./actions";

export default async function AuthorDistributionPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireRole(["author"]);

  const [books, query] = await Promise.all([getAuthorBooks(), searchParams]);
  const settings = await Promise.all(books.map((book) => getAuthorDistribution(book.id)));

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-xl bg-night-900 p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-night-50">
              <Globe2 className="h-3.5 w-3.5" />
              Distribution & marchés
            </div>
            <h1 className="mt-4 font-bold text-3xl tracking-[-0.03em] sm:text-4xl">Distribuer vos livres en Afrique et au-delà</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Configurez les territoires, canaux, royalties, précommandes, impression locale et ventes institutionnelles titre par titre.
            </p>
          </div>
          <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-white">
            <Rocket className="h-4 w-4" />
            Nouveau titre
          </Link>
        </div>
      </header>

      {query.saved ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Paramètres de distribution enregistrés.</div> : null}
      {query.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">Impossible d’enregistrer les paramètres de distribution de ce titre.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Globe2, title: "Territoires", copy: "Monde entier ou pays sélectionnés." },
          { icon: Printer, title: "Impression", copy: "POD et impression locale configurable." },
          { icon: Building2, title: "Institutionnel", copy: "Écoles, entreprises et marchés publics." },
          { icon: Store, title: "Librairies", copy: "Préparez la distribution physique locale." },
        ].map((item) => {
          const Icon = item.icon;
          return <article key={item.title} className="rounded-xl border border-slate-300 bg-white p-5"><Icon className="h-5 w-5 text-brand-600" /><h2 className="mt-4 font-semibold text-night-900">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p></article>;
        })}
      </section>

      <div className="grid gap-5">
        {books.map((book, index) => {
          const item = settings[index];
          const selectedChannels = item?.sales_channels ?? ["web_store", "mobile_app"];
          const hasContractRate = item?.royalty_rate !== null && item?.royalty_rate !== undefined;
          const royaltyPercent = hasContractRate ? Math.round(Number(item.royalty_rate) * 100) : 70;

          return (
            <article key={book.id} className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-night-900 text-white"><BookOpen className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-xl text-night-900">{book.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">{book.status === "published" ? "Publié" : "En préparation"} · {book.currency_code} · ISBN {book.isbn || "non renseigné"}</p>
                  </div>
                </div>
                <Link href={`/dashboard/author/books/${book.id}/edit`} className="text-sm font-bold text-brand-600">Modifier le livre</Link>
              </div>

              <form action={updateBookDistributionAction.bind(null, book.id)} className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Marché principal
                    <select name="primary_market" defaultValue={item?.primary_market ?? "CD"} className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal outline-none focus:border-night-900">
                      <option value="CD">RDC</option>
                      <option value="CG">Congo-Brazzaville</option>
                      <option value="RW">Rwanda</option>
                      <option value="BI">Burundi</option>
                      <option value="KE">Kenya</option>
                      <option value="UG">Ouganda</option>
                      <option value="TZ">Tanzanie</option>
                      <option value="ZM">Zambie</option>
                      <option value="AO">Angola</option>
                      <option value="CM">Cameroun</option>
                      <option value="CI">Côte d’Ivoire</option>
                      <option value="SN">Sénégal</option>
                      <option value="GH">Ghana</option>
                      <option value="NG">Nigeria</option>
                      <option value="ZA">Afrique du Sud</option>
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CA">Canada</option>
                      <option value="US">États-Unis</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Portée
                    <select name="territory_mode" defaultValue={item?.territory_mode ?? "worldwide"} className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal outline-none focus:border-night-900">
                      <option value="worldwide">Monde entier</option>
                      <option value="selected">Pays sélectionnés</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Devise locale
                    <select name="local_currency" defaultValue={item?.local_currency ?? book.currency_code ?? "USD"} className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal outline-none focus:border-night-900">
                      <option value="USD">USD</option>
                      <option value="CDF">CDF</option>
                      <option value="EUR">EUR</option>
                      <option value="XAF">XAF</option>
                      <option value="XOF">XOF</option>
                      <option value="RWF">RWF</option>
                      <option value="BIF">BIF</option>
                      <option value="KES">KES</option>
                      <option value="UGX">UGX</option>
                      <option value="TZS">TZS</option>
                      <option value="ZMW">ZMW</option>
                      <option value="AOA">AOA</option>
                      <option value="GHS">GHS</option>
                      <option value="NGN">NGN</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
                    Pays sélectionnés
                    <input name="territories" defaultValue={(item?.territories ?? []).join(", ")} placeholder="CD, CG, CI, SN..." className="h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal uppercase outline-none focus:border-night-900" />
                    <span className="text-xs font-normal text-slate-500">Utilisé uniquement lorsque la portée est « pays sélectionnés ».</span>
                  </label>
                  <div className="grid gap-2 text-sm font-semibold text-slate-700">
                    Royalty auteur
                    <p className="flex h-11 items-center rounded-xl border border-slate-300 bg-slate-100 px-3 font-normal text-slate-700">
                      {royaltyPercent} %{hasContractRate ? " (contrat)" : " (taux plateforme)"}
                    </p>
                    <span className="text-xs font-normal text-slate-500">Fixé par l’équipe finance selon votre contrat.</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-700">Canaux de vente</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["web_store", "Boutique web"],
                      ["mobile_app", "Application mobile"],
                      ["institutional", "Vente institutionnelle"],
                      ["bookstores", "Librairies partenaires"],
                    ].map(([channel, label]) => (
                      <label key={channel} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
                        <input type="checkbox" name="sales_channels" value={channel} defaultChecked={selectedChannels.includes(channel)} className="h-4 w-4 accent-night-900" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" name="preorder_enabled" defaultChecked={item?.preorder_enabled ?? false} className="mt-1 h-4 w-4 accent-night-900" />
                    <span><strong className="block text-sm text-night-900">Précommande</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Vendre avant la date de lancement.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" name="print_on_demand_enabled" defaultChecked={item?.print_on_demand_enabled ?? false} className="mt-1 h-4 w-4 accent-night-900" />
                    <span><strong className="block text-sm text-night-900">Print on demand</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Impression déclenchée à la commande.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" name="local_print_enabled" defaultChecked={item?.local_print_enabled ?? false} className="mt-1 h-4 w-4 accent-night-900" />
                    <span><strong className="block text-sm text-night-900">Impression locale</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Production via partenaires locaux.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" name="bookstore_distribution_enabled" defaultChecked={item?.bookstore_distribution_enabled ?? false} className="mt-1 h-4 w-4 accent-night-900" />
                    <span><strong className="block text-sm text-night-900">Librairies</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Activer la distribution physique.</span></span>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                    <input type="checkbox" name="institutional_sales_enabled" defaultChecked={item?.institutional_sales_enabled ?? false} className="mt-1 h-4 w-4 accent-night-900" />
                    <span><strong className="block text-sm text-night-900">Ventes institutionnelles</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Écoles, universités, entreprises, administrations et ONG.</span></span>
                  </label>
                  <label className="grid gap-2 rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
                    Date de lancement
                    <input type="date" name="launch_date" defaultValue={item?.launch_date ? item.launch_date.slice(0, 10) : ""} className="h-10 rounded-xl border border-slate-300 bg-white px-3 font-normal outline-none focus:border-night-900" />
                  </label>
                </div>

                <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
                  Notes de distribution
                  <textarea name="distribution_notes" defaultValue={item?.distribution_notes ?? ""} rows={3} placeholder="Contraintes territoriales, accords libraires, imprimeur local, conditions particulières..." className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal leading-6 outline-none focus:border-night-900" />
                </label>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-slate-600"><Truck className="h-4 w-4" />Ces paramètres déterminent où et comment votre livre est vendu.</p>
                  <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-night-900 px-5 text-sm font-bold text-white transition hover:bg-night-800"><Save className="h-4 w-4" />Enregistrer</button>
                </div>
              </form>
            </article>
          );
        })}
      </div>

      {!books.length ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-500" />
          <h2 className="mt-4 font-bold text-2xl text-night-900">Aucun livre à distribuer</h2>
          <p className="mt-2 text-sm text-slate-600">Ajoutez d’abord un titre à votre catalogue.</p>
          <Link href="/dashboard/author/add-book" className="mt-5 inline-flex h-11 items-center rounded-full bg-night-900 px-5 text-sm font-bold text-white">Ajouter un livre</Link>
        </section>
      ) : null}
    </div>
  );
}
