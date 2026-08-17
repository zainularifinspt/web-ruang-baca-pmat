"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getGoogleDrivePreviewUrl,
  getGoogleDriveDownloadUrl,
  getGoogleDriveDirectViewUrl,
} from "@/lib/google-drive";
import { cn } from "@/lib/utils";

interface EbookPdfViewerProps {
  pdfUrl?: string;
  title?: string;
  author?: string;
  category?: string;
  className?: string;
}

export function EbookPdfViewer({
  pdfUrl,
  title = "Dokumen E-Book",
  className,
}: EbookPdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const previewUrl = getGoogleDrivePreviewUrl(pdfUrl);
  const downloadUrl = getGoogleDriveDownloadUrl(pdfUrl);
  const directViewUrl = getGoogleDriveDirectViewUrl(pdfUrl);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [pdfUrl]);

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
        <p className="font-semibold text-slate-800">File E-Book Belum Tersedia</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-xl shadow-slate-900/10 w-full",
        className,
      )}
    >
      {/* Viewer Body */}
      <div className="relative w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden h-[68vh] sm:h-[75vh] lg:h-[80vh] min-h-[500px] sm:min-h-[640px]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
            <div className="relative mb-4 flex size-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20 duration-1000" />
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-lg text-white">
                <Loader2 className="size-7 animate-spin" />
              </div>
            </div>
            <p className="text-base font-bold text-white tracking-tight">
              Menghubungkan ke Google Drive Viewer...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-8 text-center text-white">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-4 ring-1 ring-rose-500/30">
              <AlertCircle className="size-7" />
            </div>
            <h4 className="text-lg font-bold">Pratinjau Tidak Dapat Dimuat Langsung</h4>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
              Silakan baca atau unduh dokumen melalui tombol di bawah:
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-xl bg-gradient-to-r from-red-600 to-orange-600 font-bold text-white shadow-md">
                <a href={directViewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Buka Dokumen di Tab Baru
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20">
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2 size-4" />
                  Download File PDF
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Embedded Google Drive Iframe */}
        <iframe
          src={previewUrl}
          title={`Google Drive Viewer: ${title}`}
          className="h-full w-full border-0 bg-white min-h-[500px] sm:min-h-[640px]"
          allow="autoplay; fullscreen"
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
    </div>
  );
}
