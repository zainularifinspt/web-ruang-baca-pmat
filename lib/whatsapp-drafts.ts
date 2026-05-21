export type DraftSubmissionType = "book" | "thesis";
export type DraftSubmissionStatus = "pending" | "approved" | "rejected";

export type DraftSubmission = {
  id: string;
  sender_phone: string | null;
  sender_name: string | null;
  submitted_by: string | null;
  type: DraftSubmissionType | null;
  title: string | null;
  author: string | null;
  year: number | null;
  category: string | null;
  description: string | null;
  raw_message: string | null;
  parsing_error: boolean;
  unknown_sender: boolean;
  status: DraftSubmissionStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type WhatsappPetugas = {
  id: string;
  profile_id: string | null;
  nama: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
};

export type ParsedWhatsappDraft = {
  type: DraftSubmissionType | null;
  title: string;
  author: string;
  year: number | null;
  category: string;
  description: string;
  formatNote: string | null;
};

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function parseWhatsappDraftMessage(rawMessage: string): ParsedWhatsappDraft {
  const lines = rawMessage
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0]?.toUpperCase();
  const type =
    firstLine === "BUKU" ? "book" : firstLine === "SKRIPSI" ? "thesis" : null;
  const fields = parseFields(lines.slice(type ? 1 : 0));

  const title = fields.judul ?? "";
  const author = fields.penulis ?? fields.mahasiswa ?? fields.nama ?? fields.nama_mahasiswa ?? "";
  const category =
    type === "book"
      ? fields.kategori ?? ""
      : fields.topik ?? fields.kategori ?? "Skripsi";
  const description =
    type === "thesis"
      ? fields.abstrak ?? fields.deskripsi ?? ""
      : fields.deskripsi ?? "";
  const year = fields.tahun ? Number(fields.tahun) : null;
  const errors: string[] = [];

  if (!type) errors.push("Baris pertama harus BUKU atau SKRIPSI.");
  if (!title) errors.push("Judul wajib diisi.");
  if (!author) errors.push(type === "thesis" ? "Penulis/nama mahasiswa wajib diisi." : "Penulis wajib diisi.");
  if (type === "book" && !category) errors.push("Kategori wajib diisi untuk buku.");
  if (type === "thesis" && (!year || !Number.isFinite(year))) {
    errors.push("Tahun wajib berupa angka untuk skripsi.");
  }
  if (type === "thesis" && !description) errors.push("Abstrak wajib diisi untuk skripsi.");

  return {
    type,
    title,
    author,
    year: year && Number.isFinite(year) ? year : null,
    category,
    description,
    formatNote: errors.length ? `Format perlu diperbaiki: ${errors.join(" ")}` : null,
  };
}

function parseFields(lines: string[]) {
  const fields: Record<string, string> = {};
  let currentKey = "";

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      if (currentKey) {
        fields[currentKey] = [fields[currentKey], line].filter(Boolean).join("\n");
      }

      continue;
    }

    const key = line
      .slice(0, separatorIndex)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      currentKey = key;
      if (value) fields[key] = value;
    }
  }

  return fields;
}
