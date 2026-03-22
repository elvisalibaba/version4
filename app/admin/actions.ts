"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isBookCopyrightBlocked } from "@/lib/book-copyright";
import { DIGITAL_BOOK_FORMATS } from "@/lib/book-formats";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createBlogPost, deleteBlogPost, parseBlogContentInput } from "@/lib/blog";
import { addBookToFlashSale, clearFlashSaleBooks, removeBookFromFlashSale, updateFlashSaleDiscount } from "@/lib/flash-sales";
import { addBookToHomeFeatured, clearHomeFeaturedBooks, moveHomeFeaturedBook, removeBookFromHomeFeatured } from "@/lib/home-positioning";
import { splitCommaSeparatedValues } from "@/lib/supabase/admin/shared";
import { createClient } from "@/lib/supabase/server";
import type {
  BookFormatType,
  BookReviewStatus,
  BookStatus,
  CopyrightStatus,
  LibraryAccessType,
  OrderPaymentStatus,
  SubscriptionStatus,
  UserRole,
} from "@/types/database";

/* --------------------------------------------------------------------------
 *  Utilities
 * ------------------------------------------------------------------------- */

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value ? value : null;
}

function getNumber(formData: FormData, key: string, fallback = 0): number {
  const raw = getString(formData, key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getNullableNumber(formData: FormData, key: string): number | null {
  const raw = getString(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getBoolean(formData: FormData, key: string): boolean {
  const value = getString(formData, key);
  return value === "true" || value === "on" || value === "1";
}

function getRedirectPath(formData: FormData, fallback: string): string {
  return getString(formData, "redirect_to") || fallback;
}

function appendRedirectParam(path: string, key: string, value: string) {
  const [pathname, search = ""] = path.split("?");
  const searchParams = new URLSearchParams(search);
  searchParams.set(key, value);
  const nextSearch = searchParams.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

/* --------------------------------------------------------------------------
 *  Blog actions
 * ------------------------------------------------------------------------- */

/**
 * Crée un nouvel article de blog (admin uniquement).
 */
export async function createBlogPostAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/blog");

  const post = await createBlogPost({
    slug: getNullableString(formData, "slug") ?? undefined,
    title: getString(formData, "title"),
    excerpt: getString(formData, "excerpt"),
    tag: getString(formData, "tag"),
    date: getString(formData, "date") || new Date().toISOString().slice(0, 10),
    author: getString(formData, "author"),
    readTime: getString(formData, "read_time") || "5 min",
    coverLabel: getString(formData, "cover_label") || "Magazine editorial",
    coverImageUrl: getNullableString(formData, "cover_image_url"),
    coverImageAlt: getNullableString(formData, "cover_image_alt"),
    content: parseBlogContentInput(getString(formData, "content")),
  });

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");
  redirect(redirectTo);
}

/**
 * Supprime un article de blog (admin uniquement).
 */
export async function deleteBlogPostAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/blog");
  const slug = getString(formData, "slug");
  const deletedPost = await deleteBlogPost(slug);

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/blog");
  if (deletedPost) {
    revalidatePath(`/blog/${deletedPost.slug}`);
  }
  revalidatePath("/admin/blog");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Flash sales actions
 * ------------------------------------------------------------------------- */

/**
 * Met à jour le pourcentage de remise pour les flash sales (admin uniquement).
 */
export async function updateFlashSaleDiscountAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/flash-sales");

  await updateFlashSaleDiscount(getNumber(formData, "discount_percentage", 20));

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin/flash-sales");
  redirect(redirectTo);
}

/**
 * Ajoute un livre à la liste des flash sales (admin uniquement).
 */
export async function addFlashSaleBookAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/flash-sales");
  const bookId = getString(formData, "book_id");

  if (bookId) {
    await addBookToFlashSale(bookId);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin/flash-sales");
  redirect(redirectTo);
}

/**
 * Retire un livre de la liste des flash sales (admin uniquement).
 */
export async function removeFlashSaleBookAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/flash-sales");
  const bookId = getString(formData, "book_id");

  if (bookId) {
    await removeBookFromFlashSale(bookId);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin/flash-sales");
  redirect(redirectTo);
}

/**
 * Vide complètement la liste des flash sales (admin uniquement).
 */
export async function clearFlashSaleBooksAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/flash-sales");

  await clearFlashSaleBooks();

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin/flash-sales");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Home featured books actions
 * ------------------------------------------------------------------------- */

/**
 * Ajoute un livre à la section mise en avant de la page d'accueil (admin uniquement).
 */
export async function addHomeFeaturedBookAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/home-positioning");
  const bookId = getString(formData, "book_id");

  if (bookId) {
    await addBookToHomeFeatured(bookId);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/home-positioning");
  redirect(redirectTo);
}

/**
 * Retire un livre de la section mise en avant de la page d'accueil (admin uniquement).
 */
export async function removeHomeFeaturedBookAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/home-positioning");
  const bookId = getString(formData, "book_id");

  if (bookId) {
    await removeBookFromHomeFeatured(bookId);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/home-positioning");
  redirect(redirectTo);
}

/**
 * Vide complètement la section mise en avant de la page d'accueil (admin uniquement).
 */
export async function clearHomeFeaturedBooksAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/home-positioning");

  await clearHomeFeaturedBooks();

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/home-positioning");
  redirect(redirectTo);
}

/**
 * Déplace un livre dans l'ordre d'affichage de la section mise en avant (admin uniquement).
 */
export async function moveHomeFeaturedBookAction(formData: FormData) {
  await requireAdmin();
  const redirectTo = getRedirectPath(formData, "/admin/home-positioning");
  const bookId = getString(formData, "book_id");
  const direction = getString(formData, "direction");

  if (bookId && (direction === "up" || direction === "down")) {
    await moveHomeFeaturedBook(bookId, direction);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/admin");
  revalidatePath("/admin/home-positioning");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Users & authors actions
 * ------------------------------------------------------------------------- */

/**
 * Met à jour le rôle d'un utilisateur (admin uniquement).
 */
export async function updateUserRoleAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const userId = getString(formData, "user_id");
  const role = getString(formData, "role") as UserRole;
  const redirectTo = getRedirectPath(formData, `/admin/users/${userId}`);

  await supabase.from("profiles").update({ role }).eq("id", userId);

  if (role === "author" || role === "admin") {
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", userId).maybeSingle();
    await supabase.from("author_profiles").upsert({
      id: userId,
      display_name: profile?.name?.trim() || "Auteur",
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/authors");
  redirect(redirectTo);
}

/**
 * Met à jour le profil auteur (admin uniquement).
 */
export async function updateAuthorProfileAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const authorId = getString(formData, "author_id");
  const redirectTo = getRedirectPath(formData, `/admin/authors/${authorId}`);

  await supabase.from("author_profiles").upsert({
    id: authorId,
    display_name: getString(formData, "display_name") || "Auteur",
    avatar_url: getNullableString(formData, "avatar_url"),
    bio: getNullableString(formData, "bio"),
    website: getNullableString(formData, "website"),
    location: getNullableString(formData, "location"),
    professional_headline: getNullableString(formData, "professional_headline"),
    phone: getNullableString(formData, "phone"),
    genres: splitCommaSeparatedValues(getString(formData, "genres")),
    publishing_goals: getNullableString(formData, "publishing_goals"),
  });

  revalidatePath("/admin/authors");
  revalidatePath(`/admin/authors/${authorId}`);
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Books actions
 * ------------------------------------------------------------------------- */

/**
 * Met à jour un livre (admin uniquement).
 */
export async function updateBookAction(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const bookId = getString(formData, "book_id");
  const redirectTo = getRedirectPath(formData, `/admin/books/${bookId}`);
  const status = getString(formData, "status") as BookStatus;
  const reviewStatus = getString(formData, "review_status") as BookReviewStatus;
  const copyrightStatus = getString(formData, "copyright_status") as CopyrightStatus;
  const publishedAt = getNullableString(formData, "published_at");
  const submittedAt = getNullableString(formData, "submitted_at");
  const reviewedAt = getNullableString(formData, "reviewed_at");
  const reviewNote = getNullableString(formData, "review_note");
  const copyrightNote = getNullableString(formData, "copyright_note");
  const isReviewedStatus = reviewStatus === "approved" || reviewStatus === "rejected" || reviewStatus === "changes_requested";
  const isBlockedForCopyright = isBookCopyrightBlocked(copyrightStatus);

  const { data: currentBook } = await supabase
    .from("books")
    .select("published_at, submitted_at, reviewed_at, reviewed_by, copyright_blocked_at, copyright_blocked_by")
    .eq("id", bookId)
    .maybeSingle();

  await supabase.from("books").update({
    title: getString(formData, "title"),
    subtitle: getNullableString(formData, "subtitle"),
    description: getNullableString(formData, "description"),
    author_id: getString(formData, "author_id"),
    author_display_name: getNullableString(formData, "author_display_name"),
    status,
    language: getString(formData, "language") || "fr",
    price: getNumber(formData, "price"),
    currency_code: getString(formData, "currency_code") || "USD",
    publication_date: getNullableString(formData, "publication_date"),
    publisher: getNullableString(formData, "publisher"),
    isbn: getNullableString(formData, "isbn"),
    page_count: getNullableNumber(formData, "page_count"),
    categories: splitCommaSeparatedValues(getString(formData, "categories")),
    tags: splitCommaSeparatedValues(getString(formData, "tags")),
    co_authors: splitCommaSeparatedValues(getString(formData, "co_authors")),
    age_rating: getNullableString(formData, "age_rating"),
    edition: getNullableString(formData, "edition"),
    series_name: getNullableString(formData, "series_name"),
    series_position: getNullableNumber(formData, "series_position"),
    file_format: getNullableString(formData, "file_format"),
    file_size: getNullableNumber(formData, "file_size"),
    cover_url: getNullableString(formData, "cover_url"),
    cover_thumbnail_url: getNullableString(formData, "cover_thumbnail_url"),
    cover_alt_text: getNullableString(formData, "cover_alt_text"),
    file_url: getNullableString(formData, "file_url"),
    sample_url: getNullableString(formData, "sample_url"),
    sample_pages: getNullableNumber(formData, "sample_pages"),
    is_single_sale_enabled: getBoolean(formData, "is_single_sale_enabled"),
    is_subscription_available: getBoolean(formData, "is_subscription_available"),
    review_status: reviewStatus,
    submitted_at: reviewStatus === "submitted" ? submittedAt ?? currentBook?.submitted_at ?? new Date().toISOString() : submittedAt,
    reviewed_at: isReviewedStatus ? reviewedAt ?? currentBook?.reviewed_at ?? new Date().toISOString() : reviewedAt,
    reviewed_by: isReviewedStatus ? admin.id : null,
    review_note: reviewNote,
    copyright_status: copyrightStatus,
    copyright_note: copyrightNote,
    copyright_blocked_at: isBlockedForCopyright ? currentBook?.copyright_blocked_at ?? new Date().toISOString() : null,
    copyright_blocked_by: isBlockedForCopyright ? currentBook?.copyright_blocked_by ?? admin.id : null,
    views_count: Math.max(0, getNumber(formData, "views_count")),
    purchases_count: Math.max(0, getNumber(formData, "purchases_count")),
    rating_avg: getNullableNumber(formData, "rating_avg"),
    ratings_count: Math.max(0, getNumber(formData, "ratings_count")),
    published_at: status === "published" ? publishedAt ?? currentBook?.published_at ?? new Date().toISOString() : publishedAt,
  }).eq("id", bookId);

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath(`/admin/books/${bookId}/edit`);
  revalidatePath("/home");
  revalidatePath("/books");
  revalidatePath(`/book/${bookId}`);
  revalidatePath("/dashboard/reader/library");
  revalidatePath("/dashboard/reader/favorites");
  redirect(appendRedirectParam(redirectTo, "saved", isBlockedForCopyright ? "copyright_blocked" : "updated"));
}

/**
 * Traite une soumission de livre (approbation, demande de modifications ou rejet).
 */
export async function reviewBookSubmissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const bookId = getString(formData, "book_id");
  const redirectTo = getRedirectPath(formData, `/admin/books/${bookId}`);
  const decision = getString(formData, "decision");
  const targetStatus = getString(formData, "target_status") as BookStatus;
  const shouldPublishDigitalFormats = getBoolean(formData, "publish_ebook_format");
  const reviewNote = getNullableString(formData, "review_note");
  const { data: currentBook } = await supabase.from("books").select("copyright_status").eq("id", bookId).maybeSingle();

  if (decision === "approve" && isBookCopyrightBlocked(currentBook?.copyright_status as CopyrightStatus | null | undefined)) {
    redirect(appendRedirectParam(redirectTo, "review", "copyright_blocked"));
  }

  const reviewPayload: {
    review_status: BookReviewStatus;
    reviewed_at: string;
    reviewed_by: string;
    review_note: string | null;
    status?: BookStatus;
    published_at?: string | null;
  } = {
    review_status: "submitted",
    reviewed_at: new Date().toISOString(),
    reviewed_by: admin.id,
    review_note: reviewNote,
  };

  if (decision === "approve") {
    reviewPayload.review_status = "approved";
    reviewPayload.status = targetStatus || "published";
    reviewPayload.published_at = reviewPayload.status === "published" ? new Date().toISOString() : null;
  } else if (decision === "request_changes") {
    reviewPayload.review_status = "changes_requested";
    reviewPayload.status = "draft";
    reviewPayload.published_at = null;
  } else {
    reviewPayload.review_status = "rejected";
    reviewPayload.status = "draft";
    reviewPayload.published_at = null;
  }

  await supabase.from("books").update(reviewPayload).eq("id", bookId);

  if (decision === "approve" && shouldPublishDigitalFormats) {
    await supabase.from("book_formats").update({ is_published: true }).eq("book_id", bookId).in("format", [...DIGITAL_BOOK_FORMATS]);
  }

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}`);
  revalidatePath(`/admin/books/${bookId}/edit`);
  revalidatePath("/admin/formats");
  revalidatePath("/dashboard/author");
  revalidatePath("/dashboard/author/books");
  revalidatePath("/home");
  revalidatePath("/books");
  revalidatePath("/librairie");
  const reviewResult =
    decision === "approve"
      ? shouldPublishDigitalFormats
        ? "approved_published"
        : "approved"
      : decision === "request_changes"
        ? "changes_requested"
        : "rejected";
  redirect(appendRedirectParam(redirectTo, "review", reviewResult));
}

/* --------------------------------------------------------------------------
 *  Book formats actions
 * ------------------------------------------------------------------------- */

/**
 * Crée ou met à jour un format de livre (admin uniquement).
 */
export async function saveBookFormatAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const formatId = getString(formData, "format_id");
  const bookId = getString(formData, "book_id");
  const redirectTo = getRedirectPath(formData, formatId ? `/admin/formats/${formatId}` : "/admin/formats");

  const payload = {
    book_id: bookId,
    format: getString(formData, "format") as BookFormatType,
    price: getNumber(formData, "price"),
    currency_code: getString(formData, "currency_code") || "USD",
    downloadable: false,
    is_published: getBoolean(formData, "is_published"),
    printing_cost: getNullableNumber(formData, "printing_cost"),
    stock_quantity: getNullableNumber(formData, "stock_quantity"),
    file_size_mb: getNullableNumber(formData, "file_size_mb"),
    file_url: getNullableString(formData, "file_url"),
  };

  if (formatId) {
    await supabase.from("book_formats").update(payload).eq("id", formatId);
  } else {
    await supabase.from("book_formats").insert(payload);
  }

  revalidatePath("/admin/formats");
  revalidatePath(`/admin/books/${bookId}`);
  if (formatId) {
    revalidatePath(`/admin/formats/${formatId}`);
  }
  redirect(redirectTo);
}

/**
 * Supprime un format de livre (seulement s'il n'est pas publié).
 */
export async function deleteBookFormatAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const formatId = getString(formData, "format_id");
  const bookId = getString(formData, "book_id");
  const redirectTo = getRedirectPath(formData, "/admin/formats");

  const { data: format } = await supabase.from("book_formats").select("is_published").eq("id", formatId).maybeSingle();

  if (!format?.is_published) {
    await supabase.from("book_formats").delete().eq("id", formatId);
  }

  revalidatePath("/admin/formats");
  if (bookId) revalidatePath(`/admin/books/${bookId}`);
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Orders actions
 * ------------------------------------------------------------------------- */

/**
 * Met à jour le statut de paiement d'une commande (admin uniquement).
 */
export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const orderId = getString(formData, "order_id");
  const paymentStatus = getString(formData, "payment_status") as OrderPaymentStatus;
  const redirectTo = getRedirectPath(formData, `/admin/orders/${orderId}`);

  await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", orderId);
  if (orderId && paymentStatus === "paid") {
    await supabase.rpc("sync_library_access_for_order", { p_order_id: orderId });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/library");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Library access actions
 * ------------------------------------------------------------------------- */

/**
 * Ajoute un accès à la bibliothèque pour un utilisateur (admin uniquement).
 */
export async function addLibraryAccessAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const redirectTo = getRedirectPath(formData, "/admin/library");

  await supabase.from("library").upsert(
    {
      user_id: getString(formData, "user_id"),
      book_id: getString(formData, "book_id"),
      access_type: getString(formData, "access_type") as LibraryAccessType,
      subscription_id: getNullableString(formData, "subscription_id"),
      purchased_at: getNullableString(formData, "purchased_at") ?? new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" },
  );

  revalidatePath("/admin/library");
  redirect(redirectTo);
}

/**
 * Supprime un accès à la bibliothèque (admin uniquement).
 */
export async function removeLibraryAccessAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const libraryId = getString(formData, "library_id");
  const redirectTo = getRedirectPath(formData, "/admin/library");

  await supabase.from("library").delete().eq("id", libraryId);

  revalidatePath("/admin/library");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Ratings & highlights actions
 * ------------------------------------------------------------------------- */

/**
 * Supprime une note (admin uniquement).
 */
export async function deleteRatingAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const ratingId = getString(formData, "rating_id");
  const redirectTo = getRedirectPath(formData, "/admin/ratings");

  await supabase.from("ratings").delete().eq("id", ratingId);

  revalidatePath("/admin/ratings");
  revalidatePath("/admin/books");
  redirect(redirectTo);
}

/**
 * Supprime un surlignage (admin uniquement).
 */
export async function deleteHighlightAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const highlightId = getString(formData, "highlight_id");
  const redirectTo = getRedirectPath(formData, "/admin/highlights");

  await supabase.from("highlights").delete().eq("id", highlightId);

  revalidatePath("/admin/highlights");
  revalidatePath("/admin/books");
  redirect(redirectTo);
}

/* --------------------------------------------------------------------------
 *  Subscriptions actions
 * ------------------------------------------------------------------------- */

/**
 * Crée ou met à jour un plan d'abonnement (admin uniquement).
 */
export async function saveSubscriptionPlanAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const planId = getString(formData, "plan_id");
  const redirectTo = getRedirectPath(formData, planId ? `/admin/subscriptions/plans/${planId}` : "/admin/subscriptions/plans");
  const payload = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getNullableString(formData, "description"),
    monthly_price: getNumber(formData, "monthly_price"),
    currency_code: getString(formData, "currency_code") || "USD",
    is_active: getBoolean(formData, "is_active"),
  };

  if (planId) {
    await supabase.from("subscription_plans").update(payload).eq("id", planId);
  } else {
    await supabase.from("subscription_plans").insert(payload);
  }

  revalidatePath("/admin/subscriptions/plans");
  if (planId) {
    revalidatePath(`/admin/subscriptions/plans/${planId}`);
  }
  redirect(redirectTo);
}

/**
 * Ajoute un livre à un plan d'abonnement (admin uniquement).
 */
export async function addBookToPlanAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const planId = getString(formData, "plan_id");
  const bookId = getString(formData, "book_id");
  const redirectTo = getRedirectPath(formData, `/admin/subscriptions/plans/${planId}`);

  await supabase.from("subscription_plan_books").upsert({
    plan_id: planId,
    book_id: bookId,
  });

  revalidatePath("/admin/subscriptions/plans");
  revalidatePath(`/admin/subscriptions/plans/${planId}`);
  revalidatePath(`/admin/books/${bookId}`);
  redirect(redirectTo);
}

/**
 * Retire un livre d'un plan d'abonnement (admin uniquement).
 */
export async function removeBookFromPlanAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const mappingId = getString(formData, "mapping_id");
  const planId = getString(formData, "plan_id");
  const redirectTo = getRedirectPath(formData, `/admin/subscriptions/plans/${planId}`);

  await supabase.from("subscription_plan_books").delete().eq("id", mappingId);

  revalidatePath("/admin/subscriptions/plans");
  revalidatePath(`/admin/subscriptions/plans/${planId}`);
  redirect(redirectTo);
}

/**
 * Crée ou met à jour un abonnement utilisateur (admin uniquement).
 */
export async function saveUserSubscriptionAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const subscriptionId = getString(formData, "subscription_id");
  const redirectTo = getRedirectPath(formData, "/admin/subscriptions/users");
  const payload = {
    user_id: getString(formData, "user_id"),
    plan_id: getString(formData, "plan_id"),
    status: getString(formData, "status") as SubscriptionStatus,
    started_at: getNullableString(formData, "started_at") ?? new Date().toISOString(),
    expires_at: getNullableString(formData, "expires_at"),
  };

  if (subscriptionId) {
    await supabase.from("user_subscriptions").update(payload).eq("id", subscriptionId);
  } else {
    await supabase.from("user_subscriptions").insert(payload);
  }

  revalidatePath("/admin/subscriptions/users");
  redirect(redirectTo);
}
