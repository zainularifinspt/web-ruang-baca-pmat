"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CatalogBrowser } from "@/components/catalog-browser";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { useRole } from "@/components/role-provider";
import type { Book, Thesis } from "@/lib/types";

export function DashboardCatalogContent({
  books,
  theses,
}: {
  books: Book[];
  theses: Thesis[];
}) {
  return <CatalogBrowser books={books} theses={theses} />;
}

export function DashboardCatalogActions() {
  const { role, canAccess } = useRole();
  const canCreate = canAccess(role, "create_collection");
  const canExport = canAccess(role, "export_data");

  return (
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
              description:
                "Data baru akan masuk antrean verifikasi pada implementasi lengkap.",
            })
          }
        >
          <Plus />
          Tambah koleksi
        </Button>
      ) : null}
    </>
  );
}
