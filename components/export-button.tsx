"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ExportType } from "@/lib/types";

const exportLabels: Record<ExportType, string> = {
  attendance: "presensi",
  book: "buku",
  thesis: "skripsi",
  visitor: "laporan pengunjung",
};

export function ExportButton({
  type,
  label = "Ekspor",
}: {
  type: ExportType;
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        toast.success(`Ekspor ${exportLabels[type]} disiapkan`, {
          description:
            "Mode pratinjau: file unduhan akan tersedia pada implementasi lengkap.",
        })
      }
    >
      <Download />
      {label}
    </Button>
  );
}
