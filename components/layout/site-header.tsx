import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShoppingCart, UserCircle2 } from "lucide-react";

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

  let displayName: string | null = null;
  let displayRole: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, role")
      .eq("id", user.id)
      .maybeSingle();

    displayName =
      profile?.name ||
      (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
      profile?.email ||
      user.email ||
      "Utilisateur";
    displayRole = profile?.role || (user.user_metadata?.role as string | undefined) || "reader";
  }

  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="ios-hero mx-auto max-w-7xl overflow-hidden rounded-[2rem] text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 sm:px-6">
          <Link href="/home" className="min-w-fit text-xl font-bold tracking-wide">
            Holistique Books
          </Link>
          <form action="/books" method="get" className="flex flex-1 items-center overflow-hidden rounded-2xl border border-white/10 bg-white/90 shadow-lg shadow-slate-950/15">
            <select name="scope" className="h-10 border-r border-slate-200/80 bg-slate-50 px-2 text-sm text-slate-800 outline-none">
              <option>Livres</option>
              <option>Auteurs</option>
              <option>Blog</option>
            </select>
            <input
              type="search"
              name="q"
              placeholder="Rechercher un livre, un auteur, un sujet..."
              className="h-10 flex-1 px-3 text-sm text-slate-900 outline-none"
            />
            <button type="submit" className="ios-button-primary h-10 px-4 text-sm font-semibold">
              Rechercher
            </button>
          </form>
          {user ? (
            <div className="hidden items-center gap-4 text-sm md:flex">
              <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-1.5 backdrop-blur-xl">
                <p className="text-xs text-slate-200">Bonjour</p>
                <p className="max-w-[180px] truncate font-semibold text-white">{displayName}</p>
                <p className="text-[11px] uppercase tracking-wide text-rose-200">{displayRole}</p>
              </div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 hover:text-rose-200">
                <UserCircle2 className="h-4 w-4" />
                Mon compte
              </Link>
              <Link href="/cart" className="inline-flex items-center gap-1.5 font-semibold hover:text-rose-200">
                <ShoppingCart className="h-4 w-4" />
                Panier
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 font-semibold text-rose-100 hover:bg-rose-400/20"
                >
                  Deconnecter
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden items-center gap-4 text-sm md:flex">
              <Link href="/login" className="hover:text-rose-200">
                Connexion
              </Link>
              <Link href="/login" className="inline-flex items-center gap-1.5 hover:text-rose-200">
                <UserCircle2 className="h-4 w-4" />
                Compte
              </Link>
              <Link href="/cart" className="inline-flex items-center gap-1.5 font-semibold hover:text-rose-200">
                <ShoppingCart className="h-4 w-4" />
                Panier
              </Link>
            </div>
          )}
        </div>
      </div>
      <nav className="mx-auto mt-3 flex max-w-7xl items-center gap-3 overflow-x-auto px-2 py-2 text-sm sm:px-3 md:justify-center">
        {[
          { label: "NOS SERVICES", href: "/services" },
          { label: "CONSEILS & RESSOURCES", href: "/ressources" },
          { label: "LIBRAIRIE", href: "/librairie" },
          { label: "QUI SOMMES-NOUS ?", href: "/qui-sommes-nous" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="ios-chip min-w-fit rounded-full px-4 py-2 font-semibold hover:text-rose-700">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
