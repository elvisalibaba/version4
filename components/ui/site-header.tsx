import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { LogoLink } from "@/components/brand/logo";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { MainNav, MobileMenu, type NavLink } from "@/components/layout/main-nav";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUserProfile } from "@/lib/auth";

function isDynamicError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

export const SITE_NAV_LINKS: NavLink[] = [
  { label: "À propos", href: "/qui-sommes-nous" },
  { label: "Services", href: "/services" },
  { label: "Packs", href: "/home#packs" },
  { label: "Librairie", href: "/librairie" },
  { label: "Magazines", href: "/home#magazines" },
  { label: "Académie", href: "/formation-editoriale" },
  { label: "Contact", href: "/home#contact" },
];

export async function SiteHeader() {
  let user: { name: string | null; avatarUrl: string | null } | null = null;
  let role: string | null = null;
  try {
    const profile = await getCurrentUserProfile();
    user = profile ? { name: profile.first_name ?? profile.name ?? null, avatarUrl: profile.avatar_url } : null;
    role = profile?.role ?? null;
  } catch (error) {
    if (isDynamicError(error)) throw error;
    console.error("[SiteHeader] Auth unavailable", error);
  }

  const accountHref = role === "admin" ? "/admin" : role === "author" ? "/dashboard/author" : "/dashboard/reader";
  const publishHref = role === "author" ? "/dashboard/author/add-book" : "/register?role=author";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-60 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Aller au contenu
      </a>
      <div className="relative mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <LogoLink height={44} priority />

        <div className="mx-auto">
          <MainNav links={SITE_NAV_LINKS} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          {user ? (
            <Link
              href={accountHref}
              aria-label={`Mon espace${user.name ? `, ${user.name}` : ""}`}
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep"
            >
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <UserRound aria-hidden="true" className="h-5 w-5" />
              )}
            </Link>
          ) : (
            <ButtonLink href="/login" variant="secondary" className="hidden sm:inline-flex">Se connecter</ButtonLink>
          )}
          <CartIndicator />
          <ButtonLink href={publishHref} className="hidden xl:inline-flex">Publier mon livre</ButtonLink>
          <MobileMenu links={SITE_NAV_LINKS}>
            {user ? null : <ButtonLink href="/login" variant="secondary" className="sm:hidden">Se connecter</ButtonLink>}
            <ButtonLink href={publishHref}>Publier mon livre</ButtonLink>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
