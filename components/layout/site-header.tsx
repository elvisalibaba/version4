import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Search, ShoppingCart, Sparkles, UserCircle2 } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";

export async function SiteHeader() {
  async function signOut() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/home");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const userRole = profile?.role ?? null;
  const dashboardHref =
    userRole === "admin" ? "/admin" : userRole === "author" ? "/dashboard/author" : user ? "/dashboard/reader" : "/login";
  const publishHref = userRole === "admin" || userRole === "author" ? "/dashboard/author" : "/register";
  const primaryLinks = [
    { label: "Studio auteur", href: publishHref },
    { label: "Collections", href: "/books" },
    { label: "Journal", href: "/blog" },
  ];
  const mainLinks = [
    { label: "Accueil", href: "/home" },
    { label: "Catalogue", href: "/books" },
    { label: "Librairie", href: "/librairie" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <header className="sticky top-0 z-40 hb-header">
      <div className="hb-header-top">
        <div className="hb-header-inner hb-header-topbar">
          <div className="hb-header-links">
            {primaryLinks.map((item) => (
              <Link key={item.label} href={item.href} className="hb-top-link">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hb-header-actions">
            <span className="premium-badge hidden lg:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              Livres qui elevent
            </span>
            {user ? (
              <form action={signOut} className="hidden sm:block">
                <button type="submit" className="hb-top-button">
                  Deconnecter
                </button>
              </form>
            ) : (
              <Link href="/login" className="hb-top-button">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="hb-header-main">
        <div className="hb-header-inner hb-header-brand">
          <div className="hb-brand-cluster">
            <Link href="/home" className="hb-logo">
              <span className="dashboard-brand-mark">HB</span>
              <span className="hb-logo-copy">
                <span className="hb-logo-kicker">Transformational library</span>
                <span className="hb-logo-title">HolistiqueBooks</span>
              </span>
            </Link>
            <span className="hb-brand-pill">Lire pour grandir</span>
          </div>
          <div className="hb-header-search">
            <SearchBar
              defaultValue=""
              placeholder="Trouver un livre, un auteur ou une collection"
              buttonLabel="Explorer"
              compact
            />
          </div>
          <nav className="hb-main-nav hb-main-nav-desktop">
            {mainLinks.map((item) => (
              <Link key={item.label} href={item.href} className="hb-main-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hb-utility-nav">
            <Link href="/books" className="hb-icon-button" aria-label="Catalogue">
              <BookOpen className="h-4 w-4" />
            </Link>
            <Link href={dashboardHref} className="hb-icon-button" aria-label="Compte">
              <UserCircle2 className="h-4 w-4" />
            </Link>
            <Link href="/cart" className="hb-icon-button" aria-label="Panier">
              <ShoppingCart className="h-4 w-4" />
            </Link>
            <Link href="/books" className="hb-icon-button" aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Link>
          </div>
          <nav className="hb-main-nav hb-main-nav-mobile">
            {mainLinks.map((item) => (
              <Link key={`${item.label}-mobile`} href={item.href} className="hb-main-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
