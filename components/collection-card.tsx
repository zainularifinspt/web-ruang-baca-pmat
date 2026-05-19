import {
  BookMarked,
  Calendar,
  GraduationCap,
  Layers3,
  MapPin,
  UserRound,
} from "lucide-react";
import { CollectionDetailContent } from "@/components/collection-detail";
import { AvailabilityBadge, StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { Book, Thesis } from "@/lib/types";

type CollectionItem = Book | Thesis;

export function CollectionCard({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex h-full min-h-[330px] flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-slate-200/75 transition duration-200 hover:-translate-y-1 hover:shadow-md hover:ring-emerald-200"
        >
          {isBook ? <BookCover item={item} /> : <ThesisCover item={item} />}
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {isBook ? (
                <AvailabilityBadge available={item.available} stock={item.stock} />
              ) : (
                <StatusBadge status={item.verificationStatus} />
              )}
              <Badge variant="secondary" className="rounded-full">
                {isBook ? item.category : item.topic}
              </Badge>
            </div>

            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-950">
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

function BookCover({ item }: { item: Book }) {
  return (
    <div className="relative h-32 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-5 text-white">
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex h-full flex-col justify-between">
        <BookMarked className="size-7 opacity-90" />
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-100">{item.code}</p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold">{item.category}</p>
        </div>
      </div>
    </div>
  );
}

function ThesisCover({ item }: { item: Thesis }) {
  return (
    <div className="relative h-32 bg-slate-900 p-5 text-white">
      {item.coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${item.coverUrl})` }}
        />
      ) : null}
      <div className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-1 text-xs">
        {item.year}
      </div>
      <div className="relative flex h-full flex-col justify-between">
        <GraduationCap className="size-7 text-emerald-200" />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">{item.code}</p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold">{item.topic}</p>
        </div>
      </div>
    </div>
  );
}

function BookMeta({ item }: { item: Book }) {
  return (
    <div className="mt-4 grid gap-2 text-sm text-slate-600">
      <p className="flex items-center gap-2">
        <UserRound className="size-4 text-slate-400" />
        <span className="line-clamp-1">{item.author}</span>
      </p>
      <p className="flex items-center gap-2">
        <Layers3 className="size-4 text-slate-400" />
        Stok {item.available} dari {item.stock}
      </p>
      <p className="flex items-center gap-2">
        <MapPin className="size-4 text-slate-400" />
        {item.rackLocation}
      </p>
    </div>
  );
}

function ThesisMeta({ item }: { item: Thesis }) {
  return (
    <div className="mt-4 flex flex-1 flex-col gap-3 text-sm text-slate-600">
      <div className="grid gap-2">
        <p className="flex items-center gap-2">
          <UserRound className="size-4 text-slate-400" />
          <span className="line-clamp-1">{item.studentName}</span>
        </p>
        <p className="flex items-center gap-2">
          <Calendar className="size-4 text-slate-400" />
          {item.year}
        </p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <p className="font-medium text-slate-500">Pembimbing:</p>
        <p className="line-clamp-1">{item.supervisor1}</p>
        <p className="line-clamp-1">{item.supervisor2}</p>
      </div>
      <p className="line-clamp-3 border-t pt-3 text-xs leading-5 text-slate-500">
        {item.abstract}
      </p>
    </div>
  );
}
