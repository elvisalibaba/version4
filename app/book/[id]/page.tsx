import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { trackBookEngagement } from "@/lib/book-engagement";
import { getReaderBookAccessState } from "@/lib/book-access";
import { getCurrentUserProfile } from "@/lib/auth";
import { getBookById } from "@/lib/books";
import { BookDetailClient } from "./book-detail-client";
import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ read?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book || book.status !== "published") {
    return { title: "Livre introuvable", robots: { index: false, follow: false } };
  }

  const description = book.description?.trim().slice(0, 160) || `Découvrez ${book.title} sur ${SITE_NAME}.`;
  const image = book.cover_signed_url || "/pwa-icon-512.png";

  return {
    title: book.title,
    description,
    alternates: { canonical: `/book/${book.id}` },
    openGraph: {
      type: "book",
      title: book.title,
      description,
      url: `/book/${book.id}`,
      images: [{ url: image, alt: book.cover_alt_text || `Couverture de ${book.title}` }],
    },
    twitter: { card: "summary_large_image", title: book.title, description, images: [image] },
  };
}

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

export default async function BookDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { read } = await searchParams;
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.description || undefined,
    image: book.cover_signed_url || undefined,
    author: { "@type": "Person", name: book.author_name || "Auteur Holistique Books" },
    inLanguage: book.language || "fr",
    isbn: book.isbn || undefined,
    numberOfPages: book.page_count || undefined,
    url: absoluteUrl(`/book/${book.id}`),
    offers: book.is_single_sale_enabled
      ? {
          "@type": "Offer",
          price: book.price,
          priceCurrency: book.currency_code,
          availability: "https://schema.org/InStock",
          url: absoluteUrl(`/book/${book.id}`),
        }
      : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <BookDetailClient
        book={book}
        accessState={accessState}
        isAuthenticated={Boolean(profile)}
        autoOpenReader={read === "1" && (book.is_free || Boolean(accessState?.hasAccess))}
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
    </>
  );
}
