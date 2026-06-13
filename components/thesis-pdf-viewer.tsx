"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
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
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

const MIN_PDF_ZOOM = 0.75;
const MAX_PDF_ZOOM = 2.5;
const PDF_ZOOM_STEP = 0.15;

type ThesisPdfViewerProps = {
  pdfUrl?: string;
  pdfFilename?: string;
  studentName?: string;
};

export function ThesisPdfViewer({ pdfUrl, studentName }: ThesisPdfViewerProps) {
  const resolvedPdfUrl = resolveThesisPdfUrl(pdfUrl);
  const [open, setOpen] = useState(false);
  const readerTitle = studentName ? `File Skripsi - ${studentName}` : "File Skripsi";

  useEffect(() => {
    if (!resolvedPdfUrl) return;

    const warmup = window.setTimeout(() => {
      void import("pdfjs-dist").then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();
      });
    }, 250);

    return () => window.clearTimeout(warmup);
  }, [resolvedPdfUrl]);

  if (!resolvedPdfUrl) {
    return <p className="text-sm leading-6 text-slate-500">File PDF belum tersedia.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              className="w-full sm:w-auto rounded-2xl border border-red-300/70 bg-red-600 px-6 py-2.5 font-semibold text-white shadow-[0_12px_24px_rgba(16,185,129,0.25)] hover:bg-red-500 hover:shadow-[0_16px_32px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Eye className="size-4 shrink-0" />
              Lihat PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 p-0">
            <DialogHeader className="px-5 py-4 pr-12 sm:px-6">
              <DialogTitle>File Skripsi</DialogTitle>
              <DialogDescription>{studentName || "Nama mahasiswa belum tercatat"}</DialogDescription>
            </DialogHeader>
            <div
              className="min-h-0 select-none overflow-hidden border-t bg-slate-100"
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
                  event.preventDefault();
                }
              }}
              onContextMenu={(event) => event.preventDefault()}
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onSelect={(event) => event.preventDefault()}
              onSelectCapture={(event) => event.preventDefault()}
            >
              <PdfCanvasReader
                active={open}
                pdfUrl={readerPdfUrl(resolvedPdfUrl)}
                title={readerTitle}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function readerPdfUrl(value: string) {
  return isGoogleDriveUrl(value) ? `/api/theses/pdf/proxy?url=${encodeURIComponent(value)}` : value;
}

function isGoogleDriveUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "drive.google.com";
  } catch {
    return false;
  }
}

