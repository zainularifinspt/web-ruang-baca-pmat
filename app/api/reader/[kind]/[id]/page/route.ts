import { NextResponse } from "next/server";
import { getReaderDocument, readerPage } from "@/lib/reader/store";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const url = new URL(request.url);
  if (kind !== "book" && kind !== "thesis")
    return NextResponse.json(
      { error: "Koleksi tidak ditemukan." },
      { status: 404 },
    );
  try {
    const doc = await getReaderDocument(kind, id);
    if (!doc || url.searchParams.get("v") !== doc.revision)
      return NextResponse.json(
        { error: "Sumber sudah berubah atau tidak tersedia." },
        { status: 409 },
      );
    const p = await readerPage(doc, Number(url.searchParams.get("page")));
    if (!p)
      return NextResponse.json(
        { error: "Halaman tidak tersedia." },
        { status: 404 },
      );
    return NextResponse.json(
      {
        text: p.text,
        words: p.words,
        label: p.label,
        number: p.number,
        quality: p.quality,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Teks halaman belum dapat diambil." },
      { status: 503 },
    );
  }
}
