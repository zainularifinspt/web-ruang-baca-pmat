"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  FileText,
  AlertCircle,
  Sparkles,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getGoogleDrivePreviewUrl,
  getGoogleDriveDownloadUrl,
  getGoogleDriveDirectViewUrl,
  isGoogleDriveUrl,
} from "@/lib/google-drive";
import { cn } from "@/lib/utils";

interface EbookPdfViewerProps {
  pdfUrl?: string;
  title?: string;
  author?: string;
  category?: string;
  className?: string;
  compact?: boolean;
}

export function EbookPdfViewer({
  pdfUrl,
  title = "Dokumen E-Book",
  author,
  category,
  className,
  compact = false,
}: EbookPdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const previewUrl = getGoogleDrivePreviewUrl(pdfUrl);
  const downloadUrl = getGoogleDriveDownloadUrl(pdfUrl);
  const directViewUrl = getGoogleDriveDirectViewUrl(pdfUrl);
  const isGdrive = isGoogleDriveUrl(pdfUrl);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [pdfUrl]);

  // Handle ESC key untuk keluar dari mode fullscreen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleCopyLink = async () => {
    if (!pdfUrl) return;
    try {
      await navigator.clipboard.writeText(directViewUrl || pdfUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3 shadow-inner">
          <FileText className="size-6" />
        </div>
        <p className="font-semibold text-slate-800">File E-Book Belum Tersedia</p>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Dokumen digital untuk koleksi ini sedang dalam proses pembaruan oleh petugas ruang baca.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col overflow-hidden transition-all duration-300",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-0 bg-slate-950/95 backdrop-blur-xl p-3 sm:p-6"
          : "w-full rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl shadow-slate-900/10",
        className,
      )}
    >
      {/* Top Action Bar */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-3 text-white backdrop-blur-md",
          compact ? "py-2 px-3" : "py-3 px-4",
        )}
      >
        {/* Left: Info */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white shadow-md">
            <BookOpen className="size-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs sm:text-sm font-bold text-white tracking-tight">
                {title}
              </p>
              {category ? (
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex shrink-0 rounded-full bg-white/15 px-2 py-0.2 text-[10px] font-semibold text-amber-200 border border-white/10"
                >
                  {category}
                </Badge>
              ) : null}
            </div>
            {author ? (
              <p className="truncate text-[11px] text-slate-400 font-medium">
                {author}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Direct Download Button */}
          <Button
            asChild
            size="sm"
            className="h-8 sm:h-9 rounded-xl bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-3 sm:px-4 text-xs font-bold text-white shadow-md transition-all duration-200 hover:brightness-110 hover:shadow-orange-500/25 active:scale-95 border-0 gap-1.5 cursor-pointer"
          >
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              title="Download File PDF E-Book"
            >
              <Download className="size-3.5 sm:size-4" />
              <span>Download PDF</span>
            </a>
          </Button>

          {/* Open in Google Drive / New Tab */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 rounded-xl border-white/15 bg-white/10 px-2.5 sm:px-3 text-xs font-semibold text-white shadow-sm hover:bg-white/20 hover:text-white active:scale-95 gap-1.5 cursor-pointer"
          >
            <a
              href={directViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di Google Drive (Tab Baru)"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden md:inline">Buka di Drive</span>
            </a>
          </Button>

          {/* Copy Share Link */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 sm:h-9 size-8 sm:size-9 rounded-xl p-0 text-slate-300 hover:bg-white/10 hover:text-white"
            title="Salin Tautan E-Book"
            aria-label="Salin Tautan"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Share2 className="size-3.5" />
            )}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 sm:h-9 size-8 sm:size-9 rounded-xl p-0 text-slate-300 hover:bg-white/10 hover:text-white"
            title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Mode Layar Penuh"}
            aria-label="Layar Penuh"
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5 sm:size-4" />
            ) : (
              <Maximize2 className="size-3.5 sm:size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Viewer Body */}
      <div
        className={cn(
          "relative w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden",
          isFullscreen ? "flex-1 min-h-0" : "h-[540px] sm:h-[680px] lg:h-[780px] xl:h-[820px] min-h-[500px]",
        )}
      >
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
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Dokumen e-book sedang dimuat secara interaktif. Anda juga dapat langsung mengunduh file melalui tombol Download.
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
              Hak akses file Google Drive atau pembatasan browser mungkin mencegah penyematan langsung.
              Anda tetap dapat membaca atau mengunduh dokumen secara langsung:
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
          className="h-full w-full border-0 bg-white"
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

      {/* Footer Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-4 py-2 text-[11px] text-slate-400 border-t border-white/5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-amber-400" />
          <span>Google Drive Interactive PDF Viewer &bull; Bebas didownload mahasiswa</span>
        </span>
        <div className="flex items-center gap-3">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-amber-400 hover:text-amber-300 font-semibold underline decoration-amber-400/40 underline-offset-2"
          >
            Direct Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
