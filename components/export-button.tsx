"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Book, ExportType, Thesis } from "@/lib/types";
import { cn } from "@/lib/utils";

const exportLabels: Record<ExportType, string> = {
  attendance: "presensi",
  book: "buku",
  thesis: "skripsi",
  visitor: "laporan pengunjung",
};

export function ExportButton({
  className,
  type,
  label = "Ekspor",
}: {
  className?: string;
  type: ExportType;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "rounded-full border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
        className,
      )}
      onClick={() => exportCatalogData(type)}
    >
      <Download />
      {label}
    </Button>
  );
}

async function exportCatalogData(type: ExportType) {
  if (type !== "book" && type !== "thesis") {
    toast.success(`Ekspor ${exportLabels[type]} disiapkan`, {
      description: "File ekspor sedang disiapkan dari data sistem.",
    });
    return;
  }

  try {
    const [{ utils, writeFile }, response] = await Promise.all([
      import("xlsx"),
      fetch("/api/catalog?visibility=internal", { cache: "no-store" }),
    ]);
    const payload = (await response.json()) as {
      books?: Book[];
      theses?: Thesis[];
      error?: string;
    };

    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? "Data katalog tidak berhasil dimuat.");
    }

    const rows =
      type === "book"
        ? (payload.books ?? []).map((book) => ({
            title: book.title,
            author: book.author,
            year: book.year,
            category: book.category,
            rack_location: book.rackLocation,
            stock: book.stock,
            status: book.status,
            cover_url: book.coverUrl ?? "",
          }))
        : (payload.theses ?? []).map((thesis) => ({
            title: thesis.title,
            student_name: thesis.studentName,
            year: thesis.year,
            topic: thesis.topic,
            abstract: thesis.abstract,
            supervisor_1: thesis.supervisor1,
            supervisor_2: thesis.supervisor2,
            physical_location: thesis.physicalLocation,
            access_note: thesis.accessNote,
            cover_url: thesis.coverUrl ?? "",
            pdf_url: thesis.pdfUrl ?? "",
          }));
    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    const filename = type === "book" ? "export-buku.xlsx" : "export-skripsi.xlsx";

    utils.book_append_sheet(workbook, worksheet, type === "book" ? "Buku" : "Skripsi");
    writeFile(workbook, filename);

    toast.success(`Ekspor ${exportLabels[type]} selesai`, {
      description: `${rows.length} data diunduh sebagai XLSX.`,
    });
  } catch (error) {
    toast.error(`Gagal ekspor ${exportLabels[type]}`, {
      description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat XLSX.",
    });
  }
}
