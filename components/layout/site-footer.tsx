import Link from "next/link";
import { Download, Headphones, PenSquare, Smartphone } from "lucide-react";

export function SiteFooter() {
  const footerColumns = [
    {
      title: "Boutique",
      links: [
        { label: "Catalogue complet", href: "/books" },
        { label: "Livres gratuits", href: "/books?access=free" },
        { label: "Inclus Premium", href: "/dashboard/reader/subscriptions" },
        { label: "Nouveautes", href: "/books" },
      ],
    },
    {
      title: "Lecture",
      links: [
        { label: "Lecteur web", href: "/books" },
        { label: "Mon espace lecteur", href: "/dashboard/reader" },
        { label: "Historique d achats", href: "/dashboard/reader/purchases" },
        { label: "Bibliotheque", href: "/dashboard/reader/library" },
      ],
    },
    {
      title: "Auteurs",
      links: [
        { label: "Studio auteur", href: "/dashboard/author" },
        { label: "Publier un livre", href: "/dashboard/author/add-book" },
        { label: "Suivi des ventes", href: "/dashboard/author/sales" },
        { label: "Creer un compte", href: "/register" },
      ],
    },
    {
      title: "Aide",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/home#contact" },
        { label: "Faire un don", href: "/don" },
      ],
    },
    {
      title: "Juridique",
      links: [
        { label: "Conditions", href: "/conditions" },
        { label: "Confidentialite", href: "/confidentialite" },
        { label: "Cookies", href: "/cookies" },
      ],
    },
  ];

  const highlights = [
    {
      icon: Smartphone,
      title: "Lecture sur tous les ecrans",
      text: "Parcourez le catalogue puis lisez depuis le web, le mobile ou votre poste de travail.",
    },
    {
      icon: Headphones,
      title: "Storefront de lecture premium",
      text: "Une experience de librairie numerique plus claire, plus stable et orientee conversion.",
    },
    {
      icon: PenSquare,
      title: "Studio auteur inclus",
      text: "Publication, ventes, catalogue et pilotage auteur dans le meme environnement produit.",
    },
  ];

  return (
    <footer className="mt-12 border-t border-[#ece3d7] bg-[linear-gradient(180deg,#faf6f1,#f5efe8)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10">
        <div className="grid gap-5 rounded-[34px] border border-[#ece3d7] bg-[#171717] p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd9cd]">
              <Download className="h-3.5 w-3.5" />
              Holistique Books
            </span>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-[2rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.5rem]">
                Une librairie digitale pour lire, publier et faire circuler de meilleurs livres.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/72">
                La plateforme combine storefront public, lecture web, espace lecteur, studio auteur et administration dans un parcours plus professionnel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
            </div>
          </div>

          <div className="grid gap-3">
            {highlights.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffd9cd]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-6 text-white/68">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 rounded-[34px] border border-[#ece3d7] bg-white/94 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] lg:p-8">
          <div className="space-y-4">
            <Link href="/home" className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#171717] text-sm font-semibold text-white">HB</span>
              <span>
                <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#a85b3f]">Read. Publish. Grow.</span>
                <span className="block text-xl font-semibold tracking-[-0.04em] text-[#171717]">Holistique Books</span>
              </span>
            </Link>
            <p className="max-w-xl text-sm leading-7 text-[#6f665e]">
              Librairie numerique pour lecteurs exigeants et auteurs independants, avec lecture web, paiement, profils et catalogue centralises.
            </p>
            <p className="text-sm font-semibold text-[#171717]">contact@holistiquebooks.africa</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
            {footerColumns.map((column) => (
              <div key={column.title} className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#8b8177]">{column.title}</p>
                <div className="grid gap-2">
                  {column.links.map((link) => (
                    <Link key={link.label} href={link.href} className="text-sm text-[#4f4740] transition hover:text-[#171717]">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#ece3d7] pt-5 text-xs text-[#7f756b] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Holistique Books. Storefront inspire des librairies ebook modernes, adapte a votre plateforme.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/conditions" className="transition hover:text-[#171717]">
              Conditions
            </Link>
            <Link href="/confidentialite" className="transition hover:text-[#171717]">
              Confidentialite
            </Link>
            <Link href="/cookies" className="transition hover:text-[#171717]">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
