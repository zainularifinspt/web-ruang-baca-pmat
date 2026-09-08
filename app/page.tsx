import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  BookOpen,
  Building2,
  Clock3,
  Globe2,
  GraduationCap,
  LibraryBig,
  Mail,
  MapPin,
  ScanLine,
  Users,
} from "lucide-react";
import { JournalShowcase } from "@/components/journal-showcase";
import { LandingSearchForm } from "@/components/landing-search-form";
import { PublicNav } from "@/components/public-nav";
import { RealtimeVisitorChart } from "@/components/realtime-visitor-chart";
import { WebsiteVisitorStat } from "@/components/website-visitor-stat";
import { Badge } from "@/components/ui/badge";
import { FadeIn, FadeInStagger, ScaleIn } from "@/components/ui/framer";
import {
  fetchPublicLandingStats,
  fetchPublicSearchItems,
  fetchPublicVisitorRows,
} from "@/lib/public-cache";

export const revalidate = 300;

export default async function HomePage() {
  const [{ items: searchItems }, stats, visitorRows] = await Promise.all([
    fetchPublicSearchItems(),
    fetchPublicLandingStats(),
    fetchPublicVisitorRows(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <PublicNav initialSearchItems={searchItems} />
      <main className="relative overflow-hidden">
        {/* Editorial Academic Crimson Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#7f1d1d] via-[#881337] to-[#991b1b] text-white pb-24 pt-10 sm:pb-32 sm:pt-16 lg:pb-36 lg:pt-20">
          <MathBackdrop />

          <FadeInStagger>
            <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white shadow-2xs backdrop-blur-xs">
                  <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={18} height={18} className="size-4 object-contain" priority />
                  <span>Jurusan Pendidikan Matematika FKIP ULM</span>
                </div>
              </FadeIn>
              <FadeIn>
                <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                  Ruang Baca Pendidikan Matematika
                </h1>
              </FadeIn>
              <FadeIn>
                <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-red-100 font-normal">
                  Pusat literatur ilmiah dan referensi akademik Jurusan Pendidikan Matematika Universitas Lambung Mangkurat. Akses katalog buku, repositori skripsi, jurnal Scopus, dan presensi kunjungan.
                </p>
              </FadeIn>

              {/* Interactive Search Bar inside Hero */}
              <FadeIn className="mt-8 sm:mt-10">
                <LandingSearchForm />
              </FadeIn>
            </div>
          </FadeInStagger>
        </section>

        {/* Quick Navigation Cards */}
        <section className="relative mx-auto -mt-12 sm:-mt-14 max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12 z-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Katalog Buku & E-Book Button */}
            <Link
              href="/katalog?tab=books"
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-600 hover:shadow-lg hover:shadow-red-950/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-800 border border-red-200/60">
                    <BookOpen className="size-5" />
                  </div>
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/50">
                    E-Book &amp; Cetak
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                  Katalog Buku
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Akses buku teks perkuliahan, modul ajar, dan koleksi e-book digital.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-red-700">
                <span>Buka Katalog Buku</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>

            {/* Katalog Skripsi Button */}
            <Link
              href="/katalog?tab=theses"
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-600 hover:shadow-lg hover:shadow-red-950/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-800 border border-red-200/60">
                    <GraduationCap className="size-5" />
                  </div>
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/50">
                    Tugas Akhir S1
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                  Katalog Skripsi
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Koleksi repositori skripsi dan riset mahasiswa Pendidikan Matematika.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-red-700">
                <span>Telusuri Skripsi</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>

            {/* Pencarian Scopus Button */}
            <Link
              href="/scopus"
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-600 hover:shadow-lg hover:shadow-red-950/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-800 border border-red-200/60">
                    <Globe2 className="size-5" />
                  </div>
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/50">
                    Elsevier Scopus®
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                  Pencarian Scopus
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Eksplorasi publikasi jurnal internasional bereputasi Q1–Q4 &amp; sitasi riset.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-red-700">
                <span>Buka Scopus Hub</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>

            {/* Presensi Button */}
            <Link
              href="/presensi"
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-red-600 hover:shadow-lg hover:shadow-red-950/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-800 border border-red-200/60">
                    <ScanLine className="size-5" />
                  </div>
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/50">
                    Presensi Mandiri
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                  Presensi Pengunjung
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Pencatatan kunjungan mandiri mahasiswa, dosen, dan tamu ruang baca.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-red-700">
                <span>Catat Presensi</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Showcase Jurnal Prodi Pendidikan Matematika */}
        <JournalShowcase />

        {/* Grafik Pengunjung */}
        <section className="relative mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <RealtimeVisitorChart initialRows={visitorRows} />
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-4 px-4 pb-16 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <StatTile icon={BookOpen} label="Total Buku" value={stats.bookCount} description="Koleksi buku terdata" />
          <StatTile icon={GraduationCap} label="Total Skripsi" value={stats.thesisCount} description="Koleksi skripsi terdata" />
          <StatTile icon={Users} label="Total Petugas" value={stats.staffCount} description="Pengelola ruang baca" />
          <WebsiteVisitorStat initialCount={stats.todayWebsiteVisits} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-red-200 hover:shadow-sm">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-red-50 text-red-700 border-red-200/70">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</span>
        <span className="block text-xs font-semibold text-slate-700">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
    </div>
  );
}

function MathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-white shadow-xs">
              <LibraryBig className="size-5" />
            </span>
            <div>
              <p className="font-bold text-white tracking-tight">Ruang Baca PMat</p>
              <p className="text-xs text-slate-400">Pendidikan Matematika FKIP ULM</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Sistem informasi perpustakaan digital untuk katalog buku, repositori skripsi, jurnal ilmiah, dan layanan ruang baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.
          </p>
        </div>
        <FooterColumn
          title="Navigasi"
          links={[
            ["Katalog Buku", "/katalog?tab=books"],
            ["Katalog Skripsi", "/katalog?tab=theses"],
            ["Pencarian Scopus", "/scopus"],
            ["Presensi Pengunjung", "/presensi"],
            ["Login Admin", "/login?redirectTo=/dashboard"],
          ]}
        />
        <div className="space-y-4">
          <h3 className="font-semibold text-white text-sm tracking-tight">Informasi Ruang Baca</h3>
          <div className="grid gap-2.5 text-xs text-slate-400">
            <p className="flex gap-2 items-center"><Clock3 className="size-3.5 text-amber-400" /> <span>Senin - Jumat, 08.00 - 16.00 WITA</span></p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <span className="leading-relaxed">Gedung Pendidikan Matematika FKIP ULM, Jl. Brigjen H. Hasan Basry, Banjarmasin</span>
            </p>
            <p className="flex gap-2 items-center"><Mail className="size-3.5 text-amber-400" /> <span>edu.mat@ulm.ac.id</span></p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-white text-sm tracking-tight">Institusi</h3>
          <div className="rounded-xl bg-slate-800/60 border border-slate-750 p-4 text-xs leading-relaxed text-slate-400">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1 shadow-xs">
                <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={24} height={24} className="size-5 object-contain" />
              </span>
              <Building2 className="size-4 text-amber-400" />
            </div>
            <p className="text-slate-400">
              Fakultas Keguruan dan Ilmu Pendidikan, Universitas Lambung Mangkurat.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
        © 2026 Ruang Baca Jurusan Pendidikan Matematika ULM.
      </div>
    </footer>
  );
}
function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white text-sm tracking-tight">{title}</h3>
      <div className="grid gap-2 text-xs text-slate-400">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition-colors duration-200 hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
