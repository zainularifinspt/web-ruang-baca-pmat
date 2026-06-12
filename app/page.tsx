import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock3,
  GraduationCap,
  LibraryBig,
  Mail,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import { LandingSearchForm } from "@/components/landing-search-form";
import { PublicNav } from "@/components/public-nav";
import { RealtimeVisitorChart } from "@/components/realtime-visitor-chart";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { hasValidSupabaseConfig } from "@/lib/supabase-config";
import { fetchCatalogData } from "@/lib/supabase";
import type { Book, Thesis } from "@/lib/types";

export const dynamic = "force-dynamic";



export default async function HomePage() {
  const { books, theses } = await fetchCatalogData({ visibility: "public" });
  const staffCount = await fetchStaffCount();


  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-950 antialiased selection:bg-yellow-500/20 selection:text-yellow-900">
      <PublicNav />
      <main className="relative overflow-hidden bg-[linear-gradient(180deg,#fafbfe_0%,#f5f8ff_50%,#fafbfe_100%)]">
        <MathBackdrop />

        <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-28">
          <Badge className="rounded-full border-white/60 bg-white/45 px-4.5 py-1.5 text-red-800 shadow-sm shadow-slate-950/2 backdrop-blur-xl hover:bg-white/60 transition-all duration-300 font-semibold border text-xs">
            <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={22} height={22} className="mr-2 size-4.5 object-contain animate-pulse" priority />
            Jurusan Pendidikan Matematika ULM
          </Badge>
          <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Ruang Baca{" "}
            <span className="bg-gradient-to-r from-red-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Pendidikan Matematika
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base md:text-lg">
            Portal referensi akademik Jurusan Pendidikan Matematika Universitas Lambung Mangkurat
            untuk menemukan buku, skripsi, lokasi koleksi, dan informasi ruang baca dengan cepat.
          </p>

          <div className="mt-10">
            <LandingSearchForm />
          </div>
        </section>

        <section className="relative mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Katalog Buku Button (Disabled) */}
            <div className="glass-panel p-8 flex flex-col items-center justify-center text-center opacity-80 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                  Belum Tersedia
                </span>
              </div>
              <div className="size-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 mb-5 shadow-inner ring-1 ring-white">
                 <BookOpen className="size-8" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Katalog Buku</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium px-4">
                Saat ini tidak tersedia karena datanya belum ada.
              </p>
            </div>

            {/* Katalog Skripsi Button */}
            <Link href="/katalog?tab=theses" className="glass-panel glass-panel-hover p-8 flex flex-col items-center justify-center text-center group relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-700 ring-1 ring-yellow-200/50">
                  Tersedia
                </span>
              </div>
              <div className="size-16 rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center text-orange-600 mb-5 shadow-inner ring-1 ring-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                 <GraduationCap className="size-8" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Katalog Skripsi</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium px-4">
                Jelajahi dan temukan koleksi skripsi dan tugas akhir mahasiswa.
              </p>
            </Link>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <RealtimeVisitorChart />
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-5 px-4 pb-20 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <StatTile icon={BookOpen} label="Total Buku" value={books.length} description="Koleksi buku tersedia" />
          <StatTile icon={GraduationCap} label="Total Skripsi" value={theses.length} description="Koleksi skripsi tersedia" tone="sky" />
          <StatTile icon={Users} label="Total Petugas" value={staffCount} description="Pengelola ruang baca" tone="violet" />
          <StatTile icon={TrendingUp} label="Total Pengunjung" value="Realtime" description="Dihitung dari presensi" tone="amber" />
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



function StatTile({
  icon: Icon,
  label,
  value,
  description,
  tone = "emerald",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  description: string;
  tone?: "emerald" | "sky" | "violet" | "amber";
}) {
  const tones = {
    emerald: "bg-gradient-to-br from-red-500/10 via-yellow-500/5 to-transparent text-red-700 ring-red-100/50",
    sky: "bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent text-yellow-700 ring-yellow-100/50",
    violet: "bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent text-orange-700 ring-orange-100/50",
    amber: "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent text-amber-700 ring-amber-100/50",
  };

  return (
    <div className="group flex items-center gap-4 rounded-[2rem] border border-white/40 bg-white/45 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)] backdrop-blur-3xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_24px_50px_rgba(15,23,42,0.06)]">
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition-all duration-300 group-hover:scale-105 ${tones[tone]}`}>
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        <span className="mt-0.5 block text-sm font-bold text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs font-medium text-slate-400">{description}</span>
      </span>
    </div>
  );
}

function MathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Soft Gemini-inspired gradient orbs */}
      <div className="absolute -left-20 top-[-10%] size-[35rem] rounded-full bg-gradient-to-tr from-yellow-400/10 via-rose-400/8 to-transparent blur-[80px] animate-drift-slow" />
      <div className="absolute -right-20 top-[10%] size-[40rem] rounded-full bg-gradient-to-br from-orange-400/10 via-purple-400/8 to-transparent blur-[100px] animate-drift-reverse" />
      <div className="absolute left-[20%] top-[40%] size-[30rem] rounded-full bg-gradient-to-tr from-red-400/5 via-yellow-400/5 to-transparent blur-[90px] animate-drift-slow" />
      
      {/* Mathematical glyphs and outlines */}
      <div className="absolute left-[-2rem] top-28 hidden text-[11rem] font-light leading-none text-red-600/[0.04] sm:block">
        ∫
      </div>
      <div className="absolute right-[9%] top-24 hidden text-7xl font-semibold text-amber-600/[0.05] lg:block">
        Σ
      </div>
      <div className="absolute left-[18%] top-20 hidden text-3xl italic text-red-600/[0.06] sm:block">
        A = πr²
      </div>
      <div className="absolute right-[18%] top-20 hidden text-3xl italic text-orange-600/[0.06] lg:block">
        f(x) = x² - 4x + 3
      </div>
      <div className="absolute left-[5%] top-48 hidden h-36 w-56 -rotate-12 rounded-[50%] border border-red-500/[0.05] sm:block" />
      <div className="absolute bottom-28 right-[7%] hidden size-32 rotate-45 border border-amber-500/[0.05] lg:block" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-yellow-600 to-orange-600 text-white shadow-md">
              <LibraryBig className="size-5" />
            </span>
            <div>
              <p className="font-bold text-white tracking-tight">Ruang Baca PMat</p>
              <p className="text-xs text-slate-500">Jurusan Pendidikan Matematika ULM</p>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-400 font-medium">
            Digital library modern untuk katalog, repositori skripsi, presensi, dan manajemen ruang baca
            Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.
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
        <div className="space-y-4">
          <h3 className="font-bold text-white tracking-tight">Informasi</h3>
          <div className="grid gap-3 text-sm">
            <p className="flex gap-2 items-center"><Clock3 className="size-4 text-yellow-400" /> <span>Senin - Jumat, 08.00 - 16.00</span></p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-yellow-400" />
              <span className="leading-6">Jl. Brigjen H. Hasan Basry Kayu Tangi, Banjarmasin, Kalimantan Selatan 70123</span>
            </p>
            <p className="flex gap-2 items-center"><Mail className="size-4 text-yellow-400" /> <span>edu.mat@ulm.ac.id</span></p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-bold text-white tracking-tight">Institusi</h3>
          <div className="rounded-2xl bg-white/[0.02] p-5 text-sm leading-6 text-slate-400 ring-1 ring-white/5 shadow-inner">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/90 p-1 shadow-sm">
                <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={28} height={28} className="size-7 object-contain" />
              </span>
              <Building2 className="size-5 text-yellow-400" />
            </div>
            <p className="text-xs text-slate-400 leading-5">
              Jurusan Pendidikan Matematika Universitas Lambung Mangkurat, Fakultas Keguruan dan Ilmu Pendidikan.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.05] px-4 py-6 text-center text-xs text-slate-600">
        © 2026 Ruang Baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat. Website dibuat oleh M. Zainul Arifin.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white tracking-tight">{title}</h3>
      <div className="grid gap-2 text-sm text-slate-400">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition-all duration-300 hover:text-white hover:translate-x-0.5">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
