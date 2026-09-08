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
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-900/40 bg-gradient-to-br from-[#7f1d1d] via-[#881337] to-[#991b1b] p-5 sm:p-8 text-white shadow-xl shadow-red-950/25">
      {/* Ambient glowing radial effects */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-red-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative z-10 max-w-4xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs sm:text-sm font-bold text-white shadow-xs ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>Koleksi Terpadu Ruang Baca PMat FKIP ULM</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-white leading-tight">
          Katalog Buku, E-Book Digital &amp; Repositori Skripsi
        </h1>

        <p className="max-w-3xl text-xs sm:text-base leading-relaxed text-red-100 font-normal">
          Temukan buku teks matematika, baca dan download e-book perkuliahan digital via Google Drive,
          serta telusuri riset skripsi mahasiswa Jurusan Pendidikan Matematika.
        </p>

        {/* Quick Highlights */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="inline-flex items-center rounded-lg bg-black/25 px-2.5 py-1 font-semibold text-red-100 ring-1 ring-white/15">
            📚 Buku Fisik &amp; Lokasi Rak
          </span>
          <span className="inline-flex items-center rounded-lg bg-black/25 px-2.5 py-1 font-semibold text-red-100 ring-1 ring-white/15">
            ⚡ E-Book Digital &amp; PDF Drive
          </span>
          <span className="inline-flex items-center rounded-lg bg-black/25 px-2.5 py-1 font-semibold text-red-100 ring-1 ring-white/15">
            🎓 Skripsi &amp; Pembimbing
          </span>
        </div>
      </div>
    </section>
  );
}
