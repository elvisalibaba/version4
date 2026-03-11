import { Building2 } from "lucide-react";

const partners = [
  "Editeurs francophones",
  "Reseau Afrique & diaspora",
  "Librairies independantes",
  "Imprimeurs certifies",
  "Medias culturels",
  "Comites de lecture",
  "Plateformes internationales",
  "Agents litteraires",
];

export function PartnersSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="ios-surface rounded-[2.5rem] p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="ios-kicker">Reseau d'edition</p>
            <h2 className="ios-title text-3xl font-bold sm:text-4xl">Plus de 100 maisons d'edition partenaires.</h2>
            <p className="ios-muted max-w-2xl text-sm sm:text-base">
              Un ecosysteme solide pour faire rayonner vos livres en Afrique, en Europe et a l'international.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4 text-rose-600" />
            Reseau de diffusion et de partenaires certifies
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {partners.map((partner) => (
            <div key={partner} className="ios-chip rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
