import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { DashboardIconName } from "@/components/ui/dashboard-icons";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReaderDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();
  const navigation: Array<{ href: string; label: string; icon: DashboardIconName; exact?: boolean }> = [
    { href: "/dashboard/reader", label: "Tableau de bord", icon: "book-open", exact: true },
    { href: "/dashboard/reader/library", label: "Bibliothèque", icon: "library-big" },
    { href: "/dashboard/reader/media", label: "Audio & vidéo", icon: "headphones" },
    { href: "/dashboard/reader/favorites", label: "Favoris", icon: "heart" },
    { href: "/dashboard/reader/purchases", label: "Transactions", icon: "receipt" },
    { href: "/dashboard/reader/subscriptions", label: "Premium", icon: "gem" },
    { href: "/dashboard/reader/affiliations", label: "Affiliation", icon: "circle-dollar-sign" },
  ];

  return (
    <DashboardShell
      areaLabel="Reader workspace"
      headline="Bibliothèque, médias, achats et abonnements"
      description="Reprenez vos lectures, retrouvez les éditions audio/vidéo, vérifiez vos achats et gérez Premium."
      userName={profile?.name ?? profile?.email ?? "Reader"}
      userRole="Lecteur"
      navigation={navigation}
      theme="reader"
    >
      {children}
    </DashboardShell>
  );
}
