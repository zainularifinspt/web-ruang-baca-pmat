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
        {/* Editorial Academic Header */}
        <section className="relative border-b border-slate-200/80 bg-white pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
          <MathBackdrop />

          <FadeInStagger>
            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={18} height={18} className="size-4 object-contain" priority />
                  <span>Jurusan Pendidikan Matematika FKIP ULM</span>
                </div>
              </FadeIn>
              <FadeIn>
                <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Ruang Baca Pendidikan Matematika
                </h1>
              </FadeIn>
              <FadeIn>
                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 font-normal">
                  Pusat referensi dan layanan literatur akademik Jurusan Pendidikan Matematika Universitas Lambung Mangkurat untuk penelusuran buku teks, repositori skripsi, jurnal ilmiah, dan presensi kunjungan.
                </p>
              </FadeIn>
            </div>
          </FadeInStagger>
        </section>

        {/* Quick Navigation Cards */}
        <section className="relative mx-auto -mt-10 max-w-6xl px-4 pb-8 sm:px-6 sm:pb-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Katalog Buku & E-Book Button */}
            <Link
              href="/katalog?tab=books"
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                    <BookOpen className="size-5" />
                  </div>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/50">
                    E-Book & Cetak
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Katalog Buku
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Akses buku teks perkuliahan, modul ajar, dan e-book digital.
                </p>
              </div>
            </Link>

            {/* Katalog Skripsi Button */}
            <Link
              href="/katalog?tab=theses"
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                    <GraduationCap className="size-5" />
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800 border border-blue-200/50">
                    Tugas Akhir
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Katalog Skripsi
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Koleksi skripsi dan karya riset mahasiswa Pendidikan Matematika.
                </p>
              </div>
            </Link>

            {/* Pencarian Scopus Button */}
            <Link
              href="/scopus"
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60">
                    <Globe2 className="size-5" />
                  </div>
                  <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-200/50">
                    Scopus®
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  Pencarian Scopus
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Eksplorasi publikasi jurnal internasional bereputasi dan sitasi.
                </p>
              </div>
            </Link>

            {/* Presensi Button */}
            <Link
              href="/presensi"
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <ScanLine className="size-5" />
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/50">
                    Layanan
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Presensi Pengunjung
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pencatatan kunjungan fisik harian mahasiswa, dosen, dan tamu.
                </p>
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
          <StatTile icon={BookOpen} label="Total Buku" value={stats.bookCount} description="Koleksi buku terdata" tone="amber" />
          <StatTile icon={GraduationCap} label="Total Skripsi" value={stats.thesisCount} description="Koleksi skripsi terdata" tone="sky" />
          <StatTile icon={Users} label="Total Petugas" value={stats.staffCount} description="Pengelola ruang baca" tone="violet" />
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
  tone = "amber",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  description: string;
  tone?: "emerald" | "sky" | "violet" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    sky: "bg-blue-50 text-blue-700 border-blue-200/60",
    violet: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
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
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl" />
      <div className="absolute left-0 bottom-0 h-80 w-80 rounded-full bg-amber-50/40 blur-3xl" />
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
