import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { DashboardIconName } from "@/components/ui/dashboard-icons";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function AuthorDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();
  const navigation: Array<{ href: string; label: string; icon: DashboardIconName; exact?: boolean }> = [
    { href: "/dashboard/author", label: "Vue d'ensemble", icon: "bar-chart-3", exact: true },
    { href: "/dashboard/author/books", label: "Mes livres", icon: "book-open" },
    { href: "/dashboard/author/add-book", label: "Ajouter un livre", icon: "plus-circle" },
    { href: "/dashboard/author/sales", label: "Ventes", icon: "circle-dollar-sign" },
  ];

  return (
    <DashboardShell
      areaLabel="Author studio"
      headline="Catalogue, ventes et mise en ligne"
      description="Le studio auteur garde les memes donnees Supabase, mais avec une interface plus compacte et plus proche d un outil de publication."
      userName={profile?.name ?? profile?.email ?? "Author"}
      userRole="Auteur"
      navigation={navigation}
    >
      {children}
    </DashboardShell>
  );
}
