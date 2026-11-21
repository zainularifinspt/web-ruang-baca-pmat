import { AdminPageHeading } from "@/components/admin-page-heading";
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
          <AlertTitle>Data belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <DashboardCatalogContent books={books} theses={theses} />
    </div>
  );
}

function CatalogManagementHeader() {
  return (
    <AdminPageHeading
      title="Manajemen koleksi"
      description="Kelola buku, e-book, dan repositori skripsi. Tambahkan, perbarui, atau impor koleksi dalam satu tempat."
    />
  );
}
