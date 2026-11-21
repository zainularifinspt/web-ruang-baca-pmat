import { read, utils } from "xlsx";
import { isCloudflareWorkerOrR2Url, resolveThesisPdfUrl } from "./thesis-pdf";

export const DEFAULT_THESIS_PDF_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1bhiL1iZ9U2s3A1EXIfw7d0lQAovclpIMsDAmRxkd8dw/export?format=csv&gid=0";

export type SheetThesisPdfInfo = {
  studentName: string;
  studentNim: string;
  pdfUrl: string;
  pdfR2?: string;
  pdfTanpaBab4?: string;
  pdfTotal?: string;
};

export type ThesisSheetPdfMap = {
  byNim: Map<string, SheetThesisPdfInfo>;
  byIdentity: Map<string, SheetThesisPdfInfo>;
  byName: Map<string, SheetThesisPdfInfo>;
  list: SheetThesisPdfInfo[];
};

type CacheEntry = {
  data: ThesisSheetPdfMap;
  cachedAt: number;
};

const SHEET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit
let inMemoryPdfSheetCache: CacheEntry | null = null;

export function clearThesisSheetPdfCache() {
  inMemoryPdfSheetCache = null;
}

export function normalizeIdentity(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeNim(value?: string | null): string {
  return (value ?? "").trim().replace(/\D/g, "");
}

export function thesisIdentityKey(normalizedName: string, normalizedNim: string): string {
  return `${normalizedName}|${normalizedNim}`;
}

export async function fetchThesisSheetPdfMap(options?: {
  forceFresh?: boolean;
}): Promise<ThesisSheetPdfMap> {
  const forceFresh = options?.forceFresh ?? false;

  if (
    !forceFresh &&
    inMemoryPdfSheetCache &&
    Date.now() - inMemoryPdfSheetCache.cachedAt < SHEET_CACHE_TTL_MS
  ) {
    return inMemoryPdfSheetCache.data;
  }

  const sheetUrl =
    process.env.THESIS_PDF_SHEET_URL || DEFAULT_THESIS_PDF_SHEET_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const fetchUrl = forceFresh
      ? `${sheetUrl}${sheetUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`
      : sheetUrl;

    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      ...(forceFresh
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate: 300,
              tags: ["public-catalog", "thesis-pdf-sheet"],
            },
          }),
      headers: {
        Accept: "text/csv, application/vnd.ms-excel, */*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const workbook = read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Spreadsheet PDF tidak memiliki sheet.");

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("Sheet pertama tidak ditemukan.");

    const rawRows = utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    if (!rawRows.length) {
      const emptyMap: ThesisSheetPdfMap = {
        byNim: new Map(),
        byIdentity: new Map(),
        byName: new Map(),
        list: [],
      };
      inMemoryPdfSheetCache = { data: emptyMap, cachedAt: Date.now() };
      return emptyMap;
    }

    const headerRow = looksLikeSpreadsheetHeader(rawRows[0]) ? rawRows[0] : undefined;
    const dataRows = headerRow ? rawRows.slice(1) : rawRows;
    const columns = resolveColumnIndexes(headerRow);

    const byNim = new Map<string, SheetThesisPdfInfo>();
    const byIdentity = new Map<string, SheetThesisPdfInfo>();
    const byName = new Map<string, SheetThesisPdfInfo>();
    const list: SheetThesisPdfInfo[] = [];

    for (const row of dataRows) {
      const studentName =
        columns.name >= 0 ? cellText(row, columns.name) : guessStudentName(row);
      const studentNim =
        columns.nim >= 0 ? cellText(row, columns.nim) : guessStudentNim(row);

      const rawPdfR2 =
        columns.pdfR2 >= 0
          ? cellText(row, columns.pdfR2)
          : row && row.length > 4
            ? cellText(row, 4)
            : "";
      const rawPdfTanpaBab4 =
        columns.pdfTanpaBab4 >= 0
          ? cellText(row, columns.pdfTanpaBab4)
          : cellText(row, 3);
      const rawPdfTotal =
        columns.pdfTotal >= 0
          ? cellText(row, columns.pdfTotal)
          : cellText(row, 2);

      const cleanedPdfR2 = cleanValidUrl(rawPdfR2);
      const cleanedPdfTanpaBab4 = cleanValidUrl(rawPdfTanpaBab4);
      const cleanedPdfTotal = cleanValidUrl(rawPdfTotal);

      // Prioritas pemilihan URL PDF:
      // 1. File PDF R2
      // 2. File PDF Tanpa Bab 4
      // 3. File PDF Total
      const selectedPdfUrl =
        cleanedPdfR2 || cleanedPdfTanpaBab4 || cleanedPdfTotal || "";

      if (!selectedPdfUrl && !studentName && !studentNim) {
        continue;
      }

      const info: SheetThesisPdfInfo = {
        studentName,
        studentNim,
        pdfUrl: selectedPdfUrl,
        pdfR2: cleanedPdfR2 || undefined,
        pdfTanpaBab4: cleanedPdfTanpaBab4 || undefined,
        pdfTotal: cleanedPdfTotal || undefined,
      };

      list.push(info);

      const normNim = normalizeNim(studentNim);
      const normName = normalizeIdentity(studentName);

      if (normNim) {
        byNim.set(normNim, info);
      }
      if (normName && normNim) {
        byIdentity.set(thesisIdentityKey(normName, normNim), info);
      }
      if (normName && !byName.has(normName)) {
        byName.set(normName, info);
      }
    }

    const resultMap: ThesisSheetPdfMap = { byNim, byIdentity, byName, list };
    inMemoryPdfSheetCache = { data: resultMap, cachedAt: Date.now() };
    return resultMap;
  } catch (error) {
    console.error("[thesis-sheet-pdf] Gagal membaca Google Sheet PDF:", error);
    if (inMemoryPdfSheetCache) {
      return inMemoryPdfSheetCache.data;
    }
    return {
      byNim: new Map(),
      byIdentity: new Map(),
      byName: new Map(),
      list: [],
    };
  }
}

