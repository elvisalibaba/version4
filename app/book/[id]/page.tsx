import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { trackBookEngagement } from "@/lib/book-engagement";
import { getReaderBookAccessState } from "@/lib/book-access";
import { getCurrentUserProfile } from "@/lib/auth";
import { getBookById } from "@/lib/books";
import { BookDetailClient } from "./book-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

function deriveCheckoutNames(profile: {
  first_name: string | null;
  last_name: string | null;
  name: string | null;
}) {
  const firstName = profile.first_name?.trim() ?? "";
  const lastName = profile.last_name?.trim() ?? "";

  if (firstName && lastName) {
    return { firstName, lastName };
  }

  const fallbackName = profile.name?.trim() ?? "";
  const fallbackParts = fallbackName ? fallbackName.split(/\s+/).filter(Boolean) : [];

  return {
    firstName: firstName || fallbackParts[0] || "",
    lastName: lastName || fallbackParts.slice(1).join(" ") || "",
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const [book, profile] = await Promise.all([getBookById(id), getCurrentUserProfile()]);

  if (!book || book.status !== "published") {
    notFound();
  }

  const requestHeaders = await headers();
  await trackBookEngagement({
    bookId: book.id,
    eventType: "detail_view",
    source: "book_detail_page",
    requestHeaders,
    metadata: {
      access_mode: book.offer_mode,
      has_subscription_offer: book.is_subscription_available,
      has_single_sale_offer: book.is_single_sale_enabled,
    },
  });

  const accessState = profile
    ? await getReaderBookAccessState({
        userId: profile.id,
        bookId: book.id,
        bookPlanIds: book.subscription_plans.map((plan) => plan.id),
      })
    : null;
  const checkoutIdentity = profile ? deriveCheckoutNames(profile) : null;

  return (
    <BookDetailClient
      book={book}
      accessState={accessState}
      isAuthenticated={Boolean(profile)}
      checkoutCustomer={
        profile
          ? {
              customerId: profile.id,
              firstName: checkoutIdentity?.firstName ?? null,
              lastName: checkoutIdentity?.lastName ?? null,
              email: profile.email,
              phoneNumber: profile.phone,
              city: profile.city,
              country: profile.country,
            }
          : null
      }
    />
  );
}
