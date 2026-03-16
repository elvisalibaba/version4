import { AdminShell } from "@/components/admin/shared/admin-shell";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireAdmin();

  return (
    <AdminShell profileName={profile.name ?? "Administrateur"} profileEmail={profile.email}>
      {children}
    </AdminShell>
  );
}
