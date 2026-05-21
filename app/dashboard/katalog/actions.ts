"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import {
  writeCatalogInputOverride,
  writeBookVerificationOverride,
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

export async function createBook(values: BookFormValues): Promise<CatalogActionResult> {
  const auth = await requireStaffRole(["admin", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const inputBy = await getInputActorName(auth.user.id, auth.user.email);
  const result = await safelyMutateCatalog(() =>
    insertBook(bookPayload(values, inputBy), { type: "book", inputBy }),
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
    insertThesis(thesisPayload(values, inputBy), {
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

  const { input_by: _inputBy, input_source: _inputSource, ...fallbackPayload } = payload;
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
    return success("ok");
  }

  if (!isMissingInputAuditColumn(error.message) && !isMissingVerificationColumn(error.message)) {
    return failure(error.message);
  }

  const {
    input_by: _inputBy,
    input_source: _inputSource,
    verification_status: _verificationStatus,
    ...fallbackPayload
  } = payload;
  const { data: fallbackData, error: fallbackError } = await createSupabaseAdminClient()
    .from("theses")
    .insert(fallbackPayload)
    .select("id")
    .single();
  if (fallbackError) return failure(fallbackError.message);

  await writeInputAuditFromInsert(fallbackData, options);
  await writeVerificationOverrideFromInsert(fallbackData, options);
  return success("ok");
}

async function updateThesisRow(id: string, payload: MutationPayload) {
  const { error } = await createSupabaseAdminClient().from("theses").update(payload).eq("id", id);
  return error ? failure(error.message) : success("ok");
}

function bookPayload(values: BookFormValues, inputBy?: string): MutationPayload {
  return withInputAudit({
    title: values.title,
    author: values.author,
    category: values.category,
    rack_location: values.rackLocation,
    stock: values.stock,
    status: values.status,
    cover_url: optionalPayloadValue(values.coverUrl),
  }, inputBy);
}

function thesisPayload(values: ThesisFormValues, inputBy?: string): MutationPayload {
  return withInputAudit({
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
  }, inputBy);
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

function withInputAudit(payload: MutationPayload, inputBy?: string): MutationPayload {
  if (!inputBy) return payload;

  return {
    ...payload,
    input_source: "Dasbor",
    input_by: inputBy,
  };
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
  return message.includes("input_by") || message.includes("input_source") || message.includes("schema cache");
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
