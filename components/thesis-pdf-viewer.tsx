"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

const MIN_PDF_ZOOM = 0.75;
const MAX_PDF_ZOOM = 2.5;
const PDF_ZOOM_STEP = 0.15;
const PDF_RANGE_CHUNK_SIZE = 512 * 1024;
const MAX_PAGE_BASE_WIDTH = 900;
const MAX_RENDERED_PAGE_WIDTH = 1800;
const MAX_CANVAS_PIXELS = 4_000_000;
const MAX_CANVAS_PIXEL_RATIO = 1.5;
const MAX_CONCURRENT_PAGE_RENDERS = 2;

type QueuedPageRender = {
  cancelled: boolean;
  run: () => Promise<void>;
};

let activePageRenders = 0;
const pageRenderQueue: QueuedPageRender[] = [];

type ThesisPdfViewerProps = {
  pdfUrl?: string;
  pdfFilename?: string;
  studentName?: string;
};

export function ThesisPdfViewer({ pdfUrl, studentName }: ThesisPdfViewerProps) {
  const resolvedPdfUrl = resolveThesisPdfUrl(pdfUrl);
  const [open, setOpen] = useState(false);
  const readerTitle = studentName ? `File Skripsi - ${studentName}` : "File Skripsi";
  const resolvedReaderPdfUrl = resolvedPdfUrl ? readerPdfUrl(resolvedPdfUrl) : "";

  useEffect(() => {
    if (!open || !resolvedPdfUrl) return;

    const warmup = window.setTimeout(() => {
      void import("pdfjs-dist").then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();
      });
    }, 250);

    return () => window.clearTimeout(warmup);
  }, [open, resolvedPdfUrl]);

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
              <PdfCanvasReader active={open} pdfUrl={resolvedReaderPdfUrl} title={readerTitle} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function readerPdfUrl(value: string) {
  return `/api/theses/pdf/proxy?url=${encodeURIComponent(value)}`;
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
  const [hiddenPageNumbers, setHiddenPageNumbers] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Memuat file PDF...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");
  const [pageBaseWidth, setPageBaseWidth] = useState(820);
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureScaleRef = useRef(1);
  const pendingScrollRatioRef = useRef<{ left: number; top: number } | null>(null);

  const zoomPercent = Math.round(zoom * 100);

  const captureScrollRatio = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    pendingScrollRatioRef.current = {
      left: getScrollRatio(container.scrollLeft, container.scrollWidth - container.clientWidth),
      top: getScrollRatio(container.scrollTop, container.scrollHeight - container.clientHeight),
    };
  }, []);

  const updateZoom = useCallback((nextZoom: number | ((currentZoom: number) => number)) => {
    captureScrollRatio();
    setZoom((currentZoom) => {
      const resolvedZoom = typeof nextZoom === "function" ? nextZoom(currentZoom) : nextZoom;
      return clampZoom(resolvedZoom);
    });
  }, [captureScrollRatio]);

  const zoomIn = useCallback(() => {
    updateZoom((currentZoom) => currentZoom + PDF_ZOOM_STEP);
  }, [updateZoom]);

  const zoomOut = useCallback(() => {
    updateZoom((currentZoom) => currentZoom - PDF_ZOOM_STEP);
  }, [updateZoom]);

  const resetZoom = useCallback(() => {
    updateZoom(1);
  }, [updateZoom]);

  useLayoutEffect(() => {
    const scrollRatio = pendingScrollRatioRef.current;
    const container = containerRef.current;
    if (!scrollRatio || !container) return;

    const frame = window.requestAnimationFrame(() => {
      container.scrollLeft = scrollRatio.left * Math.max(0, container.scrollWidth - container.clientWidth);
      container.scrollTop = scrollRatio.top * Math.max(0, container.scrollHeight - container.clientHeight);
      pendingScrollRatioRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [zoom]);

  useEffect(() => {
    if (!active) return;

    let isCancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDocument: PDFDocumentProxy | null = null;

    async function loadPdf() {
      setIsLoading(true);
      setLoadingMessage("Memuat file PDF...");
      setError("");
      setDocument(null);
      setHiddenPageNumbers(new Set());
      setLoadingProgress(0);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();

        loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          httpHeaders: {
            "X-PDF-Canvas-Reader": "1",
          },
          withCredentials: false,
          rangeChunkSize: PDF_RANGE_CHUNK_SIZE,
          cMapPacked: true,
          useSystemFonts: true,
        });
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!total || isCancelled) return;

          setLoadingProgress(Math.min(99, Math.round((loaded / total) * 100)));
        };
        loadedDocument = await loadingTask.promise;

        if (!isCancelled) {
          setLoadingMessage("Menyiapkan PDF tanpa Bab IV...");
          const nextHiddenPageNumbers = await detectChapterFourPages(loadedDocument);
          if (isCancelled) {
            loadedDocument.destroy();
            return;
          }

          setLoadingProgress(100);
          setHiddenPageNumbers(nextHiddenPageNumbers);
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
  }, [document, hiddenPageNumbers, zoom, rotation]);

  useEffect(() => {
    if (!document) return;

    const container = containerRef.current;
    if (!container) return;

    const updateReaderMeasurements = () => {
      const nextBaseWidth = Math.max(
        320,
        Math.min(MAX_PAGE_BASE_WIDTH, container.clientWidth - 96),
      );

      setPageBaseWidth(Math.round(nextBaseWidth));
    };

    updateReaderMeasurements();
    const resizeObserver = new ResizeObserver(updateReaderMeasurements);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
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
  }, [document, updateZoom]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
        <div className="w-full max-w-sm space-y-3">
          <div>
            <p>{loadingMessage}</p>
            <p className="mt-1 text-xs font-normal text-slate-400">
              PDF dirender sebagai gambar dan Bab IV disembunyikan dari pembaca.
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

  const visiblePageNumbers = Array.from({ length: document.numPages }, (_, index) => index + 1)
    .filter((pageNumber) => !hiddenPageNumbers.has(pageNumber));

  return (
    <div className="relative h-full overflow-hidden bg-slate-200">
      <div
        ref={containerRef}
        aria-label={title}
        className="pdf-reader-scroll h-full overflow-auto bg-slate-200 px-4 py-6 select-none"
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
                  if (newPage >= 1 && newPage <= document.numPages && !hiddenPageNumbers.has(newPage)) {
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
                if (newPage >= 1 && newPage <= document.numPages && !hiddenPageNumbers.has(newPage)) {
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
        {hiddenPageNumbers.size ? (
          <p className="mx-auto mb-4 w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            Bab IV disembunyikan dari viewer
          </p>
        ) : null}
        <div className="mx-auto flex w-max min-w-full flex-col items-center gap-6">
          {visiblePageNumbers.map((pageNumber) => (
            <PdfCanvasPage
              key={`${pdfUrl}-${pageNumber}`}
              document={document}
              pageNumber={pageNumber}
              pageBaseWidth={pageBaseWidth}
              rotation={rotation}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function clampZoom(value: number) {
  return Math.max(MIN_PDF_ZOOM, Math.min(MAX_PDF_ZOOM, Number(value.toFixed(2))));
}

function getScrollRatio(value: number, maxValue: number) {
  if (maxValue <= 0) return 0;
  return Math.max(0, Math.min(1, value / maxValue));
}

async function detectChapterFourPages(document: PDFDocumentProxy) {
  const hiddenPageNumbers = new Set<number>();
  let chapterFourStart = 0;
  let chapterFiveStart = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);

    try {
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .toUpperCase();

      if (!chapterFourStart && /^(\d+\s+)?BAB\s*(IV|4)\b/.test(pageText)) {
        chapterFourStart = pageNumber;
      } else if (chapterFourStart && /^(\d+\s+)?BAB\s*(V|5)\b/.test(pageText)) {
        chapterFiveStart = pageNumber;
        break;
      }
    } finally {
      page.cleanup();
    }
  }

  if (!chapterFourStart) return hiddenPageNumbers;

  const endPage = chapterFiveStart ? chapterFiveStart - 1 : document.numPages;
  for (let pageNumber = chapterFourStart; pageNumber <= endPage; pageNumber++) {
    hiddenPageNumbers.add(pageNumber);
  }

  return hiddenPageNumbers;
}

function queuePdfPageRender(run: () => Promise<void>) {
  const queuedRender: QueuedPageRender = {
    cancelled: false,
    run,
  };

  pageRenderQueue.push(queuedRender);
  flushPdfPageRenderQueue();

  return () => {
    queuedRender.cancelled = true;
    const queuedIndex = pageRenderQueue.indexOf(queuedRender);
    if (queuedIndex >= 0) {
      pageRenderQueue.splice(queuedIndex, 1);
    }
  };
}

function flushPdfPageRenderQueue() {
  while (activePageRenders < MAX_CONCURRENT_PAGE_RENDERS && pageRenderQueue.length > 0) {
    const nextRender = pageRenderQueue.shift();
    if (!nextRender || nextRender.cancelled) continue;

    activePageRenders += 1;
    void nextRender.run().finally(() => {
      activePageRenders = Math.max(0, activePageRenders - 1);
      flushPdfPageRenderQueue();
    });
  }
}

function getCanvasOutputScale(viewportWidth: number, viewportHeight: number) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const maxAreaScale = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, viewportWidth * viewportHeight));

  return Math.max(0.75, Math.min(devicePixelRatio, MAX_CANVAS_PIXEL_RATIO, maxAreaScale));
}

const PdfCanvasPage = memo(function PdfCanvasPage({
  document,
  pageNumber,
  pageBaseWidth,
  rotation,
  zoom,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  pageBaseWidth: number;
  rotation: number;
  zoom: number;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(pageNumber === 1);
  const [isRendered, setIsRendered] = useState(false);
  const pageWidth = Math.round(Math.max(320, Math.min(MAX_RENDERED_PAGE_WIDTH, pageBaseWidth * zoom)));
  const placeholderHeight = Math.round(pageWidth * 1.414);

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
      let page: PDFPageProxy | null = null;

      try {
        setIsRendered(false);
        page = await document.getPage(pageNumber);
        if (isCancelled) return;

        const initialViewport = page.getViewport({ scale: 1, rotation });
        const scale = pageWidth / initialViewport.width;
        const viewport = page.getViewport({ scale, rotation });
        const context = targetCanvas.getContext("2d", { alpha: false });
        if (!context) return;

        const outputScale = getCanvasOutputScale(viewport.width, viewport.height);
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
      } finally {
        page?.cleanup();
      }
    }

    const cancelQueuedRender = queuePdfPageRender(renderPage);

    return () => {
      isCancelled = true;
      cancelQueuedRender();
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
        minHeight: placeholderHeight,
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
});
