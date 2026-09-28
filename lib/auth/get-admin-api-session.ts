import { getCurrentUserProfile } from "@/lib/auth";

export type AdminApiSession = {
  id: string;
};

export async function getAdminApiSession(): Promise<AdminApiSession | null> {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== "admin") return null;

  return { id: profile.id };
}
