import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
  name: string | null;
  role: "admin";
  created_at: string;
};

export async function requireAdmin(): Promise<AdminIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    ...profile,
    role: "admin",
  };
}
