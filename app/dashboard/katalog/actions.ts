"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { read, utils } from "xlsx";
import { requireStaffRole } from "@/lib/auth-guards";
import {
  writeCatalogInputOverride,
  writeBookVerificationOverride,
  writeThesisPdfOverride,
  writeThesisVerificationOverride,
} from "@/lib/catalog-verification-store";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  BookFormValues,
  CatalogActionResult,
  ThesisFormValues,
} from "@/lib/catalog-crud-types";
import type { Book, Thesis, VerificationStatus } from "@/lib/types";

type MutationPayload = Record<string, unknown>;
type InsertCatalogOptions = {
  type: "book" | "thesis";
  inputBy?: string;
  verificationStatus?: VerificationStatus;
};

export type GoogleSheetThesisCandidate = {
  key: string;
  title: string;
  studentName: string;
  studentNim: string;
  year: number;
  supervisor1: string;
  supervisor2: string;
  pdfUrl: string;
};

const maxThesisPdfSize = 5 * 1024 * 1024;
const defaultThesisMetadataSheetUrl =
  "https://docs.google.com/spreadsheets/d/1b7B0V2gu1lADwzGHF1F-TIno6vP2mQQFg4IweiOZAaU/export?format=csv&gid=750085679";
const defaultThesisPdfSheetUrl =
  "https://docs.google.com/spreadsheets/d/1bhiL1iZ9U2s3A1EXIfw7d0lQAovclpIMsDAmRxkd8dw/export?format=csv&gid=0";
const thesisMetadataSheetUrl =
  process.env.THESIS_METADATA_SHEET_URL ??
  process.env.THESIS_SHEET_URL ??
  defaultThesisMetadataSheetUrl;
const thesisPdfSheetUrl =
  process.env.THESIS_PDF_SHEET_URL ??
  defaultThesisPdfSheetUrl;

export async function createBook(values: BookFormValues): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const inputBy = await getInputActorName(auth.user.id, auth.user.email);
  const result = await safelyMutateCatalog(() =>
    insertBook(bookPayload(values, inputBy, auth.user.id), { type: "book", inputBy }),
  );
  revalidateCatalogPaths();

  return result.ok
    ? success("Buku berhasil ditambahkan.")
    : failure(result.message);
}

export async function createThesis(values: ThesisFormValues): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const inputBy = await getInputActorName(auth.user.id, auth.user.email);
  const result = await safelyMutateCatalog(() =>
    insertThesis(thesisPayload(values, inputBy, auth.user.id), {
      type: "thesis",
      inputBy,
      verificationStatus: values.verificationStatus,
    }),
  );
  revalidateCatalogPaths();

  return result.ok
    ? success("Skripsi berhasil ditambahkan.")
    : failure(result.message);
}

export async function previewThesisSyncFromGoogleSheets(): Promise<
  CatalogActionResult & { candidates?: GoogleSheetThesisCandidate[]; count?: number }
> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  try {
    const candidates = await getNewGoogleSheetThesisCandidates();

    if (!candidates.length) {
      return {
        ok: true,
        message: "Tidak ada data baru yang ditambahkan.",
        candidates: [],
        count: 0,
      };
    }

    return {
      ok: true,
      message: `${candidates.length} data skripsi baru terdeteksi. Konfirmasi untuk memasukkan ke katalog.`,
      candidates,
      count: candidates.length,
    };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
  }
}

