import Link from "next/link";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="ios-hero rounded-[2rem] p-8 text-white">
        <h2 className="text-2xl font-bold">Pret a lire ou publier sur Holistique Books ?</h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          Creez votre compte lecteur ou auteur en moins de 2 minutes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="ios-button-primary rounded-full px-5 py-2.5 text-sm font-semibold">
            Ouvrir un compte
          </Link>
          <Link href="/dashboard/author" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-xl hover:bg-white/15">
            Espace auteur
          </Link>
        </div>
      </div>
    </section>
  );
}
