import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  Clock3,
  GraduationCap,
  LibraryBig,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { HomeGlobalSearch } from "@/components/home-global-search";
import { PublicNav } from "@/components/public-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { fetchCatalogData } from "@/lib/supabase";
import type { Book, Thesis } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const heroImage =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2200&q=85";

export default async function HomePage() {
  const { books, theses } = await fetchCatalogData({ visibility: "public" });
  const staffCount = await fetchStaffCount();
  const latestBooks = books.slice(0, 3);
  const latestTheses = theses.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <PublicNav />
      <main>
        <section className="relative isolate overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,118,110,0.45),rgba(15,23,42,0.82))]" aria-hidden="true" />

          <div className="relative mx-auto flex min-h-[calc(100vh-4.75rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center text-white sm:px-6 lg:py-20">
            <Badge className="rounded-full border-white/20 bg-white/10 px-4 py-1.5 text-white backdrop-blur hover:bg-white/10">
              <Sparkles className="mr-1 size-3.5" />
              Digital Library Prodi
            </Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.05] tracking-normal sm:text-6xl lg:text-7xl">
              Ruang Baca Pendidikan Matematika
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-100 sm:text-lg">
              Portal referensi akademik modern untuk menemukan buku, skripsi, lokasi koleksi,
              dan informasi ruang baca dengan pencarian cepat berbasis data Supabase.
            </p>

            <div className="mt-9 w-full">
              <HomeGlobalSearch books={books} theses={theses} />
            </div>

            <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
              <HeroMetric icon={BookOpen} label="Total buku" value={books.length} />
              <HeroMetric icon={GraduationCap} label="Total skripsi" value={theses.length} />
              <HeroMetric icon={Users} label="Total petugas" value={staffCount} />
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-7 sm:grid-cols-3 sm:px-6">
            <InfoStrip icon={Search} title="Pencarian realtime" description="Debounce cepat untuk judul, penulis, kategori, topik, dan pembimbing." />
            <InfoStrip icon={ShieldCheck} title="Koleksi terverifikasi" description="Data publik hanya menampilkan buku dan skripsi yang sudah disetujui admin." />
            <InfoStrip icon={CalendarCheck} title="Siap untuk layanan" description="Terhubung dengan presensi dan dashboard operasional ruang baca." />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
          <div>
            <SectionHeading
              eyebrow="Koleksi terbaru"
              title="Buku terbaru di ruang baca"
              description="Referensi yang sudah diverifikasi dan siap ditelusuri oleh mahasiswa."
              actionHref="/katalog?tab=books"
            />
            <div className="mt-6 grid gap-4">
              {latestBooks.length ? (
                latestBooks.map((book) => <LatestBook key={book.id} book={book} />)
              ) : (
                <EmptyPreview label="Belum ada buku publik yang terverifikasi." />
              )}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Repositori skripsi"
              title="Skripsi terbaru"
              description="Karya akhir mahasiswa yang sudah lolos verifikasi admin."
              actionHref="/katalog?tab=theses"
            />
            <div className="mt-6 grid gap-4">
              {latestTheses.length ? (
                latestTheses.map((thesis) => <LatestThesis key={thesis.id} thesis={thesis} />)
              ) : (
                <EmptyPreview label="Belum ada skripsi publik yang terverifikasi." />
              )}
            </div>
          </div>
        </section>

        <section className="border-y border-emerald-100 bg-emerald-950 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-200">Akses internal</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Kelola koleksi, verifikasi data, dan pantau layanan dari dashboard admin.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50">
                Dashboard dirancang untuk petugas dan admin prodi dengan statistik, tabel data,
                modal edit, notifikasi toast, serta alur verifikasi yang tetap aman.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 rounded-2xl bg-white px-6 text-emerald-950 hover:bg-emerald-50">
              <Link href="/login?redirectTo=/dashboard">
                Login Admin
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

async function fetchStaffCount() {
  if (!hasValidSupabaseConfig()) return 0;

  try {
    const { count, error } = await createSupabaseAdminClient()
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "petugas"]);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white/12 p-5 text-left shadow-sm ring-1 ring-white/20 backdrop-blur">
      <Icon className="size-5 text-emerald-200" />
      <p className="mt-5 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{label}</p>
    </div>
  );
}

function InfoStrip({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl p-3 transition hover:bg-slate-50">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <Button asChild variant="outline" className="w-fit rounded-2xl bg-white">
        <Link href={actionHref}>
          Lihat semua
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

function LatestBook({ book }: { book: Book }) {
  return (
    <Card className="group overflow-hidden rounded-[1.5rem] border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
      <CardContent className="flex gap-4 p-4">
        <CoverPreview item={book} />
        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="rounded-full">{book.category || "Buku"}</Badge>
          <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-slate-950">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-slate-600">{book.author}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{book.rackLocation}</p>
          <Link href={`/books/${book.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            Detail buku
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestThesis({ thesis }: { thesis: Thesis }) {
  return (
    <Card className="group overflow-hidden rounded-[1.5rem] border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg">
      <CardContent className="flex gap-4 p-4">
        <CoverPreview item={thesis} />
        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="rounded-full bg-sky-50 text-sky-800">
            Skripsi {thesis.year}
          </Badge>
          <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-slate-950">
            {thesis.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-slate-600">{thesis.studentName}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{formatDate(thesis.createdAt)}</p>
          <Link href={`/theses/${thesis.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            Detail skripsi
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CoverPreview({ item }: { item: Book | Thesis }) {
  return (
    <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-900 text-white shadow-md">
      {item.coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#0f766e,#0f172a)]" />
      )}
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="relative flex h-full flex-col justify-between p-3">
        {item.type === "book" ? <BookOpen className="size-5" /> : <GraduationCap className="size-5" />}
        <span className="text-xs font-semibold">{item.year}</span>
      </div>
    </div>
  );
}

function EmptyPreview({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <LibraryBig className="size-5" />
            </span>
            <div>
              <p className="font-bold text-white">Ruang Baca PMat</p>
              <p className="text-xs text-slate-400">Pendidikan Matematika</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Digital library modern untuk katalog, repositori skripsi, presensi, dan manajemen ruang baca.
          </p>
        </div>
        <FooterColumn
          title="Navigasi"
          links={[
            ["Katalog Buku", "/katalog?tab=books"],
            ["Cari Skripsi", "/katalog?tab=theses"],
            ["Presensi", "/presensi"],
            ["Login Admin", "/login?redirectTo=/dashboard"],
          ]}
        />
        <div>
          <h3 className="font-semibold text-white">Informasi</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <p className="flex gap-2"><Clock3 className="size-4 text-emerald-400" /> Senin-Jumat, 08.00-16.00</p>
            <p className="flex gap-2"><MapPin className="size-4 text-emerald-400" /> Gedung Prodi Pendidikan Matematika</p>
            <p className="flex gap-2"><Mail className="size-4 text-emerald-400" /> ruangbaca.pmat@example.ac.id</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-white">Institusi</h3>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-400 ring-1 ring-white/10">
            <Building2 className="mb-3 size-5 text-emerald-400" />
            Program Studi Pendidikan Matematika, portal ruang baca berbasis Supabase.
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 Ruang Baca Pendidikan Matematika. Semua koleksi publik melalui proses verifikasi admin.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
