import type { ScopusArticle, ScopusSearchResponse, ScopusSearchSnapshot } from "./scopus";

// Offset pagination in Scopus Search is limited to the first 5,000 records.
export const SCOPUS_EXPORT_LIMIT = 5000;
export type ScopusExportScope = "selected" | "page" | "all";
export type ScopusExportFormat = "xlsx" | "csv" | "ris";
export const SCOPUS_EXPORT_GROUPS = [
  { id: "citation", label: "Identitas & sitasi", description: "Informasi utama untuk mengenali dan mengutip artikel." },
  { id: "publication", label: "Informasi publikasi", description: "Jurnal, pengenal serial, afiliasi, dan akses dokumen." },
  { id: "abstract", label: "Abstrak & kata kunci", description: "Dilengkapi melalui metadata artikel jika akses API tersedia." },
  { id: "screening", label: "Persiapan SLR", description: "Kolom kerja yang diisi oleh peneliti, tersedia di Excel/CSV." },
] as const;

export const SCOPUS_EXPORT_FIELDS = [
  { id: "rowNumber", label: "No", group: "screening", ris: false },
  { id: "title", label: "Judul", group: "citation" },
  { id: "authors", label: "Penulis", group: "citation" },
  { id: "authorSource", label: "Sumber metadata penulis", group: "publication" },
  { id: "year", label: "Tahun", group: "citation" },
  { id: "journal", label: "Jurnal / sumber", group: "citation" },
  { id: "doi", label: "DOI", group: "citation" },
  { id: "eid", label: "EID Scopus", group: "citation" },
  { id: "issn", label: "ISSN", group: "publication" },
  { id: "eIssn", label: "eISSN", group: "publication" },
  { id: "sourceId", label: "Source ID", group: "publication" },
  { id: "pubmedId", label: "PubMed ID", group: "publication" },
  { id: "volume", label: "Volume", group: "citation" },
  { id: "issue", label: "Nomor terbitan", group: "citation" },
  { id: "pages", label: "Halaman / nomor artikel", group: "citation" },
  { id: "articleNumber", label: "Nomor artikel", group: "publication" },
  { id: "coverDate", label: "Tanggal publikasi", group: "publication" },
  { id: "subtypeDescription", label: "Jenis dokumen", group: "citation" },
  { id: "aggregationType", label: "Jenis sumber", group: "publication" },
  { id: "publicationStage", label: "Tahap publikasi", group: "publication" },
  { id: "sourceAbbreviation", label: "Singkatan nama sumber", group: "publication" },
  { id: "publisher", label: "Penerbit", group: "publication" },
  { id: "language", label: "Bahasa publikasi", group: "publication" },
  { id: "citedByCount", label: "Jumlah sitasi", group: "citation" },
  { id: "openAccess", label: "Open access", group: "publication" },
  { id: "affiliations", label: "Afiliasi", group: "publication" },
  { id: "abstract", label: "Abstrak", group: "abstract" },
  { id: "keywords", label: "Kata kunci", group: "abstract" },
  { id: "indexedKeywords", label: "Kata kunci terindeks", group: "abstract" },
  { id: "doiUrl", label: "Tautan DOI", group: "citation" },
  { id: "scopusUrl", label: "Tautan Scopus", group: "citation" },
  { id: "screeningDecision", label: "Keputusan screening", group: "screening", ris: false },
  { id: "exclusionReason", label: "Alasan eksklusi", group: "screening", ris: false },
  { id: "reviewer", label: "Reviewer", group: "screening", ris: false },
  { id: "notes", label: "Catatan", group: "screening", ris: false },
] as const;

export type ScopusExportFieldId = typeof SCOPUS_EXPORT_FIELDS[number]["id"];
export type ScopusExportSettings = { fields?: ScopusExportFieldId[]; includeSearchLog?: boolean };
export const SCOPUS_CITATION_FIELDS: ScopusExportFieldId[] = SCOPUS_EXPORT_FIELDS.filter((field) => field.group === "citation").map((field) => field.id);
export const SCOPUS_SLR_FIELDS: ScopusExportFieldId[] = [...SCOPUS_CITATION_FIELDS, "issn", "eIssn", "authorSource", "abstract", "keywords", "rowNumber", "screeningDecision", "exclusionReason", "reviewer", "notes"];

