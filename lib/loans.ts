import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchCatalogData } from "@/lib/supabase";
import type { Book, Thesis } from "@/lib/types";

export type LoanStatus = "active" | "returned" | "overdue" | "cancelled";
export type LoanItemType = "book" | "thesis";

export type LoanCollectionOption = {
  id: string;
  title: string;
  type: LoanItemType;
  subtitle: string;
};

export type LoanListItem = {
  id: string;
  borrowerName: string;
  borrowerPhone: string;
  identityNumber: string | null;
  borrowerType: string | null;
  itemType: LoanItemType;
  itemTitle: string;
  itemSubtitle: string;
  loanDate: string;
  dueDate: string;
  returnedAt: string | null;
  status: LoanStatus;
  notes: string | null;
  successNotifiedAt: string | null;
  reminderH1SentAt: string | null;
  reminderDueSentAt: string | null;
  createdAt: string;
};

type UnknownRow = Record<string, unknown>;

export async function fetchLoansPageData({
  search = "",
  status = "all",
}: {
  search?: string;
  status?: string;
} = {}) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const [{ data, error }, activeTargets, catalog] = await Promise.all([
      supabaseAdmin
        .from("loans")
        .select("*, borrowers(*), books(id,title,author,category), theses(id,title,student_name,topic)")
        .order("created_at", { ascending: false }),
      fetchOpenLoanTargets(),
      fetchCatalogData({ visibility: "internal" }),
    ]);

    if (error) {
      return emptyLoansData(formatLoanDatabaseError(error.message));
    }

    const allLoans = ((data ?? []) as UnknownRow[]).map(mapLoanRow);
    const filteredLoans = filterLoans(allLoans, search, status);

    return {
      loans: filteredLoans,
      activeCount: allLoans.filter((loan) => loan.status === "active").length,
      overdueCount: allLoans.filter((loan) => loan.status === "overdue").length,
      returnedCount: allLoans.filter((loan) => loan.status === "returned").length,
      cancelledCount: allLoans.filter((loan) => loan.status === "cancelled").length,
      availableBooks: buildBookOptions(catalog.books, activeTargets.bookIds),
      availableTheses: buildThesisOptions(catalog.theses, activeTargets.thesisIds),
      error: catalog.error,
    };
  } catch (error) {
    return emptyLoansData(
      error instanceof Error
        ? formatLoanDatabaseError(error.message)
        : "Gagal memuat data peminjaman.",
    );
  }
}

export async function fetchLoanSummary() {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("loans")
      .select("status");

    if (error) return { active: 0, overdue: 0 };

    const rows = (data ?? []) as Array<{ status: LoanStatus | null }>;
    return {
      active: rows.filter((row) => row.status === "active").length,
      overdue: rows.filter((row) => row.status === "overdue").length,
    };
  } catch {
    return { active: 0, overdue: 0 };
  }
}

export async function fetchOpenLoanTargets() {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("loans")
      .select("book_id,thesis_id,status")
      .in("status", ["active", "overdue"]);

    if (error) {
      console.error("[loans] Failed to load open loan targets", {
        error: formatLoanDatabaseError(error.message),
      });
      return { bookIds: new Set<string>(), thesisIds: new Set<string>() };
    }

    const rows = (data ?? []) as Array<{ book_id: string | null; thesis_id: string | null }>;
    return {
      bookIds: new Set(rows.map((row) => row.book_id).filter(Boolean) as string[]),
      thesisIds: new Set(rows.map((row) => row.thesis_id).filter(Boolean) as string[]),
    };
  } catch (error) {
    console.error("[loans] Failed to load open loan targets", {
      error: error instanceof Error ? error.message : error,
    });
    return { bookIds: new Set<string>(), thesisIds: new Set<string>() };
  }
}

function emptyLoansData(error?: string) {
  return {
    loans: [] as LoanListItem[],
    activeCount: 0,
    overdueCount: 0,
    returnedCount: 0,
    cancelledCount: 0,
    availableBooks: [] as LoanCollectionOption[],
    availableTheses: [] as LoanCollectionOption[],
    error,
  };
}

export function formatLoanDatabaseError(message: string) {
  if (
    message.includes("public.loans") ||
    message.includes("public.borrowers") ||
    message.includes("schema cache")
  ) {
    return "Tabel peminjaman belum dibuat. Jalankan migration peminjaman terlebih dahulu.";
  }

  return message;
}

function filterLoans(loans: LoanListItem[], search: string, status: string) {
  const normalizedSearch = search.trim().toLowerCase();
  return loans.filter((loan) => {
    const matchesStatus = status === "all" || !status || loan.status === status;
    const matchesSearch =
      !normalizedSearch ||
      [
        loan.borrowerName,
        loan.borrowerPhone,
        loan.itemTitle,
        loan.itemSubtitle,
        loan.identityNumber ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}

function buildBookOptions(books: Book[], openBookIds: Set<string>): LoanCollectionOption[] {
  return books
    .filter((book) => book.verificationStatus === "approved")
    .filter((book) => !openBookIds.has(book.id))
    .filter((book) => book.status !== "arsip" && book.status !== "dipinjam")
    .map((book) => ({
      id: book.id,
      type: "book",
      title: book.title,
      subtitle: [book.author, book.category].filter(Boolean).join(" - "),
    }));
}

function buildThesisOptions(theses: Thesis[], openThesisIds: Set<string>): LoanCollectionOption[] {
  return theses
    .filter((thesis) => thesis.verificationStatus === "approved")
    .filter((thesis) => !openThesisIds.has(thesis.id))
    .map((thesis) => ({
      id: thesis.id,
      type: "thesis",
      title: thesis.title,
      subtitle: [thesis.studentName, thesis.topic].filter(Boolean).join(" - "),
    }));
}

function mapLoanRow(row: UnknownRow): LoanListItem {
  const borrower = objectValue(row.borrowers);
  const book = objectValue(row.books);
  const thesis = objectValue(row.theses);
  const itemType = textValue(row.item_type) === "thesis" ? "thesis" : "book";
  const collection = itemType === "thesis" ? thesis : book;

  return {
    id: textValue(row.id),
    borrowerName: textValue(borrower.name, "Peminjam"),
    borrowerPhone: textValue(borrower.phone),
    identityNumber: optionalText(borrower.identity_number),
    borrowerType: optionalText(borrower.borrower_type),
    itemType,
    itemTitle: textValue(collection.title, "Koleksi"),
    itemSubtitle:
      itemType === "thesis"
        ? [textValue(collection.student_name), textValue(collection.topic)].filter(Boolean).join(" - ")
        : [textValue(collection.author), textValue(collection.category)].filter(Boolean).join(" - "),
    loanDate: textValue(row.loan_date),
    dueDate: textValue(row.due_date),
    returnedAt: optionalText(row.returned_at),
    status: loanStatusValue(row.status),
    notes: optionalText(row.notes),
    successNotifiedAt: optionalText(row.success_notified_at),
    reminderH1SentAt: optionalText(row.reminder_h1_sent_at),
    reminderDueSentAt: optionalText(row.reminder_due_sent_at),
    createdAt: textValue(row.created_at),
  };
}

function objectValue(value: unknown): UnknownRow {
  if (Array.isArray(value)) return objectValue(value[0]);
  if (value && typeof value === "object") return value as UnknownRow;
  return {};
}

function loanStatusValue(value: unknown): LoanStatus {
  if (value === "returned" || value === "overdue" || value === "cancelled") return value;
  return "active";
}

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function optionalText(value: unknown) {
  const text = textValue(value).trim();
  return text || null;
}
