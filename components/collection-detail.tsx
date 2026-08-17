import Image from "next/image";
import {
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  MapPin,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/status-badge";
import { ThesisPdfViewer } from "@/components/thesis-pdf-viewer";
import { EbookPdfViewer } from "@/components/ebook-pdf-viewer";
import { BookCover } from "@/components/book-cover";
import { splitBookAuthors } from "@/lib/book-authors";
import { getGoogleDriveDownloadUrl, getGoogleDriveDirectViewUrl } from "@/lib/google-drive";
import { cn } from "@/lib/utils";
import type { Book, Thesis } from "@/lib/types";

type CollectionItem = Book | Thesis;

export function CollectionDetail({
  item,
  triggerLabel = "Detail",
}: {
  item: CollectionItem;
  triggerLabel?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <CollectionDetailContent item={item} />
    </Dialog>
  );
}

export function CollectionDetailContent({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";
  const isEbook = isBook && (item.isEbook || Boolean(item.pdfUrl));
  const downloadUrl = isBook && item.pdfUrl ? getGoogleDriveDownloadUrl(item.pdfUrl) : undefined;
  const directDriveUrl = isBook && item.pdfUrl ? getGoogleDriveDirectViewUrl(item.pdfUrl) : undefined;

  return (
    <DialogContent
      className={cn(
        "flex flex-col overflow-y-auto overflow-x-hidden rounded-[2.25rem] border border-orange-100/60 bg-gradient-to-b from-orange-50/70 via-white to-slate-50 p-0 shadow-[0_24px_50px_rgba(234,88,12,0.12)] backdrop-blur-2xl md:grid md:grid-rows-[auto_minmax(0,1fr)] md:overflow-hidden [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:p-2 [&>button]:shadow-md [&>button]:shadow-slate-900/10 [&>button]:backdrop-blur-xl [&>button]:transition-all [&>button]:hover:scale-105",
        isEbook
          ? "w-[96vw] max-w-[1580px] h-[95vh] max-h-[95vh]"
          : "max-w-5xl sm:w-[calc(100%-2rem)] max-h-[92vh]",
      )}
    >
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden border-b border-orange-100/60 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(254,242,242,0.8),rgba(255,255,255,0.95))] px-5 pb-6 pt-5 pr-14 sm:px-8 sm:pb-7 sm:pt-6 sm:pr-16">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
        <DialogHeader className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-orange-200 bg-white/90 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-orange-950 shadow-xs backdrop-blur-md">
              {isEbook ? (
                <>
                  <BookOpen className="mr-1.5 size-4 text-orange-600" />
                  E-Book Digital
                </>
              ) : isBook ? (
                <>
                  <BookOpen className="mr-1.5 size-4 text-red-600" />
                  Buku Fisik
                </>
              ) : (
                <>
                  <GraduationCap className="mr-1.5 size-4 text-slate-800" />
                  Skripsi
                </>
              )}
            </Badge>

            {isEbook ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                <Sparkles className="size-3.5" />
                Google Drive PDF
              </span>
            ) : isBook ? (
              <AvailabilityBadge available={item.available} stock={item.stock} />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1 text-xs font-semibold text-rose-800 shadow-sm backdrop-blur-md">
                <Sparkles className="size-3.5" />
                Repositori Digital
              </span>
            )}
          </div>

          <DialogTitle className="max-w-4xl text-balance text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            {item.title}
          </DialogTitle>

          {isEbook && downloadUrl ? (
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                asChild
                size="sm"
                className="h-9 rounded-xl bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 px-4 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 border-0 gap-1.5 cursor-pointer"
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="size-4" />
                  Download PDF File
                </a>
              </Button>
              {directDriveUrl ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-slate-200 bg-white/80 px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-white hover:text-slate-900 active:scale-95 gap-1.5 cursor-pointer"
                >
                  <a href={directDriveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    Buka di Google Drive
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>
      </div>

      {/* Body Content */}
      <div className="relative min-h-0 space-y-5 bg-slate-50/50 p-5 sm:p-7 md:overflow-y-auto">
        {/* Info Grid */}
        {isEbook ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Info
              icon={<UserRound />}
              label="Penulis"
              value={<AuthorLines author={item.author} />}
            />
            <Info
              icon={<BookOpen />}
              label="Kategori / Mata Kuliah"
              value={item.category || "-"}
            />
          </div>
        ) : isBook ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Info
                icon={<UserRound />}
                label="Penulis"
                value={<AuthorLines author={item.author} />}
              />
            </div>
            <div className="md:col-span-1">
              <Info icon={<Calendar />} label="Tahun" value={String(item.year || 2024)} />
            </div>
            <div className="md:col-span-2">
              <Info icon={<MapPin />} label="Lokasi Rak" value={item.rackLocation} />
            </div>
            <div className="md:col-span-2">
              <Info icon={<BookOpen />} label="Kategori" value={item.category} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Info
                icon={<UserRound />}
                label="Mahasiswa"
                value={item.studentName}
              />
            </div>
            <div className="md:col-span-1">
              <Info icon={<Calendar />} label="Tahun" value={String(item.year || 2024)} />
            </div>
          </div>
        )}

        {/* Ebook Google Drive Viewer Panel */}
        {isEbook && item.pdfUrl ? (
          <div className="grid gap-6 lg:grid-cols-12 items-start pt-1">
            <div className="lg:col-span-3 flex flex-col items-center">
              <BookCover
                coverUrl={item.coverUrl}
                title={item.title}
                author={item.author}
                category={item.category}
                size="lg"
                className="shadow-xl"
              />
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                Cover Dokumen
              </p>
            </div>

            <div className="lg:col-span-9">
              <EbookPdfViewer
                pdfUrl={item.pdfUrl}
                title={item.title}
                author={item.author}
                category={item.category}
              />
            </div>
          </div>
        ) : null}

        {/* Physical Book Details */}
        {isBook && !isEbook ? (
          <>
            <BookCoverPreview
              coverUrl={item.coverUrl}
              title={item.title}
              author={item.author}
              category={item.category}
            />
            <GlassPanel className="p-4 text-sm leading-7 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Meta label="Kategori" value={item.category} />
                <Meta label="Stok tersedia" value={`${item.available} dari ${item.stock}`} />
                <Meta label="Kode Koleksi" value={item.code} />
                <Meta label="Lokasi Rak" value={item.rackLocation} />
              </div>
            </GlassPanel>
          </>
        ) : null}

        {/* Thesis Details */}
        {!isBook ? (
          <GlassPanel className="p-5 sm:p-6">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-7 md:border-r md:border-red-100/60 md:pr-6">
                <div className="mb-3.5 flex items-center gap-2 text-slate-900">
                  <UsersRound className="size-5 text-red-700" />
                  <p className="text-lg font-bold">Dosen Pembimbing</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Info
                    icon={<UserRound />}
                    label="Pembimbing 1"
                    value={
                      <span className="whitespace-nowrap block truncate" title={item.supervisor1}>
                        {item.supervisor1}
                      </span>
                    }
                  />
                  <Info
                    icon={<UserRound />}
                    label="Pembimbing 2"
                    value={
                      <span className="whitespace-nowrap block truncate" title={item.supervisor2}>
                        {item.supervisor2}
                      </span>
                    }
                  />
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between md:pl-2">
                <div>
                  <div className="mb-3.5 flex items-center gap-2 text-slate-900">
                    <FileText className="size-5 text-red-700" />
                    <p className="text-lg font-bold">File Skripsi</p>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Dokumen skripsi lengkap tersedia untuk dibaca secara digital melalui viewer PDF interaktif.
                  </p>
                </div>
                <div className="mt-6 md:mt-0">
                  <ThesisPdfViewer
                    pdfUrl={item.pdfUrl}
                    pdfFilename={item.pdfFilename}
                    studentName={item.studentName}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        ) : null}

        {item.notes ? (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 text-sm text-orange-950 shadow-xs backdrop-blur-md">
            <span className="font-semibold">Catatan:</span> {item.notes}
          </div>
        ) : null}
      </div>
    </DialogContent>
  );
}

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-orange-100/50 bg-white/80 shadow-[0_10px_28px_rgba(234,88,12,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl ring-1 ring-orange-50/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BookCoverPreview({
  coverUrl,
  title,
  author,
  category,
}: {
  coverUrl?: string;
  title: string;
  author?: string;
  category?: string;
}) {
  return (
    <div className="mt-4 flex justify-center">
      <BookCover
        coverUrl={coverUrl}
        title={title}
        author={author}
        category={category}
        size="xl"
        className="shadow-xl"
      />
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[4.5rem] gap-3 rounded-[1.25rem] border border-slate-200/70 bg-white/90 p-4 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 shadow-inner shadow-white/70 [&_svg]:size-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className="mt-1 break-words text-sm font-bold leading-snug text-slate-900 sm:text-base">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function AuthorLines({ author }: { author: string }) {
  const authors = splitBookAuthors(author);

  if (!authors.length) return <span>-</span>;

  return (
    <div className="space-y-0.5">
      {authors.map((name, index) => (
        <p key={`${name}-${index}`}>{name}</p>
      ))}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}
