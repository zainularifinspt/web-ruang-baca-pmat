import { BookOpen, Calendar, MapPin, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/status-badge";
import { ThesisPdfViewer } from "@/components/thesis-pdf-viewer";
import type { Book, Thesis } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
    <DialogContent className="max-w-3xl rounded-2xl border-slate-200 p-0">
      <div className="rounded-t-2xl bg-gradient-to-br from-emerald-50 to-white p-5 pr-12 sm:p-6 sm:pr-14">
        <DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">{isBook ? "Buku" : "Skripsi"}</Badge>
            {isBook ? <AvailabilityBadge available={item.available} stock={item.stock} /> : null}
          </div>
          <DialogTitle className="text-xl leading-snug text-slate-950 sm:text-2xl">{item.title}</DialogTitle>
          {isBook ? <BookCoverPreview coverUrl={item.coverUrl} title={item.title} /> : null}
        </DialogHeader>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info icon={<UserRound />} label={isBook ? "Penulis" : "Mahasiswa"} value={isBook ? item.author : item.studentName} />
          <Info icon={<Calendar />} label="Tahun" value={String(item.year)} />
          {isBook ? <Info icon={<BookOpen />} label="Kode Koleksi" value={item.code} /> : null}
          {isBook ? <Info icon={<MapPin />} label="Lokasi Fisik" value={item.rackLocation} /> : null}
        </div>
        <div className="rounded-2xl border bg-slate-50 p-4 text-sm leading-6">
          {isBook ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Meta label="Kategori" value={item.category} />
              <Meta label="Stok tersedia" value={`${item.available} dari ${item.stock}`} />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-foreground">Abstrak</p>
              <p className="text-muted-foreground">{item.abstract}</p>
            </div>
          )}
        </div>
        {!isBook ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Meta label="Diinput oleh" value={item.inputBy} />
            <Meta label="Tanggal input" value={formatDate(item.createdAt)} />
          </div>
        ) : null}
        {!isBook ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-950">Dosen Pembimbing</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info icon={<UserRound />} label="Pembimbing 1" value={item.supervisor1} />
                <Info icon={<UserRound />} label="Pembimbing 2" value={item.supervisor2} />
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 text-sm leading-6">
              <p className="mb-3 font-medium text-foreground">File Skripsi</p>
              <ThesisPdfViewer
                pdfUrl={item.pdfUrl}
                pdfFilename={item.pdfFilename}
                studentName={item.studentName}
              />
            </div>
          </div>
        ) : null}
        {item.notes ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Catatan: {item.notes}
          </div>
        ) : null}
      </div>
    </DialogContent>
  );
}

function BookCoverPreview({ coverUrl, title }: { coverUrl?: string; title: string }) {
  return (
    <div className="mt-5 w-fit rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
      {coverUrl ? (
        <div
          aria-label={`Cover ${title}`}
          className="h-48 w-32 rounded-xl bg-slate-100 bg-cover bg-center ring-1 ring-slate-200"
          role="img"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : (
        <div className="flex h-48 w-32 items-center justify-center rounded-xl bg-slate-100 px-3 text-center text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          Cover belum tersedia
        </div>
      )}
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
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border bg-white p-3 shadow-sm">
      <div className="mt-0.5 text-primary [&_svg]:size-4">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
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
