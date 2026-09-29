"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { requireRole } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateBookDistributionAction(bookId: string, formData: FormData) {
  await requireRole(["author"]);

  const royaltyPercent = Number(value(formData, "royalty_rate") || 70);
  const territories = value(formData, "territories")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const salesChannels = formData
    .getAll("sales_channels")
    .map((item) => String(item))
    .filter(Boolean);

  try {
    await apiServer(`author/books/${encodeURIComponent(bookId)}/distribution`, {
      method: "PUT",
      body: {
        primary_market: value(formData, "primary_market").toUpperCase() || "CD",
        territory_mode: value(formData, "territory_mode") || "worldwide",
        territories,
        sales_channels,
        local_currency: value(formData, "local_currency").toUpperCase() || "USD",
        royalty_rate: Math.min(100, Math.max(0, royaltyPercent)) / 100,
        preorder_enabled: formData.get("preorder_enabled") === "on",
        launch_date: value(formData, "launch_date") || null,
        print_on_demand_enabled: formData.get("print_on_demand_enabled") === "on",
        local_print_enabled: formData.get("local_print_enabled") === "on",
        institutional_sales_enabled: formData.get("institutional_sales_enabled") === "on",
        bookstore_distribution_enabled: formData.get("bookstore_distribution_enabled") === "on",
        distribution_notes: value(formData, "distribution_notes") || null,
      },
    });
  } catch {
    redirect(`/dashboard/author/distribution?error=${encodeURIComponent(bookId)}`);
  }

  revalidatePath("/dashboard/author/distribution");
  revalidatePath("/dashboard/author");
  redirect(`/dashboard/author/distribution?saved=${encodeURIComponent(bookId)}`);
}
