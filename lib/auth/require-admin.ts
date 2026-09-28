import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string | null;
  role: "admin";
  created_at?: string;
};

export async function requireAdmin(): Promise<AdminIdentity> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login?next=/admin");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: "admin",
    created_at: profile.created_at,
  };
}
