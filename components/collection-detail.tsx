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
        "p-0 transition-all duration-300",
        "[&>button]:right-4 sm:[&>button]:right-5 [&>button]:top-4 sm:[&>button]:top-5 [&>button]:rounded-full [&>button]:p-2 [&>button]:bg-white/80 [&>button]:border [&>button]:border-white/80 [&>button]:text-slate-600 [&>button]:shadow-md [&>button]:backdrop-blur-xl [&>button]:hover:scale-110 [&>button]:hover:bg-white [&>button]:transition-all [&>button]:z-20",
        isEbook
          ? "w-[94vw] max-w-2xl rounded-[2rem] overflow-hidden max-h-[92vh] overflow-y-auto sm:overflow-hidden scrollbar-none [&::-webkit-scrollbar]:hidden border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,242,242,0.78)_40%,rgba(255,248,242,0.88)_100%)] shadow-[0_28px_70px_-10px_rgba(225,29,72,0.18),0_12px_28px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-3xl"
          : "w-[95vw] max-w-5xl sm:w-[calc(100%-2rem)] max-h-[92vh] rounded-[2rem] sm:rounded-[2.25rem] border border-orange-100/60 bg-gradient-to-b from-orange-50/70 via-white to-slate-50 shadow-[0_24px_50px_rgba(234,88,12,0.12)] backdrop-blur-2xl overflow-y-auto md:grid md:grid-rows-[auto_minmax(0,1fr)] md:overflow-hidden",
      )}
    >
      {isEbook ? (
        <div className="relative p-6 sm:p-7">
          <DialogHeader className="sr-only">
            <DialogTitle>{item.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-7">
            {/* 3D Floating Book Presentation */}
            <div className="relative shrink-0 group">
              {/* Soft atmospheric depth shadow beneath the book */}
              <div className="pointer-events-none absolute -bottom-3 inset-x-3 h-5 bg-rose-950/20 blur-lg rounded-full -z-10" />

              <div className="relative overflow-hidden rounded-xl bg-slate-100 shadow-[0_20px_40px_-8px_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.12)] ring-1 ring-white/80 transition-transform duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
                {/* Physical book spine lighting illusion */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-3 z-10 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-3 w-px z-10 bg-white/25" />

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
                {/* 3D Glass Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-900 bg-white/90 border border-white shadow-[0_2px_8px_rgba(225,29,72,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md">
                    <BookOpen className="size-3.5 text-rose-600" />
                    E-Book Digital
                  </span>
                  {item.category ? (
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                      {item.category}
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                  {item.title}
                </h2>

                {/* 3D Glass Metadata Card */}
                <div className="mt-3.5 rounded-2xl border border-white/80 bg-white/60 p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl space-y-2.5">
                  {/* Author */}
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-100/80 shadow-2xs">
                      <UserRound className="size-3.5" />
                    </span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Penulis:</span>
                    <span className="font-bold text-slate-900 truncate">
                      {splitBookAuthors(item.author).join(", ") || "-"}
                    </span>
                  </div>

                  {/* Course / Category */}
                  {item.category ? (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700 border border-orange-100/80 shadow-2xs">
                        <BookOpen className="size-3.5" />
                      </span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider shrink-0">Mata Kuliah:</span>
                      <span className="font-semibold text-rose-950 truncate">{item.category}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 3D High-Contrast Glass CTA Button */}
              <div className="mt-5 pt-4 border-t border-slate-200/50">
                {pdfViewUrl ? (
                  <a
                    href={pdfViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#ffffff", textDecoration: "none" }}
                    className="group relative flex w-full sm:w-auto items-center justify-center gap-2.5 px-7 h-12 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 font-extrabold text-white !text-white shadow-[0_12px_28px_-4px_rgba(225,29,72,0.45),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-white/30 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-4px_rgba(225,29,72,0.55)] active:translate-y-0 active:scale-[0.98] cursor-pointer"
                  >
                    <span
                      className="flex size-7 items-center justify-center rounded-xl bg-white/25 backdrop-blur-md shadow-xs transition-transform group-hover:scale-110"
                      style={{ color: "#ffffff" }}
                    >
                      <ExternalLink className="size-4" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                    </span>
                    <span
                      className="text-sm sm:text-base font-black tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                      style={{ color: "#ffffff" }}
                    >
                      Lihat PDF
                    </span>
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
