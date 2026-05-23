"use client";

import { Download, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveThesisPdfUrl } from "@/lib/thesis-pdf";

type ThesisPdfViewerProps = {
  pdfUrl?: string;
  pdfFilename?: string;
};

export function ThesisPdfViewer({ pdfUrl, pdfFilename }: ThesisPdfViewerProps) {
  const resolvedPdfUrl = resolveThesisPdfUrl(pdfUrl);

  if (!resolvedPdfUrl) {
    return <p className="text-sm leading-6 text-slate-500">File PDF belum tersedia.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild type="button" className="rounded-2xl">
          <a href={resolvedPdfUrl} target="_blank" rel="noreferrer">
            <Eye className="size-4" />
            Lihat PDF
          </a>
        </Button>
        <Button asChild type="button" variant="outline" className="rounded-2xl bg-white">
          <a href={resolvedPdfUrl} download={pdfFilename} target="_blank" rel="noreferrer">
            <Download className="size-4" />
            Download PDF
          </a>
        </Button>
      </div>
      {pdfFilename ? (
        <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
          <FileText className="size-4 text-emerald-700" />
          {pdfFilename}
        </p>
      ) : null}
    </div>
  );
}
