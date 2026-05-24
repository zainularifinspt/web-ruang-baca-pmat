import { Sparkles } from "lucide-react";
import { DashboardCatalogContent } from "@/components/dashboard-catalog-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardCatalogPage() {
  const { books, theses, error } = await fetchCatalogData();

  return (
    <div className="space-y-6">
      <CatalogManagementHeader />
      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <DashboardCatalogContent books={books} theses={theses} />
    </div>
  );
}

function CatalogManagementHeader() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 p-5 text-white shadow-xl shadow-emerald-950/20 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-emerald-50 shadow-sm ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3.5" />
          Katalog internal
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">
          Manajemen Buku dan Skripsi
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
          Kelola koleksi, cek status verifikasi, dan siapkan data katalog ruang baca dalam satu alur yang rapi.
        </p>
      </div>
    </section>
  );
}
