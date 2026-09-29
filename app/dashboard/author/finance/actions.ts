"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { requireRole } from "@/lib/auth";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createPayoutAccountAction(formData: FormData) {
  await requireRole(["author"]);

  const method = clean(formData.get("method"));
  const provider = clean(formData.get("provider"));
  const countryCode = clean(formData.get("country_code")).toUpperCase();
  const currencyCode = clean(formData.get("currency_code")).toUpperCase();
  const accountName = clean(formData.get("account_name"));
  const accountIdentifier = clean(formData.get("account_identifier"));

  try {
    await apiServer("author/finance/payout-accounts", {
      method: "POST",
      body: {
        method,
        provider: provider || null,
        country_code: countryCode,
        currency_code: currencyCode,
        account_name: accountName,
        account_identifier: accountIdentifier,
        is_default: formData.get("is_default") === "on",
      },
    });
  } catch {
    redirect("/dashboard/author/finance?error=account");
  }

  revalidatePath("/dashboard/author/finance");
  redirect("/dashboard/author/finance?saved=account");
}

export async function requestPayoutAction(formData: FormData) {
  await requireRole(["author"]);

  const payoutAccountId = clean(formData.get("payout_account_id"));
  const amount = Number(clean(formData.get("amount")));

  try {
    await apiServer("author/finance/payouts", {
      method: "POST",
      body: {
        payout_account_id: payoutAccountId,
        amount,
      },
    });
  } catch {
    redirect("/dashboard/author/finance?error=payout");
  }

  revalidatePath("/dashboard/author/finance");
  revalidatePath("/dashboard/author");
  redirect("/dashboard/author/finance?saved=payout");
}
