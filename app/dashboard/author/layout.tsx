import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { DashboardIconName } from "@/components/ui/dashboard-icons";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthorDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();
  const navigation: Array<{ href: string; label: string; icon: DashboardIconName; exact?: boolean }> = [
    { href: "/dashboard/author", label: "Vue d’ensemble", icon: "bar-chart-3", exact: true },
    { href: "/dashboard/author/books", label: "Mes livres", icon: "book-open" },
    { href: "/dashboard/author/add-book", label: "Publier", icon: "plus-circle" },
    { href: "/dashboard/author/sales", label: "Ventes", icon: "receipt" },
    { href: "/dashboard/author/finance", label: "Finances", icon: "wallet-cards" },
    { href: "/dashboard/author/distribution", label: "Distribution", icon: "globe-2" },
    { href: "/dashboard/author/profile", label: "Profil auteur", icon: "user-round" },
  ];

  return (
    <DashboardShell
      areaLabel="Author Studio"
      headline="Holistique Books"
      description="Pilotez votre catalogue, vos ventes, vos royalties, vos paiements et votre distribution."
      userName={profile?.name ?? profile?.email ?? "Auteur"}
      userRole="Auteur"
      navigation={navigation}
      theme="author"
    >
      {children}
    </DashboardShell>
  );
}
