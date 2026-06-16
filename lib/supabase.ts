import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Book,
  BookStatus,
  CollectionBase,
  Thesis,
  VerificationStatus,
} from "@/lib/types";
import { resolveThesisPdfUrl } from "@/lib/thesis-pdf";

type UnknownRow = Record<string, unknown>;

type CatalogData = {
  books: Book[];
  theses: Thesis[];
  error?: string;
};

type CatalogFetchOptions = {
  visibility?: "public" | "internal";
  limit?: number;
  offset?: number;
  includePdfMetadata?: boolean;
  includeInputMetadata?: boolean;
};

type CatalogInputOverride = {
  source: CollectionBase["inputSource"];
  inputBy: string;
};

type ThesisPdfOverride = {
  url: string;
  filename?: string;
  size?: number;
};

type ProfileNameMap = Record<string, string>;

type AttendanceRow = {
  id: string;
  visitor_name: string;
  nim_nip: string;
  visitor_status: string;
  study_program: string;
  purpose: string;
  attendance_status: string;
  visited_at: string;
};

export async function fetchAttendanceRows(limit = 50, query?: { search?: string; visitorStatus?: string; purpose?: string; }) {
  try {
    let builder = getSupabaseClient().from('attendance').select('*').order('visited_at', { ascending: false }).limit(limit);

    if (query?.search) {
      const q = query.search;
      // search in visitor_name or nim_nip
      builder = builder.or(`visitor_name.ilike.%${q}%,nim_nip.ilike.%${q}%`);
    }

    if (query?.visitorStatus && query.visitorStatus !== 'all') {
      builder = builder.eq('visitor_status', query.visitorStatus);
    }

    if (query?.purpose && query.purpose !== 'all') {
      builder = builder.eq('purpose', query.purpose);
    }

    const { data, error } = await builder;

    if (error) return { rows: [] as AttendanceRow[], error: error.message };

    return { rows: (data ?? []) as AttendanceRow[], error: undefined };
  } catch (err) {
    return { rows: [] as AttendanceRow[], error: err instanceof Error ? err.message : 'Failed to fetch attendance' };
  }
}

export async function insertAttendanceRow(payload: Partial<AttendanceRow>) {
  try {
    const { data, error } = await getSupabaseClient().from('attendance').insert(payload).select('*').single();
    if (error) return { row: null as AttendanceRow | null, error: error.message };
    return { row: data as AttendanceRow, error: undefined };
  } catch (err) {
    return { row: null as AttendanceRow | null, error: err instanceof Error ? err.message : 'Failed to insert attendance' };
  }
}

const verificationStatuses: VerificationStatus[] = [
  "pending",
  "approved",
  "rejected",
];

const publicBookFields = [
  "id",
  "title",
  "tahun",
  "code",
  "location",
  "rack_location",
  "author",
  "publisher",
  "category",
  "stock",
  "isbn",
  "cover_url",
  "status",
  "verification_status",
  "notes",
  "keywords",
  "created_at",
  "input_source",
  "input_by",
].join(",");

const publicThesisFields = [
  "id",
  "title",
  "year",
  "code",
  "location",
  "physical_location",
  "student_name",
  "student_nim",
  "topic",
  "supervisor_1",
  "supervisor_2",
  "cover_url",
  "verification_status",
  "notes",
  "keywords",
  "created_at",
  "input_source",
  "input_by",
  "access_note",
].join(",");

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Konfigurasi database aplikasi belum lengkap.",
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

