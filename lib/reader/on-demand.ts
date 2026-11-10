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
      : `Judul Skripsi: ${item.title}. Penulis: ${item.studentName}${item.studentNim ? ` (NIM ${item.studentNim})` : ""}. Tahun: ${item.year}. Topik: ${item.topic}. Pembimbing 1: ${item.supervisor1}. Pembimbing 2: ${item.supervisor2}. Lokasi: ${item.physicalLocation || item.location}. Kata Kunci: ${item.keywords.join(", ")}. Abstrak: ${item.abstract || "-"}`.trim();

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
  pageTexts: string[],
  pageLineLists: string[][],
): Set<number> {
  const hidden = new Set<number>();
  if (kind !== "thesis") return hidden;

  const isChapterLine = (lines: string[], roman: string, num: string) =>
    lines
      .slice(0, 12)
      .some((line) =>
        new RegExp(`^BAB\\s*(${roman}|${num})\\b`, "i").test(line),
      );

  let ch4Start = 0;
  let ch5Start = 0;
  for (let i = 0; i < pageTexts.length; i++) {
    const pageNum = i + 1;
    const upper = pageTexts[i].toUpperCase();
    const lines = pageLineLists[i];
    if (
      !ch4Start &&
      (isChapterLine(lines, "IV", "4") || /^(\d+\s+)?BAB\s*(IV|4)\b/.test(upper))
    ) {
      ch4Start = pageNum;
    } else if (
      ch4Start &&
      !ch5Start &&
      (isChapterLine(lines, "V", "5") || /^(\d+\s+)?BAB\s*(V|5)\b/.test(upper))
    ) {
      ch5Start = pageNum;
      break;
    }
  }

  if (ch4Start > 0) {
    const endPage = ch5Start > ch4Start ? ch5Start - 1 : pageTexts.length;
    for (let p = ch4Start; p <= endPage; p++) hidden.add(p);
  }
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
      pageTexts,
      pageLineLists,
    );
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

  if (!pdfUrl) return [metadataSource];

  const doc = await extractOnDemandDocument(item, pdfUrl);
  if (!doc) return [metadataSource];

  const chunks = retrieveChunks(doc, question, embedding, page);
  const pdfSources: ReaderSource[] = chunks.map((c) => ({
    id: `${doc.key}:live:${c.id}`,
    title: doc.title,
    author: doc.author,
    page: c.page,
    label: String(c.page),
    url:
      item.type === "book"
        ? readerUrl("book", item.id, c.page)
        : `/katalog/skripsi/${encodeURIComponent(item.id)}`,
    excerpt: c.text,
  }));

  return [...pdfSources.slice(0, 5), metadataSource];
}
