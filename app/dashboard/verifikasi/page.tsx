import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { fetchCatalogData } from "@/lib/supabase";
import { VerificationQueue } from "@/app/dashboard/verifikasi/verification-queue";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const { books, theses, error } = await fetchCatalogData();
  const queue = [...books, ...theses]
    .filter((item) => item.verificationStatus === "pending")
    .sort(
      (first, second) =>
        Date.parse(second.createdAt) - Date.parse(first.createdAt),
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verifikasi"
        title="Antrean Verifikasi Buku dan Skripsi"
        description="Koleksi baru tidak tampil di katalog publik sebelum admin menekan setujui."
      />

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Data Supabase belum dapat dimuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SectionCard>
        <VerificationQueue items={queue} />
      </SectionCard>
    </div>
  );
}
