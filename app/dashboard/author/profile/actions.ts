"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { requireRole } from "@/lib/auth";

export async function updateAuthorProfileAction(formData: FormData) {
  await requireRole(["author"]);

  const payload = new FormData();
  const copy = (name: string) => {
    const value = formData.get(name);
    if (typeof value === "string") payload.set(name, value.trim());
  };

  [
    "display_name",
    "professional_headline",
    "bio",
    "website",
    "location",
    "phone",
    "publishing_goals",
    "favorite_book",
    "favorite_author",
    "favorite_character",
  ].forEach(copy);

  const genres = String(formData.get("genres") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  genres.forEach((value) => payload.append("genres[]", value));

  const socialLinks: Record<string, string> = {};
  for (const network of ["instagram", "facebook", "linkedin", "x", "youtube"]) {
    const value = String(formData.get(network) ?? "").trim();
    if (value) socialLinks[network] = value;
  }
  Object.entries(socialLinks).forEach(([key, value]) => payload.append(`social_links[${key}]`, value));

  const pressMentions = String(formData.get("press_mentions") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split("|").map((value) => value.trim());
      return title && url ? { title, url } : null;
    })
    .filter((value): value is { title: string; url: string } => Boolean(value));
  pressMentions.forEach((entry, index) => {
    payload.append(`press_mentions[${index}][title]`, entry.title);
    payload.append(`press_mentions[${index}][url]`, entry.url);
  });

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) payload.set("avatar", avatar);

  try {
    await apiServer("author/profile", { method: "POST", body: payload });
  } catch {
    redirect("/dashboard/author/profile?error=1");
  }

  revalidatePath("/dashboard/author/profile");
  revalidatePath("/authors");
  redirect("/dashboard/author/profile?saved=1");
}
