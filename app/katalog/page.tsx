import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeader } from "@/components/page-header";
import { PublicNav } from "@/components/public-nav";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = tab === "theses" ? "theses" : "books";

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
        <CatalogBrowser initialTab={initialTab} />
      </main>
    </div>
  );
}
