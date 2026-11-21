import { NextResponse } from "next/server";
import { getReaderDocument, searchDocument } from "@/lib/reader/store";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const offset = Math.min(
      2000,
      Math.max(0, Number(url.searchParams.get("offset")) || 0),
    );
    if (
      (kind !== "book" && kind !== "thesis") ||
      q.length < 2 ||
      q.length > 200
    )
      return NextResponse.json(
        { error: "Masukkan 2–200 karakter." },
        { status: 400 },
      );
    const doc = await getReaderDocument(kind, id);
    if (!doc)
      return NextResponse.json(
        { error: "Indeks buku belum tersedia." },
        { status: 404 },
      );
    if (url.searchParams.get("v") !== doc.revision)
      return NextResponse.json(
        { error: "Dokumen diperbarui. Buka kembali buku." },
        { status: 409 },
      );
    const hits = await searchDocument(doc, q, offset);
    return NextResponse.json(
      {
        hits: hits.slice(0, 20),
        nextOffset: hits.length > 20 ? offset + 20 : null,
        revision: doc.revision,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Pencarian belum dapat dimuat." },
      { status: 503 },
    );
  }
}
