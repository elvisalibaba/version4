import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books";
import { BookDetailClient } from "./book-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book || book.status !== "published") {
    notFound();
  }

  return <BookDetailClient bookId={book.id} title={book.title} description={book.description} price={book.price} />;
}
