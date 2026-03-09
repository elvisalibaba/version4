import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

function getSafeRoleFromMetadata(metadata: unknown): Exclude<UserRole, "admin"> {
  const role = typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>).role : undefined;
  return role === "author" ? "author" : "reader";
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const wantedRole = getSafeRoleFromMetadata(user.user_metadata);
    if (profile.role !== "admin" && profile.role !== wantedRole) {
      const { data: syncedProfile } = await supabase
        .from("profiles")
        .update({ role: wantedRole })
        .eq("id", user.id)
        .select("id, email, name, role, created_at")
        .maybeSingle();

      return syncedProfile ?? profile;
    }

    return profile;
  }

  const safeRole = getSafeRoleFromMetadata(user.user_metadata);

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    role: safeRole,
  });

  const { data: repairedProfile } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (repairedProfile) {
    return repairedProfile;
  }

  // Fallback: never block authenticated users if profile table is temporarily out of sync.
  return {
    id: user.id,
    email: user.email ?? "",
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
    role: getSafeRoleFromMetadata(user.user_metadata),
    created_at: new Date().toISOString(),
  };
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile;
}
