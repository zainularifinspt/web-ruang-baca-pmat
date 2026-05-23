"use client";

import { useEffect, useRef, useState } from "react";
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
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

type ThesisPdfViewerProps = {
  pdfUrl?: string;
  pdfFilename?: string;
};

export function ThesisPdfViewer({ pdfUrl, pdfFilename }: ThesisPdfViewerProps) {
  const resolvedPdfUrl = resolveThesisPdfUrl(pdfUrl);
  const [open, setOpen] = useState(false);

  if (!resolvedPdfUrl) {
    return <p className="text-sm leading-6 text-slate-500">File PDF belum tersedia.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Dialog open={open} onOpenChange={setOpen}>
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
              <PdfCanvasReader
                active={open}
                pdfUrl={resolvedPdfUrl}
                title={pdfFilename || "File skripsi"}
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

  useEffect(() => {
    if (!active) return;

    let isCancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    let loadedDocument: PDFDocumentProxy | null = null;

    async function loadPdf() {
      setIsLoading(true);
      setError("");
      setDocument(null);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();

        loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: false });
        loadedDocument = await loadingTask.promise;

        if (!isCancelled) {
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
        Memuat file PDF...
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
      aria-label={title}
      className="h-full overflow-auto bg-slate-200 px-4 py-6"
      role="document"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {Array.from({ length: document.numPages }, (_, index) => (
          <PdfCanvasPage
            key={`${pdfUrl}-${index + 1}`}
            document={document}
            pageNumber={index + 1}
            rotation={180}
          />
        ))}
      </div>
    </div>
  );
}

function PdfCanvasPage({
  document,
  pageNumber,
  rotation,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pageWidth, setPageWidth] = useState(820);
  const [isVisible, setIsVisible] = useState(pageNumber === 1);
  const [isRendered, setIsRendered] = useState(false);
  const placeholderHeight = Math.round(pageWidth * 1.414);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setPageWidth(Math.max(320, Math.min(900, entry.contentRect.width)));
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
      { rootMargin: "900px 0px" },
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

        const correctedRotation = (page.rotate + rotation) % 360;
        const initialViewport = page.getViewport({ scale: 1, rotation: correctedRotation });
        const scale = pageWidth / initialViewport.width;
        const viewport = page.getViewport({ scale, rotation: correctedRotation });
        const context = targetCanvas.getContext("2d");
        if (!context) return;

        const outputScale = Math.min(window.devicePixelRatio || 1, 1.35);
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
      ref={wrapperRef}
      className="relative flex justify-center"
      style={!isRendered ? { minHeight: placeholderHeight } : undefined}
    >
      {!isRendered ? (
        <div className="absolute top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          Memuat halaman {pageNumber}
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-label={`Halaman ${pageNumber}`}
        className="max-w-full rounded-sm bg-white shadow-lg ring-1 ring-slate-300"
      />
    </div>
  );
}
