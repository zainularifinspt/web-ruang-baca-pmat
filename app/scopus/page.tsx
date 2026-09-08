import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Building2,
  Clock3,
  Globe2,
  LibraryBig,
  Mail,
  MapPin,
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
    <div className="min-h-screen apple-mesh-body text-slate-900 antialiased">
      <PublicNav initialSearchItems={searchItems} />

      <main className="relative overflow-hidden">
        {/* Hero Section with Apple/Gemini mesh atmosphere and smooth fade to transparent */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 text-center text-white">
          {/* Background layer that fades smoothly to full transparency at the bottom */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden hero-fade-to-transparent apple-mesh-hero bg-[#0c0103]">
            {/* Ambient light glow */}
            <div className="absolute -left-20 -top-20 size-96 rounded-full bg-rose-500/25 blur-3xl" />
            <div className="absolute -right-20 bottom-0 size-96 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-red-600/20 blur-3xl" />
          </div>

          <FadeInStagger className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
            {/* Top Badges */}
            <FadeIn className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <span className="apple-glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400"></span>
                </span>
                <Globe2 className="size-3.5 text-amber-300" />
                Elsevier Scopus® Hub
              </span>

              <span className="apple-glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                <Image
                  src="/ulm-logo.png"
                  alt="Logo ULM"
                  width={16}
                  height={16}
                  className="size-3.5 object-contain drop-shadow-xs"
                  priority
                />
                Pendidikan Matematika FKIP ULM
              </span>
            </FadeIn>

            {/* Headline with Landing-Page Gradient */}
            <FadeIn>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                <span className="hero-title-gradient">
                  Pencarian Publikasi Ilmiah Scopus®
                </span>
              </h1>
            </FadeIn>

            {/* Subtitle */}
            <FadeIn>
              <p className="mx-auto mt-3.5 sm:mt-5 max-w-2xl text-xs sm:text-base leading-relaxed text-red-100/90 font-normal">
                Eksplorasi publikasi jurnal internasional bereputasi tinggi (Q1–Q4), sitasi global, dan referensi mutakhir
                di bidang Pendidikan Matematika dan kajian riset Universitas Lambung Mangkurat.
              </p>
            </FadeIn>

            {/* Quick Feature Badges */}
            <FadeIn className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
                🌐 Database Terindeks Elsevier
              </span>
              <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
                📊 Data Sitasi &amp; Quartile
              </span>
              <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
                🔓 Tautan DOI &amp; Open Access
              </span>
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
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16">
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

        <div className="space-y-4">
          <h3 className="font-semibold text-white text-sm tracking-tight">Navigasi</h3>
          <div className="grid gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <Link href="/katalog" className="hover:text-white transition-colors">Katalog Buku & Skripsi</Link>
            <Link href="/scopus" className="hover:text-white transition-colors">Pencarian Scopus</Link>
            <Link href="/presensi" className="hover:text-white transition-colors">Presensi Pengunjung</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-white text-sm tracking-tight">Informasi</h3>
          <div className="grid gap-2.5 text-xs text-slate-400">
            <p className="flex gap-2 items-center">
              <Clock3 className="size-3.5 text-amber-400" />
              <span>Senin - Jumat, 08.00 - 16.00 WITA</span>
            </p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
              <span className="leading-relaxed">
                Gedung Pendidikan Matematika FKIP ULM, Jl. Brigjen H. Hasan Basry, Banjarmasin
              </span>
            </p>
            <p className="flex gap-2 items-center">
              <Mail className="size-3.5 text-amber-400" />
              <span>edu.mat@ulm.ac.id</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-white text-sm tracking-tight">Institusi</h3>
          <div className="rounded-xl bg-slate-800/60 border border-slate-750 p-4 text-xs leading-relaxed text-slate-400">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1 shadow-xs">
                <Image
                  src="/ulm-logo.png"
                  alt="Logo Universitas Lambung Mangkurat"
                  width={24}
                  height={24}
                  className="size-5 object-contain"
                />
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
