import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function DashboardEntryPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "reader") redirect("/dashboard/reader");
  if (profile.role === "author") redirect("/dashboard/author");
  redirect("/dashboard/admin");
}
