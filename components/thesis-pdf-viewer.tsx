"use client";

import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" className="rounded-2xl">
              <Eye className="size-4" />
              Lihat PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl rounded-[2rem] p-0">
            <DialogHeader className="px-5 pt-5 sm:px-6">
              <DialogTitle>File Skripsi</DialogTitle>
              <DialogDescription>{pdfFilename || "Dokumen PDF skripsi"}</DialogDescription>
            </DialogHeader>
            <div className="h-[78vh] overflow-hidden rounded-b-[2rem] border-t bg-slate-100">
              <iframe
                src={readerPdfUrl(resolvedPdfUrl)}
                title={pdfFilename || "File skripsi"}
                className="h-full w-full"
              />
            </div>
          </DialogContent>
        </Dialog>
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

function readerPdfUrl(url: string) {
  return `${url}#toolbar=0&navpanes=0&view=FitH`;
}
