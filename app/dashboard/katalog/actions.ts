"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  BookFormValues,
  CatalogActionResult,
  ThesisFormValues,
} from "@/lib/catalog-crud-types";
import type { Book, Thesis } from "@/lib/types";

type TableName = "books" | "theses";
type MutationPayload = Record<string, unknown>;

export async function createBook(values: BookFormValues): Promise<CatalogActionResult> {
  const validationError = validateBook(values);
  if (validationError) return failure(validationError);

  const payloads = bookPayloadVariants(values);
  const result = await insertWithFallback("books", payloads);
  revalidateCatalogPaths();

  return result.ok
    ? success("Buku berhasil ditambahkan.")
    : failure(result.message);
}

export async function createThesis(values: ThesisFormValues): Promise<CatalogActionResult> {
  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const payloads = thesisPayloadVariants(values);
  const result = await insertWithFallback("theses", payloads);
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

  const result = await updateWithFallback("books", id, bookPayloadVariants(values));
  revalidateCatalogPaths();

  return result.ok ? success("Buku berhasil diperbarui.") : failure(result.message);
}

export async function updateThesis(
  id: Thesis["id"],
  values: ThesisFormValues,
): Promise<CatalogActionResult> {
  const validationError = validateThesis(values);
  if (validationError) return failure(validationError);

  const result = await updateWithFallback("theses", id, thesisPayloadVariants(values));
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

async function insertWithFallback(table: TableName, payloads: MutationPayload[]) {
  let lastMessage = "Data gagal disimpan ke Supabase.";

  for (const payload of payloads) {
    const { error } = await getSupabaseClient().from(table).insert(payload);
    if (!error) return success("ok");
    lastMessage = error.message;
  }

  return failure(lastMessage);
}

async function updateWithFallback(
  table: TableName,
  id: string,
  payloads: MutationPayload[],
) {
  let lastMessage = "Data gagal diperbarui di Supabase.";

  for (const payload of payloads) {
    const { error } = await getSupabaseClient().from(table).update(payload).eq("id", id);
    if (!error) return success("ok");
    lastMessage = error.message;
  }

  return failure(lastMessage);
}

function bookPayloadVariants(values: BookFormValues): MutationPayload[] {
  const currentYear = new Date().getFullYear();

  return [
    {
      title: values.title,
      author: values.author,
      category: values.category,
      location: values.location,
      stock: values.stock,
      available: values.stock,
      year: currentYear,
      keywords: [values.category],
      verification_status: values.status,
    },
    {
      title: values.title,
      author: values.author,
      category: values.category,
      location: values.location,
      stock: values.stock,
      status: values.status,
    },
    {
      title: values.title,
      author: values.author,
      category: values.category,
      location: values.location,
      stock: values.stock,
      verification_status: values.status,
    },
    {
      judul: values.title,
      penulis: values.author,
      kategori: values.category,
      lokasi: values.location,
      jumlah_stok: values.stock,
      status: values.status,
    },
  ];
}

function thesisPayloadVariants(values: ThesisFormValues): MutationPayload[] {
  return [
    {
      title: values.title,
      author_name: values.authorName,
      year: values.year,
      graduation_year: values.year,
      keywords: [values.topic],
      abstract: values.abstract,
      supervisor1: values.supervisor1,
      supervisor2: values.supervisor2,
      verification_status: values.verificationStatus,
    },
    {
      title: values.title,
      author_name: values.authorName,
      year: values.year,
      topic: values.topic,
      abstract: values.abstract,
      supervisor_1: values.supervisor1,
      supervisor_2: values.supervisor2,
      verification_status: values.verificationStatus,
    },
    {
      title: values.title,
      authorName: values.authorName,
      year: values.year,
      keywords: [values.topic],
      abstract: values.abstract,
      supervisor1: values.supervisor1,
      supervisor2: values.supervisor2,
      verificationStatus: values.verificationStatus,
    },
    {
      judul: values.title,
      nama_mahasiswa: values.authorName,
      tahun: values.year,
      topik: values.topic,
      abstrak: values.abstract,
      pembimbing_1: values.supervisor1,
      pembimbing_2: values.supervisor2,
      status_verifikasi: values.verificationStatus,
    },
  ];
}

function validateBook(values: BookFormValues) {
  if (!values.title.trim()) return "Judul buku wajib diisi.";
  if (!values.author.trim()) return "Penulis buku wajib diisi.";
  if (!values.category.trim()) return "Kategori buku wajib diisi.";
  if (!values.location.trim()) return "Lokasi rak wajib diisi.";
  if (!Number.isFinite(values.stock) || values.stock < 0) {
    return "Stok harus berupa angka 0 atau lebih.";
  }
  return null;
}

function validateThesis(values: ThesisFormValues) {
  if (!values.title.trim()) return "Judul skripsi wajib diisi.";
  if (!values.authorName.trim()) return "Nama mahasiswa wajib diisi.";
  if (!Number.isFinite(values.year) || values.year < 1900) {
    return "Tahun skripsi tidak valid.";
  }
  if (!values.topic.trim()) return "Topik skripsi wajib diisi.";
  if (!values.abstract.trim()) return "Abstrak wajib diisi.";
  if (!values.supervisor1.trim()) return "Dosen pembimbing 1 wajib diisi.";
  if (!values.supervisor2.trim()) return "Dosen pembimbing 2 wajib diisi.";
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