export function getScopusExportFields(settings: ScopusExportSettings = {}, format: ScopusExportFormat = "xlsx") {
  const requested = settings.fields ?? SCOPUS_EXPORT_FIELDS.map((field) => field.id);
  return SCOPUS_EXPORT_FIELDS.filter((field) => requested.includes(field.id) && (format !== "ris" || !("ris" in field && field.ris === false)));
}

export function scopusArticleNeedsMetadata(article: ScopusArticle, fields: ScopusExportFieldId[]) {
  return fields.some((field) => {
    if (field === "authors") return !article.authorNames?.length || article.authorSource === "creator";
    if (["abstract", "keywords", "indexedKeywords", "publisher", "language", "publicationStage", "sourceAbbreviation"].includes(field)) {
      const value = article[field as keyof ScopusArticle];
      return !value || (Array.isArray(value) && value.length === 0);
    }
    return false;
  });
}

export type ScopusExportMetadata = {
  search: ScopusSearchSnapshot;
  scope: ScopusExportScope;
  totalResults: number;
  retrievedCount: number;
  exportedAt: string;
  settings?: ScopusExportSettings;
  metadataWarnings?: string[];
};

export function scopusSearchIdentity(search: {
  query: string | null;
  queryMode?: "basic" | "advanced";
  searchField?: string;
  year?: string;
  language?: string;
  docType?: string;
  openAccessOnly?: boolean;
}) {
  if (search.queryMode === "advanced") return JSON.stringify([search.query, "advanced"]);
  return JSON.stringify([search.query, "basic", search.searchField ?? "title", search.year ?? "all", search.language ?? "all", search.docType ?? "all", search.openAccessOnly ?? false]);
}

export function assertScopusExportable(data: ScopusSearchResponse): asserts data is ScopusSearchResponse & { search: ScopusSearchSnapshot } {
  if (data.isDemo) throw new Error("Data simulasi tidak dapat diekspor untuk penelitian. Hubungkan Scopus lalu ulangi pencarian.");
  if (!data.search) throw new Error("Catatan pencarian belum tersedia. Silakan ulangi pencarian.");
}

export function deduplicateScopusArticles(articles: ScopusArticle[]) {
  const ids = new Set<string>();
  const dois = new Set<string>();
  return articles.filter((article) => {
    const id = article.eid || article.id;
    const doi = article.doi?.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").toLowerCase();
    if (ids.has(id) || (doi && dois.has(doi))) return false;
    ids.add(id);
    if (doi) dois.add(doi);
    return true;
  });
}

/** Nothing is downloaded if a page fails, changes query, or becomes simulated. */
export async function collectAllScopusArticles(
  initial: ScopusSearchResponse,
  fetchPage: (page: number, signal: AbortSignal) => Promise<ScopusSearchResponse>,
  signal: AbortSignal,
  onProgress: (retrieved: number, total: number) => void,
) {
  assertScopusExportable(initial);
  if (initial.totalResults > SCOPUS_EXPORT_LIMIT) throw new Error("Ekspor seluruh hasil dibatasi 5.000 artikel. Persempit pencarian dengan filter tahun atau jenis dokumen.");
  const total = initial.totalResults;
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Tidak ada artikel untuk diekspor.");
  const articles: ScopusArticle[] = [];
  const pageSignatures = new Set<string>();
  const pages = Math.ceil(total / initial.pageSize);
  onProgress(0, total);
  for (let page = 1; page <= pages; page++) {
    signal.throwIfAborted();
    const result = initial.page === page ? initial : await fetchPage(page, signal);
    signal.throwIfAborted();
    assertScopusExportable(result);
    if (result.search.executedQuery !== initial.search.executedQuery || result.search.sort !== initial.search.sort || result.totalResults !== total || result.page !== page || result.pageSize !== initial.pageSize) {
      throw new Error("Hasil pencarian berubah saat ekspor. Ulangi pencarian agar data dan catatannya konsisten.");
    }
    const expected = Math.min(initial.pageSize, total - articles.length);
    const signature = result.articles.map((article) => article.eid || article.id).sort().join("|");
    if (result.articles.length !== expected || pageSignatures.has(signature)) {
      throw new Error("Scopus mengembalikan halaman yang tidak lengkap atau berulang. Tidak ada file yang diunduh; silakan coba lagi.");
    }
    pageSignatures.add(signature);
    articles.push(...result.articles);
    onProgress(articles.length, total);
  }
  return articles;
}

