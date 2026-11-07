import { fetchBookById, fetchThesisById } from "@/lib/supabase";
import type { ReaderKind } from "./types";
import { hasVerifiedCatalogSource } from "./core";
export async function publicCollection(kind: ReaderKind, id: string) {
  if (kind === "book") {
    const book = (await fetchBookById(id, { visibility: "public" })).book;
    return book && hasVerifiedCatalogSource(book) ? book : null;
  }
  return (await fetchThesisById(id, { visibility: "public" })).thesis;
}
export function sourceUrl(item: {
  type: string;
  pdfUrl?: string;
  pdfR2?: string;
}) {
  return (
    (item.type === "thesis"
      ? item.pdfR2?.trim() || item.pdfUrl?.trim()
      : item.pdfUrl?.trim()) || ""
  );
}
