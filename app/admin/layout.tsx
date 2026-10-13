import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseMode } from "@/lib/data-source";

export const dynamic = "force-dynamic";
export default async function SupabaseAdminLayout({children}:{children:React.ReactNode}) {
  if(!isSupabaseMode())return children;
  const admin=await requireAdmin();
  return <div className="min-h-screen bg-paper">
    <header className="border-b border-rule bg-night-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <div><p className="text-xs font-semibold text-brand-300">HolisticBooks / Supabase</p>
          <h1 className="text-xl font-bold">Administration éditoriale</h1></div>
        <nav className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/admin">Vue d'ensemble</Link>
          <Link href="/admin/books">Livres</Link>
          <Link href="/admin/authors">Auteurs</Link>
          <Link href="/admin/orders">Commandes</Link>
          <Link href="/dashboard">Tableaux de bord</Link>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
      <p className="text-xs text-slate-500">Session administrateur vérifiée : {admin.email}</p>
      {children}
    </main>
  </div>;
}
