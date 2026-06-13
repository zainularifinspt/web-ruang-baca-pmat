"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, FileSpreadsheet, Link, Upload } from "lucide-react";
import { toast } from "sonner";
import { createBook, createThesis } from "@/app/dashboard/katalog/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { BookFormValues, ThesisFormValues } from "@/lib/catalog-crud-types";
import type { VerificationStatus } from "@/lib/types";

type ImportType = "book" | "thesis";
type ImportStatus = "ready" | "importing" | "success" | "error";

type ImportRow = {
  rowNumber: number;
  type: ImportType;
  title: string;
  data: Record<string, unknown>;
  coverUrl: string;
  deprecatedCoverFilename: string;
  deprecatedPdfFilename: string;
  pdfUrl: string;
  status: ImportStatus;
  message: string;
};

const defaultAccessNote =
  "Dokumen lengkap tersedia dalam bentuk fisik di Ruang Baca Program Studi Pendidikan Matematika.";

export function CatalogImportDialog({
  importType,
  triggerLabel,
}: {
  importType: ImportType;
  triggerLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [summary, setSummary] = useState("");
  const [isPending, startTransition] = useTransition();
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const successCount = rows.filter((row) => row.status === "success").length;
  const errorCount = rows.filter((row) => row.status === "error").length;

  const handlePrepare = () => {
    if (!spreadsheetFile) {
      toast.error("File spreadsheet wajib dipilih.");
      return;
    }

    startTransition(async () => {
      try {
        const parsedRows = await parseSpreadsheet(spreadsheetFile, importType);
        const validatedRows = validateImportRows(parsedRows);
        setRows(validatedRows);
        setSummary(
          `${validatedRows.length} baris dibaca. ${validatedRows.filter((row) => row.status === "ready").length} siap import.`,
        );
      } catch (error) {
        toast.error("Gagal membaca file import", {
          description: error instanceof Error ? error.message : "Periksa format spreadsheet.",
        });
      }
    });
  };

  const handleImport = () => {
    const importableRows = rows.filter((row) => row.status === "ready");
    if (!importableRows.length) {
      toast.error("Tidak ada baris yang siap diimport.");
      return;
    }

    startTransition(async () => {
      for (const row of importableRows) {
        updateRowStatus(row.rowNumber, "importing", "Menyimpan data...");

        try {
          if (row.type === "book") {
            const values = buildBookValues(row);
            const result = await createBook(values);
            if (!result.ok) throw new Error(result.message);
          } else {
            const values = buildThesisValues(row);
            const result = await createThesis(values);
            if (!result.ok) throw new Error(result.message);
          }

          updateRowStatus(row.rowNumber, "success", "Berhasil diimport.");
        } catch (error) {
          updateRowStatus(
            row.rowNumber,
            "error",
            error instanceof Error ? error.message : "Gagal mengimport baris ini.",
          );
        }
      }

      toast.success("Import katalog selesai.");
      router.refresh();
    });
  };

  const updateRowStatus = (rowNumber: number, status: ImportStatus, message: string) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.rowNumber === rowNumber ? { ...row, status, message } : row)),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="rounded-xl bg-white">
          <Upload className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Import {importType === "book" ? "Buku" : "Skripsi"}</DialogTitle>
          <DialogDescription>
            Upload spreadsheet data. Aset cover dan PDF memakai link Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <FileSpreadsheet className="size-4" />
              Spreadsheet CSV/XLSX
            </span>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={isPending}
              onChange={(event) => setSpreadsheetFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">Template XLSX</p>
              <p className="mt-1">
                {importType === "book"
                  ? "Kolom: title, author, year, category, rack_location, stock, status, cover_url."
                  : "Kolom: title/student_name atau format Google Form: JUDUL SKRIPSI, NAMA, PEMBIMBING 1, PEMBIMBING 2, File Skripsi PDF."}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Link className="size-3.5" />
                Link Google Drive harus bisa diakses publik atau oleh browser/admin yang sedang login.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl bg-white"
              onClick={() => downloadImportTemplate(importType)}
            >
              <Download className="size-4" />
              Download template
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {summary || "Pilih file lalu klik Baca file import."}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending || !spreadsheetFile}
              onClick={handlePrepare}
            >
              {isPending ? "Membaca..." : "Baca file import"}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={isPending || readyCount === 0}
              onClick={handleImport}
            >
              {isPending ? "Memproses..." : `Import ${readyCount} baris`}
            </Button>
          </div>
        </div>

        {rows.length ? (
          <div className="max-h-80 overflow-auto rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Baris</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="bg-white">
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">{row.type === "book" ? "Buku" : "Skripsi"}</td>
                    <td className="px-4 py-3 font-medium text-slate-950">{row.title || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={statusClassName(row.status)}>
                        {statusLabel(row.status)}
                      </span>
                      {row.message ? (
                        <p className="mt-1 max-w-md text-xs text-slate-500">{row.message}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {rows.length ? (
          <div className="text-xs text-slate-500">
            Siap: {readyCount} | Berhasil: {successCount} | Error: {errorCount}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-xl" disabled={isPending}>
              Tutup
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function parseSpreadsheet(file: File, importType: ImportType): Promise<ImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Spreadsheet tidak memiliki sheet.");

  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  return records
    .map((record, index) => normalizeImportRow(record, index + 2, importType))
    .filter((row): row is ImportRow => Boolean(row));
}

function normalizeImportRow(
  record: Record<string, unknown>,
  rowNumber: number,
  importType: ImportType,
): ImportRow | null {
  const typeValue = getText(record, ["type", "jenis", "tipe"]).toLowerCase();
  const type = typeValue === "book" || typeValue === "buku"
    ? "book"
    : typeValue === "thesis" || typeValue === "skripsi"
      ? "thesis"
      : importType;

  if (!type) return null;

  return {
    rowNumber,
    type,
    title: getText(record, ["title", "judul", "judul_skripsi", "judul skripsi"]),
    data: record,
    coverUrl: getText(record, ["cover_url", "cover_link", "cover_drive_url", "link_cover"]),
    deprecatedCoverFilename: getText(record, ["cover_filename", "cover_file", "cover"]),
    deprecatedPdfFilename: getText(record, ["pdf_filename", "pdf_file", "pdf"]),
    pdfUrl: getText(record, [
      "pdf_url",
      "pdf_link",
      "pdf_drive_url",
      "link_pdf",
      "file_skripsi_pdf",
      "file skripsi pdf",
    ]),
    status: "ready",
    message: "",
  };
}

function validateImportRows(rows: ImportRow[]) {
  return rows.map((row) => {
    const errors: string[] = [];
    const requiredFields =
      row.type === "book"
        ? ["title", "author", "category", "rack_location"]
        : ["title", "student_name", "supervisor_1", "supervisor_2"];

    requiredFields.forEach((field) => {
      if (!getText(row.data, fieldAliases(field))) {
        errors.push(`Kolom ${field} wajib diisi.`);
      }
    });

    if (row.coverUrl && !isUrl(row.coverUrl)) {
      errors.push("Kolom cover_url harus berisi link Google Drive atau URL publik.");
    }
    if (row.pdfUrl && !isUrl(row.pdfUrl)) {
      errors.push("Kolom pdf_url harus berisi link Google Drive atau URL publik.");
    }
    if (row.deprecatedCoverFilename) {
      errors.push("Kolom cover_filename sudah tidak digunakan. Pakai cover_url.");
    }
    if (row.deprecatedPdfFilename) {
      errors.push("Kolom pdf_filename sudah tidak digunakan. Pakai pdf_url.");
    }

    return errors.length
      ? { ...row, status: "error" as const, message: errors.join(" ") }
      : row;
  });
}

async function downloadImportTemplate(importType: ImportType) {
  const XLSX = await import("xlsx");
  const rows =
    importType === "book"
      ? [
          {
            title: "Kalkulus Dasar",
            author: "Varberg\nPurcell\nRigdon",
            year: "2026",
            category: "Matematika",
            rack_location: "Ruang Baca",
            stock: "1",
            status: "tersedia",
            cover_url: "https://drive.google.com/file/d/cover-file-id/view?usp=sharing",
          },
        ]
      : [
          {
            title: "Analisis Kemampuan Berpikir Kritis Siswa",
            student_name: "Ahmad Fauzi",
            year: "2026",
            abstract: "Ringkasan penelitian skripsi.",
            supervisor_1: "Dr. Pembimbing Satu, M.Pd.",
            supervisor_2: "Dr. Pembimbing Dua, M.Pd.",
            cover_url: "https://drive.google.com/file/d/cover-file-id/view?usp=sharing",
            pdf_url: "https://drive.google.com/file/d/pdf-file-id/view?usp=sharing",
          },
        ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, importType === "book" ? "Import Buku" : "Import Skripsi");
  XLSX.writeFile(workbook, importType === "book" ? "template-import-buku.xlsx" : "template-import-skripsi.xlsx");
}

function buildBookValues(row: ImportRow): BookFormValues {
  return {
    title: getText(row.data, ["title", "judul"]),
    author: getText(row.data, ["author", "penulis"]),
    category: getText(row.data, ["category", "kategori"]),
    rackLocation: getText(row.data, ["rack_location", "lokasi_rak", "lokasi"], "Ruang Baca"),
    stock: getNumber(row.data, ["stock", "stok"], 1),
    status: bookStatusValue(getText(row.data, ["status"], "tersedia")),
    coverUrl: resolveCoverUrl(row.coverUrl),
  };
}

function buildThesisValues(row: ImportRow): ThesisFormValues {
  return {
    title: getText(row.data, ["title", "judul", "judul_skripsi", "judul skripsi"]),
    studentName: getText(row.data, ["student_name", "nama_mahasiswa", "mahasiswa", "nama"]),
    studentNim: getText(row.data, ["student_nim", "nim", "nim_nip", "nim/nip"]),
    year: getNumber(row.data, ["year", "tahun"], new Date().getFullYear()),
    topic: getText(row.data, ["topic", "topik"], "Skripsi"),
    abstract: getText(row.data, ["abstract", "abstrak"], defaultThesisAbstract(row.data)),
    supervisor1: getText(row.data, [
      "supervisor_1",
      "pembimbing_1",
      "pembimbing 1",
      "dosen_pembimbing_1",
    ]),
    supervisor2: getText(row.data, [
      "supervisor_2",
      "pembimbing_2",
      "pembimbing 2",
      "dosen_pembimbing_2",
    ]),
    coverUrl: resolveCoverUrl(row.coverUrl),
    physicalLocation: getText(row.data, ["physical_location", "lokasi_fisik"], "Lemari Skripsi"),
    accessNote: getText(row.data, ["access_note", "catatan_akses"], defaultAccessNote),
    verificationStatus: verificationStatusValue(getText(row.data, ["verification_status", "status_verifikasi"], "approved")),
    pdfUrl: resolvePdfUrl(row.pdfUrl),
    pdfFilename: "",
    pdfSize: 0,
  };
}

function resolveCoverUrl(coverUrl: string) {
  if (!coverUrl) return "";
  return toGoogleDriveCoverUrl(coverUrl);
}

function resolvePdfUrl(pdfUrl: string) {
  if (!pdfUrl) return "";
  return toGoogleDrivePdfUrl(pdfUrl);
}

function defaultThesisAbstract(record: Record<string, unknown>) {
  const nim = getText(record, ["nim"]);
  const prefix = nim ? `NIM: ${nim}. ` : "";

  return `${prefix}Abstrak belum tersedia. File PDF skripsi dapat dibuka melalui tautan Google Drive.`;
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function toGoogleDriveCoverUrl(value: string) {
  const trimmedValue = value.trim();
  const fileId = extractGoogleDriveFileId(trimmedValue);
  return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : trimmedValue;
}

function toGoogleDrivePdfUrl(value: string) {
  const trimmedValue = value.trim();
  const fileId = extractGoogleDriveFileId(trimmedValue);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : trimmedValue;
}

function extractGoogleDriveFileId(value: string) {
  try {
    const url = new URL(value);
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    return url.searchParams.get("id") || "";
  } catch {
    return "";
  }
}

function getText(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key] ?? record[key.toUpperCase()] ?? record[key.toLowerCase()];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  const entries = Object.entries(record);
  for (const key of keys) {
    const normalizedKey = normalizeImportKey(key);
    const entry = entries.find(([recordKey]) => normalizeImportKey(recordKey) === normalizedKey);
    const value = entry?.[1];

    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return fallback;
}

function getNumber(record: Record<string, unknown>, keys: string[], fallback: number) {
  const value = getText(record, keys);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fieldAliases(field: string) {
  const aliases: Record<string, string[]> = {
    title: ["title", "judul", "judul_skripsi", "judul skripsi"],
    author: ["author", "penulis"],
    category: ["category", "kategori"],
    rack_location: ["rack_location", "lokasi_rak", "lokasi"],
    student_name: ["student_name", "nama_mahasiswa", "mahasiswa", "nama"],
    year: ["year", "tahun"],
    topic: ["topic", "topik"],
    abstract: ["abstract", "abstrak"],
    supervisor_1: ["supervisor_1", "pembimbing_1", "pembimbing 1", "dosen_pembimbing_1"],
    supervisor_2: ["supervisor_2", "pembimbing_2", "pembimbing 2", "dosen_pembimbing_2"],
  };

  return aliases[field] ?? [field];
}

function normalizeImportKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function bookStatusValue(value: string): BookFormValues["status"] {
  const normalized = value.toLowerCase();
  if (normalized === "dipinjam" || normalized === "arsip") return normalized;
  return "tersedia";
}

function verificationStatusValue(value: string): VerificationStatus {
  const normalized = value.toLowerCase();
  if (normalized === "pending" || normalized === "rejected") return normalized;
  return "approved";
}

function statusClassName(status: ImportStatus) {
  const baseClassName = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "success") return `${baseClassName} bg-red-50 text-red-700`;
  if (status === "error") return `${baseClassName} bg-rose-50 text-rose-700`;
  if (status === "importing") return `${baseClassName} bg-amber-50 text-amber-700`;
  return `${baseClassName} bg-slate-100 text-slate-700`;
}

function statusLabel(status: ImportStatus) {
  if (status === "success") return "Berhasil";
  if (status === "error") return "Error";
  if (status === "importing") return "Importing";
  return "Siap";
}
