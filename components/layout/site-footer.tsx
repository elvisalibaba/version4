"use client";

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#f3f3f3] text-gray-700">
      {/* Back to top button (style Amazon) */}
      <div
        onClick={scrollToTop}
        className="cursor-pointer border-b border-gray-300 bg-[#37475a] py-3 text-center text-sm font-medium text-white transition hover:bg-[#485769]"
      >
        Haut de page
      </div>

      {/* Main footer links - Amazon style columns */}
      <div className="mx-auto max-w-[96rem] px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Column 1 : Get to Know Us (aboutLinks) */}
          <div className="space-y-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">A propos de Holistique Books</h3>
            <ul className="space-y-1 text-sm">
              {aboutLinks.map((item) => (
                <li key={item}>
                  <Link href="/home" className="text-gray-600 transition hover:underline">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 : Make Money with Us (opportunityLinks) */}
          <div className="space-y-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Opportunités</h3>
            <ul className="space-y-1 text-sm">
              {opportunityLinks.map((item) => (
                <li key={item}>
                  <Link href="/dashboard/author" className="text-gray-600 transition hover:underline">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 : Blog */}
          <div className="space-y-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Derniers billets</h3>
            <ul className="space-y-1 text-sm">
              {blogLinks.map((item) => (
                <li key={item}>
                  <Link href="/blog" className="text-gray-600 transition hover:underline">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 : Payment Methods + Social */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="mb-2 text-sm font-semibold text-gray-800">Moyens de paiement</h3>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span key={method} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700">
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="mb-2 text-sm font-semibold text-gray-800">Restez connecté</h3>
              <div className="flex flex-wrap gap-2">
                {["Facebook", "Instagram", "YouTube", "LinkedIn"].map((social) => (
                  <span key={social} className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700">
                    {social}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 5 : Help (added for Amazon-like completeness, keeps data intact) */}
          <div className="space-y-2">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Aide & services</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/faq" className="text-gray-600 transition hover:underline">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link href="/accessibilite" className="text-gray-600 transition hover:underline">
                  Accessibilité
                </Link>
              </li>
              <li>
                <Link href="/conditions" className="text-gray-600 transition hover:underline">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-gray-600 transition hover:underline">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-gray-300" />

        {/* Bottom bar : country + copyright + legal links */}
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-gray-500 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <span>Français</span>
            <span>© 2026 Holistique Books</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/conditions" className="hover:underline">
              Conditions d'utilisation
            </Link>
            <Link href="/confidentialite" className="hover:underline">
              Politique de confidentialité
            </Link>
            <Link href="/cookies" className="hover:underline">
              Paramètres de confidentialité
            </Link>
            <Link href="/faq" className="hover:underline">
              Accessibilité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}