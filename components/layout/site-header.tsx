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
  const primaryLinks = [
    { label: "Toutes les promos", href: "/books" },
    { label: "Nos contenus exclusifs", href: "/dashboard/reader/subscriptions" },
    { label: "Publiez votre roman !", href: "/dashboard/author/add-book" },
    { label: "Le blog Holistique", href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#ece3d7] bg-[rgba(250,246,241,0.96)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[96rem] px-4">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-[#f0e7dc] text-[0.72rem] font-medium text-[#6f665e]">
          <div className="flex flex-wrap items-center gap-3 py-2">
            <span className="transition hover:text-[#171717]">Changer de pays</span>
            <span className="text-[#cbbcab]">|</span>
            <span className="font-semibold text-[#171717]">Francais</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 py-2">
            <Link href="/don" className="transition hover:text-[#171717]">
              Cartes cadeau
            </Link>
            <Link href="/blog" className="transition hover:text-[#171717]">
              Blog
            </Link>
            <Link href="/faq" className="transition hover:text-[#171717]">
              Aide
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4 xl:min-w-[250px]">
            <Link href="/home" className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#171717] text-sm font-semibold text-white">HB</span>
              <span>
                <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#a85b3f]">Holistique</span>
                <span className="block text-xl font-semibold tracking-[-0.04em] text-[#171717]">Books</span>
              </span>
            </Link>
          </div>

          <form action="/books" className="flex min-h-[3.25rem] flex-1 items-center gap-3 rounded-full border border-[#e7ddd1] bg-white px-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <Search className="h-4 w-4 text-[#8b8177]" />
            <input
              type="search"
              name="q"
              placeholder="Rechercher sur Holistique Books"
              className="h-full flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9c9186]"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              Rechercher
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[#171717]">
            <Link href="/books" className="transition hover:text-[#a85b3f]">
              Liste d envies
            </Link>
            <Link href="/cart" className="transition hover:text-[#a85b3f]">
              Panier
            </Link>
            <Link href={dashboardHref} className="transition hover:text-[#a85b3f]">
              Mon compte
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-4">
          {primaryLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center rounded-full border border-[#ece3d7] bg-white/92 px-4 py-2.5 text-sm font-medium text-[#3a342f] transition hover:border-[#d6c7b7] hover:bg-white hover:text-[#171717]"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <Link href="/books" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-white text-[#26221d]">
              <Heart className="h-4 w-4" />
            </Link>
            <Link href="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7ddd1] bg-white text-[#26221d]">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <Link
              href={dashboardHref}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#171717] bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
            >
              <UserCircle2 className="h-4 w-4" />
              {user ? "Mon compte" : "Connexion"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
