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
    <DialogContent className="grid h-[min(90vh,860px)] max-w-4xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[1.75rem] border border-sky-200/70 bg-sky-50/70 p-0 shadow-[0_26px_70px_rgba(14,116,144,0.24)] backdrop-blur-2xl sm:w-[calc(100%-3rem)] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white/75 [&>button]:p-2 [&>button]:shadow-lg [&>button]:shadow-sky-900/10 [&>button]:backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(219,234,254,0.68),rgba(255,255,255,0.92))] px-5 pb-6 pt-5 pr-14 sm:px-7 sm:pb-7 sm:pt-6 sm:pr-16">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
        <DialogHeader className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-sky-200/80 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-sky-900 shadow-sm shadow-sky-900/5 backdrop-blur-md">
              <GraduationCap className="mr-1.5 size-4" />
              {isBook ? "Buku" : "Skripsi"}
            </Badge>
            {isBook ? <AvailabilityBadge available={item.available} stock={item.stock} /> : null}
            {!isBook ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/80 bg-cyan-50/70 px-3 py-1 text-xs font-semibold text-cyan-800 shadow-sm backdrop-blur-md">
                <Sparkles className="size-3.5" />
                Repositori Digital
              </span>
            ) : null}
          </div>
          <DialogTitle className="max-w-4xl text-balance text-2xl font-black leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {item.title}
          </DialogTitle>
          {isBook ? <BookCoverPreview coverUrl={item.coverUrl} title={item.title} /> : null}
        </DialogHeader>
      </div>
      <div className="relative min-h-0 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.72),rgba(219,234,254,0.42))] p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <Info
            icon={<UserRound />}
            label={isBook ? "Penulis" : "Mahasiswa"}
            value={isBook ? <AuthorLines author={item.author} /> : item.studentName}
          />
          <Info icon={<Calendar />} label="Tahun" value={String(item.year)} />
          {isBook ? <Info icon={<BookOpen />} label="Kode Koleksi" value={item.code} /> : null}
          {isBook ? <Info icon={<MapPin />} label="Lokasi Fisik" value={item.rackLocation} /> : null}
        </div>
        <GlassPanel className="p-4 text-sm leading-7 sm:p-5">
          {isBook ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Meta label="Kategori" value={item.category} />
              <Meta label="Stok tersedia" value={`${item.available} dari ${item.stock}`} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-950">
                <FileText className="size-5 text-sky-700" />
                <p className="text-lg font-bold">Abstrak</p>
              </div>
              <p className="text-sm leading-7 text-slate-600 sm:text-base">{item.abstract}</p>
            </div>
          )}
        </GlassPanel>
        {!isBook ? (
          <div className="space-y-5">
            <GlassPanel className="p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-950">
                <UsersRound className="size-5 text-sky-700" />
                <p className="text-lg font-bold">Dosen Pembimbing</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Info icon={<UserRound />} label="Pembimbing 1" value={item.supervisor1} />
                <Info icon={<UserRound />} label="Pembimbing 2" value={item.supervisor2} />
              </div>
            </GlassPanel>
            <GlassPanel className="p-4 text-sm leading-6 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-950">
                <FileText className="size-5 text-sky-700" />
                <p className="text-lg font-bold">File Skripsi</p>
              </div>
              <ThesisPdfViewer
                pdfUrl={item.pdfUrl}
                pdfFilename={item.pdfFilename}
                studentName={item.studentName}
              />
            </GlassPanel>
          </div>
        ) : null}
        {item.notes ? (
          <div className="rounded-2xl border border-sky-200 bg-white/70 p-3 text-sm text-sky-900 shadow-sm backdrop-blur-md">
            Catatan: {item.notes}
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
        "rounded-[1.5rem] border border-white/75 bg-white/55 shadow-[0_18px_45px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl ring-1 ring-sky-100/80",
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
    <div className="flex min-h-20 gap-3 rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(14,116,144,0.15),inset_0_1px_0_rgba(255,255,255,0.95)]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-sky-100/80 text-sky-700 shadow-inner shadow-white/70 [&_svg]:size-5">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="mt-1 break-words text-base font-bold leading-snug text-slate-950 sm:text-lg">{value || "-"}</div>
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
