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

type LatestItem = Book | Thesis;

export default async function HomePage() {
  const { books, theses } = await fetchCatalogData({ visibility: "public" });
  const staffCount = await fetchStaffCount();
  const latestCollections = [...books, ...theses]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f7fafc] text-slate-950 antialiased">
      <PublicNav />
      <main className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfeff_0%,#f7fbff_45%,#f9fbf7_100%)]">
        <MathBackdrop />

        <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16 lg:pb-16 lg:pt-20">
          <Badge className="rounded-full border-white/70 bg-white/65 px-4 py-1.5 text-emerald-700 shadow-sm shadow-emerald-950/5 backdrop-blur-xl hover:bg-white/80">
            <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={22} height={22} className="mr-1.5 size-5 object-contain" priority />
            Jurusan Pendidikan Matematika ULM
          </Badge>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.03] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Ruang Baca{" "}
            <span className="bg-[linear-gradient(100deg,#047857_0%,#0284c7_48%,#7c3aed_100%)] bg-clip-text text-transparent">
              Pendidikan Matematika
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Portal referensi akademik Jurusan Pendidikan Matematika Universitas Lambung Mangkurat
            untuk menemukan buku, skripsi, lokasi koleksi, dan informasi ruang baca dengan cepat.
          </p>

          <div className="mt-9">
            <LandingSearchForm />
          </div>
        </section>

        <section className="relative mx-auto max-w-5xl px-4 pb-5 sm:px-6">
          <div className="rounded-[2rem] border border-white/75 bg-white/72 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div className="text-left">
                <h2 className="text-sm font-bold tracking-tight text-slate-950">Koleksi terbaru</h2>
                <p className="mt-1 text-xs text-slate-500">Buku dan skripsi publik yang baru tersedia</p>
              </div>
              <p className="rounded-full bg-slate-950/[0.03] px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/70">
                {latestCollections.length} item
              </p>
            </div>
            <div className="grid gap-3">
              {latestCollections.length ? (
                latestCollections.map((item) => <LatestCollectionRow key={`${item.type}-${item.id}`} item={item} />)
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-slate-500">
                  Belum ada koleksi publik yang terverifikasi.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <RealtimeVisitorChart />
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-4 px-4 pb-14 pt-3 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
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

function LatestCollectionRow({ item }: { item: LatestItem }) {
  const isBook = item.type === "book";
  const href = isBook ? `/books/${item.id}` : `/theses/${item.id}`;
  const Icon = isBook ? BookOpen : GraduationCap;
  const meta = isBook
    ? `${item.author || "Penulis"} - ${item.category || "Buku"}`
    : `${item.studentName || "Mahasiswa"} - ${item.year}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-3xl border border-transparent bg-white/55 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/90 hover:shadow-lg hover:shadow-slate-950/[0.07]"
    >
      <span
        className={[
          "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition duration-300 group-hover:scale-105",
          isBook
            ? "bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 ring-emerald-100"
            : "bg-gradient-to-br from-sky-50 to-violet-50 text-sky-700 ring-sky-100",
        ].join(" ")}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="line-clamp-1 text-sm font-bold tracking-tight text-slate-950">{item.title}</span>
        <span className="mt-1 block line-clamp-1 text-xs font-medium text-slate-500">{meta}</span>
      </span>
      <span className="hidden rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100 sm:inline-flex">
        {isBook ? "Buku" : "Skripsi"}
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-emerald-700" />
    </Link>
  );
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
    emerald: "bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 ring-emerald-100",
    sky: "bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 ring-sky-100",
    violet: "bg-gradient-to-br from-violet-50 to-sky-50 text-violet-700 ring-violet-100",
    amber: "bg-gradient-to-br from-amber-50 to-emerald-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="group flex items-center gap-4 rounded-[1.75rem] border border-white/75 bg-white/70 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition duration-300 group-hover:scale-105 ${tones[tone]}`}>
        <Icon className="size-7" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-3xl font-bold tracking-tight text-slate-950">{value}</span>
        <span className="mt-1 block text-sm font-bold text-slate-700">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
    </div>
  );
}

function MathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-[-18rem] top-[-22rem] h-[36rem] rotate-[-3deg] bg-[linear-gradient(110deg,rgba(16,185,129,0.14),rgba(14,165,233,0.14)_42%,rgba(124,58,237,0.12)_76%,transparent)] blur-3xl" />
      <div className="absolute inset-x-[-16rem] top-32 h-80 rotate-2 bg-[linear-gradient(90deg,transparent,rgba(20,184,166,0.1),rgba(99,102,241,0.08),transparent)] blur-3xl" />
      <div className="absolute left-[-3rem] top-28 hidden text-[11rem] font-light leading-none text-emerald-100/60 sm:block">
        ∫
      </div>
      <div className="absolute right-[9%] top-24 hidden text-7xl font-semibold text-sky-100/85 lg:block">
        Σ
      </div>
      <div className="absolute left-[18%] top-20 hidden text-3xl italic text-emerald-100 sm:block">
        A = πr²
      </div>
      <div className="absolute right-[18%] top-20 hidden text-3xl italic text-violet-100 lg:block">
        f(x) = x² - 4x + 3
      </div>
      <div className="absolute left-[5%] top-48 hidden h-36 w-56 -rotate-12 rounded-[50%] border border-emerald-100/80 sm:block" />
      <div className="absolute bottom-28 right-[7%] hidden size-32 rotate-45 border border-sky-100/80 lg:block" />
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
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-white/10">
              <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={34} height={34} className="size-8 object-contain" />
            </span>
            <div>
              <p className="font-bold text-white">Ruang Baca PMat</p>
              <p className="text-xs text-slate-400">Jurusan Pendidikan Matematika ULM</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
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
        <div>
          <h3 className="font-semibold text-white">Informasi</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-400">
            <p className="flex gap-2"><Clock3 className="size-4 text-emerald-400" /> Senin-Jumat, 08.00-16.00</p>
            <p className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span>Jl. Brigjen H. Hasan Basry Kayu Tangi, Banjarmasin, Kalimantan Selatan 70123</span>
            </p>
            <p className="flex gap-2"><Mail className="size-4 text-emerald-400" /> edu.mat@ulm.ac.id</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-white">Institusi</h3>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-400 ring-1 ring-white/10">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-white">
                <Image src="/ulm-logo.png" alt="Logo Universitas Lambung Mangkurat" width={32} height={32} className="size-8 object-contain" />
              </span>
              <Building2 className="size-5 text-emerald-400" />
            </div>
            Jurusan Pendidikan Matematika Universitas Lambung Mangkurat, Fakultas Keguruan dan Ilmu Pendidikan.
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 Ruang Baca Jurusan Pendidikan Matematika Universitas Lambung Mangkurat. Website dibuat oleh M. Zainul Arifin.
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
