import { redirect } from "next/navigation";
import { isUuidLike, normalizeAffiliateCode, normalizeAffiliateSourceType } from "@/lib/affiliate";
import type { UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

function getMetadataRecord(metadata: unknown) {
  return typeof metadata === "object" && metadata !== null ? (metadata as Record<string, unknown>) : null;
}

function getSafeRoleFromMetadata(metadata: unknown): Exclude<UserRole, "admin"> {
  const role = getMetadataRecord(metadata)?.role;
  return role === "author" ? "author" : "reader";
}

function getStringMetadata(metadata: unknown, key: string) {
  const value = getMetadataRecord(metadata)?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getUuidMetadata(metadata: unknown, key: string) {
  const value = getStringMetadata(metadata, key);
  return isUuidLike(value) ? value : null;
}

function getStringArrayMetadata(metadata: unknown, key: string) {
  const value = getMetadataRecord(metadata)?.[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
}

function getBooleanMetadata(metadata: unknown, key: string) {
  return Boolean(getMetadataRecord(metadata)?.[key]);
}

function getNestedRecordMetadata(metadata: unknown, key: string) {
  return getMetadataRecord(getMetadataRecord(metadata)?.[key]);
}

function getStringObject(value: unknown) {
  const record = getMetadataRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record).flatMap(([key, entry]) =>
      typeof entry === "string" && entry.trim().length > 0 ? [[key, entry.trim()]] : [],
    ),
  );
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
  const affiliateSourceType = normalizeAffiliateSourceType(getStringMetadata(user.user_metadata, "affiliate_source_type"));

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
    referred_by_affiliate_code: normalizeAffiliateCode(getStringMetadata(user.user_metadata, "referred_by_affiliate_code")),
    affiliate_source_type: affiliateSourceType,
    affiliate_source_book_id: affiliateSourceType === "book" ? getUuidMetadata(user.user_metadata, "affiliate_source_book_id") : null,
    affiliate_source_plan_id: affiliateSourceType === "plan" ? getUuidMetadata(user.user_metadata, "affiliate_source_plan_id") : null,
  };
}

function buildAuthorProfileUpsertPayload(user: {
  id: string;
  email?: string | null;
  user_metadata?: unknown;
}) {
  const metadata = user.user_metadata;
  const authorMetadata = getNestedRecordMetadata(metadata, "author_profile");
  const firstName = getStringMetadata(metadata, "first_name");
  const lastName = getStringMetadata(metadata, "last_name");
  const fallbackName = getStringMetadata(metadata, "name");
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const fallbackDisplayName = fallbackName || fullName || user.email?.split("@")[0] || "Auteur";

  return {
    id: user.id,
    display_name: getStringMetadata(authorMetadata, "display_name") ?? fallbackDisplayName,
    professional_headline: getStringMetadata(authorMetadata, "professional_headline"),
    bio: getStringMetadata(authorMetadata, "bio"),
    website: getStringMetadata(authorMetadata, "website"),
    location: getStringMetadata(authorMetadata, "location"),
    phone: getStringMetadata(authorMetadata, "phone") ?? getStringMetadata(metadata, "phone"),
    genres: getStringArrayMetadata(authorMetadata, "genres"),
    publishing_goals: getStringMetadata(authorMetadata, "publishing_goals"),
    social_links: getStringObject(getMetadataRecord(authorMetadata)?.social_links),
  };
}

async function syncAuthorProfileIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: unknown;
  },
) {
  if (getSafeRoleFromMetadata(user.user_metadata) !== "author") {
    return;
  }

  const authorProfilePayload = buildAuthorProfileUpsertPayload(user);
  await supabase.from("author_profiles").upsert(authorProfilePayload, { onConflict: "id" });
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

      if (wantedRole === "author") {
        await syncAuthorProfileIfNeeded(supabase, user).catch(() => undefined);
      }

      return syncedProfile ?? profile;
    }

    if (wantedRole === "author") {
      await syncAuthorProfileIfNeeded(supabase, user).catch(() => undefined);
    }

    return profile;
  }

  const safeRole = getSafeRoleFromMetadata(user.user_metadata);

  const profilePayload = buildProfileUpsertPayload(user);
  await supabase.from("profiles").upsert(profilePayload);

  if (safeRole === "author") {
    await syncAuthorProfileIfNeeded(supabase, user).catch(() => undefined);
  }

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
