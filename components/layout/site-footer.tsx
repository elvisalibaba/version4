import Link from "next/link";

export function SiteFooter() {
  const aboutLinks = [
    "A propos de Holistique Books",
    "Equipe editoriale",
    "Applications gratuites",
    "Lecteur Web",
    "Acheter des cartes-cadeaux",
    "Aide",
    "Plan du site",
  ];
  const opportunityLinks = ["Auto-edition", "Affilies", "Offres d emploi", "Partenariats", "Achats d entreprise"];
  const blogLinks = [
    "10 lectures pour mieux vivre 2026",
    "Selection business et spiritualite",
    "La pile a lire de l equipe Holistique",
    "Des livres pour ralentir et mieux penser",
    "Voir tous les billets du blog",
  ];
  const paymentMethods = ["Visa", "MasterCard", "PayPal", "Apple Pay", "Google Pay", "Virement"];

  return (
    <footer className="mt-12 border-t border-[#ece3d7] bg-[linear-gradient(180deg,#faf6f1,#f5efe8)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10">
        <div className="grid gap-5 rounded-[34px] border border-[#ece3d7] bg-[#171717] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              Holistique Books
            </span>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-[2rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.55rem]">
                Restez connecte a la boutique, au studio auteur et a vos prochaines lectures.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                Une architecture footer plus riche, plus proche des grands stores ebook, avec aide, opportunites, blog, paiements et navigation de service.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/books"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#171717] transition hover:bg-[#f4eee7]"
            >
              Explorer la boutique
            </Link>
            <Link
              href="/dashboard/author"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Ouvrir le studio auteur
            </Link>
            <Link
              href="/dashboard/reader/subscriptions"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Decouvrir Premium
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Centre d aide
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 rounded-[34px] border border-[#ece3d7] bg-white/94 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:p-8">
          <div className="space-y-4">
            <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">A propos de Holistique Books</h3>
            <div className="grid gap-2">
              {aboutLinks.map((item) => (
                <Link key={item} href="/home" className="text-sm text-[#4f4740] transition hover:text-[#171717]">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">Opportunites</h3>
            <div className="grid gap-2">
              {opportunityLinks.map((item) => (
                <Link key={item} href="/dashboard/author" className="text-sm text-[#4f4740] transition hover:text-[#171717]">
                  {item}
                </Link>
              ))}
            </div>

            <h3 className="pt-3 text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">Restez connecte</h3>
            <div className="flex flex-wrap gap-2">
              {["Facebook", "Instagram", "YouTube", "LinkedIn"].map((item) => (
                <span key={item} className="rounded-full border border-[#ece3d7] bg-[#fcfaf7] px-3 py-1.5 text-xs font-semibold text-[#4f4740]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">Derniers billets de blog</h3>
            <div className="grid gap-2">
              {blogLinks.map((item) => (
                <Link key={item} href="/blog" className="text-sm text-[#4f4740] transition hover:text-[#171717]">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 rounded-[34px] border border-[#ece3d7] bg-white/94 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">Telechargez l application gratuite</h3>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-[16px] border border-[#ece3d7] bg-[#171717] px-4 py-3 text-sm font-semibold text-white">Disponible sur le Web</span>
              <span className="rounded-[16px] border border-[#ece3d7] bg-[#fcfaf7] px-4 py-3 text-sm font-semibold text-[#171717]">Ajout PWA possible</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[#8b8177]">Modes de paiement acceptes</h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((item) => (
                <span key={item} className="rounded-full border border-[#ece3d7] bg-[#fcfaf7] px-3 py-1.5 text-xs font-semibold text-[#4f4740]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#ece3d7] pt-5 text-xs text-[#7f756b] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>Francais</span>
            <span>© 2026 Holistique Books</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/conditions" className="transition hover:text-[#171717]">
              Conditions d utilisation
            </Link>
            <Link href="/confidentialite" className="transition hover:text-[#171717]">
              Politique de confidentialite
            </Link>
            <Link href="/cookies" className="transition hover:text-[#171717]">
              Parametres de confidentialite
            </Link>
            <Link href="/faq" className="transition hover:text-[#171717]">
              Accessibilite
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
