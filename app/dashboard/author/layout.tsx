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
    { href: "/dashboard/author", label: "Tableau de bord", icon: "bar-chart-3", exact: true },
    { href: "/dashboard/author/books", label: "Catalogue", icon: "book-open" },
    { href: "/dashboard/author/add-book", label: "Nouveau titre", icon: "plus-circle" },
    { href: "/dashboard/author/sales", label: "Ventes", icon: "circle-dollar-sign" },
    { href: "/dashboard/author/profile", label: "Profil public", icon: "user-round" },
  ];

  return (
    <DashboardShell
      areaLabel="Espace auteur"
      headline="Holistique Books"
      description="Gérez simplement vos livres, votre profil et vos ventes."
      userName={profile?.name ?? profile?.email ?? "Auteur"}
      userRole="Auteur"
      navigation={navigation}
      theme="author"
    >
      {children}
    </DashboardShell>
  );
}
