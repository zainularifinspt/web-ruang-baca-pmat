"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Download, FileSpreadsheet, Upload } from "lucide-react";
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
type ZipAssetMap = Map<string, { name: string; blob: Blob }>;

type ImportRow = {
  rowNumber: number;
  type: ImportType;
  title: string;
  data: Record<string, unknown>;
  coverFilename: string;
  pdfFilename: string;
  status: ImportStatus;
  message: string;
};

const maxPdfSize = 5 * 1024 * 1024;
const maxCoverOriginalSize = 15 * 1024 * 1024;
const maxCoverUploadSize = 900 * 1024;
const maxCoverDimension = 900;
const allowedCoverTypes = ["image/jpeg", "image/png", "image/webp"];

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
  const [assetZipFile, setAssetZipFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [assets, setAssets] = useState<ZipAssetMap>(new Map());
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
        const [parsedRows, parsedAssets] = await Promise.all([
          parseSpreadsheet(spreadsheetFile, importType),
          assetZipFile ? parseAssetZip(assetZipFile) : Promise.resolve(new Map() as ZipAssetMap),
        ]);

        const validatedRows = validateImportRows(parsedRows, parsedAssets);
        setRows(validatedRows);
        setAssets(parsedAssets);
        setSummary(
          `${validatedRows.length} baris dibaca. ${validatedRows.filter((row) => row.status === "ready").length} siap import.`,
        );
      } catch (error) {
        toast.error("Gagal membaca file import", {
          description: error instanceof Error ? error.message : "Periksa format spreadsheet dan ZIP aset.",
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
        updateRowStatus(row.rowNumber, "importing", "Mengupload aset dan menyimpan data...");

        try {
          if (row.type === "book") {
            const values = await buildBookValues(row, assets);
            const result = await createBook(values);
            if (!result.ok) throw new Error(result.message);
          } else {
            const values = await buildThesisValues(row, assets);
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
            Upload spreadsheet data dan ZIP aset untuk import massal {importType === "book" ? "buku" : "skripsi"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Archive className="size-4" />
              ZIP aset cover/PDF
            </span>
            <Input
              type="file"
              accept=".zip,application/zip"
              disabled={isPending}
              onChange={(event) => setAssetZipFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">Template XLSX</p>
              <p className="mt-1">
                {importType === "book"
                  ? "Kolom: title, author, year, category, rack_location, stock, status, cover_filename."
                  : "Kolom: title, student_name, year, topic, abstract, supervisor_1, supervisor_2, physical_location, access_note, cover_filename, pdf_filename."}
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

async function parseAssetZip(file: File): Promise<ZipAssetMap> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const assets: ZipAssetMap = new Map();

  await Promise.all(
    Object.values(zip.files).map(async (entry) => {
      if (entry.dir) return;

      const blob = await entry.async("blob");
      const normalizedName = normalizeFilename(entry.name);
      const basename = normalizeFilename(entry.name.split("/").pop() ?? entry.name);
      const asset = { name: entry.name, blob };

      assets.set(normalizedName, asset);
      assets.set(basename, asset);
    }),
  );

  return assets;
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
    title: getText(record, ["title", "judul"]),
    data: record,
    coverFilename: getText(record, ["cover_filename", "cover_file", "cover"]),
    pdfFilename: getText(record, ["pdf_filename", "pdf_file", "pdf"]),
    status: "ready",
    message: "",
  };
}

function validateImportRows(rows: ImportRow[], assets: ZipAssetMap) {
  return rows.map((row) => {
    const errors: string[] = [];
    const requiredFields =
      row.type === "book"
        ? ["title", "author", "category", "rack_location"]
        : ["title", "student_name", "year", "topic", "abstract", "supervisor_1", "supervisor_2"];

    requiredFields.forEach((field) => {
      if (!getText(row.data, fieldAliases(field))) {
        errors.push(`Kolom ${field} wajib diisi.`);
      }
    });

    if (row.coverFilename && !findAsset(assets, row.coverFilename)) {
      errors.push(`Cover ${row.coverFilename} tidak ditemukan di ZIP.`);
    }

    if (row.type === "thesis" && row.pdfFilename && !findAsset(assets, row.pdfFilename)) {
      errors.push(`PDF ${row.pdfFilename} tidak ditemukan di ZIP.`);
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
            cover_filename: "covers/kalkulus-dasar.jpg",
          },
        ]
      : [
          {
            title: "Analisis Kemampuan Berpikir Kritis Siswa",
            student_name: "Ahmad Fauzi",
            year: "2026",
            topic: "Pendidikan Matematika",
            abstract: "Ringkasan penelitian skripsi.",
            supervisor_1: "Dr. Pembimbing Satu, M.Pd.",
            supervisor_2: "Dr. Pembimbing Dua, M.Pd.",
            physical_location: "Lemari Skripsi",
            access_note: defaultAccessNote,
            cover_filename: "covers/ahmad-fauzi.jpg",
            pdf_filename: "pdf/ahmad-fauzi.pdf",
          },
        ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, importType === "book" ? "Import Buku" : "Import Skripsi");
  XLSX.writeFile(workbook, importType === "book" ? "template-import-buku.xlsx" : "template-import-skripsi.xlsx");
}

async function buildBookValues(row: ImportRow, assets: ZipAssetMap): Promise<BookFormValues> {
  const coverUrl = row.coverFilename ? await uploadCoverAsset(row.coverFilename, assets) : "";

  return {
    title: getText(row.data, ["title", "judul"]),
    author: getText(row.data, ["author", "penulis"]),
    category: getText(row.data, ["category", "kategori"]),
    rackLocation: getText(row.data, ["rack_location", "lokasi_rak", "lokasi"], "Ruang Baca"),
    stock: getNumber(row.data, ["stock", "stok"], 1),
    status: bookStatusValue(getText(row.data, ["status"], "tersedia")),
    coverUrl,
  };
}

async function buildThesisValues(row: ImportRow, assets: ZipAssetMap): Promise<ThesisFormValues> {
  const coverUrl = row.coverFilename ? await uploadCoverAsset(row.coverFilename, assets) : "";
  const pdfMetadata = row.pdfFilename
    ? await uploadPdfAsset(row.pdfFilename, assets)
    : { pdfUrl: "", pdfFilename: "", pdfSize: 0 };

  return {
    title: getText(row.data, ["title", "judul"]),
    studentName: getText(row.data, ["student_name", "nama_mahasiswa", "mahasiswa"]),
    year: getNumber(row.data, ["year", "tahun"], new Date().getFullYear()),
    topic: getText(row.data, ["topic", "topik"], "Skripsi"),
    abstract: getText(row.data, ["abstract", "abstrak"]),
    supervisor1: getText(row.data, ["supervisor_1", "pembimbing_1", "dosen_pembimbing_1"]),
    supervisor2: getText(row.data, ["supervisor_2", "pembimbing_2", "dosen_pembimbing_2"]),
    coverUrl,
    physicalLocation: getText(row.data, ["physical_location", "lokasi_fisik"], "Lemari Skripsi"),
    accessNote: getText(row.data, ["access_note", "catatan_akses"], defaultAccessNote),
    verificationStatus: verificationStatusValue(getText(row.data, ["verification_status", "status_verifikasi"], "approved")),
    pdfUrl: pdfMetadata.pdfUrl,
    pdfFilename: pdfMetadata.pdfFilename,
    pdfSize: pdfMetadata.pdfSize,
  };
}

async function uploadCoverAsset(filename: string, assets: ZipAssetMap) {
  const asset = findAsset(assets, filename);
  if (!asset) throw new Error(`Cover ${filename} tidak ditemukan di ZIP.`);

  const file = fileFromAsset(asset, mimeTypeFromFilename(asset.name));
  const error = validateCoverFile(file);
  if (error) throw new Error(error);

  const compressedCover = await compressCoverImage(file);
  const formData = new FormData();
  formData.append("file", compressedCover);

  const response = await fetch("/api/books/cover", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as { coverUrl?: string; error?: string };
  if (!response.ok || payload.error || !payload.coverUrl) {
    throw new Error(payload.error ?? `Gagal mengupload cover ${filename}.`);
  }

  return payload.coverUrl;
}

async function uploadPdfAsset(filename: string, assets: ZipAssetMap) {
  const asset = findAsset(assets, filename);
  if (!asset) throw new Error(`PDF ${filename} tidak ditemukan di ZIP.`);

  const file = fileFromAsset(asset, "application/pdf");
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error(`File ${filename} harus PDF.`);
  }
  if (file.size > maxPdfSize) {
    throw new Error(`File ${filename} melebihi batas 5 MB.`);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/theses/pdf", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as {
    pdfUrl?: string;
    pdfFilename?: string;
    pdfSize?: number;
    error?: string;
  };
  if (!response.ok || payload.error || !payload.pdfUrl) {
    throw new Error(payload.error ?? `Gagal mengupload PDF ${filename}.`);
  }

  return {
    pdfUrl: payload.pdfUrl,
    pdfFilename: payload.pdfFilename ?? filename,
    pdfSize: payload.pdfSize ?? file.size,
  };
}

function fileFromAsset(asset: { name: string; blob: Blob }, mimeType: string) {
  return new File([asset.blob], asset.name.split("/").pop() ?? asset.name, { type: mimeType });
}

function findAsset(assets: ZipAssetMap, filename: string) {
  return assets.get(normalizeFilename(filename)) ?? assets.get(normalizeFilename(filename.split("/").pop() ?? filename));
}

function normalizeFilename(filename: string) {
  return filename.trim().replaceAll("\\", "/").toLowerCase();
}

function getText(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key] ?? record[key.toUpperCase()] ?? record[key.toLowerCase()];
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
    title: ["title", "judul"],
    author: ["author", "penulis"],
    category: ["category", "kategori"],
    rack_location: ["rack_location", "lokasi_rak", "lokasi"],
    student_name: ["student_name", "nama_mahasiswa", "mahasiswa"],
    year: ["year", "tahun"],
    topic: ["topic", "topik"],
    abstract: ["abstract", "abstrak"],
    supervisor_1: ["supervisor_1", "pembimbing_1", "dosen_pembimbing_1"],
    supervisor_2: ["supervisor_2", "pembimbing_2", "dosen_pembimbing_2"],
  };

  return aliases[field] ?? [field];
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
  if (status === "success") return `${baseClassName} bg-emerald-50 text-emerald-700`;
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

function validateCoverFile(file: File | null) {
  if (!file) return null;
  if (!allowedCoverTypes.includes(file.type)) return `Cover ${file.name} harus berupa JPG, PNG, atau WebP.`;
  if (file.size > maxCoverOriginalSize) return `Cover ${file.name} maksimal 15 MB sebelum kompresi.`;
  return null;
}

async function compressCoverImage(file: File) {
  const image = await loadImage(file);
  let quality = 0.82;
  let maxDimension = maxCoverDimension;
  let compressed = await drawCompressedCover(image, file, maxDimension, quality);

  while (compressed.size > maxCoverUploadSize && (quality > 0.52 || maxDimension > 640)) {
    quality = Math.max(0.52, quality - 0.08);
    maxDimension = Math.max(640, Math.round(maxDimension * 0.9));
    compressed = await drawCompressedCover(image, file, maxDimension, quality);
  }

  return compressed;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Cover ${file.name} tidak dapat dibaca sebagai gambar.`));
    };
    image.src = objectUrl;
  });
}

function drawCompressedCover(
  image: HTMLImageElement,
  sourceFile: File,
  maxDimension: number,
  quality: number,
) {
  return new Promise<File>((resolve, reject) => {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Browser tidak dapat memproses kompresi cover."));
      return;
    }

    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengompres cover."));
          return;
        }

        const filename = `${sourceFile.name.replace(/\.[^.]+$/, "") || "cover"}.webp`;
        resolve(new File([blob], filename, { type: "image/webp" }));
      },
      "image/webp",
      quality,
    );
  });
}

function mimeTypeFromFilename(filename: string) {
  const normalized = filename.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