function PdfCanvasReader({
  active,
  pdfUrl,
  title,
}: {
  active: boolean;
  pdfUrl: string;
  title: string;
}) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureScaleRef = useRef(1);

  const zoomPercent = Math.round(zoom * 100);

  function updateZoom(nextZoom: number | ((currentZoom: number) => number)) {
    setZoom((currentZoom) => {
      const resolvedZoom = typeof nextZoom === "function" ? nextZoom(currentZoom) : nextZoom;
      return clampZoom(resolvedZoom);
    });
  }

  function zoomIn() {
    updateZoom((currentZoom) => currentZoom + PDF_ZOOM_STEP);
  }

  function zoomOut() {
    updateZoom((currentZoom) => currentZoom - PDF_ZOOM_STEP);
  }

  function resetZoom() {
    updateZoom(1);
  }

  useEffect(() => {
    if (!active) return;

    let isCancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDocument: PDFDocumentProxy | null = null;

    async function loadPdf() {
      setIsLoading(true);
      setError("");
      setDocument(null);
      setLoadingProgress(0);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();

        loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          withCredentials: false,
          rangeChunkSize: 524288,
          cMapUrl: "https://unpkg.com/pdfjs-dist@4.4.168/cmaps/",
          cMapPacked: true,
        });
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!total || isCancelled) return;

          setLoadingProgress(Math.min(99, Math.round((loaded / total) * 100)));
        };
        loadedDocument = await loadingTask.promise;

        if (!isCancelled) {
          setLoadingProgress(100);
          setDocument(loadedDocument);
        } else {
          loadedDocument.destroy();
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "File PDF belum dapat ditampilkan.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      isCancelled = true;
      loadingTask?.destroy();
      loadedDocument?.destroy();
    };
  }, [active, pdfUrl]);

  useEffect(() => {
    if (!document || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageStr = entry.target.getAttribute("data-page-number");
            if (pageStr) {
              const page = parseInt(pageStr, 10);
              setCurrentPage(page);
              setInputPage(String(page));
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.4,
      }
    );

    // Timeout ensures elements are rendered before observing
    const timeout = setTimeout(() => {
      if (containerRef.current) {
        const elements = containerRef.current.querySelectorAll(".pdf-page");
        elements.forEach((el) => observer.observe(el));
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [document, zoom, rotation]);

  useEffect(() => {
    if (!document) return;

    const container = containerRef.current;
    if (!container) return;

    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      const sensitivity = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 0.004 : 0.08;
      const delta = Math.max(0.04, Math.min(0.22, Math.abs(event.deltaY) * sensitivity));
      updateZoom((currentZoom) => currentZoom + direction * delta);
    }

    function handleGestureStart(event: Event) {
      event.preventDefault();
      gestureScaleRef.current = 1;
    }

    function handleGestureChange(event: Event) {
      event.preventDefault();
      const gestureEvent = event as Event & { scale?: number };
      const nextScale = gestureEvent.scale ?? 1;
      const scaleDelta = nextScale - gestureScaleRef.current;

      if (Math.abs(scaleDelta) >= 0.01) {
        updateZoom((currentZoom) => currentZoom + scaleDelta * 0.35);
        gestureScaleRef.current = nextScale;
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("gesturestart", handleGestureStart, { passive: false });
    container.addEventListener("gesturechange", handleGestureChange, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("gesturestart", handleGestureStart);
      container.removeEventListener("gesturechange", handleGestureChange);
    };
  }, [document]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
        <div className="w-full max-w-sm space-y-3">
          <div>
            <p>Memuat file PDF...</p>
            <p className="mt-1 text-xs font-normal text-slate-400">
              PDF dirender sebagai gambar agar teks tidak bisa disalin.
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-red-600 transition-all"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {loadingProgress ? `${loadingProgress}%` : "Menyiapkan viewer..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-rose-700">
        {error}
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-label={title}
      className="pdf-reader-scroll h-full overflow-auto bg-slate-200 px-4 py-6 select-none relative"
      role="document"
      tabIndex={0}
      onKeyDown={(event) => {
        if (!event.ctrlKey && !event.metaKey) return;

        const key = event.key.toLowerCase();
        if (key === "+" || key === "=") {
          event.preventDefault();
          zoomIn();
        } else if (key === "-" || key === "_") {
          event.preventDefault();
          zoomOut();
        } else if (key === "0") {
          event.preventDefault();
          resetZoom();
        }
      }}
    >
      <div className="sticky top-0 z-10 mx-auto mb-4 flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm">
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
          <input
            type="text"
            className="h-8 w-12 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-700 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const newPage = parseInt(inputPage, 10);
                if (newPage >= 1 && newPage <= document.numPages) {
                  const element = window.document.getElementById(`pdf-page-${newPage}`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                } else {
                  setInputPage(String(currentPage));
                }
              }
            }}
            onBlur={() => {
              const newPage = parseInt(inputPage, 10);
              if (newPage >= 1 && newPage <= document.numPages) {
                const element = window.document.getElementById(`pdf-page-${newPage}`);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              } else {
                setInputPage(String(currentPage));
              }
            }}
          />
          <span className="text-xs font-medium text-slate-500">
            / {document.numPages}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-9 rounded-xl p-0"
          onClick={zoomOut}
          disabled={zoom <= MIN_PDF_ZOOM}
          aria-label="Zoom out"
          title="Zoom out (Ctrl/Cmd + -)"
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="min-w-14 text-center text-xs font-semibold text-slate-600">
          {zoomPercent}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="size-9 rounded-xl p-0"
          onClick={zoomIn}
          disabled={zoom >= MAX_PDF_ZOOM}
          aria-label="Zoom in"
          title="Zoom in (Ctrl/Cmd + + atau Ctrl/Cmd + scroll)"
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl"
          onClick={() => setRotation((currentRotation) => (currentRotation + 180) % 360)}
          aria-label="Putar halaman"
          title="Putar halaman"
        >
          <RotateCw className="size-4" />
          Putar
        </Button>
      </div>
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-6">
        {Array.from({ length: document.numPages }, (_, index) => (
          <PdfCanvasPage
            key={`${pdfUrl}-${index + 1}`}
            document={document}
            pageNumber={index + 1}
            rotation={rotation}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
}

function clampZoom(value: number) {
  return Math.max(MIN_PDF_ZOOM, Math.min(MAX_PDF_ZOOM, Number(value.toFixed(2))));
}

function PdfCanvasPage({
  document,
  pageNumber,
  rotation,
  zoom,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  zoom: number;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(820);
  const [isVisible, setIsVisible] = useState(pageNumber === 1);
  const [isRendered, setIsRendered] = useState(false);
  const pageWidth = Math.round(Math.max(320, Math.min(2250, availableWidth * zoom)));
  const placeholderHeight = Math.round(pageWidth * 1.414);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setAvailableWidth(Math.max(320, Math.min(900, entry.contentRect.width)));
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );

    visibilityObserver.observe(wrapper);
    return () => visibilityObserver.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let isCancelled = false;
    let renderTask: RenderTask | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const targetCanvas = canvas;

    async function renderPage() {
      try {
        setIsRendered(false);
        const page = await document.getPage(pageNumber);
        if (isCancelled) return;

        const initialViewport = page.getViewport({ scale: 1, rotation });
        const scale = pageWidth / initialViewport.width;
        const viewport = page.getViewport({ scale, rotation });
        const context = targetCanvas.getContext("2d", { alpha: false });
        if (!context) return;

        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        targetCanvas.width = Math.floor(viewport.width * outputScale);
        targetCanvas.height = Math.floor(viewport.height * outputScale);
        targetCanvas.style.width = `${Math.floor(viewport.width)}px`;
        targetCanvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        renderTask = page.render({
          canvas: targetCanvas,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (caughtError) {
        if (!isCancelled && !(caughtError instanceof Error && caughtError.name === "RenderingCancelledException")) {
          console.error("[thesis-pdf-viewer] Failed to render PDF page", caughtError);
        }
      }
    }

    void renderPage();

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [document, isVisible, pageNumber, pageWidth, rotation]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      ref={wrapperRef}
      className="relative flex justify-center pdf-page"
      style={{
        width: pageWidth,
        ...(!isRendered ? { minHeight: placeholderHeight } : {}),
      }}
    >
      {!isRendered ? (
        <div className="absolute top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          Memuat halaman {pageNumber}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-label={`Halaman ${pageNumber}`}
        className="select-none rounded-sm bg-white shadow-lg ring-1 ring-slate-300"
      />
    </div>
  );
}
