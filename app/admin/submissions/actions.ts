"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import {
  writeBookVerificationOverride,
  writeThesisVerificationOverride,
} from "@/lib/catalog-verification-store";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { DraftSubmissionType } from "@/lib/whatsapp-drafts";

export type DraftSubmissionInput = {
  id: string;
  title: string;
  author: string;
  year?: string;
  category?: string;
  description?: string;
};

export type DraftSubmissionActionResult = {
  ok: boolean;
  message: string;
};

type DraftSubmissionRow = {
  id: string;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
  raw_message: string | null;
  status: "pending" | "approved" | "rejected";
};

const defaultAccessNote =
  "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.";

export async function updateDraftSubmission(
  input: DraftSubmissionInput,
): Promise<DraftSubmissionActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const id = input.id.trim();
  if (!id) return failure("Submission tidak valid.");

  const year = parseYear(input.year);
  if (input.year?.trim() && !year) return failure("Tahun harus berupa angka yang valid.");

  try {
    const { error } = await createSupabaseAdminClient()
      .from("draft_submissions")
      .update({
        title: input.title.trim() || null,
        author: input.author.trim() || null,
        year,
        category: input.category?.trim() || null,
        description: input.description?.trim() || null,
      })
      .eq("id", id);

    if (error) return failure(error.message);

    revalidateSubmissionPaths();
    return { ok: true, message: "Draft submission diperbarui." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal memperbarui submission.");
  }
}

export async function approveDraftSubmission(id: string): Promise<DraftSubmissionActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const normalizedId = id.trim();
  if (!normalizedId) return failure("Submission tidak valid.");

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: draft, error: draftError } = await supabaseAdmin
      .from("draft_submissions")
      .select("id,type,title,author,year,category,description,raw_message,status")
      .eq("id", normalizedId)
      .maybeSingle();

    if (draftError) return failure(draftError.message);
    if (!draft) return failure("Submission tidak ditemukan.");

    const validationError = validateDraftForApproval(draft as DraftSubmissionRow);
    if (validationError) return failure(validationError);

    const row = draft as DraftSubmissionRow;
    const insertResult =
      row.type === "book"
        ? await insertApprovedBook(row)
        : await insertApprovedThesis(row);

    if (!insertResult.ok) return insertResult;

    const { error: updateError } = await supabaseAdmin
      .from("draft_submissions")
      .update({ status: "approved" })
      .eq("id", normalizedId);

    if (updateError) return failure(updateError.message);

    revalidateSubmissionPaths();
    revalidateTag("public-catalog", "max");
    revalidateTag("public-landing", "max");
    revalidatePath("/");
    revalidatePath("/katalog");
    revalidatePath("/dashboard/katalog");
    revalidatePath("/dashboard/verifikasi");

    return { ok: true, message: "Submission disetujui dan masuk katalog." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal menyetujui submission.");
  }
}

export async function rejectDraftSubmission(id: string): Promise<DraftSubmissionActionResult> {
  const auth = await requireStaffRole(["admin"]);
  if (!auth.ok) return failure(auth.message);

  const normalizedId = id.trim();
  if (!normalizedId) return failure("Submission tidak valid.");

  try {
    const { error } = await createSupabaseAdminClient()
      .from("draft_submissions")
      .update({ status: "rejected" })
      .eq("id", normalizedId);

    if (error) return failure(error.message);

    revalidateSubmissionPaths();
    return { ok: true, message: "Submission ditolak." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Gagal menolak submission.");
  }
}

async function insertApprovedBook(row: DraftSubmissionRow) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("books")
    .insert({
      title: row.title,
      author: row.author,
      category: row.category || "Buku",
      rack_location: "Ruang Baca",
      stock: 1,
      status: "tersedia",
    })
    .select("id")
    .single();

  if (error) return failure(error.message);

  const bookId = textId(data);
  if (bookId) {
    await markBookApproved(bookId);
  }

  return { ok: true, message: "ok" };
}

async function markBookApproved(bookId: string) {
  const { error } = await createSupabaseAdminClient()
    .from("books")
    .update({ verification_status: "approved" })
    .eq("id", bookId);

  if (!error) return;

  if (isMissingVerificationColumn(error.message)) {
    console.warn(
      "[draft-submissions] books.verification_status belum ada di schema cache. Using verification override fallback.",
    );

    try {
      await writeBookVerificationOverride(bookId, "approved");
    } catch (overrideError) {
      console.error("[draft-submissions] Failed to write book verification override", {
        bookId,
        error: overrideError instanceof Error ? overrideError.message : overrideError,
      });
    }

    return;
  }

  console.error("[draft-submissions] Failed to mark approved book verification_status", {
    bookId,
    error: error.message,
  });
}

async function insertApprovedThesis(row: DraftSubmissionRow) {
  const { data, error } = await createSupabaseAdminClient()
    .from("theses")
    .insert({
      title: row.title,
      student_name: row.author,
      year: row.year ?? new Date().getFullYear(),
      topic: row.category || "Skripsi",
      abstract: row.description,
      supervisor_1: "-",
      supervisor_2: "-",
      physical_location: "Ruang Baca",
      access_note: defaultAccessNote,
    })
    .select("id")
    .single();

  if (error) return failure(error.message);

  const thesisId = textId(data);
  if (thesisId) {
    await markThesisApproved(thesisId);
  }

  return { ok: true, message: "ok" };
}

async function markThesisApproved(thesisId: string) {
  const { error } = await createSupabaseAdminClient()
    .from("theses")
    .update({ verification_status: "approved" })
    .eq("id", thesisId);

  if (!error) return;

  if (isMissingVerificationColumn(error.message)) {
    console.warn(
      "[draft-submissions] theses.verification_status belum ada di schema cache. Using verification override fallback.",
    );

    try {
      await writeThesisVerificationOverride(thesisId, "approved");
    } catch (overrideError) {
      console.error("[draft-submissions] Failed to write thesis verification override", {
        thesisId,
        error: overrideError instanceof Error ? overrideError.message : overrideError,
      });
    }

    return;
  }

  console.error("[draft-submissions] Failed to mark approved thesis verification_status", {
    thesisId,
    error: error.message,
  });
}

function validateDraftForApproval(row: DraftSubmissionRow) {
  if (row.status === "approved") return "Submission ini sudah disetujui.";
  if (!row.type) return "Tipe submission belum valid. Perbaiki format pesan terlebih dahulu.";
  if (!row.title?.trim()) return "Judul wajib diisi sebelum approve.";
  if (!row.author?.trim()) return row.type === "thesis" ? "Nama mahasiswa wajib diisi sebelum approve." : "Penulis wajib diisi sebelum approve.";
  if (row.type === "book" && !row.category?.trim()) return "Kategori buku wajib diisi sebelum approve.";
  if (row.type === "thesis" && !row.year) return "Tahun skripsi wajib diisi sebelum approve.";
  if (row.type === "thesis" && !row.description?.trim()) return "Abstrak skripsi wajib diisi sebelum approve.";
  return null;
}

function parseYear(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 ? parsed : null;
}

function isMissingVerificationColumn(message: string) {
  return message.includes("verification_status") || message.includes("schema cache");
}

function textId(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : "";
}

function revalidateSubmissionPaths() {
  revalidatePath("/admin/submissions");
  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard/verifikasi");
}

function failure(message: string): DraftSubmissionActionResult {
  return { ok: false, message };
}
