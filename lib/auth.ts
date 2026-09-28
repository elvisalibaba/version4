import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { apiServer } from "@/lib/api/server";
import type { ApiUser, UserRole } from "@/types/api";

export type CurrentUserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  preferred_language: string;
  favorite_categories: string[];
  marketing_opt_in: boolean;
  created_at?: string;
};

function flattenUser(user: ApiUser): CurrentUserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.profile.role,
    first_name: user.profile.first_name,
    last_name: user.profile.last_name,
    phone: user.profile.phone,
    country: user.profile.country,
    city: user.profile.city,
    preferred_language: user.profile.preferred_language,
    favorite_categories: user.profile.favorite_categories ?? [],
    marketing_opt_in: user.profile.marketing_opt_in,
  };
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  try {
    const response = await apiServer<{ data: ApiUser }>("auth/me");
    return response?.data ? flattenUser(response.data) : null;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    return null;
  }
}

export async function requireRole(allowed: UserRole[]) {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) redirect("/dashboard");
  return profile;
}
