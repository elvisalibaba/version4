import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Search, ShoppingCart, UserCircle2 } from "lucide-react";

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

  return (
    <header className="sticky top-0 z-40 hb-header">
      <div className="hb-header-top">
        <div className="hb-header-inner">
          <div className="hb-header-links">
            <Link href="/dashboard/author" className="hb-top-link">
              Publier un livre
            </Link>
            <Link href="/books" className="hb-top-link">
              Auteurs
            </Link>
            <Link href="/blog" className="hb-top-link">
              Blog
            </Link>
          </div>
          <div className="hb-header-actions">
            <Link href="/books" className="hb-icon-button" aria-label="Rechercher">
              <Search className="h-4 w-4" />
            </Link>
            <Link href={user ? "/dashboard" : "/login"} className="hb-icon-button" aria-label="Compte">
              <UserCircle2 className="h-4 w-4" />
            </Link>
            <Link href="/cart" className="hb-icon-button" aria-label="Panier">
              <ShoppingCart className="h-4 w-4" />
            </Link>
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
          <Link href="/home" className="hb-logo text-lg font-semibold">
            Holistique Books
          </Link>
          <nav className="hb-main-nav">
            {[
              { label: "Nouveautes", href: "/books" },
              { label: "Best-Sellers", href: "/books" },
              { label: "Genres", href: "/books" },
              { label: "A paraitre", href: "/books" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="hb-main-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
