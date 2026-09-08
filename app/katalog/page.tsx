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
    <div className="min-h-screen apple-mesh-body">
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
    <section className="relative overflow-hidden rounded-3xl border border-red-950/40 apple-mesh-hero-subtle p-6 sm:p-10 text-white shadow-xl shadow-red-950/20">
      {/* Ambient glowing radial effects */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative z-10 max-w-4xl space-y-3.5">
        <div className="apple-glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold text-white shadow-xs">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>Koleksi Terpadu Ruang Baca PMat FKIP ULM</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white leading-tight">
          Katalog Buku, E-Book Digital &amp; Repositori Skripsi
        </h1>

        <p className="max-w-3xl text-xs sm:text-base leading-relaxed text-red-100/90 font-normal">
          Temukan buku teks matematika, baca dan unduh e-book perkuliahan digital via Google Drive,
          serta telusuri riset skripsi mahasiswa Jurusan Pendidikan Matematika.
        </p>

        {/* Quick Highlights */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
            📚 Buku Fisik &amp; Rak
          </span>
          <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
            ⚡ E-Book &amp; PDF Drive
          </span>
          <span className="apple-glass-pill inline-flex items-center rounded-full px-3 py-1 font-semibold text-white/95">
            🎓 Skripsi Mahasiswa
          </span>
        </div>
      </div>
    </section>
  );
}
