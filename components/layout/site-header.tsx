import Image from "next/image";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

function isDynamicError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

const links = [
  { label: "Librairie", href: "/books" }, { label: "Lire gratuitement", href: "/library" },
  { label: "Auteurs", href: "/authors" }, { label: "Magazine", href: "/blog" },
  { label: "Services éditoriaux", href: "/services" },
];

export async function SiteHeader() {
  let user: { id: string } | null = null;
  let role: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id } : null;
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      role = profile?.role ?? null;
    }
  } catch (error) {
    if (isDynamicError(error)) throw error;
    console.error("[SiteHeader] Auth unavailable", error);
  }

  const accountHref = role === "admin" ? "/admin" : role === "author" ? "/dashboard/author" : user ? "/dashboard/reader" : "/login";
  const favoritesHref = role === "reader" ? "/dashboard/reader/favorites" : user ? "/books" : "/login?next=%2Fdashboard%2Freader%2Ffavorites";

  return (
    <header className="sticky top-0 z-50 border-b border-[#d9cebd] bg-[#fffaf2]/95 text-[#17231d] shadow-[0_4px_25px_rgba(40,31,23,.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-3 sm:px-6 lg:h-[72px] lg:px-8">
        <Link href="/home" className="flex shrink-0 items-center gap-2.5" aria-label="Accueil Holistique Books">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#173d2c] p-1.5"><Image src="/logo.svg" alt="" width={32} height={32} className="h-full w-full object-contain" priority /></span>
          <span className="hidden sm:block"><strong className="block font-serif text-lg leading-none">Holistique Books</strong><span className="mt-1 block text-[.55rem] font-bold uppercase tracking-[.2em] text-[#b85135]">Maison éditoriale africaine</span></span>
        </Link>
        <nav aria-label="Navigation principale" className="ml-5 hidden items-center gap-1 xl:flex">
          {links.map((link) => <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-[#efe6d8] hover:text-[#b85135]">{link.label}</Link>)}
        </nav>
        <form action="/books" className="ml-auto hidden min-w-0 max-w-[250px] flex-1 lg:block">
          <div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d756a]" /><input name="q" type="search" aria-label="Rechercher" placeholder="Titre, auteur…" className="h-11 w-full rounded-full border border-[#d9cebd] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#173d2c] focus:ring-2 focus:ring-[#173d2c]/10" /></div>
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-1">
          <Link href="/books" className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-[#efe6d8] lg:hidden" aria-label="Rechercher"><Search className="h-5 w-5" /></Link>
          <Link href={favoritesHref} className="hidden h-11 w-11 place-items-center rounded-full transition hover:bg-[#efe6d8] sm:grid" aria-label="Favoris"><Heart className="h-5 w-5" /></Link>
          <Link href="/cart" className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-[#efe6d8]" aria-label="Panier"><ShoppingBag className="h-5 w-5" /></Link>
          <Link href={accountHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#173d2c] px-3.5 text-sm font-bold text-white transition hover:bg-[#23573f] sm:px-4"><UserRound className="h-4 w-4" /><span className="hidden sm:inline">{user ? "Mon espace" : "Connexion"}</span></Link>
          {user ? <LogoutButton label="Sortir" className="hidden h-11 items-center rounded-full border border-[#d9cebd] px-3 text-xs font-bold transition hover:bg-[#efe6d8] xl:inline-flex" /> : null}
          <details className="relative xl:hidden"><summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full hover:bg-[#efe6d8] [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></summary><nav className="absolute right-0 top-13 w-64 rounded-2xl border border-[#d9cebd] bg-[#fffaf2] p-2 shadow-2xl">{links.map((link) => <Link key={link.href} href={link.href} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-[#efe6d8]">{link.label}</Link>)}{user ? <div className="border-t border-[#d9cebd] pt-2"><LogoutButton label="Déconnexion" className="flex h-11 w-full items-center rounded-xl px-4 text-sm font-bold hover:bg-[#efe6d8]" /></div> : null}</nav></details>
        </div>
      </div>
    </header>
  );
}