export async function fetchCatalogData(options: CatalogFetchOptions = {}): Promise<CatalogData> {
  const publicOnly = options.visibility === "public";
  const includePdfMetadata = options.includePdfMetadata ?? !publicOnly;
  const includeInputMetadata = options.includeInputMetadata ?? !publicOnly;
  const tableOptions = {
    visibility: options.visibility,
    limit: options.limit,
    offset: options.offset,
    select: publicOnly ? undefined : "*",
  };
  const [booksResult, thesesResult] = await Promise.all([
    fetchTableRows("books", {
      ...tableOptions,
      select: publicOnly ? publicBookFields : "*",
    }),
    fetchTableRows("theses", {
      ...tableOptions,
      select: publicOnly
        ? includePdfMetadata
          ? `${publicThesisFields},pdf_url,pdf_filename,pdf_size`
          : publicThesisFields
        : "*",
    }),
  ]);
  const bookVerificationOverrides = await getBookVerificationOverrides();
  const thesisVerificationOverrides = await getThesisVerificationOverrides();
  const inputOverrides = includeInputMetadata ? await getCatalogInputOverrides() : {};
  const thesisPdfOverrides = includePdfMetadata ? await getThesisPdfOverrides() : {};
  const profileNamesById = includeInputMetadata
    ? await getProfileNamesForRows([
        ...booksResult.rows,
        ...thesesResult.rows,
      ])
    : {};

  const errors = [booksResult.error, thesesResult.error].filter(Boolean);
  const books = booksResult.rows.map((row) =>
    mapBookRow(
      row,
      bookVerificationOverrides[textValue(row, ["id"])],
      inputOverrides[`book:${textValue(row, ["id"])}`],
      createdByName(row, profileNamesById),
    ),
  );
  const theses = thesesResult.rows.map((row) =>
    mapThesisRow(
      row,
      thesisVerificationOverrides[textValue(row, ["id"])],
      inputOverrides[`thesis:${textValue(row, ["id"])}`],
      createdByName(row, profileNamesById),
      thesisPdfOverrides[textValue(row, ["id"])],
    ),
  );

  return {
    books: sortByNewest(publicOnly ? books.filter(isApproved) : books),
    theses: sortByNewest(publicOnly ? theses.filter(isApproved) : theses),
    error: errors.length ? errors.join(" ") : undefined,
  };
}

export async function fetchCollectionById(type: string, id: string, options: CatalogFetchOptions = {}) {
  const table = type === "buku" ? "books" : type === "skripsi" ? "theses" : null;
  if (!table) return null;

  const { row } = await fetchTableRowById(table, id);
  if (!row) return null;

  const rows = [row];
  const bookVerificationOverrides =
    table === "books" ? await getBookVerificationOverrides() : {};
  const thesisVerificationOverrides =
    table === "theses" ? await getThesisVerificationOverrides() : {};
  const inputOverrides = await getCatalogInputOverrides();
  const thesisPdfOverrides = table === "theses" ? await getThesisPdfOverrides() : {};
  const profileNamesById = await getProfileNamesForRows(rows);
  const mappedRows =
    table === "books"
      ? rows.map((row) =>
          mapBookRow(
            row,
            bookVerificationOverrides[textValue(row, ["id"])],
            inputOverrides[`book:${textValue(row, ["id"])}`],
            createdByName(row, profileNamesById),
          ),
        )
      : rows.map((row) =>
          mapThesisRow(
            row,
            thesisVerificationOverrides[textValue(row, ["id"])],
            inputOverrides[`thesis:${textValue(row, ["id"])}`],
            createdByName(row, profileNamesById),
            thesisPdfOverrides[textValue(row, ["id"])],
          ),
        );

  const item = mappedRows.find((item) => item.id === id) ?? null;

  if (options.visibility === "public" && item && !isApproved(item)) {
    return null;
  }

  return item;
}

export async function fetchBookById(id: string, options: CatalogFetchOptions = {}) {
  const { row, error } = await fetchTableRowById("books", id);
  const bookVerificationOverrides = await getBookVerificationOverrides();
  const inputOverrides = await getCatalogInputOverrides();
  const profileNamesById = await getProfileNamesForRows(row ? [row] : []);
  const book = row
    ? mapBookRow(
        row,
        bookVerificationOverrides[textValue(row, ["id"])],
        inputOverrides[`book:${textValue(row, ["id"])}`],
        createdByName(row, profileNamesById),
      )
    : null;

  return {
    book: book && (options.visibility !== "public" || isApproved(book)) ? book : null,
    error,
  };
}