const scopeLabels: Record<ScopusExportScope, string> = {
  selected: "Artikel terpilih lintas halaman",
  page: "Halaman aktif",
  all: "Seluruh hasil pencarian",
};

export function scopusExportLog(metadata: ScopusExportMetadata, exportedCount: number) {
  const { search } = metadata;
  return {
    "Sumber data": "Scopus (Elsevier)",
    "Kata kunci asli": search.query,
    "Query Scopus yang dijalankan": search.executedQuery,
    "Mode pencarian": search.queryMode === "advanced" ? "Advanced query" : "Pencarian biasa",
    "Kolom yang dipilih": getScopusExportFields(metadata.settings).map((field) => field.label).join("; "),
    "Keterangan metadata tambahan": metadata.metadataWarnings?.join("; ") || "Tidak ada peringatan",
    "Cakupan pencarian": search.queryMode === "advanced" ? "Sesuai advanced query" : search.searchField === "all" ? "Judul, abstrak, dan kata kunci" : search.searchField === "author" ? "Nama penulis" : "Judul",
    "Filter tahun": search.year,
    "Filter bahasa": search.language,
    "Filter jenis dokumen": search.docType,
    "Hanya open access": search.openAccessOnly ? "Ya" : "Tidak",
    "Urutan": search.sort,
    "Waktu pencarian (UTC)": search.searchedAt,
    "Waktu ekspor (UTC)": metadata.exportedAt,
    "Cakupan ekspor": scopeLabels[metadata.scope],
    "Total hasil pencarian": metadata.totalResults,
    "Artikel dikumpulkan": metadata.retrievedCount,
    "Artikel diekspor": exportedCount,
    "Duplikat dihapus (EID/DOI)": metadata.retrievedCount - exportedCount,
    "Status pengambilan": "Selesai untuk cakupan ekspor yang dipilih",
    "Ketersediaan metadata": "Abstrak, kata kunci, dan penulis disertakan sesuai ketersediaan sumber. STANDARD Scopus dapat hanya memuat penulis pertama; penulis dilengkapi lewat Crossref bila DOI tersedia. Kolom kosong berarti data belum tersedia.",
    "Catatan screening": "Keputusan screening, alasan eksklusi, reviewer, dan catatan diisi oleh peneliti.",
  };
}

function articleValue(article: ScopusArticle, id: ScopusExportFieldId, index: number): string | number {
  if (id === "rowNumber") return index + 1;
  if (["screeningDecision", "exclusionReason", "reviewer", "notes"].includes(id)) return "";
  if (id === "authors") return article.authorNames?.join("; ") || (article.authors === "Peneliti Scopus" ? "" : article.authors);
  if (id === "authorSource") return article.authorSource === "creator" ? "Scopus (penulis pertama; belum lengkap)" : article.authorSource === "crossref" ? "Crossref" : article.authorSource === "scopus" ? "Scopus (sesuai data yang tersedia)" : "Belum tersedia";
  if (id === "openAccess") return article.openAccess == null ? "Belum tersedia" : article.openAccess ? "Ya" : "Tidak";
  const value = article[id as keyof ScopusArticle];
  return Array.isArray(value) ? value.join("; ") : typeof value === "number" ? value : String(value ?? "");
}

function articleRows(articles: ScopusArticle[], settings?: ScopusExportSettings) {
  const fields = getScopusExportFields(settings);
  if (!fields.length) throw new Error("Pilih minimal satu kolom untuk diekspor.");
  return articles.map((article, index) => Object.fromEntries(fields.map((field) => [field.label, articleValue(article, field.id, index)])));
}

