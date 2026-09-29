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
      <header className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(125,186,255,0.18),transparent_36%),linear-gradient(135deg,#101d28,#173d2c)] p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#cde5ff]">
              <Globe2 className="h-3.5 w-3.5" />
              Distribution & marchés
            </div>
            <h1 className="mt-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">Distribuer vos livres en Afrique et au-delà</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Configurez les territoires, canaux, royalties, précommandes, impression locale et ventes institutionnelles titre par titre.
            </p>
          </div>
          <Link href="/dashboard/author/add-book" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#e8ac42] px-5 text-sm font-bold text-[#173d2c]">
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
          return <article key={item.title} className="rounded-[22px] border border-[#e5ddd1] bg-white p-5"><Icon className="h-5 w-5 text-[#a94b34]" /><h2 className="mt-4 font-semibold text-[#17231d]">{item.title}</h2><p className="mt-1 text-sm leading-6 text-[#7b7268]">{item.copy}</p></article>;
        })}
      </section>

      <div className="grid gap-5">
        {books.map((book, index) => {
          const item = settings[index];
          const selectedChannels = item?.sales_channels ?? ["web_store", "mobile_app"];
          const royaltyPercent = item?.royalty_rate === null || item?.royalty_rate === undefined
            ? 70
            : Math.round(Number(item.royalty_rate) * 100);

          return (
            <article key={book.id} className="overflow-hidden rounded-[28px] border border-[#e5ddd1] bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[#eee5da] bg-[#fffaf3] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#173d2c] text-white"><BookOpen className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-xl text-[#17231d]">{book.title}</h2>
                    <p className="mt-1 text-xs text-[#837a70]">{book.status === "published" ? "Publié" : "En préparation"} · {book.currency_code} · ISBN {book.isbn || "non renseigné"}</p>
                  </div>
                </div>
                <Link href={`/dashboard/author/books/${book.id}/edit`} className="text-sm font-bold text-[#a94b34]">Modifier le livre</Link>
              </div>

              <form action={updateBookDistributionAction.bind(null, book.id)} className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-3">
                  <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                    Marché principal
                    <select name="primary_market" defaultValue={item?.primary_market ?? "CD"} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]">
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
                  <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                    Portée
                    <select name="territory_mode" defaultValue={item?.territory_mode ?? "worldwide"} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]">
                      <option value="worldwide">Monde entier</option>
                      <option value="selected">Pays sélectionnés</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                    Devise locale
                    <select name="local_currency" defaultValue={item?.local_currency ?? book.currency_code ?? "USD"} className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]">
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
                  <label className="grid gap-2 text-sm font-semibold text-[#4f4740] lg:col-span-2">
                    Pays sélectionnés
                    <input name="territories" defaultValue={(item?.territories ?? []).join(", ")} placeholder="CD, CG, CI, SN..." className="h-11 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal uppercase outline-none focus:border-[#173d2c]" />
                    <span className="text-xs font-normal text-[#8b8177]">Utilisé uniquement lorsque la portée est « pays sélectionnés ».</span>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#4f4740]">
                    Royalty auteur
                    <div className="relative">
                      <input name="royalty_rate" type="number" min="0" max="100" step="1" defaultValue={royaltyPercent} className="h-11 w-full rounded-xl border border-[#d9cebd] bg-white px-3 pr-9 font-normal outline-none focus:border-[#173d2c]" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8b8177]">%</span>
                    </div>
                  </label>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-[#4f4740]">Canaux de vente</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["web_store", "Boutique web"],
                      ["mobile_app", "Application mobile"],
                      ["institutional", "Vente institutionnelle"],
                      ["bookstores", "Librairies partenaires"],
                    ].map(([channel, label]) => (
                      <label key={channel} className="flex items-center gap-3 rounded-2xl border border-[#e8dfd3] bg-[#fffdf9] p-3 text-sm font-medium text-[#514a43]">
                        <input type="checkbox" name="sales_channels" value={channel} defaultChecked={selectedChannels.includes(channel)} className="h-4 w-4 accent-[#173d2c]" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e8dfd3] p-4">
                    <input type="checkbox" name="preorder_enabled" defaultChecked={item?.preorder_enabled ?? false} className="mt-1 h-4 w-4 accent-[#173d2c]" />
                    <span><strong className="block text-sm text-[#17231d]">Précommande</strong><span className="mt-1 block text-xs leading-5 text-[#7b7268]">Vendre avant la date de lancement.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e8dfd3] p-4">
                    <input type="checkbox" name="print_on_demand_enabled" defaultChecked={item?.print_on_demand_enabled ?? false} className="mt-1 h-4 w-4 accent-[#173d2c]" />
                    <span><strong className="block text-sm text-[#17231d]">Print on demand</strong><span className="mt-1 block text-xs leading-5 text-[#7b7268]">Impression déclenchée à la commande.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e8dfd3] p-4">
                    <input type="checkbox" name="local_print_enabled" defaultChecked={item?.local_print_enabled ?? false} className="mt-1 h-4 w-4 accent-[#173d2c]" />
                    <span><strong className="block text-sm text-[#17231d]">Impression locale</strong><span className="mt-1 block text-xs leading-5 text-[#7b7268]">Production via partenaires locaux.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e8dfd3] p-4">
                    <input type="checkbox" name="bookstore_distribution_enabled" defaultChecked={item?.bookstore_distribution_enabled ?? false} className="mt-1 h-4 w-4 accent-[#173d2c]" />
                    <span><strong className="block text-sm text-[#17231d]">Librairies</strong><span className="mt-1 block text-xs leading-5 text-[#7b7268]">Activer la distribution physique.</span></span>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-[#e8dfd3] p-4">
                    <input type="checkbox" name="institutional_sales_enabled" defaultChecked={item?.institutional_sales_enabled ?? false} className="mt-1 h-4 w-4 accent-[#173d2c]" />
                    <span><strong className="block text-sm text-[#17231d]">Ventes institutionnelles</strong><span className="mt-1 block text-xs leading-5 text-[#7b7268]">Écoles, universités, entreprises, administrations et ONG.</span></span>
                  </label>
                  <label className="grid gap-2 rounded-2xl border border-[#e8dfd3] p-4 text-sm font-semibold text-[#4f4740]">
                    Date de lancement
                    <input type="date" name="launch_date" defaultValue={item?.launch_date ? item.launch_date.slice(0, 10) : ""} className="h-10 rounded-xl border border-[#d9cebd] bg-white px-3 font-normal outline-none focus:border-[#173d2c]" />
                  </label>
                </div>

                <label className="mt-5 grid gap-2 text-sm font-semibold text-[#4f4740]">
                  Notes de distribution
                  <textarea name="distribution_notes" defaultValue={item?.distribution_notes ?? ""} rows={3} placeholder="Contraintes territoriales, accords libraires, imprimeur local, conditions particulières..." className="rounded-xl border border-[#d9cebd] bg-white px-3 py-3 font-normal leading-6 outline-none focus:border-[#173d2c]" />
                </label>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#f5f8f6] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-[#657068]"><Truck className="h-4 w-4" />Ces paramètres sont enregistrés dans MySQL et utilisés pour calculer la distribution et les royalties.</p>
                  <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white transition hover:bg-[#0f2d20]"><Save className="h-4 w-4" />Enregistrer</button>
                </div>
              </form>
            </article>
          );
        })}
      </div>

      {!books.length ? (
        <section className="rounded-[28px] border border-dashed border-[#d8ccbc] bg-[#fffaf3] p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[#ad9f8f]" />
          <h2 className="mt-4 font-serif text-2xl text-[#17231d]">Aucun livre à distribuer</h2>
          <p className="mt-2 text-sm text-[#766e64]">Ajoutez d’abord un titre à votre catalogue.</p>
          <Link href="/dashboard/author/add-book" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#173d2c] px-5 text-sm font-bold text-white">Ajouter un livre</Link>
        </section>
      ) : null}
    </div>
  );
}
