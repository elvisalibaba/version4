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
    { href: "/dashboard/author", label: "Tableau de bord", icon: "bar-chart-3", exact: true },
    { href: "/dashboard/author/books", label: "Catalogue", icon: "book-open" },
    { href: "/dashboard/author/add-book", label: "Nouveau titre", icon: "plus-circle" },
    { href: "/dashboard/author/sales", label: "Ventes", icon: "circle-dollar-sign" },
  ];

  return (
    <DashboardShell
      areaLabel="Author studio"
      headline="Catalogue, ventes et publication"
      description="Un studio auteur plus net, plus orienté pilotage, avec les memes donnees Supabase et une lecture proche d une console KDP."
      userName={profile?.name ?? profile?.email ?? "Author"}
      userRole="Auteur"
      navigation={navigation}
      theme="author"
    >
      {children}
    </DashboardShell>
  );
}
