import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeader } from "@/components/page-header";
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
  const initialTab = tab === "theses" ? "theses" : "books";
  const { books, theses, error } = await fetchCatalogData({ visibility: "public" });

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <PageHeader
          eyebrow="Perpustakaan digital"
          title="Katalog Buku dan Repositori Skripsi"
          description="Cari referensi akademik, cek ketersediaan buku, dan telusuri skripsi kakak tingkat berdasarkan topik, tahun, serta pembimbing."
          className="bg-gradient-to-br from-white to-emerald-50/70"
        />
        {error ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <CatalogBrowser books={books} theses={theses} initialTab={initialTab} initialQuery={q ?? ""} />
      </main>
    </div>
  );
}
