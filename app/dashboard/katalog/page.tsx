"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CatalogBrowser } from "@/components/catalog-browser";
import { ExportButton } from "@/components/export-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useRole } from "@/components/role-provider";

export default function DashboardCatalogPage() {
  const { role, canAccess } = useRole();
  const canCreate = canAccess(role, "create_collection");
  const canExport = canAccess(role, "export_data");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Katalog internal"
        title="Manajemen Buku dan Skripsi"
        description="Kelola koleksi, cek status verifikasi, dan siapkan ekspor data untuk kebutuhan laporan ruang baca."
        action={
          <>
          {canExport ? (
            <>
              <ExportButton type="book" label="Ekspor buku" />
              <ExportButton type="thesis" label="Ekspor skripsi" />
            </>
          ) : null}
          {canCreate ? (
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() =>
                toast.info("Form input koleksi disimulasikan", {
                  description: "Data baru akan masuk antrean verifikasi pada implementasi lengkap.",
                })
              }
            >
              <Plus />
              Tambah koleksi
            </Button>
          ) : null}
          </>
        }
      />
      <CatalogBrowser />
    </div>
  );
}
