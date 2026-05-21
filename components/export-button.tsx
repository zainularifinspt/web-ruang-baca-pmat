"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ExportType } from "@/lib/types";
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
        "rounded-full border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
        className,
      )}
      onClick={() =>
        toast.success(`Ekspor ${exportLabels[type]} disiapkan`, {
          description: "File ekspor sedang disiapkan dari data sistem.",
        })
      }
    >
      <Download />
      {label}
    </Button>
  );
}
