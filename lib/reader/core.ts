import type {
  ReaderDocument,
  ReaderKind,
  SearchHit,
  ReaderChunk,
  ReaderSource,
} from "./types";

export const READER_POLICY = "public-v1-no-chapter-iv";
export function hasVerifiedCatalogSource(item: {
  id: string;
  readerSourceVerified?: boolean;
}) {
  return (
    item.readerSourceVerified !== false &&
    (!item.id.startsWith("ebk-") || item.readerSourceVerified === true)
  );
}
export function readerKey(kind: ReaderKind, id: string) {
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id))
    throw new Error("Identitas koleksi tidak valid.");
  return `${kind}-${id}`;
}
export function readerUrl(
  kind: ReaderKind,
  id: string,
  page?: number,
  revision?: string,
) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (revision) params.set("v", revision);
  return `/baca/${kind === "book" ? "buku" : "skripsi"}/${encodeURIComponent(id)}${params.size ? `?${params}` : ""}`;
}
export function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function queryTerms(query: string) {
  const stop = new Set([
    "apa",
    "yang",
    "dan",
    "di",
    "ke",
    "dari",
    "untuk",
    "ini",
    "itu",
    "nya",
    "saya",
    "ada",
    "tentang",
    "tolong",
    "cari",
    "carikan",
    "buku",
    "skripsi",
    "halaman",
    "berapa",
  ]);
  const all = normalizeText(query)
    .split(" ")
    .filter((w) => w.length > 1);
  return [
    ...new Set(
      all.filter((w) => !stop.has(w)).length
        ? all.filter((w) => !stop.has(w))
        : all,
    ),
  ];
}
export function hasPoorWordBoundaries(text: string) {
  return (text.match(/[A-Za-z]{24,}/g) || []).length >= 2;
}
export function snippet(text: string, query: string, length = 260) {
  const terms = queryTerms(query);
  const normalized = text.toLowerCase();
  const positions = terms
    .map((t) => normalized.indexOf(t))
    .filter((n) => n >= 0);
  const start = Math.max(
    0,
    (positions.length ? Math.min(...positions) : 0) - 65,
  );
  return `${start ? "…" : ""}${text.slice(start, start + length).trim()}${text.length > start + length ? "…" : ""}`;
}
export function searchPages(doc: ReaderDocument, query: string): SearchHit[] {
  const terms = queryTerms(query);
  const phrase = normalizeText(query);
  if (!phrase || !terms.length) return [];
  return doc.pages
    .flatMap<SearchHit>((page) => {
      const text = normalizeText(page.text);
      const found = terms.filter((t) => text.includes(t));
      if (
        !found.length ||
        (terms.length > 1 && found.length / terms.length < 0.5)
      )
        return [];
      const score =
        found.length / terms.length + (text.includes(phrase) ? 2 : 0);
      return [
        {
          page: page.number,
          label: page.label,
          excerpt: snippet(page.text, query),
          score,
          quality:
            page.quality === "poor" || hasPoorWordBoundaries(page.text)
              ? "poor"
              : page.quality,
          matches: page.words
            .filter((w) => terms.some((t) => normalizeText(w.text).includes(t)))
            .slice(0, 80),
        },
      ];
    })
    .sort((a, b) => b.score - a.score || a.page - b.page);
}
export function chunkPages(pages: ReaderDocument["pages"]): ReaderChunk[] {
  return pages.flatMap((page) => {
    if (page.quality === "poor" || page.quality === "image") return [];
    const words = page.text.split(/\s+/).filter(Boolean);
    const chunks: ReaderChunk[] = [];
    for (let start = 0; start < words.length; start += 260) {
      const text = words.slice(start, start + 300).join(" ");
      if (text.length >= 50)
        chunks.push({
          id: `p${page.number}-${start}`,
          page: page.number,
          text,
        });
      if (start + 300 >= words.length) break;
    }
    return chunks;
  });
}
export function cosine(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return dot / Math.sqrt(aa * bb || 1);
}
export function retrieveChunks(
  doc: ReaderDocument,
  query: string,
  embedding?: number[],
  page?: number,
) {
  const terms = queryTerms(query);
  const candidates = doc.chunks
    .filter((c) => !page || c.page === page)
    .map((c) => {
      const text = normalizeText(c.text);
      const lexical = terms.length
        ? terms.filter((t) => text.includes(t)).length / terms.length
        : 0;
      const semantic =
        embedding && c.embedding ? cosine(embedding, c.embedding) : 0;
      return {
        ...c,
        score: lexical + semantic,
        relevant: lexical >= 0.5 || semantic >= 0.84,
      };
    })
    .filter((c) => c.relevant)
    .sort((a, b) => b.score - a.score);
  return candidates.slice(0, 6);
}
const quoteText = (text: string) =>
  text.normalize("NFC").replace(/\s+/g, " ").trim();
export function validateAnswer(
  value: unknown,
  sources: ReaderSource[],
): { paragraphs: string[]; sources: ReaderSource[] } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { paragraphs?: unknown; citations?: unknown };
  if (
    !Array.isArray(v.paragraphs) ||
    v.paragraphs.length < 1 ||
    v.paragraphs.length > 2 ||
    !v.paragraphs.every(
      (p) =>
        typeof p === "string" &&
        p.trim() &&
        !/[\r\n\u2028\u2029]/.test(p) &&
        p.length <= 900,
    )
  )
    return null;
  const paragraphs = (v.paragraphs as string[]).map((p) => p.trim());
  if (paragraphs.join(" ").split(/\s+/).length > 160) return null;
  if (
    !Array.isArray(v.citations) ||
    !v.citations.length ||
    v.citations.length > 6
  )
    return null;
  const result: ReaderSource[] = [];
  for (const c of v.citations) {
    if (
      !c ||
      typeof c !== "object" ||
      typeof c.id !== "string" ||
      typeof c.quote !== "string" ||
      c.quote.trim().length < 20
    )
      return null;
    const source = sources.find((s) => s.id === c.id);
    if (!source || !quoteText(source.excerpt).includes(quoteText(c.quote)))
      return null;
    if (!result.some((s) => s.id === source.id))
      result.push({ ...source, excerpt: c.quote.trim() });
  }
  if (paragraphs.some((p) => /https?:\/\/|<\/?[a-z][^>]*>|\]\(/i.test(p)))
    return null;
  const pageClaims = [
    ...paragraphs.join(" ").matchAll(/(?:halaman|hlm\.?)\s*(\d+)/gi),
  ].map((m) => m[1]);
  if (
    pageClaims.some(
      (n) => !result.some((s) => String(s.page) === n || s.label === n),
    )
  )
    return null;
  return { paragraphs, sources: result };
}
