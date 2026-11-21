import type { Metadata } from "next";
import {
  CollectionDetailError,
  CollectionDetailPage,
} from "@/components/collection-detail-page";
import { fetchBookById } from "@/lib/supabase";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { book } = await fetchBookById(id, { visibility: "public" });

  return {
    title: book ? `${book.title} | Detail Buku` : "Buku tidak ditemukan",
  };
}

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { book, error } = await fetchBookById(id, { visibility: "public" });

  if (!book) {
    return <CollectionDetailError type="book" id={id} message={error} />;
  }

  return <CollectionDetailPage item={book} />;
}
