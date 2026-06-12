"use server";

import { revalidatePath } from "next/cache";
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
const maxThesisPdfSize = 5 * 1024 * 1024;

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

export async function syncThesisFromGoogleSheets(): Promise<CatalogActionResult & { count?: number }> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  try {
    const url = "https://docs.google.com/spreadsheets/d/1b7B0V2gu1lADwzGHF1F-TIno6vP2mQQFg4IweiOZAaU/export?format=csv&gid=750085679";
    const response = await fetch(url);
    if (!response.ok) return failure("Gagal mengunduh data dari Google Sheets.");
    
    const buffer = await response.arrayBuffer();
    const workbook = read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = utils.sheet_to_json<Record<string, any>>(sheet, { raw: false });

    const supabase = createSupabaseAdminClient();
    const { data: existingTheses, error: fetchError } = await supabase
      .from("theses")
      .select("title, student_name");

    if (fetchError) return failure(fetchError.message);

    const existingMap = new Set(
      existingTheses.map((t) => `${t.title.trim().toLowerCase()}|${t.student_name.trim().toLowerCase()}`)
    );

    let addedCount = 0;
    const inputBy = await getInputActorName(auth.user.id, auth.user.email);

    for (const row of rows) {
      const title = row["JUDUL SKRIPSI"]?.toString() || "";
      const studentName = row["NAMA"]?.toString() || "";
      
      if (!title || !studentName) continue;

      const key = `${title.trim().toLowerCase()}|${studentName.trim().toLowerCase()}`;
      if (existingMap.has(key)) continue;

      const dateStr = row["TANGGAL YUDISIUM (SESUAI SKL)"]?.toString() || "";
      let year = new Date().getFullYear();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
      }

      const thesisValues: ThesisFormValues = {
        title: title.trim(),
        studentName: studentName.trim(),
        year,
        topic: "Pendidikan Matematika",
        abstract: "Abstrak belum tersedia",
        supervisor1: row["PEMBIMBING 1"]?.toString().trim() || "-",
        supervisor2: row["PEMBIMBING 2"]?.toString().trim() || "-",
        physicalLocation: "Ruang Baca PMAT",
        accessNote: "Dapat dibaca di tempat",
        coverUrl: "",
        pdfUrl: row["File Skripsi PDF"]?.toString().trim() || "",
        pdfFilename: "",
        pdfSize: 0,
        verificationStatus: "approved",
      };

      const result = await insertThesis(thesisPayload(thesisValues, inputBy, auth.user.id), {
        type: "thesis",
        inputBy,
        verificationStatus: "approved",
      });

      if (result.ok) {
        addedCount++;
        existingMap.add(key);
      }
    }

    revalidateCatalogPaths();
    return { ok: true, message: `Berhasil sinkronisasi. ${addedCount} data skripsi baru ditambahkan.`, count: addedCount };

  } catch (error) {
    return failure(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
  }
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
  return error ? failure(error.message) : success("ok");
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
    !isMissingThesisPdfColumn(error.message)
  ) {
    return failure(error.message);
  }

  const fallbackPayload = omitPayloadKeys(payload, [
    "created_by",
    "input_by",
    "input_source",
    "verification_status",
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
  if (!error) return success("ok");

  if (payloadHasThesisPdf(payload) && isMissingThesisPdfColumn(error.message)) {
    const fallbackPayload = omitPayloadKeys(payload, [
      "pdf_url",
      "pdf_filename",
      "pdf_size",
    ]);
    const { error: fallbackError } = await createSupabaseAdminClient()
      .from("theses")
      .update(fallbackPayload)
      .eq("id", id);

    if (fallbackError) return failure(fallbackError.message);

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
    cover_url: optionalPayloadValue(values.coverUrl),
  }, inputBy, actorId);
}

function thesisPayload(values: ThesisFormValues, inputBy?: string, actorId?: string): MutationPayload {
  const payload: MutationPayload = {
    title: values.title,
    student_name: values.studentName,
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
