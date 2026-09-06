import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  BookOpen,
  Building2,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  LibraryBig,
  Mail,
  MapPin,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { ScopusSearchBrowser } from "@/components/scopus-search-browser";
import { FadeIn, FadeInStagger } from "@/components/ui/framer";
import { fetchPublicSearchItems } from "@/lib/public-cache";

export const metadata: Metadata = {
  title: "Pencarian Artikel Scopus | Ruang Baca Pendidikan Matematika ULM",
  description:
    "Portal pencarian referensi dan artikel jurnal internasional terindeks Scopus untuk mahasiswa dan dosen Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.",
};

export default async function ScopusPage() {
  const { items: searchItems } = await fetchPublicSearchItems();

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-950 antialiased selection:bg-orange-500/20 selection:text-orange-950">
      <PublicNav initialSearchItems={searchItems} />

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fc5c4c] via-[#fa793d] to-[#fafbfe] pt-10 pb-14 sm:pt-16 sm:pb-20 text-center">
          <ScopusHeroBackdrop />

          <FadeInStagger className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            {/* Top Badges */}
            <FadeIn className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-300"></span>
                </span>
                <Globe2 className="size-3.5 text-yellow-200" />
                Elsevier Scopus® Research Hub
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                <Image
                  src="/ulm-logo.png"
                  alt="Logo ULM"
                  width={18}
                  height={18}
                  className="size-4 object-contain"
                  priority
                />
                Pendidikan Matematika FKIP ULM
              </span>
            </FadeIn>

            {/* Headline */}
            <FadeIn>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-xs">
                Pencarian Publikasi Ilmiah{" "}
                <span className="bg-gradient-to-r from-yellow-200 via-amber-100 to-white bg-clip-text text-transparent">
                  Scopus®
                </span>
              </h1>
            </FadeIn>

            {/* Subtitle */}
            <FadeIn>
              <p className="mx-auto mt-3.5 sm:mt-5 max-w-2xl text-xs sm:text-base leading-relaxed sm:leading-7 text-white/95 font-medium">
                Eksplorasi publikasi jurnal internasional bereputasi tinggi (Q1–Q4), sitasi global, dan referensi mutakhir
                di bidang Pendidikan Matematika dan kajian riset Universitas Lambung Mangkurat.
              </p>
            </FadeIn>

            {/* Feature Highlights Grid */}
            <FadeIn className="mt-8 sm:mt-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-4xl mx-auto">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/35 bg-white/20 p-3 sm:p-3.5 text-left backdrop-blur-md shadow-xs transition-all hover:bg-white/25">
                  <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/30 text-yellow-100 ring-1 ring-white/40 shadow-inner">
                    <Award className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">Jurnal Q1 – Q4</p>
                    <p className="text-[10px] sm:text-xs text-white/85 font-medium truncate">Bereputasi Global</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/35 bg-white/20 p-3 sm:p-3.5 text-left backdrop-blur-md shadow-xs transition-all hover:bg-white/25">
                  <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/30 text-rose-100 ring-1 ring-white/40 shadow-inner">
                    <FileText className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">75Jt+ Publikasi</p>
                    <p className="text-[10px] sm:text-xs text-white/85 font-medium truncate">Artikel & Prosiding</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/35 bg-white/20 p-3 sm:p-3.5 text-left backdrop-blur-md shadow-xs transition-all hover:bg-white/25">
                  <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/30 text-sky-100 ring-1 ring-white/40 shadow-inner">
                    <ExternalLink className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">Buka Artikel</p>
                    <p className="text-[10px] sm:text-xs text-white/85 font-medium truncate">Tautan Resmi DOI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/35 bg-white/20 p-3 sm:p-3.5 text-left backdrop-blur-md shadow-xs transition-all hover:bg-white/25">
                  <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/30 text-emerald-100 ring-1 ring-white/40 shadow-inner">
                    <SlidersHorizontal className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">Filter Presisi</p>
                    <p className="text-[10px] sm:text-xs text-white/85 font-medium truncate">Tahun & Open Access</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </FadeInStagger>
        </section>

        {/* Search Browser Component */}
        <ScopusSearchBrowser />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-16">
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
            Portal referensi akademik dan pusat literasi ilmiah Jurusan Pendidikan Matematika
            Universitas Lambung Mangkurat.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white tracking-tight">Navigasi</h3>
          <div className="grid gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition">Beranda</Link>
            <Link href="/katalog" className="hover:text-white transition">Katalog Buku & Skripsi</Link>
            <Link href="/scopus" className="hover:text-white transition">Pencarian Scopus</Link>
            <Link href="/presensi" className="hover:text-white transition">Presensi Pengunjung</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white tracking-tight">Informasi</h3>
          <div className="grid gap-3 text-sm">
            <p className="flex gap-2 items-center">
              <Clock3 className="size-4 text-yellow-400" />
              <span>Senin - Jumat, 08.00 - 16.00</span>
            </p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-yellow-400" />
              <span className="leading-6">
                Jl. Brigjen H. Hasan Basry Kayu Tangi, Banjarmasin, Kalimantan Selatan 70123
              </span>
            </p>
            <p className="flex gap-2 items-center">
              <Mail className="size-4 text-yellow-400" />
              <span>edu.mat@ulm.ac.id</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white tracking-tight">Institusi</h3>
          <div className="rounded-2xl bg-white/[0.02] p-5 text-sm leading-6 text-slate-400 ring-1 ring-white/5 shadow-inner">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/90 p-1 shadow-sm">
                <Image
                  src="/ulm-logo.png"
                  alt="Logo Universitas Lambung Mangkurat"
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
              </span>
              <Building2 className="size-5 text-yellow-400" />
            </div>
            <p className="text-xs text-slate-400 leading-5">
              Jurusan Pendidikan Matematika, Fakultas Keguruan dan Ilmu Pendidikan, Universitas Lambung Mangkurat.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.05] px-4 py-6 text-center text-xs text-slate-600">
        © 2026 Ruang Baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat.
      </div>
    </footer>
  );
}

function ScopusHeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle academic coordinate grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="scopus-hero-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M0 36V.5H36" fill="none" strokeDasharray="2 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#scopus-hero-grid)" />
      </svg>

      {/* Ambient gradient glow orbs */}
      <div className="absolute -left-20 top-[-10%] hidden size-[38rem] rounded-full bg-gradient-to-tr from-yellow-300/25 via-amber-400/15 to-transparent blur-[70px] lg:block" />
      <div className="absolute -right-20 top-[-5%] hidden size-[34rem] rounded-full bg-gradient-to-bl from-rose-400/20 via-orange-400/15 to-transparent blur-[70px] sm:block" />

      {/* Floating 3D shapes from global css */}
      <div className="vibrant-comet float-anim-1 absolute -left-16 top-[10%] size-[18rem] opacity-75 sm:block hidden" />
      <div
        className="vibrant-sphere float-anim-2 absolute -right-10 top-[20%] size-[16rem] opacity-75 lg:block hidden"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="vibrant-capsule float-anim-1 absolute right-[22%] top-[6%] h-[3rem] w-[9rem] rotate-12 opacity-60 sm:block hidden"
        style={{ animationDelay: "-6s" }}
      />

      {/* Floating Math & Research symbols */}
      <div
        className="vibrant-math-symbol float-anim-2 absolute left-[8%] top-[24%] text-[9rem] opacity-60 lg:block hidden italic select-none"
        style={{ animationDelay: "-2s" }}
      >
        ∫
      </div>
      <div
        className="vibrant-math-symbol float-anim-1 absolute right-[10%] top-[28%] text-[8rem] opacity-60 sm:block hidden select-none"
        style={{ animationDelay: "-3s" }}
      >
        ∑
      </div>
      <div
        className="vibrant-math-symbol float-anim-2 absolute left-[22%] top-[64%] text-[6rem] opacity-40 lg:block hidden select-none"
        style={{ animationDelay: "-5s" }}
      >
        π
      </div>

      {/* Delicate geometric outlines */}
      <div className="geo-outline geo-circle absolute left-[12%] top-[18%] size-7 opacity-50 float-anim-1" />
      <div
        className="geo-triangle absolute right-[16%] top-[14%] opacity-50 float-anim-2"
        style={{ animationDelay: "-2.5s" }}
      />
      <div
        className="geo-cross absolute left-[26%] top-[12%] opacity-60 float-anim-1"
        style={{ animationDelay: "-1s" }}
      />
      <div
        className="geo-dot absolute left-[18%] top-[35%] size-2.5 opacity-70 float-anim-2"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="geo-dot absolute right-[28%] top-[25%] size-2 opacity-60 float-anim-1"
        style={{ animationDelay: "-1.5s" }}
      />
    </div>
  );
}
