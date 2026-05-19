import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  LibraryBig,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { AvailabilityBadge, StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Book, Thesis } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type DetailItem = Book | Thesis;

export function CollectionDetailPage({ item }: { item: DetailItem }) {
  const isBook = item.type === "book";
  const backHref = isBook ? "/katalog?tab=books" : "/katalog?tab=theses";
  const collectionType = isBook ? "Buku" : "Skripsi";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Button asChild variant="outline" size="sm" className="mb-6 rounded-xl bg-white">
          <Link href={backHref}>
            <ArrowLeft />
            Kembali ke katalog
          </Link>
        </Button>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex min-h-[24rem] flex-col justify-between bg-slate-950 p-6 text-white sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/10">
                  {collectionType}
                </Badge>
                <StatusBadge status={item.verificationStatus} />
                {isBook ? <AvailabilityBadge available={item.available} stock={item.stock} /> : null}
              </div>

              <div className="mt-12">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-300">
                  Detail Koleksi
                </p>
                <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                  {item.title}
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">
                  {isBook
                    ? `${item.author} · ${item.publisher || "Penerbit belum tercatat"}`
                    : `${item.studentName} · ${item.topic}`}
                </p>
              </div>

              <div className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
                <HeroMetric icon={Hash} label="Kode" value={item.code} />
                <HeroMetric icon={Calendar} label="Tahun" value={String(item.year)} />
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={UserRound}
                  label={isBook ? "Penulis" : "Mahasiswa"}
                  value={isBook ? item.author : item.studentName}
                />
                <InfoCard
                  icon={MapPin}
                  label="Lokasi Fisik"
                  value={isBook ? item.rackLocation : item.physicalLocation}
                />
                <InfoCard icon={LibraryBig} label="Sumber Input" value={item.inputSource} />
                <InfoCard icon={Calendar} label="Tanggal Input" value={formatDate(item.createdAt)} />
              </div>

              <Card className="mt-5 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none">
                <CardContent className="p-5">
                  {isBook ? <BookDetail item={item} /> : <ThesisDetail item={item} />}
                </CardContent>
              </Card>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-slate-950">Kata Kunci</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.keywords.length ? (
                        item.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="rounded-full">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Belum ada kata kunci.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-emerald-100 bg-emerald-50 shadow-none">
                  <CardContent className="p-5 text-sm leading-6 text-emerald-900">
                    <Sparkles className="mb-3 size-5" />
                    Data detail ini ditarik langsung dari tabel Supabase berdasarkan id koleksi.
                  </CardContent>
                </Card>
              </div>

              {item.notes ? (
                <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                  <span className="font-semibold">Catatan:</span> {item.notes}
                </div>
              ) : null}
            </div>
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
            <Button asChild className="mt-7 rounded-xl">
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
        <div className="mb-6 h-9 w-40 animate-pulse rounded-xl bg-slate-200" />
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="min-h-[24rem] bg-slate-950 p-6 sm:p-8">
              <div className="flex gap-2">
                <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="mt-20 h-4 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-5 h-10 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-10 w-3/5 animate-pulse rounded bg-white/10" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BookDetail({ item }: { item: Book }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">Informasi Buku</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Meta label="Penerbit" value={item.publisher} />
        <Meta label="Kategori" value={item.category} />
        <Meta label="ISBN" value={item.isbn} />
        <Meta label="Stok" value={`${item.available} tersedia dari ${item.stock}`} />
      </div>
    </div>
  );
}

function ThesisDetail({ item }: { item: Thesis }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-950">Informasi Skripsi</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Meta label="Pembimbing 1" value={item.supervisor1} />
          <Meta label="Pembimbing 2" value={item.supervisor2} />
          <Meta label="Topik" value={item.topic} />
          <Meta label="Catatan akses" value={item.accessNote} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-950">Abstrak</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{item.abstract}</p>
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
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
      <div className="flex items-center gap-2 text-slate-300">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-3", className)}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
