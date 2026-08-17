"use client";

import { useState } from "react";
import { BookOpen, Download, ExternalLink, X } from "lucide-react";
import { EbookPdfViewer } from "@/components/ebook-pdf-viewer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Book } from "@/lib/types";

interface EbookReaderModalProps {
  book: Book;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function EbookReaderModal({
  book,
  children,
  defaultOpen = false,
}: EbookReaderModalProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="rounded-xl bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95 border-0 gap-1.5"
          >
            <BookOpen className="size-3.5" />
            Baca E-Book
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-5xl w-[96vw] h-[92vh] max-h-[92vh] p-0 overflow-hidden rounded-[2rem] border-0 bg-slate-950 shadow-2xl flex flex-col">
        <EbookPdfViewer
          pdfUrl={book.pdfUrl}
          title={book.title}
          author={book.author}
          category={book.category}
          className="h-full w-full rounded-none border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
