import Image from "next/image";
import Link from "next/link";
import { Heart, PenLine, Phone, Search, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { WordmarkLink } from "@/components/brand/ribbon";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { MainNav } from "@/components/layout/main-nav";
import { getCurrentUserProfile } from "@/lib/auth";
import { COMPANY } from "@/lib/holistique";

function isDynamicError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

const links = [
  { label: "Catalogue", href: "/books" },
  { label: "Lire gratuitement", href: "/books?access=free" },
  { label: "Éducation", href: "/education" },
  { label: "Auteurs", href: "/authors" },
  { label: "Magazine", href: "/blog" },
  { label: "Services éditoriaux", href: "/services" },
  { label: "La maison", href: "/qui-sommes-nous" },
];

const iconButton = "relative grid h-11 w-11 place-items-center rounded-sm text-night-900 transition hover:bg-paper-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600";

function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form action="/books" role="search" className={className}>
      <label htmlFor={id} className="sr-only">Rechercher un livre ou un auteur</label>
      <div className="flex h-11 items-center gap-2 border-b border-night-900/25 transition focus-within:border-brand-600">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Un titre, un auteur, un thème…"
          className="hb-bare-input min-w-0 flex-1 bg-transparent text-[0.95rem] text-night-900 outline-none placeholder:text-slate-500"
        />
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
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/90">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-60 focus:rounded-sm focus:bg-night-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Aller au contenu
      </a>

      {/* Filet supérieur : la devise de la maison */}
      <div className="hidden bg-night-900 text-night-100 lg:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-8 text-xs">
          <p className="font-display text-[0.85rem] italic">{COMPANY.slogan}</p>
          <div className="flex items-center gap-5">
            <a href={COMPANY.phoneHref} className="inline-flex items-center gap-1.5 transition hover:text-white"><Phone aria-hidden="true" className="h-3 w-3" />{COMPANY.phone}</a>
            <Link href="/faq" className="transition hover:text-white">Aide</Link>
            {user ? <LogoutButton label="Déconnexion" className="transition hover:text-white" /> : <Link href="/login" className="transition hover:text-white">Se connecter</Link>}
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-3 px-3 sm:px-6 lg:gap-8 lg:px-8">
        <WordmarkLink tagline />

        <SearchForm id="site-search" className="hidden max-w-sm flex-1 md:block" />

        <nav aria-label="Compte" className="ml-auto flex shrink-0 items-center gap-0.5">
          <Link href={accountHref} className={iconButton} aria-label={user ? `Mon espace${user.name ? `, ${user.name}` : ""}` : "Se connecter"}>
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover ring-1 ring-rule" />
            ) : (
              <UserRound aria-hidden="true" className="h-5 w-5" />
            )}
          </Link>
          <Link href={favoritesHref} className={`${iconButton} hidden sm:grid`} aria-label="Mes favoris">
            <Heart aria-hidden="true" className="h-5 w-5" />
          </Link>
          <CartIndicator />
          <span className="ml-3 hidden lg:block">
            <Link href={publishHref} className="cta-primary inline-flex h-10 items-center gap-2 px-4 text-sm">
              <PenLine aria-hidden="true" className="h-4 w-4" />
              Publier un livre
            </Link>
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 md:hidden">
        <SearchForm id="site-search-mobile" />
      </div>

      <div className="border-t border-rule">
        <MainNav links={links} />
      </div>
    </header>
  );
}
