import Link from "next/link";
import Image from "next/image";
import { CircleDollarSign, Heart, Search, ShoppingCart, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Helper to identify dynamic server usage errors
function isNextDynamicServerUsageError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      userRole = profile?.role ?? null;
    }
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }
    console.error(
      "[SiteHeader] Failed to resolve auth state. Rendering public navigation.",
      error
    );
  }

  const dashboardHref =
    userRole === "admin"
      ? "/admin"
      : userRole === "author"
      ? "/dashboard/author"
      : user
      ? "/dashboard/reader"
      : "/login";

  // Navigation links (modern layout)
  const primaryLinks = [
    { label: "Promotions", href: "/books" },
    { label: "Exclusivites", href: "/dashboard/reader/subscriptions" },
    { label: "Publier", href: "/dashboard/author/add-book" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Glass-morphic header with backdrop blur */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4 px-4 py-2 md:px-6">
          {/* Logo with custom image */}
          <Link
            href="/home"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900 transition hover:opacity-80"
          >
            <Image
              src="/logo.svg" // Replace with your actual logo path
              alt="Holistique Books"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="hidden sm:inline">Holistique Books</span>
          </Link>

          {/* Search bar - full width on mobile, centered on desktop */}
          <form
            action="/books"
            className="flex-1 max-w-2xl mx-4 md:mx-0 order-3 md:order-none w-full md:w-auto"
          >
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder="Rechercher un livre, un auteur..."
                className="h-12 w-full rounded-full border border-gray-200 bg-gray-50 pl-5 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#febd69] focus:ring-2 focus:ring-[#febd69]/30"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500 transition hover:bg-gray-200"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Icon group */}
          <div className="flex items-center gap-4 text-sm font-medium text-gray-800">
            <Link
              href="/books"
              className="flex items-center gap-1 rounded-full p-2 transition hover:bg-gray-100 hover:text-[#febd69]"
            >
              <Heart className="h-5 w-5" />
              <span className="hidden sm:inline">Liste</span>
            </Link>
            <Link
              href="/cart"
              className="flex items-center gap-1 rounded-full p-2 transition hover:bg-gray-100 hover:text-[#febd69]"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Panier</span>
            </Link>
            <Link
              href="/don"
              className="inline-flex items-center gap-2 rounded-full bg-[#febd69] px-3 py-2 font-semibold text-[#101826] shadow-sm transition hover:bg-[#f3a847]"
            >
              <CircleDollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Don</span>
            </Link>
            <Link
              href={dashboardHref}
              className="flex items-center gap-1 rounded-full p-2 transition hover:bg-gray-100 hover:text-[#febd69]"
            >
              <UserCircle2 className="h-5 w-5" />
              <span className="hidden sm:inline">
                {user ? "Compte" : "Connexion"}
              </span>
            </Link>
          </div>
        </div>

        {/* Secondary navigation - bottom bar with category links */}
        <div className="border-t border-gray-200/50 bg-white/50">
          <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-4 overflow-x-auto px-4 py-2 text-sm text-gray-700 scrollbar-hide md:px-6">
            {primaryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="whitespace-nowrap rounded-full px-3 py-1 transition hover:bg-gray-100 hover:text-[#febd69]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
