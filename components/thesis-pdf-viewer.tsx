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
          <DialogContent className="h-[94vh] max-h-[94vh] w-[96vw] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[2rem] p-0">
            <DialogHeader className="px-5 py-4 pr-12 sm:px-6">
              <DialogTitle>File Skripsi</DialogTitle>
              <DialogDescription>{pdfFilename || "Dokumen PDF skripsi"}</DialogDescription>
            </DialogHeader>
            <div
              className="min-h-0 select-none overflow-hidden rounded-b-[2rem] border-t bg-slate-100"
              onContextMenu={(event) => event.preventDefault()}
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onSelect={(event) => event.preventDefault()}
              onSelectCapture={(event) => event.preventDefault()}
            >
              <iframe
                src={readerPdfUrl(resolvedPdfUrl)}
                title={pdfFilename || "File skripsi"}
                className="h-full w-full select-none"
                sandbox="allow-same-origin"
                referrerPolicy="no-referrer"
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
