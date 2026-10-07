import Image from "next/image";
import Link from "next/link";
import { Heart, PenLine, Search, UserRound } from "lucide-react";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUserProfile } from "@/lib/auth";

function isDynamicError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

const links = [
  { label: "Tous les livres", href: "/books" },
  { label: "Lire gratuitement", href: "/books?access=free" },
  { label: "Élèves & étudiants", href: "/education" },
  { label: "Auteurs", href: "/authors" },
  { label: "Magazine", href: "/blog" },
  { label: "Services éditoriaux", href: "/services" },
  { label: "Aide", href: "/faq" },
];

function SearchForm({ className = "" }: { className?: string }) {
  return (
    <form action="/books" role="search" className={className}>
      <label htmlFor="site-search" className="sr-only">Rechercher un livre ou un auteur</label>
      <div className="flex h-11 overflow-hidden rounded-md bg-white ring-2 ring-transparent transition focus-within:ring-brand-600">
        <input
          id="site-search"
          name="q"
          type="search"
          placeholder="Titre, auteur ou thème"
          className="min-w-0 flex-1 bg-transparent px-4 text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-500"
        />
        <button type="submit" aria-label="Lancer la recherche" className="grid w-12 shrink-0 place-items-center bg-brand-600 text-white transition hover:bg-brand-700">
          <Search className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

export async function SiteHeader() {
  let user: { id: string; name: string | null; avatarUrl: string | null } | null = null;
  let role: string | null = null;
  try {
    const profile = await getCurrentUserProfile();
    user = profile ? { id: profile.id, name: profile.first_name ?? profile.name ?? null, avatarUrl: profile.avatar_url } : null;
    role = profile?.role ?? null;
  } catch (error) {
    if (isDynamicError(error)) throw error;
    console.error("[SiteHeader] Auth unavailable", error);
  }

  const accountHref = role === "admin" ? "/admin" : role === "author" ? "/dashboard/author" : user ? "/dashboard/reader" : "/login";
  const favoritesHref = role === "reader" ? "/dashboard/reader/favorites" : user ? "/books" : "/login?next=%2Fdashboard%2Freader%2Ffavorites";
  const publishHref = role === "author" ? "/dashboard/author/add-book" : "/register?role=author";

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-60 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-night-900">
        Aller au contenu
      </a>

      <div className="bg-night-900 text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
          <Link href="/home" className="flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Accueil Holistique Books">
            <Image src="/logo.svg" alt="" width={44} height={44} className="h-11 w-11 brightness-0 invert" priority />
            <span className="leading-tight">
              <span className="block text-[1.05rem] font-bold tracking-tight">Holistique Books</span>
              <span className="hidden text-[0.7rem] font-medium text-night-200 sm:block">Lire · Publier · Transmettre</span>
            </span>
          </Link>

          <SearchForm className="hidden flex-1 md:block" />

          <nav aria-label="Compte" className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <Link href={accountHref} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <UserRound className="h-6 w-6" />
              )}
              <span className="hidden leading-tight lg:block">
                <span className="block text-xs text-night-200">{user ? `Bonjour${user.name ? `, ${user.name}` : ""}` : "Bonjour, identifiez-vous"}</span>
                <span className="block text-sm font-semibold">{user ? "Mon espace" : "Compte et bibliothèque"}</span>
              </span>
            </Link>
            <Link href={favoritesHref} className="hidden h-11 w-11 place-items-center rounded-md transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:grid" aria-label="Mes favoris">
              <Heart className="h-5 w-5" />
            </Link>
            <CartIndicator />
          </nav>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>

      <div className="bg-night-800 text-white">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <nav aria-label="Navigation principale" className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {link.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <LogoutButton label="Déconnexion" className="hidden shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white lg:inline-flex" />
          ) : null}
          <Link href={publishHref} className="hidden shrink-0 items-center gap-2 rounded-md bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex">
            <PenLine className="h-4 w-4" />
            Publier votre livre
          </Link>
        </div>
      </div>
    </header>
  );
}
