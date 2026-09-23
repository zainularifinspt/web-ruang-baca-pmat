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
        "flex flex-col overflow-y-auto overflow-x-hidden rounded-[2rem] sm:rounded-[2.25rem] p-0 [&>button]:right-4 sm:[&>button]:right-6 [&>button]:top-4 sm:[&>button]:top-6 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:p-2.5 [&>button]:shadow-lg [&>button]:shadow-slate-900/10 [&>button]:backdrop-blur-xl [&>button]:border [&>button]:border-white/80 [&>button]:transition-all [&>button]:hover:scale-110 [&>button]:hover:bg-white",
        isEbook
          ? "w-[95vw] max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[92vh] border border-white/80 bg-gradient-to-b from-white/95 via-rose-50/30 to-orange-50/40 shadow-[0_30px_90px_rgba(225,29,72,0.18),0_12px_30px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-3xl"
          : "w-[95vw] max-w-5xl sm:w-[calc(100%-2rem)] max-h-[92vh] border border-orange-100/60 bg-gradient-to-b from-orange-50/70 via-white to-slate-50 shadow-[0_24px_50px_rgba(234,88,12,0.12)] backdrop-blur-2xl md:grid md:grid-rows-[auto_minmax(0,1fr)] md:overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden border-b border-rose-100/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,241,242,0.85),rgba(255,247,237,0.9))] px-6 pb-5 pt-5 pr-14 sm:px-8 sm:pb-6 sm:pt-6 sm:pr-16 backdrop-blur-2xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rose-300/60 to-transparent" />
        <DialogHeader className="relative space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge className="rounded-full border border-rose-200/80 bg-white/90 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-rose-950 shadow-[0_2px_8px_rgba(225,29,72,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              {isEbook ? (
                <>
                  <BookOpen className="mr-1.5 size-4 text-rose-600" />
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

            {isBook && !isEbook ? (
              <AvailabilityBadge available={item.available} stock={item.stock} />
            ) : null}
          </div>

          <DialogTitle className="max-w-3xl text-balance text-xl font-black leading-tight tracking-tight text-slate-950 sm:text-2xl md:text-3xl">
            {item.title}
          </DialogTitle>
        </DialogHeader>
      </div>

      {/* Body Content */}
      <div
        className={cn(
          "relative min-h-0 p-5 sm:p-8",
          isEbook
            ? "bg-transparent"
            : "bg-slate-50/50 space-y-3.5 sm:space-y-5 md:overflow-y-auto",
        )}
      >
        {/* Info Grid / Ebook 3D Glassmorphism Layout */}
        {isEbook ? (
          <div className="relative">
            {/* Ambient decorative blur orbs for authentic 3D glass refraction */}
            <div className="pointer-events-none absolute -left-12 -top-12 size-64 rounded-full bg-gradient-to-br from-rose-400/20 to-orange-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 -bottom-12 size-64 rounded-full bg-gradient-to-tr from-amber-300/20 to-rose-400/20 blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-center md:items-stretch gap-6 sm:gap-8">
              {/* Foto Cover Buku - 3D Floating Showcase */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-rose-500/20 via-orange-400/15 to-amber-300/20 blur-2xl opacity-80" />
                <BookCover
                  coverUrl={item.coverUrl}
                  title={item.title}
                  author={item.author}
                  category={item.category}
                  size="xl"
                  className="relative shadow-[0_22px_55px_-10px_rgba(0,0,0,0.38),0_0_25px_rgba(225,29,72,0.15)] ring-1 ring-white/90 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                />
              </div>

              {/* Detail Info & Tombol Lihat PDF */}
              <div className="flex flex-1 flex-col justify-between w-full space-y-4 sm:space-y-5">
                <div className="space-y-3 sm:space-y-4">
                  <GlassInfoCard
                    icon={<UserRound className="size-5 text-rose-600" />}
                    label="Penulis"
                    value={<AuthorLines author={item.author} />}
                  />
                  <GlassInfoCard
                    icon={<BookOpen className="size-5 text-orange-600" />}
                    label="Kategori / Mata Kuliah"
                    value={item.category || "-"}
                  />
                </div>

                {pdfViewUrl ? (
                  <div className="pt-2">
                    <a
                      href={pdfViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#ffffff" }}
                      className="group relative flex w-full h-12 sm:h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 px-6 font-black text-white !text-white shadow-[0_14px_34px_-4px_rgba(225,29,72,0.45),inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.2)] ring-1 ring-white/30 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-4px_rgba(225,29,72,0.55)] active:translate-y-0 active:scale-[0.98] cursor-pointer no-underline"
                    >
                      <span className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-xs group-hover:scale-110 transition-transform">
                        <ExternalLink className="size-4 sm:size-4.5 text-white !text-white" style={{ color: "#ffffff" }} />
                      </span>
                      <span
                        className="text-sm sm:text-base font-black tracking-wide text-white !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                        style={{ color: "#ffffff" }}
                      >
                        Lihat PDF
                      </span>
                    </a>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs font-semibold text-slate-500">
                    File PDF belum tersedia untuk e-book ini
                  </div>
                )}
              </div>
            </div>
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
                    pdfR2={item.pdfR2}
                    pdfFilename={item.pdfFilename}
                    studentName={item.studentName}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        ) : null}

        {item.notes && !isEbook ? (
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

function GlassInfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl sm:rounded-[1.35rem] border border-white/80 bg-white/80 p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95 hover:border-rose-200/80 hover:shadow-[0_12px_28px_rgba(225,29,72,0.08)]">
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-900/70">
            {label}
          </p>
          <div className="mt-1 text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
            {value}
          </div>
        </div>
      </div>
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
