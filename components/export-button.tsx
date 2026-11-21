"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Attendance, Book, ExportType, Thesis } from "@/lib/types";
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
  attendances,
  disabled = false,
}: {
  className?: string;
  type: ExportType;
  label?: string;
  attendances?: Attendance[];
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "rounded-lg border-slate-200 bg-white px-3.5 font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        className,
      )}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await exportCatalogData(type, attendances);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download />
      {busy ? "Menyiapkan..." : label}
    </Button>
  );
}

async function exportCatalogData(type: ExportType, attendances?: Attendance[]) {
  try {
    if (type === "attendance" || type === "visitor") {
      if (!attendances?.length) {
        toast.info("Belum ada presensi untuk diekspor.");
        return;
      }
      const { utils, writeFile } = await import("xlsx");
      const rows = attendances.map((item) => ({
        Nama: item.guestName,
        "NIM/NIP": item.guestNim,
        Status: item.visitorStatus,
        "Program studi": item.studyProgram,
        Tujuan: item.purpose,
        "Waktu (WITA)": new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Makassar",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(item.visitedAt)),
      }));
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, utils.json_to_sheet(rows), "Presensi");
      writeFile(
        workbook,
        `export-${type === "visitor" ? "laporan-pengunjung" : "presensi"}.xlsx`,
      );
      toast.success("Ekspor selesai", {
        description: `${rows.length} catatan presensi diunduh.`,
      });
      return;
    }
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
    const filename =
      type === "book" ? "export-buku.xlsx" : "export-skripsi.xlsx";

    utils.book_append_sheet(
      workbook,
      worksheet,
      type === "book" ? "Buku" : "Skripsi",
    );
    writeFile(workbook, filename);

    toast.success(`Ekspor ${exportLabels[type]} selesai`, {
      description: `${rows.length} data diunduh sebagai XLSX.`,
    });
  } catch (error) {
    toast.error(`Gagal ekspor ${exportLabels[type]}`, {
      description:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat XLSX.",
    });
  }
}