// CSV fields are quoted and formula-like text is neutralized before opening in Excel.
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function generateScopusCsv(articles: ScopusArticle[], metadata: ScopusExportMetadata) {
  const log = scopusExportLog(metadata, articles.length);
  const rows = articleRows(articles, metadata.settings).map((article) => ({ ...article, ...(metadata.settings?.includeSearchLog === false ? {} : log) }));
  if (!rows.length) throw new Error("Tidak ada artikel untuk diekspor.");
  return "\uFEFF" + [Object.keys(rows[0]), ...rows.map((row) => Object.values(row))]
    .map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function risText(value: string) {
  return value.replace(/[\r\n\u0000-\u001f]+/g, " ").trim();
}

export function generateScopusRis(articles: ScopusArticle[], metadata: ScopusExportMetadata) {
  const fields = getScopusExportFields(metadata.settings, "ris");
  if (!fields.length) throw new Error("Pilih minimal satu kolom referensi untuk RIS.");
  const selected = new Set<string>(fields.map((field) => field.id));
  return articles.map((article) => {
    const docType = article.subtypeDescription.toLowerCase();
    const type = docType.includes("conference") ? "CONF" : docType.includes("chapter") ? "CHAP" : docType === "book" ? "BOOK" : "JOUR";
    const lines: string[] = [];
    const add = (tag: string, value?: string) => { if (value?.trim()) lines.push(`${tag}  - ${risText(value)}`); };
    add("TY", type);
    const tags: Partial<Record<ScopusExportFieldId, string>> = { title: "TI", year: "PY", journal: "T2", volume: "VL", issue: "IS", doi: "DO", eid: "ID", issn: "SN", eIssn: "SN", publisher: "PB", language: "LA", abstract: "AB", pubmedId: "AN" };
    for (const field of fields) {
      if (tags[field.id]) add(tags[field.id]!, String(articleValue(article, field.id, 0)));
      else if (field.id === "authors") for (const name of article.authorNames ?? []) add("AU", name);
      else if (field.id === "keywords" || field.id === "indexedKeywords") for (const word of article[field.id] ?? []) add("KW", word);
      else if (field.id === "affiliations") for (const affiliation of article.affiliations) add("AD", affiliation);
      else if (field.id === "coverDate") add("DA", article.coverDate.replace(/-/g, "/"));
      else if (field.id === "pages") {
        const pages = article.pages?.split(/\s*[-–—]\s*/);
        add("SP", pages?.[0]);
        if (pages?.length === 2) add("EP", pages[1]);
      } else if (field.id === "doiUrl" || field.id === "scopusUrl") add("UR", article[field.id]);
      else {
        const value = String(articleValue(article, field.id, 0));
        if (value) add("N1", `${field.label}: ${value}`);
      }
    }
    if (metadata.settings?.includeSearchLog !== false) {
      add("DB", "Scopus");
      add("N1", `Query: ${metadata.search.executedQuery}; pencarian (UTC): ${metadata.search.searchedAt}; ekspor (UTC): ${metadata.exportedAt}; cakupan: ${scopeLabels[metadata.scope]}`);
      for (const warning of metadata.metadataWarnings ?? []) add("N1", warning);
      if (selected.has("authors") && article.authorSource === "creator") add("N1", "Metadata penulis belum lengkap: hanya penulis pertama tersedia di Scopus STANDARD.");
    }
    lines.push("ER  - ");
    return lines.join("\r\n");
  }).join("\r\n\r\n") + "\r\n";
}

export async function createScopusExport(articles: ScopusArticle[], metadata: ScopusExportMetadata, format: ScopusExportFormat): Promise<{ content: BlobPart; mime: string }> {
  if (!articles.length) throw new Error("Tidak ada artikel untuk diekspor.");
  if (format === "csv") return { content: generateScopusCsv(articles, metadata), mime: "text/csv;charset=utf-8" };
  if (format === "ris") return { content: generateScopusRis(articles, metadata), mime: "application/x-research-info-systems;charset=utf-8" };
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(articleRows(articles, metadata.settings));
  sheet["!cols"] = Object.keys(articleRows(articles.slice(0, 1), metadata.settings)[0]).map((key) => ({ wch: key === "Judul" || key === "Abstrak" ? 65 : key === "Penulis" ? 40 : 24 }));
  sheet["!autofilter"] = { ref: sheet["!ref"]! };
  const hasScreening = getScopusExportFields(metadata.settings).some((field) => field.group === "screening");
  XLSX.utils.book_append_sheet(workbook, sheet, hasScreening ? "Artikel & Screening" : "Artikel");
  if (metadata.settings?.includeSearchLog !== false) {
  const logSheet = XLSX.utils.aoa_to_sheet([["Informasi", "Nilai"], ...Object.entries(scopusExportLog(metadata, articles.length))]);
  logSheet["!cols"] = [{ wch: 34 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, logSheet, "Catatan Pencarian");
  }
  return { content: XLSX.write(workbook, { bookType: "xlsx", type: "array" }), mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
}
