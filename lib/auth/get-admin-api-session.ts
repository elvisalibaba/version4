import { createClient } from "@/lib/supabase/server";

export type AdminApiSession = {
  id: string;
};

export async function getAdminApiSession(): Promise<AdminApiSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  return {
    id: profile.id,
  };
}
