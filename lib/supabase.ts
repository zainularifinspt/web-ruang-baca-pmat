import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Book,
  BookStatus,
  CollectionBase,
  Thesis,
  VerificationStatus,
} from "@/lib/types";

type UnknownRow = Record<string, unknown>;

type CatalogData = {
  books: Book[];
  theses: Thesis[];
  error?: string;
};

const verificationStatuses: VerificationStatus[] = [
  "Menunggu Verifikasi",
  "Disetujui",
  "Perlu Revisi",
  "Ditolak",
];

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export async function fetchCatalogData(): Promise<CatalogData> {
  const [booksResult, thesesResult] = await Promise.all([
    fetchTableRows("books"),
    fetchTableRows("theses"),
  ]);

  const errors = [booksResult.error, thesesResult.error].filter(Boolean);

  return {
    books: sortByNewest(booksResult.rows.map(mapBookRow)),
    theses: sortByNewest(thesesResult.rows.map(mapThesisRow)),
    error: errors.length ? errors.join(" ") : undefined,
  };
}

export async function fetchCollectionById(type: string, id: string) {
  const table = type === "buku" ? "books" : type === "skripsi" ? "theses" : null;
  if (!table) return null;

  const { rows } = await fetchTableRows(table);
  const mappedRows =
    table === "books" ? rows.map(mapBookRow) : rows.map(mapThesisRow);

  return mappedRows.find((item) => item.id === id) ?? null;
}

async function fetchTableRows(table: "books" | "theses") {
  try {
    const { data, error } = await getSupabaseClient().from(table).select("*");

    if (error) {
      return { rows: [] as UnknownRow[], error: error.message };
    }

    return { rows: (data ?? []) as UnknownRow[], error: undefined };
  } catch (error) {
    return {
      rows: [] as UnknownRow[],
      error: error instanceof Error ? error.message : "Supabase data could not be loaded.",
    };
  }
}

function mapBookRow(row: UnknownRow): Book {
  const stock = numberValue(row, ["stock"]);
  const rackLocation = textValue(
    row,
    ["rack_location"],
    "-",
  );

  return {
    ...mapBaseRow(row),
    type: "book",
    author: textValue(row, ["author"]),
    publisher: textValue(row, ["publisher"]),
    category: textValue(row, ["category"], "Buku"),
    rackLocation,
    location: rackLocation,
    stock,
    available: stock,
    isbn: textValue(row, ["isbn"]),
    coverUrl: optionalTextValue(row, ["cover_url"]),
    status: bookStatusValue(row),
  };
}

function mapThesisRow(row: UnknownRow): Thesis {
  const topic = textValue(row, ["topic"], "Skripsi");
  const physicalLocation = textValue(
    row,
    ["physical_location"],
    "-",
  );

  return {
    ...mapBaseRow(row),
    type: "thesis",
    studentName: textValue(row, ["student_name"]),
    topic,
    supervisor1: textValue(row, ["supervisor_1"]),
    supervisor2: textValue(row, ["supervisor_2"]),
    abstract: textValue(row, ["abstract"]),
    coverUrl: optionalTextValue(row, ["cover_url"]),
    physicalLocation,
    location: physicalLocation,
    accessNote: textValue(
      row,
      ["access_note"],
      "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.",
    ),
    keywords: [topic],
  };
}

function mapBaseRow(row: UnknownRow): CollectionBase {
  const currentYear = new Date().getFullYear();

  return {
    id: textValue(row, ["id"]),
    title: textValue(row, ["title"], "Tanpa judul"),
    year: numberValue(row, ["year", "tahun", "graduation_year", "graduationYear"], currentYear),
    code: textValue(row, ["code", "kode", "collection_code", "kode_koleksi"], "-"),
    location: textValue(row, ["location", "rack_location", "physical_location"], "-"),
    inputSource: inputSourceValue(row),
    inputBy: textValue(row, ["input_by", "inputBy", "diinput_oleh"], "Supabase"),
    verificationStatus: verificationStatusValue(row),
    notes: optionalTextValue(row, ["notes", "catatan"]),
    keywords: keywordsValue(row),
    createdAt: textValue(row, ["created_at", "createdAt"], new Date().toISOString()),
  };
}

function textValue(row: UnknownRow, keys: string[], fallback = "") {
  const value = firstValue(row, keys);

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  return fallback;
}

function optionalTextValue(row: UnknownRow, keys: string[]) {
  const value = textValue(row, keys);
  return value || undefined;
}

function numberValue(row: UnknownRow, keys: string[], fallback = 0) {
  const value = firstValue(row, keys);

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function keywordsValue(row: UnknownRow) {
  const value = firstValue(row, ["keywords", "tags", "topic", "category"]);

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function verificationStatusValue(row: UnknownRow): VerificationStatus {
  const value = textValue(row, [
    "verification_status",
    "verificationStatus",
    "status",
  ]);

  if (verificationStatuses.includes(value as VerificationStatus)) {
    return value as VerificationStatus;
  }

  const normalized = value.toLowerCase();
  if (["approved", "approve", "verified", "disetujui"].includes(normalized)) {
    return "Disetujui";
  }
  if (["revision", "needs_revision", "perlu revisi"].includes(normalized)) {
    return "Perlu Revisi";
  }
  if (["rejected", "ditolak"].includes(normalized)) {
    return "Ditolak";
  }

  return "Menunggu Verifikasi";
}

function bookStatusValue(row: UnknownRow): BookStatus {
  const value = textValue(row, ["status"], "tersedia").toLowerCase();

  if (value === "dipinjam" || value === "arsip") return value;

  return "tersedia";
}

function inputSourceValue(row: UnknownRow): CollectionBase["inputSource"] {
  const value = textValue(row, ["input_source", "inputSource", "sumber_input"]);

  if (value === "Simulasi WhatsApp" || value === "Impor") return value;

  return "Dasbor";
}

function firstValue(row: UnknownRow, keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] !== null && row[key] !== undefined) {
      return row[key];
    }
  }

  return undefined;
}

function sortByNewest<T extends { createdAt: string; year: number }>(items: T[]) {
  return [...items].sort((a, b) => {
    const dateDifference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (Number.isFinite(dateDifference) && dateDifference !== 0) {
      return dateDifference;
    }

    return b.year - a.year;
  });
}
