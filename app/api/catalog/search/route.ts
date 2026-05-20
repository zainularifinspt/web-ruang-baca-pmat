import { NextResponse } from "next/server";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { books, theses, error } = await fetchCatalogData({ visibility: "public" });

  if (error) {
    return NextResponse.json({ items: [], error }, { status: 200 });
  }

  const items = [
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
  ];

  return NextResponse.json({ items });
}
