import { BookMarked, FileText, GraduationCap, LibraryBig } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PublicNav } from "@/components/public-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchPublicCatalogData } from "@/lib/public-cache";

export const revalidate = 300;

export default async function CatalogPage() {
  const { books, theses, error } = await fetchPublicCatalogData();

  return (
    <div className="min-h-screen apple-mesh-body">
      <PublicNav />

      {/* Full-width Edge-to-Edge Hero Banner */}
      <CatalogHero />

      {/* Main Catalog Content */}
      <main className="relative z-20 mx-auto max-w-6xl space-y-5 sm:space-y-6 px-3.5 -mt-12 sm:-mt-16 pb-16 sm:px-6">
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
    <section className="relative w-full overflow-hidden pt-12 pb-28 sm:pt-16 sm:pb-36 lg:pb-44 text-center text-white">
      {/* Background layer that fades smoothly to full transparency at the bottom */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hero-fade-to-transparent apple-mesh-hero bg-[#0c0103]">
        {/* Ambient glowing radial effects */}
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-rose-500/25 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-red-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 space-y-3.5 flex flex-col items-center">
        <div className="apple-glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs sm:text-sm font-bold text-white shadow-xs">
          <LibraryBig className="size-3.5 text-amber-300" />
          <span>Koleksi Terpadu Ruang Baca PMat FKIP ULM</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-tight">
          <span className="hero-title-gradient">
            Katalog Buku, E-Book Digital &amp; Repositori Skripsi
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-rose-100/95 font-medium drop-shadow-sm">
          Temukan buku teks matematika, baca dan unduh e-book perkuliahan digital via Google Drive,
          serta telusuri riset skripsi mahasiswa Jurusan Pendidikan Matematika.
        </p>

        {/* Quick Highlights Centered */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="apple-glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold text-white/95 shadow-xs border border-white/20 bg-white/10 drop-shadow-xs">
            <BookMarked className="size-3.5 text-amber-300" />
            <span>Buku Fisik &amp; Rak</span>
          </span>
          <span className="apple-glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold text-white/95 shadow-xs border border-white/20 bg-white/10 drop-shadow-xs">
            <FileText className="size-3.5 text-rose-300" />
            <span>E-Book &amp; PDF Drive</span>
          </span>
          <span className="apple-glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold text-white/95 shadow-xs border border-white/20 bg-white/10 drop-shadow-xs">
            <GraduationCap className="size-3.5 text-amber-300" />
            <span>Skripsi Mahasiswa</span>
          </span>
        </div>
      </div>
    </section>
  );
}
