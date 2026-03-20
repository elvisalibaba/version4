import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { DashboardIconName } from "@/components/ui/dashboard-icons";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function ReaderDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();
  const navigation: Array<{ href: string; label: string; icon: DashboardIconName; exact?: boolean }> = [
    { href: "/dashboard/reader", label: "Vue d'ensemble", icon: "book-open", exact: true },
    { href: "/dashboard/reader/library", label: "Bibliotheque", icon: "library-big" },
    { href: "/dashboard/reader/purchases", label: "Historique", icon: "receipt" },
    { href: "/dashboard/reader/subscriptions", label: "Premium", icon: "gem" },
  ];

  return (
    <DashboardShell
      areaLabel="Reader workspace"
      headline="Bibliotheque, achats et Premium"
      description="Un espace lecteur plus clair pour suivre les lectures, les acquisitions et les abonnements sans surcharge visuelle."
      userName={profile?.name ?? profile?.email ?? "Reader"}
      userRole="Lecteur"
      navigation={navigation}
    >
      {children}
    </DashboardShell>
  );
}
