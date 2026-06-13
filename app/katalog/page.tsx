import { Sparkles } from "lucide-react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PublicNav } from "@/components/public-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q, tab } = await searchParams;
  const initialTab = tab === "books" || tab === "theses" ? tab : "all";
  const { books, theses, error } = await fetchCatalogData({ visibility: "public" });

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <CatalogHero />
        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <CatalogBrowser books={books} theses={theses} initialTab={initialTab} initialQuery={q ?? ""} />
      </main>
    </div>
  );
}

function CatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-red-800 via-rose-700 to-yellow-800 p-5 text-white shadow-xl shadow-red-950/20 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="relative max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-red-50 shadow-sm ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="size-3.5" />
          Perpustakaan digital
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">
          Katalog Buku dan Repositori Skripsi
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-red-50">
          Cari referensi akademik, cek ketersediaan buku, dan telusuri skripsi kakak tingkat berdasarkan topik, tahun, serta pembimbing.
        </p>
      </div>
    </section>
  );
}
