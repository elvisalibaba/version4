import Link from "next/link";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="ios-hero rounded-[2rem] p-8 text-white">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Pret a publier ou a decouvrir de nouveaux livres ?</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Rejoignez une maison d edition moderne ou explorez une librairie exigeante inspiree des meilleurs standards.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="ios-button-primary rounded-full px-5 py-2.5 text-sm font-semibold">
                Creer mon compte auteur
              </Link>
              <Link href="/librairie" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-xl hover:bg-white/15">
                Voir la librairie
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Vous etes auteur ?</p>
            <p className="mt-2">Recevez un plan d edition clair, un calendrier de publication et un accompagnement marketing.</p>
            <Link href="/home#contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
              Demander un rendez-vous
              <span>-&gt;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
