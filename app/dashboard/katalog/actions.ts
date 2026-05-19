"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  BookFormValues,
  CatalogActionResult,
  ThesisFormValues,
} from "@/lib/catalog-crud-types";
import type { Book, Thesis } from "@/lib/types";

type MutationPayload = Record<string, unknown>;

export async function createBook(values: BookFormValues): Promise<CatalogActionResult> {
  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const result = await insertBook(bookPayload(values));
  revalidateCatalogPaths();

  return result.ok
    ? success("Buku berhasil ditambahkan.")
    : failure(result.message);
}

export async function createThesis(values: ThesisFormValues): Promise<CatalogActionResult> {
  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const result = await insertThesis(thesisPayload(values));
  revalidateCatalogPaths();

  return result.ok
    ? success("Skripsi berhasil ditambahkan.")
    : failure(result.message);
}

export async function updateBook(
  id: Book["id"],
  values: BookFormValues,
): Promise<CatalogActionResult> {
  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const result = await updateBookRow(id, bookPayload(values));
  revalidateCatalogPaths();

  return result.ok ? success("Buku berhasil diperbarui.") : failure(result.message);
}

export async function updateThesis(
  id: Thesis["id"],
  values: ThesisFormValues,
): Promise<CatalogActionResult> {
  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const result = await updateThesisRow(id, thesisPayload(values));
  revalidateCatalogPaths();

  return result.ok ? success("Skripsi berhasil diperbarui.") : failure(result.message);
}

export async function deleteCollection(
  type: Book["type"] | Thesis["type"],
  id: string,
): Promise<CatalogActionResult> {
  const table = type === "book" ? "books" : "theses";
  const { error } = await getSupabaseClient().from(table).delete().eq("id", id);

  revalidateCatalogPaths();

  return error
    ? failure(error.message)
    : success(type === "book" ? "Buku berhasil dihapus." : "Skripsi berhasil dihapus.");
}

async function insertBook(payload: MutationPayload) {
  const { error } = await getSupabaseClient().from("books").insert(payload);
  return error ? failure(error.message) : success("ok");
}

async function updateBookRow(id: string, payload: MutationPayload) {
  const { error } = await getSupabaseClient().from("books").update(payload).eq("id", id);
  return error ? failure(error.message) : success("ok");
}

async function insertThesis(payload: MutationPayload) {
  const { error } = await getSupabaseClient().from("theses").insert(payload);
  return error ? failure(error.message) : success("ok");
}

async function updateThesisRow(id: string, payload: MutationPayload) {
  const { error } = await getSupabaseClient().from("theses").update(payload).eq("id", id);
  return error ? failure(error.message) : success("ok");
}

function bookPayload(values: BookFormValues): MutationPayload {
  return {
    title: values.title,
    author: values.author,
    category: values.category,
    rack_location: values.rackLocation,
    stock: values.stock,
    status: values.status,
    cover_url: optionalPayloadValue(values.coverUrl),
  };
}

function thesisPayload(values: ThesisFormValues): MutationPayload {
  return {
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
