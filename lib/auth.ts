import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

function getSafeRoleFromMetadata(metadata: unknown): Exclude<UserRole, "admin"> {
  const role = typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>).role : undefined;
  return role === "author" ? "author" : "reader";
}

function getStringMetadata(metadata: unknown, key: string) {
  if (typeof metadata !== "object" || metadata === null) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getStringArrayMetadata(metadata: unknown, key: string) {
  if (typeof metadata !== "object" || metadata === null) return [];
  const value = (metadata as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
}

function getBooleanMetadata(metadata: unknown, key: string) {
  if (typeof metadata !== "object" || metadata === null) return false;
  return Boolean((metadata as Record<string, unknown>)[key]);
}

function buildProfileUpsertPayload(user: {
  id: string;
  email?: string | null;
  user_metadata?: unknown;
}) {
  const firstName = getStringMetadata(user.user_metadata, "first_name");
  const lastName = getStringMetadata(user.user_metadata, "last_name");
  const fallbackName = getStringMetadata(user.user_metadata, "name");
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || fallbackName;

  return {
    id: user.id,
    email: user.email ?? "",
    name: fullName ?? null,
    role: getSafeRoleFromMetadata(user.user_metadata),
    first_name: firstName,
    last_name: lastName,
    phone: getStringMetadata(user.user_metadata, "phone"),
    country: getStringMetadata(user.user_metadata, "country"),
    city: getStringMetadata(user.user_metadata, "city"),
    preferred_language: getStringMetadata(user.user_metadata, "preferred_language") ?? "fr",
    favorite_categories: getStringArrayMetadata(user.user_metadata, "favorite_categories"),
    marketing_opt_in: getBooleanMetadata(user.user_metadata, "marketing_opt_in"),
  };
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, first_name, last_name, phone, country, city, preferred_language, favorite_categories, marketing_opt_in, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const wantedRole = getSafeRoleFromMetadata(user.user_metadata);
    if (profile.role !== "admin" && profile.role !== wantedRole) {
      const { data: syncedProfile } = await supabase
        .from("profiles")
        .update({ role: wantedRole })
        .eq("id", user.id)
        .select("id, email, name, role, first_name, last_name, phone, country, city, preferred_language, favorite_categories, marketing_opt_in, created_at")
        .maybeSingle();

      return syncedProfile ?? profile;
    }

    return profile;
  }

  const safeRole = getSafeRoleFromMetadata(user.user_metadata);

  const profilePayload = buildProfileUpsertPayload(user);
  await supabase.from("profiles").upsert(profilePayload);

  const { data: repairedProfile } = await supabase
    .from("profiles")
    .select("id, email, name, role, first_name, last_name, phone, country, city, preferred_language, favorite_categories, marketing_opt_in, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (repairedProfile) {
    return repairedProfile;
  }

  // Fallback: never block authenticated users if profile table is temporarily out of sync.
  return {
    id: user.id,
    email: user.email ?? "",
    name: profilePayload.name,
    role: safeRole,
    first_name: profilePayload.first_name,
    last_name: profilePayload.last_name,
    phone: profilePayload.phone,
    country: profilePayload.country,
    city: profilePayload.city,
    preferred_language: profilePayload.preferred_language,
    favorite_categories: profilePayload.favorite_categories,
    marketing_opt_in: profilePayload.marketing_opt_in,
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
