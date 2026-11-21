import type { Book, Thesis } from "@/lib/types";

export type CatalogSearchItem = {
  id: string;
  type: "book" | "thesis";
  title: string;
  category: string;
  coverUrl: string | null;
  href: string;
  searchText: string;
};

export function buildCatalogSearchItems({
  books,
  theses,
  limit = 160,
}: {
  books: Book[];
  theses: Thesis[];
  limit?: number;
}): CatalogSearchItem[] {
  return [
    ...books.map((book) => ({
      id: book.id,
      type: "book" as const,
      title: book.title,
      category: book.category || "Buku",
      coverUrl: book.coverUrl ?? null,
      href: `/books/${book.id}`,
      searchText: [
        book.title,
        book.author,
        book.category,
        book.publisher,
        book.isbn,
        ...book.keywords,
      ].join(" "),
    })),
    ...theses.map((thesis) => ({
      id: thesis.id,
      type: "thesis" as const,
      title: thesis.title,
      category: thesis.topic || "Skripsi",
      coverUrl: thesis.coverUrl ?? null,
      href: `/theses/${thesis.id}`,
      searchText: [
        thesis.title,
        thesis.studentName,
        thesis.topic,
        thesis.supervisor1,
        thesis.supervisor2,
        ...thesis.keywords,
      ].join(" "),
    })),
  ].slice(0, limit);
}
