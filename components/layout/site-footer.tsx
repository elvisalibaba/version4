import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-8 pb-8">
      <div className="ios-hero mx-auto grid max-w-7xl gap-8 rounded-[2rem] px-4 py-10 text-white sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">Holistique Books</p>
          <p className="mt-2 text-sm text-slate-200">Maison d&apos;edition digitale africaine pour lire, publier et grandir.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Decouvrir</p>
          <Link href="/librairie" className="block text-slate-200 hover:text-rose-200">
            Librairie
          </Link>
          <Link href="/dashboard/author" className="block text-slate-200 hover:text-rose-200">
            Espace Auteur
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Entreprise</p>
          <Link href="/qui-sommes-nous" className="block text-slate-200 hover:text-rose-200">
            Qui sommes-nous ?
          </Link>
          <Link href="/register" className="block text-slate-200 hover:text-rose-200">
            Ouvrir un compte
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Support</p>
          <p className="text-slate-200">contact@holistiquebooks.africa</p>
          <p className="text-slate-200">Lun - Sam, 8h - 18h</p>
        </div>
      </div>
    </footer>
  );
}
