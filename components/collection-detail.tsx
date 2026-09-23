import Image from "next/image";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
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
import dynamic from "next/dynamic";
import { AvailabilityBadge } from "@/components/status-badge";
import { BookCover } from "@/components/book-cover";
import { splitBookAuthors } from "@/lib/book-authors";
import { getGoogleDriveDirectViewUrl } from "@/lib/google-drive";
import { cn } from "@/lib/utils";
import type { Book, Thesis } from "@/lib/types";

const ThesisPdfViewer = dynamic(
  () => import("@/components/thesis-pdf-viewer").then((mod) => mod.ThesisPdfViewer),
  { ssr: false }
);

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
  const directDriveUrl = isBook && item.pdfUrl ? getGoogleDriveDirectViewUrl(item.pdfUrl) : undefined;
  const pdfViewUrl = directDriveUrl || item.pdfUrl || undefined;

  return (
    <DialogContent
      className={cn(
        "p-0 transition-all duration-200",
        "[&>button]:right-4 sm:[&>button]:right-5 [&>button]:top-4 sm:[&>button]:top-5 [&>button]:rounded-full [&>button]:p-2 [&>button]:bg-slate-100/80 [&>button]:text-slate-500 [&>button]:hover:bg-slate-200 [&>button]:hover:text-slate-800 [&>button]:transition-colors [&>button]:z-20",
        isEbook
          ? "w-[92vw] max-w-2xl rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto sm:overflow-hidden scrollbar-none [&::-webkit-scrollbar]:hidden border border-slate-200/90 bg-white/95 backdrop-blur-2xl shadow-2xl"
          : "w-[95vw] max-w-5xl sm:w-[calc(100%-2rem)] max-h-[92vh] rounded-[2rem] sm:rounded-[2.25rem] border border-orange-100/60 bg-gradient-to-b from-orange-50/70 via-white to-slate-50 shadow-[0_24px_50px_rgba(234,88,12,0.12)] backdrop-blur-2xl overflow-y-auto md:grid md:grid-rows-[auto_minmax(0,1fr)] md:overflow-hidden",
      )}
    >
      {isEbook ? (
        <div className="relative p-6 sm:p-7">
          <DialogHeader className="sr-only">
            <DialogTitle>{item.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-7">
            {/* Tangible Book Presentation */}
            <div className="relative shrink-0">
              <div className="relative overflow-hidden rounded-xl bg-slate-100 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
                {/* Book spine lighting illusion */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-2.5 z-10 bg-gradient-to-r from-black/25 via-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-2.5 w-px z-10 bg-white/20" />

                {/* Cover image */}
                {item.coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.coverUrl}
                    alt={`Cover ${item.title}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-36 h-52 sm:w-44 sm:h-64 object-cover block"
                  />
                ) : (
                  <div className="w-36 h-52 sm:w-44 sm:h-64 flex flex-col items-center justify-center p-4 text-center bg-slate-100 text-slate-400">
                    <BookOpen className="size-8 text-slate-300 mb-2" />
                    <span className="text-xs font-medium text-slate-500 line-clamp-3">{item.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book Metadata & Action */}
            <div className="flex flex-1 flex-col justify-between self-stretch min-w-0 text-left">
              <div>
                {/* Badge & Category Tag */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-100/80">
                    <BookOpen className="size-3 text-rose-600" />
                    E-Book Digital
                  </span>
                  {item.category ? (
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                      {item.category}
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h2>

                {/* Authors */}
                <div className="mt-3 text-sm text-slate-600">
                  <span className="text-slate-400">Penulis: </span>
                  <span className="font-semibold text-slate-800">
                    {splitBookAuthors(item.author).join(", ") || "-"}
                  </span>
                </div>

                {/* Mata Kuliah */}
                {item.category ? (
                  <div className="mt-1.5 text-sm text-slate-600">
                    <span className="text-slate-400">Mata Kuliah: </span>
                    <span className="font-medium text-slate-700">{item.category}</span>
                  </div>
                ) : null}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                {pdfViewUrl ? (
                  <a
                    href={pdfViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm shadow-sm transition-all duration-150 hover:shadow active:scale-[0.99] cursor-pointer no-underline"
                  >
                    <ExternalLink className="size-4 text-white" />
                    <span>Lihat PDF</span>
                  </a>
                ) : (
                  <p className="text-xs text-slate-400">File PDF belum tersedia untuk koleksi ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header for Book & Thesis */}
          <div className="relative shrink-0 overflow-hidden border-b border-orange-100/60 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(254,242,242,0.8),rgba(255,255,255,0.95))] px-5 pb-4 pt-5 pr-12 sm:px-7 sm:pb-5 sm:pt-6 sm:pr-14">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            <DialogHeader className="relative space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Badge className="rounded-full border border-orange-200 bg-white/90 px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-bold text-orange-950 shadow-xs backdrop-blur-md">
                  {isBook ? (
                    <>
                      <BookOpen className="mr-1.5 size-3.5 sm:size-4 text-red-600" />
                      Buku Fisik
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-1.5 size-3.5 sm:size-4 text-slate-800" />
                      Skripsi
                    </>
                  )}
                </Badge>

                {isBook ? (
                  <AvailabilityBadge available={item.available} stock={item.stock} />
                ) : null}
              </div>

              <DialogTitle className="max-w-4xl text-balance text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl md:text-2xl">
                {item.title}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Body for Book & Thesis */}
          <div className="relative min-h-0 bg-slate-50/50 p-4 sm:p-6 space-y-3.5 sm:space-y-5 sm:p-7 md:overflow-y-auto">
            {isBook ? (
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

            {/* Physical Book Details */}
            {isBook ? (
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
                        pdfR2={item.pdfR2}
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
        </>
      )}
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
    <div className="flex min-h-[3.75rem] sm:min-h-[4.5rem] gap-2.5 sm:gap-3 rounded-2xl sm:rounded-[1.25rem] border border-slate-200/70 bg-white/90 p-3 sm:p-4 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-md">
      <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-orange-50 text-orange-700 shadow-inner shadow-white/70 [&_svg]:size-4 sm:[&_svg]:size-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </p>
        <div className="mt-0.5 sm:mt-1 break-words text-xs sm:text-sm md:text-base font-bold leading-snug text-slate-950">
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
