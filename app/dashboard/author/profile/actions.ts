"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function safeExternalUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parsePressMentions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .flatMap((line) => {
      const separator = line.indexOf("|");
      const title = (separator >= 0 ? line.slice(0, separator) : line).trim();
      const url = safeExternalUrl(separator >= 0 ? line.slice(separator + 1).trim() : "");
      return title && url ? [{ title: title.slice(0, 160), url }] : [];
    });
}

export async function updateAuthorProfileAction(formData: FormData) {
  const profile = await requireRole(["author"]);
  const supabase = await createClient();
  const displayName = text(formData, "display_name");

  if (!displayName) redirect("/dashboard/author/profile?error=display_name");

  const avatar = formData.get("avatar");
  let avatarPath: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    const extension = ALLOWED_AVATAR_TYPES.get(avatar.type);
    if (!extension || avatar.size > MAX_AVATAR_SIZE) {
      redirect("/dashboard/author/profile?error=avatar");
    }

    avatarPath = `author-avatars/${profile.id}/profile.${extension}`;
    const { error: uploadError } = await supabase.storage.from("books").upload(avatarPath, await avatar.arrayBuffer(), {
      contentType: avatar.type,
      cacheControl: "3600",
      upsert: true,
    });
    if (uploadError) redirect("/dashboard/author/profile?error=upload");
  }

  const socialLinks = Object.fromEntries(
    ["instagram", "facebook", "linkedin", "x", "youtube"]
      .map((network) => [network, safeExternalUrl(text(formData, network))] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );

  const payload = {
    display_name: displayName.slice(0, 120),
    professional_headline: nullableText(formData, "professional_headline"),
    bio: nullableText(formData, "bio"),
    website: safeExternalUrl(text(formData, "website")),
    location: nullableText(formData, "location"),
    phone: nullableText(formData, "phone"),
    genres: text(formData, "genres").split(",").map((genre) => genre.trim()).filter(Boolean).slice(0, 12),
    publishing_goals: nullableText(formData, "publishing_goals"),
    favorite_book: nullableText(formData, "favorite_book"),
    favorite_author: nullableText(formData, "favorite_author"),
    favorite_character: nullableText(formData, "favorite_character"),
    press_mentions: parsePressMentions(text(formData, "press_mentions")),
    social_links: socialLinks,
    ...(avatarPath ? { avatar_url: avatarPath } : {}),
  };

  const { error } = await supabase.from("author_profiles").update(payload).eq("id", profile.id);
  if (error) redirect("/dashboard/author/profile?error=save");

  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/author/profile");
  revalidatePath(`/authors/${profile.id}`);
  revalidatePath("/authors");
  revalidatePath("/home");
  redirect("/dashboard/author/profile?saved=1");
}
