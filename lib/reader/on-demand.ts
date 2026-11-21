import type { Book, Thesis } from "@/lib/types";
import { chunkPages, hasPoorWordBoundaries, readerUrl, retrieveChunks } from "./core";
import { downloadPdf } from "./network";
import type { ReaderDocument, ReaderKind, ReaderPage, ReaderSource } from "./types";

type CachedExtract = {
  expires: number;
  doc: ReaderDocument;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 8;
const onDemandCache = new Map<string, CachedExtract>();

export function buildCatalogMetadataSource(
  item: Book | Thesis,
  index = 0,
): ReaderSource {
  const fullText =
    item.type === "book"
      ? `Judul Buku: ${item.title}. Penulis: ${item.author}. Penerbit: ${item.publisher || "-"}. Tahun: ${item.year}. Kategori: ${item.category}. Lokasi Rak: ${item.rackLocation || item.location}. Status: ${item.status} (Tersedia ${item.available} dari ${item.stock}). ISBN: ${item.isbn || "-"}. Kata Kunci: ${item.keywords.join(", ")}. ${item.notes || ""}`.trim()
      : `Judul Skripsi: ${item.title}. Penulis: ${item.studentName}. Tahun: ${item.year}. Topik: ${item.topic}. Pembimbing 1: ${item.supervisor1}. Pembimbing 2: ${item.supervisor2}. Lokasi: ${item.physicalLocation || item.location}. Kata Kunci: ${item.keywords.join(", ")}. Abstrak: ${item.abstract || "-"}`.trim();

  return {
    id: `catalog-${index}`,
    title: item.title,
    author: item.type === "book" ? item.author : item.studentName,
    url:
      item.type === "book" && item.pdfUrl
        ? readerUrl("book", item.id)
        : `/katalog/${item.type === "book" ? "buku" : "skripsi"}/${encodeURIComponent(item.id)}`,
    excerpt: fullText.slice(0, 1800),
  };
}

function detectHiddenChapterFourPages(
  kind: ReaderKind,
  pageLineLists: string[][],
): Set<number> | null {
  const hidden = new Set<number>();
  if (kind !== "thesis") return hidden;

  const isChapterLine = (lines: string[], roman: string, num: string) =>
    lines
      .slice(0, 12)
      .some((line) =>
        new RegExp(`^BAB\\s*(${roman}|${num})$`, "i").test(line),
      );
  const starts = pageLineLists.flatMap((lines, i) =>
    isChapterLine(lines, "IV", "4") ? [i + 1] : [],
  );
  if (starts.length !== 1) return null;
  const ends = pageLineLists.flatMap((lines, i) =>
    i + 1 > starts[0] && isChapterLine(lines, "V", "5") ? [i + 1] : [],
  );
  if (ends.length !== 1) return null;
  for (let page = starts[0]; page < ends[0]; page++) hidden.add(page);
  return hidden;
}

async function extractOnDemandDocument(
  item: Book | Thesis,
  pdfUrl: string,
): Promise<ReaderDocument | null> {
  const cacheKey = `${item.type}:${item.id}:${pdfUrl}`;
  const now = Date.now();
  const cached = onDemandCache.get(cacheKey);
  if (cached && cached.expires > now) return cached.doc;

  try {
    const buffer = await downloadPdf(pdfUrl);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdfDoc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0,
    }).promise;

    if (item.type === "thesis" && pdfDoc.numPages > 450) {
      await pdfDoc.destroy();
      return null;
    }
    const totalPages = Math.min(pdfDoc.numPages, 450);
    const pageTexts: string[] = [];
    const pageLineLists: string[][] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      try {
        const tc = await page.getTextContent();
        const linesMap = new Map<number, { x: number; str: string }[]>();
        for (const textItem of tc.items) {
          if (!("str" in textItem) || !textItem.str.trim()) continue;
          const y = Math.round(textItem.transform[5] / 4) * 4;
          if (!linesMap.has(y)) linesMap.set(y, []);
          linesMap.get(y)!.push({
            x: textItem.transform[4],
            str: textItem.str,
          });
        }
        const lines = [...linesMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, items]) =>
            items
              .sort((a, b) => a.x - b.x)
              .map((it) => it.str)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          );
        pageLineLists.push(lines);
        pageTexts.push(lines.join("\n").trim());
      } finally {
        page.cleanup();
      }
    }
    await pdfDoc.destroy();

    const hidden = detectHiddenChapterFourPages(
      item.type,
      pageLineLists,
    );
    if (!hidden) return null;
    const pages: ReaderPage[] = [];
    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      if (hidden.has(pageNum)) continue;
      const text = pageTexts[i];
      const quality =
        text.length < 30
          ? "image"
          : hasPoorWordBoundaries(text)
            ? "poor"
            : "text";
      pages.push({
        number: pageNum,
        label: String(pageNum),
        width: 600,
        height: 800,
        text,
        words: [],
        image: "",
        thumbnail: "",
        hd: "",
        quality,
      });
    }

    const doc: ReaderDocument = {
      schema: 1,
      key: `${item.type}-${item.id}`,
      collectionId: item.id,
      kind: item.type,
      title: item.title,
      author: item.type === "book" ? item.author : item.studentName,
      revision: "live",
      sourceHash: "live",
      sourceUrl: pdfUrl,
      policy: "public-v1-no-chapter-iv",
      createdAt: new Date().toISOString(),
      totalPages,
      outline: [],
      embeddingReady: false,
      pages,
      chunks: chunkPages(pages),
    };

    if (onDemandCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = onDemandCache.keys().next().value;
      if (oldestKey) onDemandCache.delete(oldestKey);
    }
    onDemandCache.set(cacheKey, { expires: now + CACHE_TTL_MS, doc });
    return doc;
  } catch {
    return null;
  }
}

export async function retrieveOnDemandSources(
  item: Book | Thesis,
  question: string,
  embedding?: number[],
  page?: number,
): Promise<ReaderSource[]> {
  const metadataSource = buildCatalogMetadataSource(item, 0);
  const pdfUrl =
    item.type === "thesis"
      ? item.pdfR2?.trim() || item.pdfUrl?.trim()
      : item.pdfUrl?.trim();

  const metadata = page === undefined ? [metadataSource] : [];
  if (!pdfUrl) return metadata;

  const doc = await extractOnDemandDocument(item, pdfUrl);
  if (!doc || (page !== undefined && !doc.pages.some((p) => p.number === page))) return metadata;

  const chunks = retrieveChunks(doc, question, embedding, page);
  const pdfSources: ReaderSource[] = chunks.map((c) => ({
    id: `${doc.key}:live:${c.id}`,
    title: doc.title,
    author: doc.author,
    page: c.page,
    label: String(c.page),
    url: readerUrl(item.type, item.id, c.page),
    excerpt: c.text,
  }));

  return [...pdfSources.slice(0, 5), ...metadata];
}
