import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Hash,
  MapPin,
  UserRound,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { AvailabilityBadge } from "@/components/status-badge";
import { ThesisPdfViewer } from "@/components/thesis-pdf-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { splitBookAuthors } from "@/lib/book-authors";
import type { Book, Thesis } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type DetailItem = Book | Thesis;

export function CollectionDetailPage({ item }: { item: DetailItem }) {
  const isBook = item.type === "book";
  const backHref = isBook ? "/katalog?tab=books" : "/katalog?tab=theses";
  const collectionType = isBook ? "Buku" : "Skripsi";
  const supervisorNames = isBook ? "" : [item.supervisor1, item.supervisor2].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Button asChild variant="outline" size="sm" className="mb-6 rounded-2xl bg-white">
          <Link href={backHref}>
            <ArrowLeft />
            Kembali ke katalog
          </Link>
        </Button>

        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <LargeCover item={item} />
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-red-50 text-red-800 ring-1 ring-red-100 hover:bg-red-50">
                    {collectionType}
                  </Badge>
                  {isBook ? <AvailabilityBadge available={item.available} stock={item.stock} /> : null}
                </div>
                <div className="grid gap-3">
                  <SideMeta icon={Calendar} label="Tahun" value={String(item.year)} />
                  {isBook ? (
                    <>
                      <SideMeta icon={Hash} label="Kode koleksi" value={item.code} />
                      <SideMeta icon={MapPin} label="Lokasi" value={item.rackLocation} />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
              <p className="text-sm font-semibold text-red-700">Detail {collectionType}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                {item.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {isBook
                  ? splitBookAuthors(item.author).join(", ") || "Penulis belum tercatat"
                  : `${item.studentName || "Mahasiswa"} - ${item.year}`}
              </p>
            </div>

            {isBook ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={UserRound} label="Penulis" value={<AuthorLines author={item.author} />} />
                <InfoCard icon={BookOpen} label="Kategori" value={item.category} />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={Calendar} label="Tahun" value={String(item.year)} />
                <InfoCard icon={UserRound} label="Mahasiswa" value={item.studentName} />
                <InfoCard icon={GraduationCap} label="Dosen pembimbing" value={supervisorNames} />
                <InfoCard icon={Calendar} label="Tanggal input" value={formatDate(item.createdAt)} />
                <InfoCard icon={BookOpen} label="Diinput oleh" value={item.inputBy} />
              </div>
            )}

            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {isBook ? <BookDetail item={item} /> : <ThesisDetail item={item} />}
              </CardContent>
            </Card>

            {item.notes ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <span className="font-semibold">Catatan:</span> {item.notes}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export function CollectionDetailError({
  type,
  id,
  message,
}: {
  type: "book" | "thesis";
  id: string;
  message?: string;
}) {
  const label = type === "book" ? "buku" : "skripsi";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNav />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full rounded-[2rem] border-rose-100 bg-white shadow-xl shadow-slate-200/60">
          <CardContent className="p-6 text-center sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <FileText className="size-6" />
            </div>
            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-rose-700">
              Data tidak ditemukan
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Detail {label} tidak tersedia
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Tidak ada data {label} dengan id <span className="font-semibold text-slate-900">{id}</span>
              {message ? `, atau Supabase mengembalikan error: ${message}` : "."}
            </p>
            <Button asChild className="mt-7 rounded-2xl">
              <Link href="/katalog">
                <ArrowLeft />
                Kembali ke katalog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function CollectionDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 h-9 w-40 animate-pulse rounded-2xl bg-slate-200" />
        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="h-[34rem] animate-pulse rounded-[2rem] bg-slate-200" />
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-[2rem] bg-white ring-1 ring-slate-200" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function LargeCover({ item }: { item: DetailItem }) {
  return (
    <div className="relative aspect-[4/5] min-h-[28rem] overflow-hidden bg-red-950 text-white">
      {item.coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#0f766e,#0f172a_58%,#0369a1)]" />
      )}
      <div className="absolute inset-0 bg-slate-950/30" />
      <div className="relative flex h-full flex-col justify-between p-7">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
          {item.type === "book" ? <BookOpen className="size-7" /> : <GraduationCap className="size-7" />}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-100">
            {item.type === "book" ? "Digital Book" : "Thesis Archive"}
          </p>
          <p className="mt-3 line-clamp-4 text-2xl font-semibold leading-tight">{item.title}</p>
        </div>
      </div>
    </div>
  );
}

function BookDetail({ item }: { item: Book }) {
  return (
    <div>
      <p className="text-lg font-semibold text-slate-950">Informasi buku</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Meta label="Kategori" value={item.category || "-"} />
        <Meta label="Stok" value={`${item.available} tersedia dari ${item.stock}`} />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Deskripsi</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Buku ini tersedia sebagai referensi ruang baca. Gunakan kode koleksi dan lokasi rak untuk
          menemukan eksemplar fisik.
        </p>
      </div>
    </div>
  );
}

function ThesisDetail({ item }: { item: Thesis }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-semibold text-slate-950">Informasi skripsi</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Meta label="Pembimbing 1" value={item.supervisor1 || "-"} />
          <Meta label="Pembimbing 2" value={item.supervisor2 || "-"} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-950">Abstrak</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.abstract || "-"}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-950">File Skripsi</p>
        <div className="mt-3">
          <ThesisPdfViewer
            pdfUrl={item.pdfUrl}
            pdfFilename={item.pdfFilename}
            studentName={item.studentName}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-1 break-words text-sm font-semibold text-slate-950">{value || "-"}</div>
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

function SideMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <Icon className="size-4 text-red-700" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-950">{value || "-"}</p>
      </div>
    </div>
  );
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4", className)}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
