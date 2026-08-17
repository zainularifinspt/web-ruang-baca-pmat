import { Sparkles } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PublicNav } from "@/components/public-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchPublicCatalogData } from "@/lib/public-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CatalogPage() {
  const { books, theses, error } = await fetchPublicCatalogData();

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-6xl space-y-5 sm:space-y-6 px-3.5 py-5 sm:px-6 sm:py-8">
        <CatalogHero />
        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <CatalogBrowser books={books} theses={theses} />
      </main>
    </div>
  );
}

function CatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/70 bg-gradient-to-br from-red-800 via-rose-700 to-yellow-800 p-4 sm:p-6 text-white shadow-xl shadow-red-950/20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="relative max-w-4xl">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold text-red-50 shadow-sm ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3 sm:size-3.5" />
          Perpustakaan digital
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl leading-tight">
          Katalog Buku, E-Book, dan Repositori Skripsi
        </h1>
        <p className="mt-2 sm:mt-3 max-w-3xl text-xs sm:text-base leading-relaxed text-red-50">
          Cari referensi akademik, baca dan download e-book perkuliahan digital via Google Drive, serta telusuri repositori skripsi mahasiswa Pendidikan Matematika.
        </p>
      </div>
    </section>
  );
}