export async function syncThesisFromGoogleSheets(
  candidateKeys: string[],
): Promise<CatalogActionResult & { count?: number }> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  if (!candidateKeys.length) {
    return { ok: true, message: "Tidak ada data baru yang ditambahkan.", count: 0 };
  }

  try {
    const selectedKeys = new Set(candidateKeys);
    const candidates = (await getNewGoogleSheetThesisCandidates()).filter((candidate) =>
      selectedKeys.has(candidate.key),
    );

    if (!candidates.length) {
      return { ok: true, message: "Tidak ada data baru yang ditambahkan.", count: 0 };
    }

    let addedCount = 0;
    const inputBy = await getInputActorName(auth.user.id, auth.user.email);

    for (const candidate of candidates) {
      const thesisValues: ThesisFormValues = {
        title: candidate.title,
        studentName: candidate.studentName,
        studentNim: candidate.studentNim,
        year: candidate.year,
        topic: "Pendidikan Matematika",
        abstract: "Abstrak belum tersedia",
        supervisor1: candidate.supervisor1,
        supervisor2: candidate.supervisor2,
        physicalLocation: "Ruang Baca PMAT",
        accessNote: "Dapat dibaca di tempat",
        coverUrl: "",
        pdfUrl: candidate.pdfUrl,
        pdfFilename: "",
        pdfSize: 0,
        verificationStatus: "approved",
      };

      const result = await insertThesis(thesisPayload(thesisValues, inputBy, auth.user.id), {
        type: "thesis",
        inputBy,
        verificationStatus: "approved",
      });

      if (result.ok) addedCount++;
    }

    revalidateCatalogPaths();
    return { ok: true, message: `${addedCount} data skripsi baru ditambahkan ke katalog.`, count: addedCount };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
  }
}

export async function syncExistingThesisPdfUrlsFromGoogleSheets(): Promise<
  CatalogActionResult & { count?: number; skipped?: number }
> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  try {
    const [sheetRows, pdfRows, existingTheses] = await Promise.all([
      getGoogleSheetThesisRows(thesisMetadataSheetUrl),
      getGoogleSheetThesisPdfRows(),
      getExistingThesisPdfIdentityRows(),
    ]);

    const pdfUrlsByIdentity = new Map<string, string>();
    const pdfUrlsByName = new Map<string, string>();

    for (const pdfRow of pdfRows) {
      if (!pdfRow.pdfUrl) continue;

      const normalizedName = normalizeIdentity(pdfRow.studentName);
      const normalizedNim = normalizeNim(pdfRow.studentNim);

      if (normalizedName && normalizedNim) {
        pdfUrlsByIdentity.set(thesisIdentityKey(normalizedName, normalizedNim), pdfRow.pdfUrl);
      }
      if (normalizedName) {
        pdfUrlsByName.set(normalizedName, pdfRow.pdfUrl);
      }
    }

    for (const [index, row] of sheetRows.entries()) {
      const studentName = sheetText(row, ["NAMA", "nama"]);
      const studentNim = sheetText(row, ["NIM", "nim", "NIM/NIP", "nim_nip"]);
      const normalizedName = normalizeIdentity(studentName);
      const normalizedNim = normalizeNim(studentNim);
      const publicPdfUrl = pdfRows[index]?.pdfUrl ?? "";

      if (!normalizedName || !publicPdfUrl) continue;
      if (normalizedNim) {
        pdfUrlsByIdentity.set(thesisIdentityKey(normalizedName, normalizedNim), publicPdfUrl);
      }
      pdfUrlsByName.set(normalizedName, publicPdfUrl);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const thesis of existingTheses) {
      const normalizedName = normalizeIdentity(thesis.student_name);
      const normalizedNim = normalizeNim(thesis.student_nim);
      if (!normalizedName) {
        skippedCount++;
        continue;
      }

      const publicPdfUrl = normalizedNim
        ? pdfUrlsByIdentity.get(thesisIdentityKey(normalizedName, normalizedNim)) ?? pdfUrlsByName.get(normalizedName)
        : pdfUrlsByName.get(normalizedName);
      if (!publicPdfUrl) {
        skippedCount++;
        continue;
      }

      if ((thesis.pdf_url ?? "").trim() === publicPdfUrl) {
        await writeThesisPdfOverrideFromId(thesis.id, { pdf_url: publicPdfUrl });
        continue;
      }

      const result = await updateThesisRow(thesis.id, { pdf_url: publicPdfUrl });
      if (result.ok) updatedCount++;
      else skippedCount++;
    }

    revalidateCatalogPaths();

    return {
      ok: true,
      message: `${updatedCount} link PDF skripsi diperbarui dari kolom D Google Sheet PDF.`,
      count: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui link PDF.");
  }
}

