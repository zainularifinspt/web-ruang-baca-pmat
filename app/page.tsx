import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  CalendarCheck,
  Clock3,
  GraduationCap,
  LibraryBig,
  Mail,
  MapPin,
  MessageCircle,
  QrCode,
  Search,
  Sigma,
  Sparkles,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { books, theses, visitorMetrics } from "@/lib/mock-data";

const topics = [
  "Literasi Numerasi",
  "GeoGebra",
  "Etnomatematika",
  "HOTS",
  "AI dalam Pembelajaran Matematika",
  "Number Sense",
];

export default function HomePage() {
  const totalVisits = visitorMetrics.reduce((sum, item) => sum + item.visits, 0);
  const availableBooks = books.reduce((sum, item) => sum + item.available, 0);
  const visitIncrease = 18;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main>
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/60 to-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.98fr_0.82fr] lg:items-stretch lg:py-16">
            <div className="flex max-w-2xl flex-col justify-center space-y-8">
              <Badge className="rounded-full border-emerald-100 bg-white/85 px-3 py-1 text-emerald-700 shadow-sm" variant="outline">
                <Sparkles className="mr-1 size-3" />
                Ruang Baca Pendidikan Matematika
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                  Referensi akademik yang <span className="gradient-text">cepat, rapi, dan mudah ditemukan.</span>
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-[17px]">
                  Portal modern untuk mahasiswa Pendidikan Matematika: cari buku, jelajahi skripsi kakak tingkat, dan lakukan presensi kunjungan tanpa formulir panjang.
                </p>
              </div>
              <div className="grid gap-3 pt-1 sm:flex sm:flex-wrap">
                <Button asChild size="lg" className="h-11 rounded-xl px-5 shadow-md shadow-emerald-900/10">
                  <Link href="/katalog?tab=books">
                    <BookMarked />
                    Cari Buku
                    <ArrowRight className="ml-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="h-11 rounded-xl px-5">
                  <Link href="/katalog?tab=theses">
                    <GraduationCap />
                    Cari Skripsi
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-11 rounded-xl px-5 text-slate-700">
                  <Link href="/presensi">
                    <QrCode />
                    Presensi
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative h-full">
              <HeroPanel
                availableBooks={availableBooks}
                thesisCount={theses.length}
                totalVisits={totalVisits}
              />
            </div>
          </div>
        </section>

        <LandingSection className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary">Fitur Utama</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
              Semua kebutuhan ruang baca dalam satu portal
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Cari buku, telusuri skripsi, lakukan presensi, dan pantau kunjungan dengan lebih mudah.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={LibraryBig} title="Katalog Buku" description="Temukan buku berdasarkan judul, penulis, kategori, stok, dan lokasi rak." />
            <FeatureCard icon={GraduationCap} title="Repositori Skripsi" description="Telusuri skripsi kakak tingkat berdasarkan topik, tahun, dan pembimbing." />
            <FeatureCard icon={QrCode} title="Presensi QR" description="Catat kunjungan ruang baca lebih cepat melalui QR atau input NIM." />
            <FeatureCard icon={BarChart3} title="Statistik Kunjungan" description="Pantau tren pengunjung untuk kebutuhan laporan dan evaluasi ruang baca." />
          </div>
        </LandingSection>

        <LandingSection className="border-y border-emerald-100/70 bg-white/70">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-primary">Cara Menggunakan</p>
                <h2 className="mt-2 max-w-md text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                  Alur singkat dari pencarian sampai koleksi ditemukan.
                </h2>
              </div>
              <div className="relative grid gap-4 sm:grid-cols-3">
                <div className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-emerald-100 sm:block" />
                <Step number="01" icon={Search} title="Pilih kebutuhan" description="Masuk ke katalog buku, skripsi, atau halaman presensi." />
                <Step number="02" icon={Sigma} title="Cari data" description="Gunakan kata kunci, tahun, kategori, atau status koleksi." />
                <Step number="03" icon={MapPin} title="Datang ke rak" description="Catat kode koleksi dan lokasi fisik untuk mengambil referensi." />
              </div>
            </div>
          </div>
        </LandingSection>

        <LandingSection className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">Statistik Ruang Baca</p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
              Data ringkas untuk presentasi dan evaluasi layanan.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PremiumMetric label="Total buku" value={books.length} icon={BookMarked} />
            <PremiumMetric label="Total skripsi" value={theses.length} icon={GraduationCap} tone="blue" />
            <PremiumMetric label="Total pengunjung" value={totalVisits} icon={CalendarCheck} tone="amber" />
            <PremiumMetric label="Peningkatan kunjungan" value={`${visitIncrease}%`} icon={BarChart3} tone="emerald" />
          </div>
        </LandingSection>

        <LandingSection className="mx-auto max-w-6xl px-5 pb-14 sm:px-6 sm:pb-16">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Topik Skripsi Populer</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Tema penelitian yang sering dicari mahasiswa.
                </h2>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full">Pendidikan Matematika</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {topics.map((topic, index) => (
                <span
                  key={topic}
                  className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-emerald-100 transition hover:-translate-y-0.5"
                >
                  #{index + 1} {topic}
                </span>
              ))}
            </div>
          </div>
        </LandingSection>

        <Footer />
      </main>
    </div>
  );
}

function LandingSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={className}>{children}</section>;
}

function HeroPanel({
  availableBooks,
  thesisCount,
  totalVisits,
}: {
  availableBooks: number;
  thesisCount: number;
  totalVisits: number;
}) {
  return (
    <div className="relative flex h-full flex-col rounded-3xl bg-white p-6 shadow-md shadow-slate-900/5 ring-1 ring-slate-200/70">
      <div className="mb-7 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
          <LibraryBig className="size-7" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Aktivitas Ruang Baca</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Ringkasan Hari Ini</h2>
        </div>
      </div>
      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Koleksi terkurasi
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              Buku, skripsi, presensi
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Satu pintu untuk menemukan referensi dan memantau aktivitas kunjungan.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        <Metric label="Buku tersedia" value={availableBooks} icon={BookMarked} trend="+8 koleksi" />
        <Metric label="Skripsi terdata" value={thesisCount} icon={GraduationCap} trend="Topik aktif" />
        <Metric label="Kunjungan pekan ini" value={totalVisits} icon={CalendarCheck} trend="+18%" />
      </div>
      <p className="mt-5 rounded-2xl bg-emerald-50 p-3.5 text-sm leading-6 text-emerald-900">
        Mode pratinjau: data masih contoh untuk validasi alur.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  trend: string;
}) {
  return (
    <div className="group flex items-center justify-between rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-emerald-50 p-2.5 text-primary transition group-hover:scale-105">
          <Icon className="size-4" />
        </div>
        <div>
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <p className="mt-1 text-xs font-medium text-emerald-700">{trend}</p>
        </div>
      </div>
      <span className="text-3xl font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-600/70" />
      <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:scale-105">
        <Icon className="size-4" />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative z-10 mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
        <Icon className="size-6" />
      </div>
      <p className="text-xs font-bold text-primary">{number}</p>
      <h3 className="mt-2 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PremiumMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone?: "emerald" | "blue" | "amber";
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-xs font-medium text-slate-500">Siap untuk laporan prodi</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <BookMarked className="size-5" />
            </div>
            <div>
              <p className="font-bold text-white">Ruang Baca PMat</p>
              <p className="text-xs text-slate-400">Pendidikan Matematika</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Mode pratinjau: data contoh untuk presentasi dan validasi alur.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Navigasi Cepat</h3>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/katalog?tab=books" className="hover:text-white">Cari Buku</Link>
            <Link href="/katalog?tab=theses" className="hover:text-white">Cari Skripsi</Link>
            <Link href="/presensi" className="hover:text-white">Presensi</Link>
            <Link href="/dashboard" className="hover:text-white">Dasbor</Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-white">Informasi</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <p className="flex gap-2"><Clock3 className="size-4 text-emerald-400" /> Senin-Jumat, 08.00-16.00</p>
            <p className="flex gap-2"><MapPin className="size-4 text-emerald-400" /> Gedung Prodi Pendidikan Matematika</p>
            <p className="flex gap-2"><Mail className="size-4 text-emerald-400" /> ruangbaca.pmat@example.ac.id</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-white">Terhubung</h3>
          <div className="mt-4 flex gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-slate-300">
              <MessageCircle className="size-4" />
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-slate-300">
              <Mail className="size-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 Ruang Baca Pendidikan Matematika. Tampilan pratinjau untuk kebutuhan presentasi.
      </div>
    </footer>
  );
}