export function findThesisPdfInMap(
  sheetMap: ThesisSheetPdfMap,
  studentNim?: string | null,
  studentName?: string | null,
): SheetThesisPdfInfo | undefined {
  const normNim = normalizeNim(studentNim);
  const normName = normalizeIdentity(studentName);

  if (normNim && sheetMap.byNim.has(normNim)) {
    return sheetMap.byNim.get(normNim);
  }

  if (normName && normNim) {
    const key = thesisIdentityKey(normName, normNim);
    if (sheetMap.byIdentity.has(key)) {
      return sheetMap.byIdentity.get(key);
    }
  }

  if (normName && sheetMap.byName.has(normName)) {
    return sheetMap.byName.get(normName);
  }

  return undefined;
}

function cleanValidUrl(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//")
  ) {
    return trimmed;
  }
  return "";
}

function cellText(row: unknown[] | undefined, index: number): string {
  const value = row?.[index];
  return value === undefined || value === null ? "" : value.toString().trim();
}

function looksLikeSpreadsheetHeader(row: unknown[] | undefined): boolean {
  if (!row?.length) return false;

  const text = row
    .map((val) =>
      val === undefined || val === null ? "" : val.toString().trim().toLowerCase(),
    )
    .filter(Boolean)
    .join(" ");

  return (
    /\b(nim|nama|judul|skripsi|pdf|file|r2)\b/.test(text) &&
    !/^https?:\/\//i.test(cellText(row, 0)) &&
    !/^https?:\/\//i.test(cellText(row, 1))
  );
}

function resolveColumnIndexes(row: unknown[] | undefined) {
  const labels = (row ?? []).map((val) =>
    val === undefined || val === null ? "" : val.toString().trim().toLowerCase(),
  );

  return {
    name: labels.findIndex((label) =>
      ["nama", "nama mahasiswa", "student_name", "nama lengkap"].includes(label),
    ),
    nim: labels.findIndex((label) =>
      ["nim", "nim/nip", "student_nim", "nim_nip"].includes(label),
    ),
    pdfR2: labels.findIndex((label) =>
      [
        "file pdf r2",
        "file pdf r2 (cloudflare)",
        "file pdf cloudflare",
        "pdf r2",
        "pdf_r2",
        "r2",
        "cloudflare",
      ].includes(label),
    ),
    pdfTanpaBab4: labels.findIndex((label) =>
      [
        "file pdf tanpa bab 4",
        "file pdf tanpa bab iv",
        "pdf tanpa bab 4",
        "pdf tanpa bab iv",
        "tanpa bab 4",
        "tanpa bab iv",
      ].includes(label),
    ),
    pdfTotal: labels.findIndex((label) =>
      [
        "file pdf total",
        "file pdf full",
        "pdf total",
        "pdf full",
        "file skripsi pdf",
        "pdf_url",
      ].includes(label),
    ),
  };
}

function guessStudentName(row: unknown[] | undefined): string {
  const cells = (row ?? []).slice(0, 3).map((_, idx) => cellText(row, idx));
  const candidates = cells.filter(
    (val) =>
      val &&
      !/^https?:\/\//i.test(val) &&
      !/^\d+$/.test(val.replace(/\D/g, "")) &&
      /[a-z]/i.test(val),
  );
  return candidates[candidates.length - 1] ?? "";
}

function guessStudentNim(row: unknown[] | undefined): string {
  const cells = (row ?? []).slice(0, 3).map((_, idx) => cellText(row, idx));
  return cells.find((val) => normalizeNim(val).length >= 6) ?? "";
}