export async function fetchThesisById(id: string, options: CatalogFetchOptions = {}) {
  const { row, error } = await fetchTableRowById("theses", id);
  const thesisVerificationOverrides = await getThesisVerificationOverrides();
  const inputOverrides = await getCatalogInputOverrides();
  const thesisPdfOverrides = await getThesisPdfOverrides();
  const profileNamesById = await getProfileNamesForRows(row ? [row] : []);
  const thesis = row
    ? mapThesisRow(
        row,
        thesisVerificationOverrides[textValue(row, ["id"])],
        inputOverrides[`thesis:${textValue(row, ["id"])}`],
        createdByName(row, profileNamesById),
        thesisPdfOverrides[textValue(row, ["id"])],
      )
    : null;

  return {
    thesis: thesis && (options.visibility !== "public" || isApproved(thesis)) ? thesis : null,
    error,
  };
}

async function fetchTableRows(
  table: "books" | "theses",
  options: {
    visibility?: "public" | "internal";
    limit?: number;
    offset?: number;
    select?: string;
  } = {},
) {
  try {
    let selectFields = selectFieldsValue(options.select);
    let applyPublicFilter = false;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < 12; attempt++) {
      let query = getSupabaseClient()
        .from(table)
        .select(selectFields?.join(",") ?? "*")
        .order("created_at", { ascending: false });

      if (applyPublicFilter) {
        query = query.eq("verification_status", "approved");
      }

      if (typeof options.limit === "number" && options.limit > 0) {
        const offset = Math.max(0, options.offset ?? 0);
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data, error } = await query;

      if (!error) {
        return { rows: (data ?? []) as unknown as UnknownRow[], error: undefined };
      }

      lastError = error.message;
      const missingColumn = missingColumnFromError(error.message, table);

      if (missingColumn === "verification_status" && applyPublicFilter) {
        applyPublicFilter = false;
        continue;
      }

      if (missingColumn && selectFields?.includes(missingColumn)) {
        selectFields = selectFields.filter((field) => field !== missingColumn);
        continue;
      }

      return { rows: [] as UnknownRow[], error: error.message };
    }

    return { rows: [] as UnknownRow[], error: lastError ?? "Data belum dapat dimuat." };
  } catch (error) {
    return {
      rows: [] as UnknownRow[],
      error: error instanceof Error ? error.message : "Data belum dapat dimuat.",
    };
  }
}

function selectFieldsValue(select?: string) {
  if (!select || select === "*") return undefined;
  return select
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
}

function missingColumnFromError(message: string, table: "books" | "theses") {
  const postgresColumnMatch = message.match(new RegExp(`column ${table}\\.([a-zA-Z0-9_]+) does not exist`));
  if (postgresColumnMatch?.[1]) return postgresColumnMatch[1];

  const schemaCacheMatch = message.match(/Could not find the '([^']+)' column/);
  if (schemaCacheMatch?.[1]) return schemaCacheMatch[1];

  return null;
}

async function fetchTableRowById(table: "books" | "theses", id: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { row: null as UnknownRow | null, error: error.message };
    }

    return { row: (data ?? null) as UnknownRow | null, error: undefined };
  } catch (error) {
    return {
      row: null as UnknownRow | null,
      error: error instanceof Error ? error.message : "Data belum dapat dimuat.",
    };
  }
}

