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
  Sparkles,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { ScopusSearchBrowser } from "@/components/scopus-search-browser";
import { Badge } from "@/components/ui/badge";
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
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fc5c4c] via-[#fa793d] to-[#fafbfe] pt-8 pb-12 sm:pt-14 sm:pb-16 text-center">
            <div className="flex justify-center mb-3">
              <Badge className="rounded-full border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-xs border">
                <Globe2 className="size-3.5 mr-1.5" />
                Elsevier Scopus Research Hub
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Pencarian Artikel Ilmiah{" "}
              <span className="bg-gradient-to-r from-yellow-200 via-amber-100 to-white bg-clip-text text-transparent">
                Scopus
              </span>
            </h1>

            <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-white/90 font-medium">
              Eksplorasi publikasi jurnal internasional bereputasi tinggi, sitasi, dan referensi mutakhir
              di bidang Pendidikan Matematika dan riset Universitas Lambung Mangkurat.
            </p>
          </div>
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
