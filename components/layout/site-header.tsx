import Link from "next/link";
import { Heart, Search, ShoppingCart, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function isNextDynamicServerUsageError(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";
}

export async function SiteHeader() {
  let user: { id: string } | null = null;
  let userRole: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser ? { id: authUser.id } : null;

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      userRole = profile?.role ?? null;
    }
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error("[SiteHeader] Failed to resolve auth state. Rendering public navigation.", error);
  }

  const dashboardHref =
    userRole === "admin" ? "/admin" : userRole === "author" ? "/dashboard/author" : user ? "/dashboard/reader" : "/login";

  // Navigation links (Amazon style)
  const primaryLinks = [
    { label: "Promotions", href: "/books" },
    { label: "Contenus exclusifs", href: "/dashboard/reader/subscriptions" },
    { label: "Publiez votre roman", href: "/dashboard/author/add-book" },
    { label: "Blog", href: "/blog" },
  ];

  // Additional links for top bar
  const topBarLinks = [
    { label: "Cartes cadeau", href: "/don" },
    { label: "Blog", href: "/blog" },
    { label: "Aide", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar : country, account, orders, etc. (Amazon dark bar) */}
      <div className="bg-[#232f3e] text-xs text-white">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4 px-4 py-1.5">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold">Bonjour</span>
              <span className="opacity-90">•</span>
              <span>Français</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/cart" className="hover:underline">
              Panier
            </Link>
            <Link href={dashboardHref} className="hover:underline">
              {user ? "Mon compte" : "Connexion"}
            </Link>
          </div>
        </div>
      </div>

      {/* Main header : logo + search bar + cart/wishlist icons */}
      <div className="border-b border-gray-300 bg-white py-2">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-1 text-xl font-bold text-[#232f3e]">
            <span className="text-2xl">📚</span>
            <span>Holistique Books</span>
          </Link>

          {/* Search bar (Amazon style) */}
          <form action="/books" className="flex flex-1 max-w-2xl items-center rounded-md border border-gray-300 bg-white shadow-sm">
            <input
              type="search"
              name="q"
              placeholder="Rechercher dans Holistique Books"
              className="h-10 flex-1 rounded-l-md px-4 text-sm text-gray-900 outline-none"
            />
            <button
              type="submit"
              className="flex h-10 w-12 items-center justify-center rounded-r-md bg-[#febd69] text-gray-800 transition hover:bg-[#f3a847]"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          {/* Icons : wishlist & cart */}
          <div className="flex items-center gap-3 text-sm font-medium text-gray-800">
            <Link href="/books" className="relative flex items-center gap-1 hover:text-[#febd69]">
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Liste</span>
            </Link>
            <Link href="/cart" className="relative flex items-center gap-1 hover:text-[#febd69]">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Panier</span>
            </Link>
            <Link href={dashboardHref} className="flex items-center gap-1 hover:text-[#febd69]">
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden sm:inline">{user ? "Compte" : "Connexion"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary navigation : category links */}
      <div className="bg-[#232f3e] text-white">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-4 px-4 py-2 text-sm">
          {primaryLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="whitespace-nowrap hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}