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
      areaLabel="Writer side"
      headline="Holistique Author Studio"
      description="Pilotez votre catalogue, vos performances et vos ventes dans un espace plus credible, plus editorial et vraiment pense pour les auteurs."
      userName={profile?.name ?? profile?.email ?? "Author"}
      userRole="Auteur"
      navigation={navigation}
    >
      {children}
    </DashboardShell>
  );
}
