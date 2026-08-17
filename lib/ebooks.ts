import {
  extractGoogleDriveFileId,
  getGoogleDriveDownloadUrl,
  getGoogleDriveThumbnailUrl,
} from "@/lib/google-drive";
import type { Book } from "@/lib/types";

export const DEFAULT_EBOOK_API_URL =
  "https://script.google.com/macros/s/AKfycbyn1f0YKEvvSVvzr_hrtgW86LlvGn92JEP-LIpKZ1oQ2OR_lrstVJyfnrmL0PNkjguAAw/exec";

type RawEbookItem = Record<string, unknown>;

type EbookApiResponse = {
  success?: boolean;
  count?: number;
  data?: RawEbookItem[];
};

export async function fetchEbooksFromApi(): Promise<{
  ebooks: Book[];
  error?: string;
}> {
  const apiUrl =
    process.env.EBOOK_API_URL ||
    process.env.NEXT_PUBLIC_EBOOK_API_URL ||
    DEFAULT_EBOOK_API_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const fetchUrl = `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const payload = (await response.json()) as EbookApiResponse | RawEbookItem[];
    let rawItems: RawEbookItem[] = [];

    if (Array.isArray(payload)) {
      rawItems = payload;
    } else if (payload && Array.isArray(payload.data)) {
      rawItems = payload.data;
    } else if (payload && typeof payload === "object") {
      // Cari array di properti manapun (misal: records, items, books)
      const potentialArray = Object.values(payload).find(Array.isArray);
      if (potentialArray) {
        rawItems = potentialArray as RawEbookItem[];
      }
    }

    if (!rawItems.length) {
      return { ebooks: getFallbackEbooks(), error: undefined };
    }

    const ebooks = rawItems.map((item, index) => mapRawEbookToBook(item, index));
    return { ebooks, error: undefined };
  } catch (error) {
    console.error("[ebooks] Gagal memuat e-book dari API, menggunakan fallback dataset:", error);
    return {
      ebooks: getFallbackEbooks(),
      error: error instanceof Error ? error.message : "Gagal memuat API E-Book",
    };
  }
}

function mapRawEbookToBook(item: RawEbookItem, index: number): Book {
  // Ambil judul dengan berbagai kemungkinan nama properti
  const title = String(
    item.judul ??
      item["Judul Final"] ??
      item.judul_final ??
      item.title ??
      item.Judul ??
      `E-Book Referensi Matematika ${index + 1}`,
  ).trim();

  // Ambil penulis
  const rawAuthor = String(
    item.penulis ??
      item["Penulis Final"] ??
      item.penulis_final ??
      item.author ??
      item.Penulis ??
      "",
  ).trim();
  const author = rawAuthor || "Pendidikan Matematika FKIP ULM";

  // Ambil kategori / mata kuliah langsung dari spreadsheet
  const rawCategory = String(
    item.mataKuliah ??
      item["Kategori/MK"] ??
      item.kategori_mk ??
      item.kategori ??
      item.category ??
      item.MataKuliah ??
      "",
  ).trim();
  const category = rawCategory || "-";

  // Ambil cover URL
  const rawCover = String(
    item.cover ??
      item["Cover Final URL"] ??
      item.cover_final_url ??
      item.coverUrl ??
      item.image ??
      "",
  ).trim();
  const coverUrl = rawCover ? getGoogleDriveThumbnailUrl(rawCover, 800) : undefined;

  // Ambil link PDF
  const rawPdf = String(
    item.pdf ??
      item["URL PDF"] ??
      item.url_pdf ??
      item.pdfUrl ??
      item.link_pdf ??
      item.drive_url ??
      "",
  ).trim();

  const fileId = extractGoogleDriveFileId(rawPdf);
  const id = fileId ? `ebk-${fileId}` : `ebk-${index + 1}`;
  const downloadUrl = rawPdf ? getGoogleDriveDownloadUrl(rawPdf) : undefined;

  const keywords = [
    ...title.toLowerCase().split(/\s+/),
    ...author.toLowerCase().split(/\s+/),
    category.toLowerCase(),
    "ebook",
    "e-book",
    "buku digital",
    "pdf",
  ].filter((w) => w.length > 2);

  return {
    id,
    type: "book",
    title,
    author,
    publisher: "Koleksi E-Book Digital Ruang Baca PMat",
    category,
    rackLocation: "Digital / E-Library",
    location: "Google Drive Reader",
    stock: 1,
    available: 1,
    isbn: "-",
    code: `EBK-${(index + 1).toString().padStart(3, "0")}`,
    coverUrl,
    pdfUrl: rawPdf || undefined,
    downloadUrl,
    isEbook: true,
    status: "tersedia",
    inputSource: "Impor",
    inputBy: "API E-Book Ruang Baca",
    verificationStatus: "approved",
    keywords: Array.from(new Set(keywords)),
    createdAt: new Date(2026, 0, 1 + index).toISOString(),
    notes: "Dokumen elektronik tersedia dalam bentuk file PDF via Google Drive Viewer.",
    year: 2024,
  };
}

function inferCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("abstract algebra") || lower.includes("aljabar abstrak") || lower.includes("first course in abstract")) {
    return "Aljabar Abstrak";
  }
  if (lower.includes("matrices") || lower.includes("matriks") || lower.includes("linear")) {
    return "Aljabar Linear & Matriks";
  }
  if (lower.includes("real analysis") || lower.includes("analisis real") || lower.includes("calculus on the real")) {
    return "Analisis Real";
  }
  if (lower.includes("complex") || lower.includes("kompleks")) {
    return "Analisis Kompleks";
  }
  if (lower.includes("multivariate") || lower.includes("statist") || lower.includes("probability") || lower.includes("peluang")) {
    return "Statistika & Peluang";
  }
  if (lower.includes("geometri") || lower.includes("geometry") || lower.includes("lukis")) {
    return "Geometri Lukis";
  }
  if (lower.includes("fuzzy") || lower.includes("control") || lower.includes("terapan")) {
    return "Matematika Terapan";
  }
  if (lower.includes("textbook") || lower.includes("bahan ajar")) {
    return "Buku Ajar Matematika";
  }
  return "Matematika";
}

export function getFallbackEbooks(): Book[] {
  return [
    {
      id: "ebk-1hGAcZ7TI9hxdB95qi_t2w_T8RyWdfSXJ",
      type: "book",
      title: "Textbook of Mathematics & Educational Foundations",
      author: "Pendidikan Matematika FKIP ULM",
      publisher: "Koleksi E-Book Digital Ruang Baca PMat",
      category: "Buku Ajar",
      rackLocation: "Digital / E-Library",
      location: "Google Drive Reader",
      stock: 1,
      available: 1,
      isbn: "-",
      code: "EBK-001",
      coverUrl: "https://drive.google.com/thumbnail?id=1hGAcZ7TI9hxdB95qi_t2w_T8RyWdfSXJ&sz=w800",
      pdfUrl: "https://drive.google.com/file/d/1ANZ3Q1J0rA2mV3iPqJ3TGehW9UbWvB0g/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1ANZ3Q1J0rA2mV3iPqJ3TGehW9UbWvB0g",
      isEbook: true,
      status: "tersedia",
      inputSource: "Impor",
      inputBy: "API E-Book Ruang Baca",
      verificationStatus: "approved",
      keywords: ["textbook", "matematika", "ebook", "digital"],
      createdAt: "2026-01-01T00:00:00.000Z",
      year: 2024,
    },
    {
      id: "ebk-14CxT2hRBwegleQRWWchsxbV6-ANkk56H",
      type: "book",
      title: "A First Course in Abstract Algebra",
      author: "John B. Fraleigh (7th Edition)",
      publisher: "Pearson / Addison-Wesley",
      category: "Aljabar",
      rackLocation: "Digital / E-Library",
      location: "Google Drive Reader",
      stock: 1,
      available: 1,
      isbn: "978-0201763904",
      code: "EBK-002",
      coverUrl: "https://drive.google.com/thumbnail?id=1ivHpjrJeDJviVK1X8TSu-0mHMtF3OnSL&sz=w800",
      pdfUrl: "https://drive.google.com/file/d/14CxT2hRBwegleQRWWchsxbV6-ANkk56H/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=14CxT2hRBwegleQRWWchsxbV6-ANkk56H",
      isEbook: true,
      status: "tersedia",
      inputSource: "Impor",
      inputBy: "API E-Book Ruang Baca",
      verificationStatus: "approved",
      keywords: ["abstract", "algebra", "fraleigh", "aljabar", "struktur"],
      createdAt: "2026-01-02T00:00:00.000Z",
      year: 2023,
    },
    {
      id: "ebk-1jCR5dXNbOIrGQy_N-mXAzVDb3wxo_2QW",
      type: "book",
      title: "Problems in Real Analysis: Advanced Calculus on the Real Axis",
      author: "Titu Andreescu (Springer 2009)",
      publisher: "Springer",
      category: "Analisis Matematika",
      rackLocation: "Digital / E-Library",
      location: "Google Drive Reader",
      stock: 1,
      available: 1,
      isbn: "978-0387772042",
      code: "EBK-003",
      coverUrl: "https://drive.google.com/thumbnail?id=11Ald3uND3uo0LzXd0rLP8hYTnLlwTt-l&sz=w800",
      pdfUrl: "https://drive.google.com/file/d/1jCR5dXNbOIrGQy_N-mXAzVDb3wxo_2QW/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1jCR5dXNbOIrGQy_N-mXAzVDb3wxo_2QW",
      isEbook: true,
      status: "tersedia",
      inputSource: "Impor",
      inputBy: "API E-Book Ruang Baca",
      verificationStatus: "approved",
      keywords: ["real", "analysis", "andreescu", "calculus", "analisis"],
      createdAt: "2026-01-03T00:00:00.000Z",
      year: 2022,
    },
    {
      id: "ebk-1Fx9f68zsuWPIsoisRjFjTrME6vU4bpkI",
      type: "book",
      title: "Introduction to Real Analysis",
      author: "Robert G. Bartle & Donald R. Sherbert (Edisi 4)",
      publisher: "John Wiley & Sons",
      category: "Analisis Matematika",
      rackLocation: "Digital / E-Library",
      location: "Google Drive Reader",
      stock: 1,
      available: 1,
      isbn: "978-0471433316",
      code: "EBK-004",
      coverUrl: "https://drive.google.com/thumbnail?id=1xxTqYu-Q0hQvaz-GN0_m9jPrareScgu-&sz=w800",
      pdfUrl: "https://drive.google.com/file/d/1Fx9f68zsuWPIsoisRjFjTrME6vU4bpkI/view?usp=drivesdk",
      downloadUrl: "https://drive.google.com/uc?export=download&id=1Fx9f68zsuWPIsoisRjFjTrME6vU4bpkI",
      isEbook: true,
      status: "tersedia",
      inputSource: "Impor",
      inputBy: "API E-Book Ruang Baca",
      verificationStatus: "approved",
      keywords: ["real", "analysis", "bartle", "analisis", "real"],
      createdAt: "2026-01-04T00:00:00.000Z",
      year: 2021,
    },
  ];
}
