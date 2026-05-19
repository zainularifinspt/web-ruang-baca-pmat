import {
  DashboardCatalogActions,
  DashboardCatalogContent,
} from "@/components/dashboard-catalog-content";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchCatalogData } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardCatalogPage() {
  const { books, theses, error } = await fetchCatalogData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog internal"
        title="Manajemen Buku dan Skripsi"
        description="Kelola koleksi, cek status verifikasi, dan siapkan ekspor data untuk kebutuhan laporan ruang baca."
        action={<DashboardCatalogActions />}
      />
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
