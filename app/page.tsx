import Link from "next/link";
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
  Sparkles,
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
    <div className="min-h-screen bg-[#f8fbfa] text-slate-950">
      <PublicNav />
      <main className="relative overflow-hidden">
        <MathBackdrop />

        <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-12 sm:pt-14">
          <Badge className="rounded-full border-emerald-100 bg-emerald-50 px-4 py-1.5 text-emerald-700 hover:bg-emerald-50">
            <Sparkles className="mr-1 size-3.5" />
            Digital Library PMat
          </Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal text-slate-950 sm:text-6xl">
            Ruang Baca <span className="text-emerald-700">Pendidikan Matematika</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Portal referensi akademik modern untuk menemukan buku, skripsi, lokasi koleksi,
            dan informasi ruang baca dengan pencarian cepat berbasis data Supabase.
          </p>

          <div className="mt-8">
            <LandingSearchForm />
          </div>
        </section>

        <section className="relative mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-xl shadow-slate-950/6 ring-1 ring-slate-200/70 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-950">Koleksi terbaru</h2>
              <p className="text-xs font-semibold text-slate-500">{latestCollections.length} item</p>
            </div>
            <div className="grid gap-2">
              {latestCollections.length ? (
                latestCollections.map((item) => <LatestCollectionRow key={`${item.type}-${item.id}`} item={item} />)
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  Belum ada koleksi publik yang terverifikasi.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <RealtimeVisitorChart />
        </section>

        <section className="relative mx-auto grid max-w-6xl gap-4 px-4 pb-12 pt-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
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
      className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-emerald-50"
    >
      <span
        className={[
          "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1",
          isBook
            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
            : "bg-sky-50 text-sky-700 ring-sky-100",
        ].join(" ")}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="line-clamp-1 text-sm font-semibold text-slate-950">{item.title}</span>
        <span className="mt-1 block line-clamp-1 text-xs font-medium text-slate-500">{meta}</span>
      </span>
      <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
        {isBook ? "Buku" : "Skripsi"}
      </span>
      <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
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
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="flex items-center gap-4 rounded-[1.35rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ring-1 ${tones[tone]}`}>
        <Icon className="size-7" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-3xl font-semibold tracking-tight text-slate-950">{value}</span>
        <span className="mt-1 block text-sm font-semibold text-slate-700">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
    </div>
  );
}

function MathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[-3rem] top-28 hidden text-[11rem] font-light leading-none text-emerald-100/55 sm:block">
        ∫
      </div>
      <div className="absolute right-[9%] top-24 hidden text-7xl font-semibold text-emerald-100/80 lg:block">
        Σ
      </div>
      <div className="absolute right-[-2rem] top-40 hidden h-40 w-40 rounded-full bg-emerald-50 lg:block" />
      <div className="absolute left-[18%] top-20 hidden text-3xl italic text-emerald-100 sm:block">
        A = πr²
      </div>
      <div className="absolute right-[18%] top-20 hidden text-3xl italic text-emerald-100 lg:block">
        f(x) = x² - 4x + 3
      </div>
      <div className="absolute left-[5%] top-48 hidden h-36 w-56 -rotate-12 rounded-[50%] border border-emerald-100/80 sm:block" />
      <div className="absolute bottom-28 right-[7%] hidden size-32 rotate-45 border border-emerald-100/80 lg:block" />
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
