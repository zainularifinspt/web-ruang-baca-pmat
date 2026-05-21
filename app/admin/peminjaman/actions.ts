"use server";

import { revalidatePath } from "next/cache";
import { requireStaffRole } from "@/lib/auth-guards";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { formatLoanDatabaseError } from "@/lib/loans";
import { normalizePhoneNumber } from "@/lib/whatsapp-drafts";
import { sendLoanSuccessNotification } from "@/lib/whatsapp";
import type { LoanItemType } from "@/lib/loans";

export type LoanActionResult = {
  ok: boolean;
  message: string;
  whatsappOk?: boolean;
};

export type CreateLoanInput = {
  borrowerName: string;
  phone: string;
  identityNumber?: string;
  borrowerType?: string;
  itemType: LoanItemType;
  itemId: string;
  loanDate: string;
  dueDate: string;
  notes?: string;
};

export async function createLoan(input: CreateLoanInput): Promise<LoanActionResult> {
  const auth = await requireStaffRole(["admin", "dosen", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const validationError = validateLoanInput(input);
  if (validationError) return failure(validationError);

  const phone = normalizePhoneNumber(input.phone);
  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const openLoan = await findOpenLoan(input.itemType, input.itemId);
    if (openLoan) {
      return failure("Koleksi ini sedang dipinjam dan belum dikembalikan.");
    }

    const borrower = await findOrCreateBorrower({
      name: input.borrowerName.trim(),
      phone,
      identityNumber: optionalValue(input.identityNumber),
      borrowerType: optionalValue(input.borrowerType),
    });

    if (!borrower.ok) return failure(borrower.message);

    const loanPayload = {
      borrower_id: borrower.id,
      item_type: input.itemType,
      book_id: input.itemType === "book" ? input.itemId : null,
      thesis_id: input.itemType === "thesis" ? input.itemId : null,
      loan_date: input.loanDate,
      due_date: input.dueDate,
      status: "active",
      notes: optionalValue(input.notes),
      created_by: auth.user.id,
    };

    const { data: loan, error: loanError } = await supabaseAdmin
      .from("loans")
      .insert(loanPayload)
      .select("id")
      .single();

    if (loanError) {
      if (isOpenLoanConflict(loanError.message)) {
        return failure("Koleksi ini sedang dipinjam dan belum dikembalikan.");
      }

      return failure(formatLoanDatabaseError(loanError.message));
    }

    if (input.itemType === "book") {
      await supabaseAdmin.from("books").update({ status: "dipinjam" }).eq("id", input.itemId);
    }

    const itemTitle = await getCollectionTitle(input.itemType, input.itemId);
    const whatsappResult = await sendLoanSuccessNotification({
      phone,
      borrowerName: input.borrowerName.trim(),
      itemTitle,
      dueDate: input.dueDate,
    });

    if (whatsappResult.ok) {
      await supabaseAdmin
        .from("loans")
        .update({ success_notified_at: new Date().toISOString() })
        .eq("id", textId(loan));
    } else {
      console.error("[loans] Loan success WhatsApp notification failed", {
        loanId: textId(loan),
        message: whatsappResult.message,
      });
    }

    revalidateLoanPaths();

    return {
      ok: true,
      whatsappOk: whatsappResult.ok,
      message: whatsappResult.ok
        ? "Peminjaman berhasil dicatat dan notifikasi WhatsApp sedang dikirim."
        : "Peminjaman berhasil dicatat, tetapi notifikasi WhatsApp gagal dikirim. Silakan cek konfigurasi WhatsApp.",
    };
  } catch (error) {
    console.error("[loans] Failed to create loan", {
      error: error instanceof Error ? error.message : error,
    });
    return failure(
      error instanceof Error
        ? formatLoanDatabaseError(error.message)
        : "Gagal mencatat peminjaman.",
    );
  }
}

export async function markLoanReturned(id: string): Promise<LoanActionResult> {
  const auth = await requireStaffRole(["admin", "dosen", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: loan, error: loanError } = await supabaseAdmin
    .from("loans")
    .select("id,item_type,book_id,thesis_id,status")
    .eq("id", id)
    .maybeSingle();

  if (loanError) return failure(formatLoanDatabaseError(loanError.message));
  if (!loan) return failure("Data peminjaman tidak ditemukan.");
  if (loan.status === "returned") return failure("Peminjaman sudah ditandai dikembalikan.");

  const { error } = await supabaseAdmin
    .from("loans")
    .update({ status: "returned", returned_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return failure(formatLoanDatabaseError(error.message));

  if (loan.item_type === "book" && loan.book_id) {
    await supabaseAdmin.from("books").update({ status: "tersedia" }).eq("id", loan.book_id);
  }

  revalidateLoanPaths();
  return success("Peminjaman ditandai sudah dikembalikan.");
}

export async function cancelLoan(id: string): Promise<LoanActionResult> {
  const auth = await requireStaffRole(["admin", "dosen", "petugas"]);
  if (!auth.ok) return failure(auth.message);

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: loan, error: loanError } = await supabaseAdmin
    .from("loans")
    .select("id,item_type,book_id,status")
    .eq("id", id)
    .maybeSingle();

  if (loanError) return failure(formatLoanDatabaseError(loanError.message));
  if (!loan) return failure("Data peminjaman tidak ditemukan.");
  if (loan.status === "returned") return failure("Peminjaman yang sudah dikembalikan tidak dapat dibatalkan.");

  const { error } = await supabaseAdmin
    .from("loans")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return failure(formatLoanDatabaseError(error.message));

  if (loan.item_type === "book" && loan.book_id) {
    await supabaseAdmin.from("books").update({ status: "tersedia" }).eq("id", loan.book_id);
  }

  revalidateLoanPaths();
  return success("Peminjaman dibatalkan.");
}

async function findOpenLoan(itemType: LoanItemType, itemId: string) {
  const column = itemType === "book" ? "book_id" : "thesis_id";
  const { data, error } = await createSupabaseAdminClient()
    .from("loans")
    .select("id")
    .eq(column, itemId)
    .in("status", ["active", "overdue"])
    .maybeSingle();

  if (error) {
    throw new Error(formatLoanDatabaseError(error.message));
  }

  return data;
}

async function findOrCreateBorrower(input: {
  name: string;
  phone: string;
  identityNumber: string | null;
  borrowerType: string | null;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("borrowers")
    .select("id")
    .eq("phone", input.phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return { ok: false as const, message: formatLoanDatabaseError(existingError.message) };

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("borrowers")
      .update({
        name: input.name,
        identity_number: input.identityNumber,
        borrower_type: input.borrowerType,
      })
      .eq("id", existing.id);

    return error
      ? { ok: false as const, message: formatLoanDatabaseError(error.message) }
      : { ok: true as const, id: existing.id as string };
  }

  const { data, error } = await supabaseAdmin
    .from("borrowers")
    .insert({
      name: input.name,
      phone: input.phone,
      identity_number: input.identityNumber,
      borrower_type: input.borrowerType,
    })
    .select("id")
    .single();

  return error
    ? { ok: false as const, message: formatLoanDatabaseError(error.message) }
    : { ok: true as const, id: textId(data) };
}

async function getCollectionTitle(itemType: LoanItemType, itemId: string) {
  const table = itemType === "book" ? "books" : "theses";
  const { data } = await createSupabaseAdminClient()
    .from(table)
    .select("title")
    .eq("id", itemId)
    .maybeSingle();

  return data?.title?.trim() || "Koleksi";
}

function validateLoanInput(input: CreateLoanInput) {
  if (!input.borrowerName.trim()) return "Nama peminjam wajib diisi.";
  const phone = normalizePhoneNumber(input.phone);
  if (!phone || !/^62\d{8,15}$/.test(phone)) return "Nomor HP/WhatsApp wajib valid.";
  if (input.itemType !== "book" && input.itemType !== "thesis") return "Tipe koleksi tidak valid.";
  if (!input.itemId) return "Koleksi wajib dipilih.";
  if (!input.loanDate) return "Tanggal pinjam wajib diisi.";
  if (!input.dueDate) return "Tanggal harus kembali wajib diisi.";
  if (input.dueDate < input.loanDate) return "Tanggal kembali tidak boleh sebelum tanggal pinjam.";
  return null;
}

function isOpenLoanConflict(message: string) {
  return message.includes("loans_one_open_book_idx") || message.includes("loans_one_open_thesis_idx");
}

function optionalValue(value?: string) {
  return value?.trim() || null;
}

function textId(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" ? id : "";
}

function revalidateLoanPaths() {
  revalidatePath("/admin/peminjaman");
  revalidatePath("/admin/loans");
  revalidatePath("/dashboard/katalog");
  revalidatePath("/petugas");
  revalidatePath("/katalog");
}

function success(message: string): LoanActionResult {
  return { ok: true, message };
}

function failure(message: string): LoanActionResult {
  return { ok: false, message };
}
