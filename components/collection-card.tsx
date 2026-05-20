import {
  BookMarked,
  Calendar,
  GraduationCap,
  Layers3,
  MapPin,
  UserRound,
} from "lucide-react";
import { CollectionDetailContent } from "@/components/collection-detail";
import { AvailabilityBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { Book, Thesis } from "@/lib/types";
import { cn } from "@/lib/utils";

type CollectionItem = Book | Thesis;

export function CollectionCard({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex h-full min-h-[218px] flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200/75 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200"
        >
          <CompactHeader item={item} />
          <div className="flex flex-1 flex-col p-4">
            {isBook ? (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <AvailabilityBadge available={item.available} stock={item.stock} />
                <Badge variant="secondary" className="max-w-full truncate rounded-full px-2 py-0.5 text-[11px]">
                  {item.category}
                </Badge>
              </div>
            ) : null}

            <h3 className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-snug text-slate-950">
              {item.title}
            </h3>

            {isBook ? (
              <BookMeta item={item} />
            ) : (
              <ThesisMeta item={item} />
            )}
          </div>
        </button>
      </DialogTrigger>
      <CollectionDetailContent item={item} />
    </Dialog>
  );
}

function CompactHeader({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";
  const Icon = isBook ? BookMarked : GraduationCap;
  const eyebrow = isBook ? item.category : item.topic;
  const label = isBook ? "Buku" : "Skripsi";
  const pill = isBook ? item.rackLocation : String(item.year);

  return (
    <div
      className={cn(
        "relative border-b px-4 py-3",
        isBook
          ? "border-emerald-100 bg-emerald-50/80"
          : "border-sky-100 bg-sky-50/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
              isBook
                ? "bg-emerald-700 text-white ring-emerald-700"
                : "bg-slate-900 text-emerald-200 ring-slate-900",
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-800">
              {eyebrow || "-"}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {pill}
        </Badge>
      </div>
    </div>
  );
}

function BookMeta({ item }: { item: Book }) {
  return (
    <div className="mt-3 grid gap-2 text-sm text-slate-600">
      <MetaLine icon={UserRound} value={item.author} />
      <div className="grid grid-cols-2 gap-2">
        <MetaLine icon={Layers3} value={`Stok ${item.available}/${item.stock}`} />
        <MetaLine icon={MapPin} value={item.rackLocation} />
      </div>
    </div>
  );
}

function ThesisMeta({ item }: { item: Thesis }) {
  return (
    <div className="mt-3 flex flex-1 flex-col gap-3 text-sm text-slate-600">
      <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
        <MetaLine icon={UserRound} value={item.studentName} />
        <MetaLine icon={Calendar} value={String(item.year)} />
      </div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        <p className="font-medium text-slate-500">Pembimbing</p>
        <p className="line-clamp-1">{item.supervisor1}</p>
        <p className="line-clamp-1">{item.supervisor2}</p>
      </div>
      <p className="line-clamp-2 border-t pt-2 text-xs leading-5 text-slate-500">
        {item.abstract}
      </p>
    </div>
  );
}

function MetaLine({
  icon: Icon,
  value,
}: {
  icon: typeof UserRound;
  value: string;
}) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="truncate">{value || "-"}</span>
    </p>
  );
}
