"use client";

import Image from "next/image";
import {
  BookMarked,
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
} from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { CollectionDetailContent } from "@/components/collection-detail";
import { AvailabilityBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { Book, Thesis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/framer";

type CollectionItem = Book | Thesis;

export function CollectionCard({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";
  const isEbook = isBook && (item.isEbook || Boolean(item.pdfUrl));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <FadeIn
          whileHover={{
            y: -5,
            scale: 1.015,
            transition: { type: "spring", stiffness: 400, damping: 25 },
          }}
          whileTap={{ scale: 0.985 }}
          className="h-full w-full block text-left cursor-pointer"
        >
          <button
            type="button"
            className={cn(
              "group flex h-full w-full min-h-[220px] flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 transition duration-200 hover:shadow-lg",
              isEbook
                ? "ring-orange-200/80 hover:ring-orange-400 hover:shadow-orange-500/10"
                : isBook
                  ? "ring-red-200/75 hover:ring-red-300 hover:shadow-red-500/10"
                  : "ring-slate-200/75 hover:ring-amber-300 hover:shadow-amber-500/10",
            )}
          >
            <CompactHeader item={item} />

            <div className="flex flex-1 flex-col p-4">
              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {isBook ? (
                  <Badge
                    variant="secondary"
                    className="max-w-[200px] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 ring-1 ring-slate-200/60"
                  >
                    {item.category}
                  </Badge>
                ) : null}
              </div>

              {/* Title & Cover Row */}
              <div className="flex items-start gap-3">
                {isBook ? (
                  <BookCover
                    coverUrl={item.coverUrl}
                    title={item.title}
                    author={item.author}
                    category={item.category}
                    size="md"
                    className="group-hover:scale-105"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 min-h-11 text-[15px] font-bold leading-snug text-slate-900 group-hover:text-red-700 transition-colors">
                    {item.title}
                  </h3>
                  {isBook ? (
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                      {item.author || "Pendidikan Matematika"}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Meta details */}
              <div className="mt-auto pt-3">
                {isBook ? (
                  <BookMeta item={item} />
                ) : (
                  <ThesisMeta item={item} />
                )}
              </div>
            </div>
          </button>
        </FadeIn>
      </DialogTrigger>
      <CollectionDetailContent item={item} />
    </Dialog>
  );
}

function CompactHeader({ item }: { item: CollectionItem }) {
  const isBook = item.type === "book";
  const isEbook = isBook && (item.isEbook || Boolean(item.pdfUrl));
  const Icon = isEbook ? BookOpen : isBook ? BookMarked : GraduationCap;
  const eyebrow = isBook ? item.category : item.topic;
  const label = isEbook ? "E-Book Digital" : isBook ? "Buku" : "Skripsi";
  const pill = isEbook
    ? "Google Drive"
    : isBook
      ? item.rackLocation
      : String(item.year);

  return (
    <div
      className={cn(
        "relative border-b px-4 py-2.5 transition-colors",
        isEbook
          ? "border-orange-100 bg-gradient-to-r from-orange-50/90 to-amber-50/70"
          : isBook
            ? "border-red-100 bg-red-50/80"
            : "border-amber-100 bg-amber-50/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 shadow-xs transition-transform duration-300 group-hover:scale-105",
              isEbook
                ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-orange-400"
                : isBook
                  ? "bg-red-700 text-white ring-red-700"
                  : "bg-slate-900 text-red-200 ring-slate-900",
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isEbook ? "text-orange-700" : isBook ? "text-red-700" : "text-slate-500",
              )}
            >
              {label}
            </p>
            <p className="line-clamp-1 text-xs font-bold text-slate-800">
              {eyebrow || "-"}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs",
            isEbook
              ? "bg-orange-100/80 text-orange-800 ring-1 ring-orange-200"
              : "bg-white/90 text-slate-600 ring-1 ring-slate-200",
          )}
        >
          {pill}
        </Badge>
      </div>
    </div>
  );
}

function BookMeta({ item }: { item: Book }) {
  const isEbook = item.isEbook || Boolean(item.pdfUrl);

  if (isEbook) {
    return (
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 text-orange-700 font-semibold">
          <FileText className="size-3.5" />
          <span className="truncate">Google Drive Viewer</span>
        </div>
        <div className="flex items-center justify-end gap-1 text-slate-500 font-medium">
          <Download className="size-3 text-slate-400" />
          <span>Bisa didownload</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 grid gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
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
    <div className="flex flex-1 flex-col gap-2 text-xs text-slate-600">
      <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-2">
        <MetaLine icon={UserRound} value={item.studentName} />
        <MetaLine icon={Calendar} value={String(item.year)} />
      </div>
      <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] leading-4 text-slate-600">
        <p className="font-medium text-slate-500">Pembimbing</p>
        <p className="line-clamp-1 font-semibold">{item.supervisor1}</p>
      </div>
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
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600 font-medium">
      <Icon className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{value || "-"}</span>
    </p>
  );
}
