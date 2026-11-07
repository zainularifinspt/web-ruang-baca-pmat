import { NextResponse } from "next/server";
import { getReaderDocument } from "@/lib/reader/store";
import type { ReaderKind, ReaderManifest } from "@/lib/reader/types";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;
    if (kind !== "book" && kind !== "thesis")
      return NextResponse.json(
        { error: "Koleksi tidak ditemukan." },
        { status: 404 },
      );
    const doc = await getReaderDocument(kind as ReaderKind, id);
    if (!doc)
      return NextResponse.json(
        { error: "Dokumen belum siap dibaca sebagai flipbook." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    const asset = (name: string) =>
      `/api/reader/${kind}/${encodeURIComponent(id)}/assets/${doc.revision}/${name}`;
    const manifest: ReaderManifest = {
      key: doc.key,
      collectionId: doc.collectionId,
      kind: doc.kind,
      title: doc.title,
      author: doc.author,
      revision: doc.revision,
      totalPages: doc.totalPages,
      outline: doc.outline,
      pages: doc.pages.map((p) => ({
        number: p.number,
        label: p.label,
        width: p.width,
        height: p.height,
        image: asset(p.image),
        thumbnail: asset(p.thumbnail),
        hd: asset(p.hd),
      })),
      searchReady: doc.pages.some((p) => p.quality !== "image"),
      textPages: doc.pages.filter((p) => p.quality !== "image").length,
      aiReady:
        Boolean(process.env.DEEPSEEK_API_KEY) &&
        doc.pages.some((p) => p.quality !== "image"),
      embeddingReady: doc.embeddingReady,
    };
    // Explicit CDN only for assets pre-approved for public distribution.
    if (process.env.READER_ASSET_BASE_URL)
      for (const p of manifest.pages) {
        for (const field of ["image", "thumbnail", "hd"] as const) {
          const filename = p[field].split("/").pop();
          p[field] =
            `${process.env.READER_ASSET_BASE_URL.replace(/\/$/, "")}/${doc.key}/${doc.revision}/${filename}`;
        }
      }
    return NextResponse.json(manifest, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Pembaca belum tersedia.",
      },
      { status: 503 },
    );
  }
}
