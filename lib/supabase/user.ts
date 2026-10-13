import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApiUser, UserRole } from "@/types/api";

/** Role is read from the protected profiles table, not mutable user_metadata. */
export async function getSupabaseUser(): Promise<ApiUser | null> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  if (error || !data) return null;
  const profile = data as Record<string, unknown>;
  const role: UserRole = profile.role === "admin" || profile.role === "author" ? profile.role : "reader";
  return {
    id: auth.user.id,
    email: auth.user.email,
    name: typeof profile.name === "string" ? profile.name : null,
    email_verified_at: auth.user.email_confirmed_at ?? null,
    profile: {
      role,
      avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      first_name: typeof profile.first_name === "string" ? profile.first_name : null,
      last_name: typeof profile.last_name === "string" ? profile.last_name : null,
      phone: typeof profile.phone === "string" ? profile.phone : null,
      country: typeof profile.country === "string" ? profile.country : null,
      city: typeof profile.city === "string" ? profile.city : null,
      preferred_language: typeof profile.preferred_language === "string" ? profile.preferred_language : "fr",
      favorite_categories: Array.isArray(profile.favorite_categories) ? profile.favorite_categories as string[] : [],
      marketing_opt_in: profile.marketing_opt_in === true,
    },
  };
}
