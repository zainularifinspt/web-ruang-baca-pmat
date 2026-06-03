import { BookOpen, Calendar, FileText, GraduationCap, MapPin, Sparkles, UserRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/status-badge";
import { ThesisPdfViewer } from "@/components/thesis-pdf-viewer";
import { splitBookAuthors } from "@/lib/book-authors";
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

  return (
    <DialogContent className="grid max-h-[88vh] max-w-4xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-0 shadow-[0_24px_50px_rgba(4,120,87,0.15)] backdrop-blur-2xl sm:w-[calc(100%-3rem)] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:p-2 [&>button]:shadow-md [&>button]:shadow-emerald-950/5 [&>button]:backdrop-blur-xl [&>button]:transition-all [&>button]:hover:scale-105">
      <div className="relative overflow-hidden border-b border-emerald-100/50 bg-[linear-gradient(135deg,rgba(240,253,250,0.96),rgba(209,250,229,0.6),rgba(255,255,255,0.95))] px-5 pb-6 pt-5 pr-14 sm:px-8 sm:pb-8 sm:pt-6 sm:pr-16">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        <DialogHeader className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-emerald-200 bg-white/85 px-3.5 py-1.5 text-sm font-semibold text-emerald-900 shadow-sm shadow-emerald-900/5 backdrop-blur-md">
              <GraduationCap className="mr-1.5 size-4" />
              {isBook ? "Buku" : "Skripsi"}
            </Badge>
            {isBook ? <AvailabilityBadge available={item.available} stock={item.stock} /> : null}
            {!isBook ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur-md">
                <Sparkles className="size-3.5" />
                Repositori Digital
              </span>
            ) : null}
          </div>
          <DialogTitle className="max-w-4xl text-balance text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {item.title}
          </DialogTitle>
          {isBook ? <BookCoverPreview coverUrl={item.coverUrl} title={item.title} /> : null}
        </DialogHeader>
      </div>
      <div className="relative min-h-0 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(209,250,229,0.25))] p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3">
            <Info
              icon={<UserRound />}
              label={isBook ? "Penulis" : "Mahasiswa"}
              value={isBook ? <AuthorLines author={item.author} /> : item.studentName}
            />
          </div>
          <div className="md:col-span-1">
            <Info icon={<Calendar />} label="Tahun" value={String(item.year)} />
          </div>
          {isBook ? (
            <>
              <div className="md:col-span-2">
                <Info icon={<MapPin />} label="Lokasi Fisik" value={item.rackLocation} />
              </div>
              <div className="md:col-span-2">
                <Info icon={<BookOpen />} label="Kode Koleksi" value={item.code} />
              </div>
            </>
          ) : null}
        </div>
        {isBook ? (
          <GlassPanel className="p-4 text-sm leading-7 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Meta label="Kategori" value={item.category} />
              <Meta label="Stok tersedia" value={`${item.available} dari ${item.stock}`} />
            </div>
          </GlassPanel>
        ) : null}
        {!isBook ? (
          <GlassPanel className="p-5 sm:p-6">
            <div className="grid gap-6 md:grid-cols-12">
              {/* Left side: Dosen Pembimbing */}
              <div className="md:col-span-7 md:border-r md:border-emerald-100/60 md:pr-6">
                <div className="mb-3.5 flex items-center gap-2 text-slate-900">
                  <UsersRound className="size-5 text-emerald-700" />
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

              {/* Right side: File Skripsi */}
              <div className="md:col-span-5 flex flex-col justify-between md:pl-2">
                <div>
                  <div className="mb-3.5 flex items-center gap-2 text-slate-900">
                    <FileText className="size-5 text-emerald-700" />
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
          <div className="rounded-2xl border border-emerald-200 bg-white/70 p-3.5 text-sm text-emerald-900 shadow-sm backdrop-blur-md">
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
        "rounded-[1.75rem] border border-emerald-100/40 bg-white/60 shadow-[0_10px_28px_rgba(4,120,87,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl ring-1 ring-emerald-50/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BookCoverPreview({ coverUrl, title }: { coverUrl?: string; title: string }) {
  return (
    <div className="mt-4 flex justify-center">
      <div className="w-fit rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-lg shadow-slate-200/70">
      {coverUrl ? (
        <div
          aria-label={`Cover ${title}`}
          className="h-80 w-56 rounded-2xl bg-slate-100 bg-cover bg-center ring-1 ring-slate-200"
          role="img"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : (
        <div className="flex h-80 w-56 items-center justify-center rounded-2xl bg-slate-100 px-4 text-center text-sm font-medium text-slate-500 ring-1 ring-slate-200">
          Cover belum tersedia
        </div>
      )}
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
    <div className="flex min-h-[4.5rem] gap-3 rounded-[1.25rem] border border-emerald-100/40 bg-white/80 p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-[0_12px_24px_rgba(16,185,129,0.12)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-inner shadow-white/70 [&_svg]:size-5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-1 break-words text-sm font-bold leading-snug text-slate-900 sm:text-base">{value || "-"}</div>
      </div>
    </div>
  );
}

function AuthorLines({ author }: { author: string }) {
  const authors = splitBookAuthors(author);

  if (!authors.length) return "-";

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
