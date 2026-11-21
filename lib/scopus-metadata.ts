import type { ScopusArticle } from "./scopus";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function list(value: unknown): unknown[] { return value == null ? [] : Array.isArray(value) ? value : [value]; }
function content(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(content).filter(Boolean).join("\n");
  const record = object(value);
  if (record.$ != null) return content(record.$);
  return Object.entries(record).filter(([key]) => !key.startsWith("@")).map(([, entry]) => content(entry)).filter(Boolean).join("\n");
}

/** Maps documented Abstract Retrieval JSON; omitted properties never overwrite known data. */
export function parseScopusMetadata(payload: unknown): Partial<ScopusArticle> {
  const root = object(object(payload)["abstracts-retrieval-response"]);
  const core = object(root.coredata);
  const head = object(object(object(root.item).bibrecord).head);
  const source = object(head.source);
  const result: Partial<ScopusArticle> = {};
  const abstract = content(core["dc:description"]) || content(head.abstracts);
  if (abstract) result.abstract = abstract;
  const keywords = list(object(root.authkeywords)["author-keyword"]).map(content).filter(Boolean);
  if (keywords.length) result.keywords = [...new Set(keywords)];
  const indexedKeywords = list(object(root.idxterms).mainterm).map(content).filter(Boolean);
  if (indexedKeywords.length) result.indexedKeywords = [...new Set(indexedKeywords)];
  const authorNames = list(object(root.authors).author).map((value) => {
    const author = object(value);
    const preferred = object(author["preferred-name"]);
    const family = content(preferred["ce:surname"]) || content(author["ce:surname"]);
    const given = content(preferred["ce:given-name"]) || content(author["ce:given-name"]) || content(author["ce:initials"]);
    return family ? [family, given].filter(Boolean).join(", ") : content(author["ce:indexed-name"]);
  }).filter(Boolean);
  if (authorNames.length) {
    result.authorNames = authorNames;
    result.authors = authorNames.join("; ");
    result.authorSource = "scopus";
  }
  const language = content(object(root.language)["@xml:lang"]) || content(object(object(head["citation-info"])["citation-language"])["@xml:lang"]);
  if (language) result.language = language;
  const publisher = content(core["dc:publisher"]) || content(object(source.publisher).publishername);
  if (publisher) result.publisher = publisher;
  const sourceAbbreviation = content(source["sourcetitle-abbrev"]);
  if (sourceAbbreviation) result.sourceAbbreviation = sourceAbbreviation;
  const publicationStage = content(core.pubstage);
  if (publicationStage) result.publicationStage = publicationStage;
  return result;
}

const metadataViews = ["FULL", "META_ABS", "META"] as const;
type MetadataView = typeof metadataViews[number];
const viewCache = new Map<string, { view: MetadataView; expiresAt: number }>();

export async function fetchScopusMetadata(eid: string, signal: AbortSignal): Promise<{ article?: Partial<ScopusArticle>; unavailable?: boolean; warning?: string }> {
  const apiKey = process.env.SCOPUS_API_KEY?.trim();
  if (!apiKey) return { unavailable: true, warning: "Scopus belum terhubung untuk mengambil metadata tambahan." };
  const headers: Record<string, string> = { Accept: "application/json", "X-ELS-APIKey": apiKey };
  if (process.env.SCOPUS_INST_TOKEN?.trim()) headers["X-ELS-Insttoken"] = process.env.SCOPUS_INST_TOKEN.trim();
  const url = new URL(`https://api.elsevier.com/content/abstract/eid/${encodeURIComponent(eid)}`);
  const cacheKey = `${apiKey}:${headers["X-ELS-Insttoken"] ?? ""}`;
  const cached = viewCache.get(cacheKey);
  const views = cached && cached.expiresAt > Date.now() ? metadataViews.slice(metadataViews.indexOf(cached.view)) : metadataViews;
  let response: Response | undefined;
  let successfulView: MetadataView = "FULL";
  for (const view of views) {
    signal.throwIfAborted();
    url.searchParams.set("view", view);
    response = await fetch(url, { headers, signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]), next: { revalidate: 86400 } });
    if ([401, 403].includes(response.status)) continue;
    successfulView = view;
    break;
  }
  if (!response || [401, 403, 429].includes(response.status)) return {
    unavailable: true,
    warning: response?.status === 429 ? "Kuota metadata tambahan Scopus sedang terbatas. Kolom yang belum tersedia dibiarkan kosong." : "Akses metadata lengkap Scopus tidak tersedia untuk koneksi ini. Kolom yang belum tersedia dibiarkan kosong.",
  };
  if (response.status === 404) return { warning: "Metadata tambahan sebagian artikel tidak ditemukan di Scopus." };
  if (!response.ok) throw new Error("Gagal mengambil metadata tambahan Scopus. Silakan ulangi ekspor.");
  const payload = await response.json();
  const root = object(payload["abstracts-retrieval-response"]);
  const core = object(root.coredata);
  if (!root.coredata || (root.eid && root.eid !== eid) || (core["dc:identifier"] && String(core["dc:identifier"]).replace("SCOPUS_ID:", "") !== eid.split("-").at(-1))) {
    throw new Error("Identitas metadata Scopus tidak cocok. Ulangi ekspor untuk menjaga konsistensi data.");
  }
  if (viewCache.size > 20) viewCache.clear();
  viewCache.set(cacheKey, { view: successfulView, expiresAt: Date.now() + 15 * 60 * 1000 });
  return {
    article: parseScopusMetadata(payload),
    warning: successfulView !== "FULL" ? "Koneksi Scopus hanya menyediakan sebagian metadata artikel. Abstrak atau kata kunci yang tidak tersedia dibiarkan kosong." : undefined,
  };
}