async function getNewGoogleSheetThesisCandidates() {
  const [sheetRows, pdfRows, existingTheses] = await Promise.all([
    getGoogleSheetThesisRows(thesisMetadataSheetUrl),
    getGoogleSheetThesisPdfRows(),
    getExistingThesisIdentityRows(),
  ]);

  const existingIdentityKeys = new Set<string>();
  const existingLegacyNames = new Set<string>();

  existingTheses.forEach((thesis) => {
    const name = normalizeIdentity(thesis.student_name);
    const nim = normalizeNim(thesis.student_nim);
    if (!name) return;
    if (nim) existingIdentityKeys.add(thesisIdentityKey(name, nim));
    else existingLegacyNames.add(name);
  });

  const seenSheetKeys = new Set<string>();
  const candidates: GoogleSheetThesisCandidate[] = [];

  for (const [index, row] of sheetRows.entries()) {
    const title = sheetText(row, ["JUDUL SKRIPSI", "judul skripsi", "judul"]);
    const studentName = sheetText(row, ["NAMA", "nama"]);
    const studentNim = sheetText(row, ["NIM", "nim", "NIM/NIP", "nim_nip"]);
    const normalizedName = normalizeIdentity(studentName);
    const normalizedNim = normalizeNim(studentNim);

    if (!title || !normalizedName || !normalizedNim) continue;

    const key = thesisIdentityKey(normalizedName, normalizedNim);
    if (existingIdentityKeys.has(key) || existingLegacyNames.has(normalizedName) || seenSheetKeys.has(key)) {
      continue;
    }

    seenSheetKeys.add(key);
    const publicPdfUrl = pdfRows[index]?.pdfUrl ?? "";
    if (!publicPdfUrl) continue;

    candidates.push({
      key,
      title: title.trim(),
      studentName: studentName.trim(),
      studentNim: studentNim.trim(),
      year: graduationYear(sheetText(row, ["TANGGAL YUDISIUM (SESUAI SKL)", "tanggal yudisium"])),
      supervisor1: sheetText(row, ["PEMBIMBING 1", "pembimbing 1"]) || "-",
      supervisor2: sheetText(row, ["PEMBIMBING 2", "pembimbing 2"]) || "-",
      pdfUrl: publicPdfUrl,
    });
  }

  return candidates;
}

async function getGoogleSheetThesisRows(sheetUrl: string) {
  const response = await fetch(sheetUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Gagal mengunduh data dari Google Sheets.");

  const buffer = await response.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) throw new Error("Sheet pertama tidak ditemukan.");

  return utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
}

