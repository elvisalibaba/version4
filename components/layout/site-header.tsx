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
  const authorHref = userRole === "author" || userRole === "admin" ? "/dashboard/author" : "/register";
  const navLinks = [
    { label: "Accueil", href: "/home" },
    { label: "Catalogue", href: "/books" },
    { label: "Blog", href: "/blog" },
    { label: "Auteurs", href: authorHref },
    ...(userRole === "admin" ? [{ label: "Admin", href: "/admin" }] : []),
    { label: "Faire un don", href: "/don" },
    { label: "Contact", href: "/home#contact" },
  ];

  return (
    <header className="hb-template-header">
      <div className="hb-template-header-shell">
        <Link href="/home" className="hb-template-logo">
          Holistique Books
        </Link>

        <nav className="hb-template-nav" aria-label="Navigation principale">
          {navLinks.map((item) => (
            <Link key={item.label} href={item.href} className="hb-template-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hb-template-tools">
          <Link href="/books" className="hb-template-tool" aria-label="Rechercher">
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/books" className="hb-template-tool has-badge" aria-label="Favoris">
            <Heart className="h-4 w-4" />
            <span className="hb-template-tool-badge">0</span>
          </Link>
          <Link href="/cart" className="hb-template-tool has-badge" aria-label="Panier">
            <ShoppingCart className="h-4 w-4" />
            <span className="hb-template-tool-badge">0</span>
          </Link>
          <Link href={dashboardHref} className="hb-template-tool" aria-label="Compte">
            <UserCircle2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
