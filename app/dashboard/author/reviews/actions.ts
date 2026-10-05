"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { requireRole } from "@/lib/auth";

export async function appealReviewCaseAction(formData: FormData) {
  await requireRole(["author"]);

  const reviewCaseId = String(formData.get("review_case_id") ?? "").trim();
  const authorResponse = String(formData.get("author_response") ?? "").trim();

  if (!reviewCaseId || authorResponse.length < 10) {
    redirect("/dashboard/author/reviews?error=invalid");
  }

  try {
    await apiServer(`author/review-cases/${encodeURIComponent(reviewCaseId)}/appeal`, {
      method: "POST",
      body: { author_response: authorResponse },
    });
  } catch {
    redirect("/dashboard/author/reviews?error=appeal");
  }

  revalidatePath("/dashboard/author/reviews");
  revalidatePath("/dashboard/author");
  redirect("/dashboard/author/reviews?saved=appeal");
}