async function getGoogleSheetThesisPdfRows() {
  const response = await fetch(thesisPdfSheetUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Gagal mengunduh link PDF dari Google Sheet baru (HTTP ${response.status}). Pastikan Sheet PDF bisa diakses publik melalui link atau isi THESIS_PDF_SHEET_URL dengan URL export CSV yang publik.`,
    );
  }

  const buffer = await response.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) throw new Error("Sheet PDF pertama tidak ditemukan.");

  const rows = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const headerRow = looksLikeSpreadsheetHeader(rows[0]) ? rows[0] : undefined;
  const dataRows = headerRow ? rows.slice(1) : rows;
  const columns = sheetColumnIndexes(headerRow);

  return dataRows.map((row) => ({
    pdfUrl: sheetColumnText(row, 3),
    studentName: columns.name >= 0 ? sheetColumnText(row, columns.name) : guessPdfSheetStudentName(row),
    studentNim: columns.nim >= 0 ? sheetColumnText(row, columns.nim) : guessPdfSheetStudentNim(row),
  }));
}

async function getExistingThesisIdentityRows(): Promise<Array<{ student_name?: string | null; student_nim?: string | null }>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("theses")
    .select("student_name, student_nim");

  if (!error) return data ?? [];

  if (!isMissingStudentNimColumn(error.message)) {
    throw new Error(error.message);
  }

  const fallback = await supabase.from("theses").select("student_name");
  if (fallback.error) throw new Error(fallback.error.message);

  return fallback.data ?? [];
}

async function getExistingThesisPdfIdentityRows(): Promise<
  Array<{ id: string; student_name?: string | null; student_nim?: string | null; pdf_url?: string | null }>
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("theses")
    .select("id, student_name, student_nim, pdf_url");

  if (!error) return data ?? [];

  if (!isMissingStudentNimColumn(error.message) && !isMissingThesisPdfColumn(error.message)) {
    throw new Error(error.message);
  }

  const fallback = await supabase.from("theses").select("id, student_name, pdf_url");
  if (!fallback.error) return fallback.data ?? [];

  if (!isMissingThesisPdfColumn(fallback.error.message)) {
    throw new Error(fallback.error.message);
  }

  const minimalFallback = await supabase.from("theses").select("id, student_name");
  if (minimalFallback.error) throw new Error(minimalFallback.error.message);

  return minimalFallback.data ?? [];
}

function sheetText(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) return value.toString().trim();
  }

  return "";
}

function sheetColumnText(row: unknown[] | undefined, columnIndex: number) {
  const value = row?.[columnIndex];
  return value === undefined || value === null ? "" : value.toString().trim();
}

function looksLikeSpreadsheetHeader(row: unknown[] | undefined) {
  if (!row?.length) return false;

  const text = row
    .map((value) => (value === undefined || value === null ? "" : value.toString().trim().toLowerCase()))
    .filter(Boolean)
    .join(" ");

  return /\b(nim|nama|judul|skripsi|pdf|file)\b/.test(text) && !/^https?:\/\//i.test(sheetColumnText(row, 3));
}

function sheetColumnIndexes(row: unknown[] | undefined) {
  const labels = (row ?? []).map((value) =>
    value === undefined || value === null ? "" : value.toString().trim().toLowerCase(),
  );

  return {
    name: labels.findIndex((label) => ["nama", "nama mahasiswa", "student_name"].includes(label)),
    nim: labels.findIndex((label) => ["nim", "nim/nip", "student_nim"].includes(label)),
  };
}

function guessPdfSheetStudentName(row: unknown[] | undefined) {
  const cells = (row ?? []).slice(0, 3).map((_, index) => sheetColumnText(row, index));
  const candidates = cells.filter((value) =>
    value &&
    !/^https?:\/\//i.test(value) &&
    !/^\d+$/.test(value.replace(/\D/g, "")) &&
    /[a-z]/i.test(value),
  );

  return candidates[candidates.length - 1] ?? "";
}

function guessPdfSheetStudentNim(row: unknown[] | undefined) {
  const cells = (row ?? []).slice(0, 3).map((_, index) => sheetColumnText(row, index));
  return cells.find((value) => normalizeNim(value).length >= 6) ?? "";
}

function graduationYear(dateStr: string) {
  if (!dateStr) return new Date().getFullYear();

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date().getFullYear() : parsed.getFullYear();
}

function normalizeIdentity(value?: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeNim(value?: string | null) {
  return (value ?? "").trim().replace(/\D/g, "");
}

function thesisIdentityKey(normalizedName: string, normalizedNim: string) {
  return `${normalizedName}|${normalizedNim}`;
}

export async function updateBook(
  id: Book["id"],
  values: BookFormValues,
): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const result = await safelyMutateCatalog(() => updateBookRow(id, bookPayload(values)));
  revalidateCatalogPaths();

  return result.ok ? success("Buku berhasil diperbarui.") : failure(result.message);
}

export async function updateThesis(
  id: Thesis["id"],
  values: ThesisFormValues,
): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const result = await safelyMutateCatalog(() => updateThesisRow(id, thesisPayload(values)));
  revalidateCatalogPaths();

  return result.ok ? success("Skripsi berhasil diperbarui.") : failure(result.message);
}

export async function deleteCollection(
  type: Book["type"] | Thesis["type"],
  id: string,
): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const result = await safelyMutateCatalog(async () => {
    const table = type === "book" ? "books" : "theses";
    const { error } = await createSupabaseAdminClient().from(table).delete().eq("id", id);

    return error
      ? failure(error.message)
      : success(type === "book" ? "Buku berhasil dihapus." : "Skripsi berhasil dihapus.");
  });

  revalidateCatalogPaths();

  return result;
}

export async function updateCollectionVerificationStatus(
  type: Book["type"] | Thesis["type"],
  id: string,
  status: VerificationStatus,
): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  if (!["pending", "approved", "rejected"].includes(status)) {
    return failure("Status verifikasi tidak valid.");
  }

  const result = await safelyMutateCatalog(async () => {
    if (type === "book") {
      const { error } = await createSupabaseAdminClient()
        .from("books")
        .update({ verification_status: status })
        .eq("id", id);

      if (error) {
        if (!isMissingBookVerificationColumn(error.message)) {
          return failure(error.message);
        }

        await writeBookVerificationOverride(id, status);
      }

      return success("Status verifikasi buku berhasil diperbarui.");
    }

    const { error } = await createSupabaseAdminClient()
      .from("theses")
      .update({ verification_status: status })
      .eq("id", id);

    if (error) {
      if (!isMissingVerificationColumn(error.message)) {
        return failure(error.message);
      }

      await writeThesisVerificationOverride(id, status);
    }

    return success("Status verifikasi skripsi berhasil diperbarui.");
  });

  revalidateCatalogPaths();
  revalidatePath("/dashboard/verifikasi");

  return result;
}

function isMissingBookVerificationColumn(message: string) {
  return isMissingVerificationColumn(message);
}

function isMissingVerificationColumn(message: string) {
  return message.includes("verification_status") || message.includes("schema cache");
}

async function insertBook(payload: MutationPayload, options?: InsertCatalogOptions) {
  const { data, error } = await createSupabaseAdminClient()
    .from("books")
    .insert(payload)
    .select("id")
    .single();
  if (!error) {
    await writeInputAuditFromInsert(data, options);
    return success("ok");
  }

  if (!isMissingInputAuditColumn(error.message)) {
    return failure(error.message);
  }

  const fallbackPayload = omitPayloadKeys(payload, [
    "created_by",
    "input_by",
    "input_source",
  ]);
  const { data: fallbackData, error: fallbackError } = await createSupabaseAdminClient()
    .from("books")
    .insert(fallbackPayload)
    .select("id")
    .single();
  if (fallbackError) return failure(fallbackError.message);

  await writeInputAuditFromInsert(fallbackData, options);
  return success("ok");
}

async function updateBookRow(id: string, payload: MutationPayload) {
  const { error } = await createSupabaseAdminClient().from("books").update(payload).eq("id", id);
  if (error) return failure(error.message);

  if (typeof payload.verification_status === "string") {
    await writeBookVerificationOverride(id, payload.verification_status as VerificationStatus);
  }

  return success("ok");
}

async function insertThesis(payload: MutationPayload, options?: InsertCatalogOptions) {
  const { data, error } = await createSupabaseAdminClient()
    .from("theses")
    .insert(payload)
    .select("id")
    .single();
  if (!error) {
    await writeInputAuditFromInsert(data, options);
    await writeThesisPdfOverrideFromPayload(data, payload);
    return success("ok");
  }

  if (
    !isMissingInputAuditColumn(error.message) &&
    !isMissingVerificationColumn(error.message) &&
    !isMissingThesisPdfColumn(error.message) &&
    !isMissingStudentNimColumn(error.message)
  ) {
    return failure(error.message);
  }

  const fallbackPayload = omitPayloadKeys(payload, [
    "created_by",
    "input_by",
    "input_source",
    "verification_status",
    "student_nim",
    "pdf_url",
    "pdf_filename",
    "pdf_size",
  ]);
  const { data: fallbackData, error: fallbackError } = await createSupabaseAdminClient()
    .from("theses")
    .insert(fallbackPayload)
    .select("id")
    .single();
  if (fallbackError) return failure(fallbackError.message);

  await writeInputAuditFromInsert(fallbackData, options);
  await writeVerificationOverrideFromInsert(fallbackData, options);
  await writeThesisPdfOverrideFromPayload(fallbackData, payload);
  return success("ok");
}

async function updateThesisRow(id: string, payload: MutationPayload) {
  const { error } = await createSupabaseAdminClient().from("theses").update(payload).eq("id", id);
  if (!error) {
    if (typeof payload.verification_status === "string") {
      await writeThesisVerificationOverride(id, payload.verification_status as VerificationStatus);
    }
    await writeThesisPdfOverrideFromId(id, payload);
    return success("ok");
  }

  if (
    (payloadHasThesisPdf(payload) && isMissingThesisPdfColumn(error.message)) ||
    isMissingStudentNimColumn(error.message)
  ) {
    const fallbackPayload = omitPayloadKeys(payload, [
      "student_nim",
      "pdf_url",
      "pdf_filename",
      "pdf_size",
    ]);
    const { error: fallbackError } = await createSupabaseAdminClient()
      .from("theses")
      .update(fallbackPayload)
      .eq("id", id);

    if (fallbackError) return failure(fallbackError.message);

    if (typeof payload.verification_status === "string") {
      await writeThesisVerificationOverride(id, payload.verification_status as VerificationStatus);
    }
    await writeThesisPdfOverrideFromId(id, payload);
    return success("ok");
  }

  return failure(error.message);
}

function bookPayload(values: BookFormValues, inputBy?: string, actorId?: string): MutationPayload {
  return withInputAudit({
    title: values.title,
    author: values.author,
    category: values.category,
    rack_location: values.rackLocation,
    stock: values.stock,
    status: values.status,
    verification_status: "approved",
    cover_url: optionalPayloadValue(values.coverUrl),
  }, inputBy, actorId);
}

function thesisPayload(values: ThesisFormValues, inputBy?: string, actorId?: string): MutationPayload {
  const payload: MutationPayload = {
    title: values.title,
    student_name: values.studentName,
    student_nim: optionalPayloadValue(values.studentNim),
    year: values.year,
    topic: values.topic,
    abstract: values.abstract,
    supervisor_1: values.supervisor1,
    supervisor_2: values.supervisor2,
    cover_url: optionalPayloadValue(values.coverUrl),
    physical_location: values.physicalLocation,
    access_note: values.accessNote,
    verification_status: values.verificationStatus,
  };

  if (values.pdfUrl.trim()) payload.pdf_url = values.pdfUrl.trim();
  if (values.pdfFilename.trim()) payload.pdf_filename = values.pdfFilename.trim();
  if (values.pdfSize > 0) payload.pdf_size = values.pdfSize;

  return withInputAudit(payload, inputBy, actorId);
}

function validateBook(values: BookFormValues) {
  const bookStatuses = ["tersedia", "dipinjam", "arsip"];

  if (!values.title.trim()) return "Judul buku wajib diisi.";
  if (!values.author.trim()) return "Penulis buku wajib diisi.";
  if (!values.category.trim()) return "Kategori buku wajib diisi.";
  if (!values.rackLocation.trim()) return "Lokasi rak wajib diisi.";
  if (!Number.isFinite(values.stock) || values.stock < 0) {
    return "Stok harus berupa angka 0 atau lebih.";
  }
  if (!bookStatuses.includes(values.status)) return "Status buku tidak valid.";
  return null;
}

function validateThesis(values: ThesisFormValues) {
  if (!values.title.trim()) return "Judul skripsi wajib diisi.";
  if (!values.studentName.trim()) return "Nama mahasiswa wajib diisi.";
  if (!Number.isFinite(values.year) || values.year < 1900) {
    return "Tahun skripsi tidak valid.";
  }
  if (!values.topic.trim()) return "Topik skripsi wajib diisi.";
  if (!values.abstract.trim()) return "Abstrak wajib diisi.";
  if (!values.supervisor1.trim()) return "Dosen pembimbing 1 wajib diisi.";
  if (!values.supervisor2.trim()) return "Dosen pembimbing 2 wajib diisi.";
  if (!values.physicalLocation.trim()) return "Lokasi fisik wajib diisi.";
  if (!values.accessNote.trim()) return "Catatan akses wajib diisi.";
  if (values.pdfSize > maxThesisPdfSize) return "Ukuran file PDF maksimal 5 MB.";
  if (values.pdfFilename && !values.pdfFilename.toLowerCase().endsWith(".pdf")) {
    return "File skripsi harus berekstensi .pdf.";
  }
  return null;
}

function revalidateCatalogPaths() {
  revalidateTag("public-catalog", "max");
  revalidateTag("public-landing", "max");
  revalidatePath("/");
  revalidatePath("/katalog");
  revalidatePath("/dashboard/katalog");
  revalidatePath("/petugas");
  revalidatePath("/books/[id]");
  revalidatePath("/theses/[id]");
}

async function safelyMutateCatalog(
  operation: () => Promise<CatalogActionResult>,
): Promise<CatalogActionResult> {
  try {
    return await operation();
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal memperbarui data katalog.",
    );
  }
}

function success(message: string): CatalogActionResult {
  return { ok: true, message };
}

function failure(message: string): CatalogActionResult {
  return { ok: false, message };
}

function optionalPayloadValue(value: string) {
  return value.trim() || null;
}

function withInputAudit(payload: MutationPayload, inputBy?: string, actorId?: string): MutationPayload {
  return {
    ...payload,
    ...(actorId ? { created_by: actorId } : {}),
    ...(inputBy ? { input_source: "Dasbor", input_by: inputBy } : {}),
  };
}

function isMissingThesisPdfColumn(message: string) {
  return (
    message.includes("pdf_url") ||
    message.includes("pdf_filename") ||
    message.includes("pdf_size")
  );
}

function isMissingStudentNimColumn(message: string) {
  return message.includes("student_nim") || message.includes("schema cache");
}

function payloadHasThesisPdf(payload: MutationPayload) {
  return Boolean(payload.pdf_url || payload.pdf_filename || payload.pdf_size);
}

function omitPayloadKeys(payload: MutationPayload, keys: string[]) {
  const nextPayload = { ...payload };

  keys.forEach((key) => {
    delete nextPayload[key];
  });

  return nextPayload;
}

async function writeThesisPdfOverrideFromPayload(data: unknown, payload: MutationPayload) {
  const id = textId(data);
  if (!id) return;

  await writeThesisPdfOverrideFromId(id, payload);
}

async function writeThesisPdfOverrideFromId(id: string, payload: MutationPayload) {
  const pdfUrl = typeof payload.pdf_url === "string" ? payload.pdf_url.trim() : "";
  if (!pdfUrl) return;

  await writeThesisPdfOverride(id, {
    url: pdfUrl,
    filename: typeof payload.pdf_filename === "string" ? payload.pdf_filename : undefined,
    size: typeof payload.pdf_size === "number" ? payload.pdf_size : undefined,
  });
}

async function getInputActorName(userId: string, fallbackEmail?: string | null) {
  const { data } = await createSupabaseAdminClient()
    .from("profiles")
    .select("full_name,email")
    .eq("id", userId)
    .maybeSingle();

  return data?.full_name ?? data?.email ?? fallbackEmail ?? "Petugas Ruang Baca";
}

function isMissingInputAuditColumn(message: string) {
  return (
    message.includes("created_by") ||
    message.includes("input_by") ||
    message.includes("input_source") ||
    message.includes("schema cache")
  );
}

async function writeInputAuditFromInsert(data: unknown, options?: InsertCatalogOptions) {
  const id = textId(data);
  if (!id || !options?.inputBy) return;

  try {
    await writeCatalogInputOverride(options.type, id, {
      source: "Dasbor",
      inputBy: options.inputBy,
    });
  } catch (error) {
    console.error("[catalog-actions] Failed to write input audit override", {
      type: options.type,
      id,
      error: error instanceof Error ? error.message : error,
    });
  }
}

async function writeVerificationOverrideFromInsert(data: unknown, options?: InsertCatalogOptions) {
  const id = textId(data);
  if (!id || !options?.verificationStatus || options.type !== "thesis") return;

  try {
    await writeThesisVerificationOverride(id, options.verificationStatus);
  } catch (error) {
    console.error("[catalog-actions] Failed to write thesis verification override", {
      id,
      error: error instanceof Error ? error.message : error,
    });
  }
}

function textId(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : "";
}
