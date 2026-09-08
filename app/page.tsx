import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  Award,
  BookOpen,
  Building2,
  Clock3,
  Globe2,
  GraduationCap,
  LibraryBig,
  Mail,
  MapPin,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { JournalShowcase } from "@/components/journal-showcase";
import { LandingSearchForm } from "@/components/landing-search-form";
import { MathGeometricBackdrop } from "@/components/math-geometric-backdrop";
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
    <div className="min-h-screen apple-mesh-body text-slate-900 antialiased">
      <PublicNav initialSearchItems={searchItems} />
      <main className="relative overflow-hidden">
        {/* Pitch-Style Glowing Red Hero */}
        <section className="relative overflow-hidden bg-[#0b0103] pitch-red-hero text-white pb-36 pt-10 sm:pb-44 sm:pt-16 lg:pb-52 lg:pt-20">
          <PitchHeroBackdrop />

          <FadeInStagger>
            <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-950/70 px-4 py-1.5 text-xs font-bold text-rose-100 shadow-md backdrop-blur-md mb-6 sm:mb-8">
                  <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={18} height={18} className="size-4 object-contain drop-shadow-xs" priority />
                  <span>Jurusan Pendidikan Matematika FKIP ULM</span>
                </div>
              </FadeIn>
              <FadeIn>
                <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.04] sm:leading-[0.96] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
                  Ruang Baca <br className="hidden sm:inline" />
                  Pendidikan Matematika.
                </h1>
              </FadeIn>

              {/* Interactive Pitch-Style Prompt Search Card */}
              <FadeIn className="mt-8 sm:mt-11">
                <LandingSearchForm />
              </FadeIn>
            </div>
          </FadeInStagger>
        </section>

        {/* Quick Navigation Apple Bento Cards */}
        <section className="relative mx-auto -mt-20 sm:-mt-24 max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12 z-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Katalog Buku & E-Book Button */}
            <Link
              href="/katalog?tab=books"
              className="group apple-bento-card p-5.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-red-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
                    <BookOpen className="size-5" />
                  </div>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/60 shadow-2xs">
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
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-700 group-hover:text-red-800">
                <span>Buka Katalog Buku</span>
                <span className="transition-transform group-hover:translate-x-1 text-base leading-none">→</span>
              </div>
            </Link>

            {/* Katalog Skripsi Button */}
            <Link
              href="/katalog?tab=theses"
              className="group apple-bento-card p-5.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-rose-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-900 text-white shadow-md shadow-rose-600/25 group-hover:scale-105 transition-transform">
                    <GraduationCap className="size-5" />
                  </div>
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-200/60 shadow-2xs">
                    Tugas Akhir S1
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  Katalog Skripsi
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Koleksi repositori skripsi dan riset mahasiswa Pendidikan Matematika.
                </p>
              </div>
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:text-rose-800">
                <span>Telusuri Skripsi</span>
                <span className="transition-transform group-hover:translate-x-1 text-base leading-none">→</span>
              </div>
            </Link>

            {/* Pencarian Scopus Button */}
            <Link
              href="/scopus"
              className="group apple-bento-card p-5.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-orange-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-700 text-white shadow-md shadow-orange-600/25 group-hover:scale-105 transition-transform">
                    <Globe2 className="size-5" />
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200/60 shadow-2xs">
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
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-700 group-hover:text-red-800">
                <span>Buka Scopus Hub</span>
                <span className="transition-transform group-hover:translate-x-1 text-base leading-none">→</span>
              </div>
            </Link>

            {/* Presensi Button */}
            <Link
              href="/presensi"
              className="group apple-bento-card p-5.5 flex flex-col justify-between overflow-hidden"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-red-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-md shadow-red-600/25 group-hover:scale-105 transition-transform">
                    <ScanLine className="size-5" />
                  </div>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-800 border border-red-200/60 shadow-2xs">
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
              <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-700 group-hover:text-red-800">
                <span>Catat Presensi</span>
                <span className="transition-transform group-hover:translate-x-1 text-base leading-none">→</span>
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
    <div className="apple-bento-card flex items-center gap-4 p-5 transition-all">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 via-rose-500/15 to-red-500/5 text-red-700 border border-red-200/60 shadow-2xs">
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

function PitchHeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {/* Central Radiant Aurora Glow (Pitch Style) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[1200px] rounded-full bg-gradient-to-b from-rose-500/40 via-red-600/30 to-transparent blur-3xl" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-rose-600/25 blur-3xl" />
      <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-rose-500/25 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-red-600/30 blur-3xl" />

      {/* 3D Mathematical Geometric Shapes & Floating Glyphs */}
      <MathGeometricBackdrop />

      {/* Ultra-Smooth Scrim Gradient Transition to Light Body */}
      <div className="absolute inset-x-0 bottom-0 h-64 sm:h-80 lg:h-96 hero-scrim-fade pointer-events-none" />
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