function mapBookRow(
  row: UnknownRow,
  verificationOverride?: VerificationStatus,
  inputOverride?: CatalogInputOverride,
  createdByName?: string,
): Book {
  const stock = numberValue(row, ["stock"]);
  const rackLocation = textValue(
    row,
    ["rack_location"],
    "-",
  );

  return {
    ...mapBaseRow(row, verificationOverride, inputOverride, createdByName),
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

function mapThesisRow(
  row: UnknownRow,
  verificationOverride?: VerificationStatus,
  inputOverride?: CatalogInputOverride,
  createdByName?: string,
  pdfOverride?: ThesisPdfOverride,
): Thesis {
  const topic = textValue(row, ["topic"], "Skripsi");
  const physicalLocation = textValue(
    row,
    ["physical_location"],
    "-",
  );
  const pdfUrl = optionalTextValue(row, ["pdf_url", "pdfUrl"]);

  return {
    ...mapBaseRow(row, verificationOverride, inputOverride, createdByName),
    type: "thesis",
    studentName: textValue(row, ["student_name"]),
    studentNim: optionalTextValue(row, ["student_nim", "studentNim", "nim"]),
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
    pdfUrl: resolveThesisPdfUrl(pdfOverride?.url) ?? resolveThesisPdfUrl(pdfUrl),
    pdfFilename: pdfOverride?.filename ?? optionalTextValue(row, ["pdf_filename", "pdfFilename"]),
    pdfSize: pdfOverride?.size ?? optionalNumberValue(row, ["pdf_size", "pdfSize"]),
    keywords: [topic],
  };
}

function mapBaseRow(
  row: UnknownRow,
  verificationOverride?: VerificationStatus,
  inputOverride?: CatalogInputOverride,
  createdByName?: string,
): CollectionBase {
  const currentYear = new Date().getFullYear();

  return {
    id: textValue(row, ["id"]),
    title: textValue(row, ["title"], "Tanpa judul"),
    year: numberValue(row, ["year", "tahun", "graduation_year", "graduationYear"], currentYear),
    code: textValue(row, ["code", "kode", "collection_code", "kode_koleksi"], "-"),
    location: textValue(row, ["location", "rack_location", "physical_location"], "-"),
    inputSource: inputOverride?.source ?? inputSourceValue(row),
    inputBy:
      inputOverride?.inputBy ??
      optionalTextValue(row, ["input_by", "inputBy", "diinput_oleh"]) ??
      createdByName ??
      "Belum tercatat",
    verificationStatus: verificationOverride ?? verificationStatusValue(row),
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

function optionalNumberValue(row: UnknownRow, keys: string[]) {
  const value = firstValue(row, keys);

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
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
    return "approved";
  }
  if (["rejected", "ditolak"].includes(normalized)) {
    return "rejected";
  }

  return "pending";
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

function isApproved(item: Book | Thesis) {
  return item.verificationStatus === "approved";
}

async function getBookVerificationOverrides() {
  if (typeof window !== "undefined") {
    return {};
  }

  const { readBookVerificationOverrides } = await import("@/lib/catalog-verification-store");
  return readBookVerificationOverrides();
}

async function getThesisVerificationOverrides() {
  if (typeof window !== "undefined") {
    return {};
  }

  const { readThesisVerificationOverrides } = await import("@/lib/catalog-verification-store");
  return readThesisVerificationOverrides();
}

async function getCatalogInputOverrides() {
  if (typeof window !== "undefined") {
    return {};
  }

  const { readCatalogInputOverrides } = await import("@/lib/catalog-verification-store");
  return readCatalogInputOverrides();
}

async function getThesisPdfOverrides() {
  if (typeof window !== "undefined") {
    return {};
  }

  const { readThesisPdfOverrides } = await import("@/lib/catalog-verification-store");
  return readThesisPdfOverrides();
}

function createdByName(row: UnknownRow, profileNamesById: ProfileNameMap) {
  const profileId = textValue(row, ["created_by", "createdBy", "created_by_id"]);
  return profileId ? profileNamesById[profileId] : undefined;
}

async function getProfileNamesForRows(rows: UnknownRow[]): Promise<ProfileNameMap> {
  if (typeof window !== "undefined") return {};

  const ids = Array.from(
    new Set(
      rows
        .map((row) => textValue(row, ["created_by", "createdBy", "created_by_id"]))
        .filter(Boolean),
    ),
  );

  if (!ids.length) return {};

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const { data, error } = await createSupabaseAdminClient()
      .from("profiles")
      .select("id,full_name,email")
      .in("id", ids);

    if (error) {
      console.error("[catalog] Failed to resolve input actor profiles", {
        error: error.message,
      });
      return {};
    }

    return Object.fromEntries(
      ((data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>)
        .map((profile) => [
          profile.id,
          profile.full_name?.trim() || profile.email?.trim() || "Petugas Ruang Baca",
        ]),
    );
  } catch (error) {
    console.error("[catalog] Failed to load input actor profiles", {
      error: error instanceof Error ? error.message : error,
    });
    return {};
  }
}
