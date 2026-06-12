"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CatalogBrowser } from "@/components/catalog-browser";
import {
  AddBookDialog,
  AddThesisDialog,
  DeleteCollectionDialog,
  EditCollectionDialog,
} from "@/components/catalog-crud-dialogs";
import { CatalogImportDialog } from "@/components/catalog-import-dialog";
import { ExportButton } from "@/components/export-button";
import { useRole } from "@/components/role-provider";
import { Button } from "@/components/ui/button";
import { syncThesisFromGoogleSheets } from "@/app/dashboard/katalog/actions";
import type { Book, Thesis } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardCatalogContent({
  books,
  theses,
}: {
  books: Book[];
  theses: Thesis[];
}) {
  const { role } = useRole();
  const canEdit = role === "admin" || role === "petugas";
  const canDelete = role === "admin";

  return (
    <CatalogBrowser
      books={books}
      theses={theses}
      initialTab="all"
      initialVerificationStatus="approved"
      showAllTab
      toolbar={<DashboardCatalogActions />}
      itemActions={(item) =>
        canEdit || canDelete ? (
          <>
            {canEdit ? <EditCollectionDialog item={item} /> : null}
            {canDelete ? <DeleteCollectionDialog item={item} /> : null}
          </>
        ) : null
      }
    />
  );
}

export function DashboardCatalogActions() {
  const { role, canAccess } = useRole();
  const canExport = canAccess(role, "export_data");
  const canAddBook = role === "admin" || role === "petugas";
  const canAddThesis = role === "admin" || role === "petugas" || role === "dosen";
  const canImport = role === "admin" || role === "petugas";

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Aksi katalog</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
            Kelola data buku dan skripsi
          </h2>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-red-700">Buku</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {canExport ? <ExportButton type="book" label="Ekspor buku" /> : null}
            {canImport ? <CatalogImportDialog importType="book" triggerLabel="Import buku" /> : null}
            {canAddBook ? <AddBookDialog /> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-amber-700">Skripsi</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {canExport ? <ExportButton type="thesis" label="Ekspor skripsi" /> : null}
            {canImport ? <CatalogImportDialog importType="thesis" triggerLabel="Import skripsi" /> : null}
            {canAddThesis ? <AddThesisDialog /> : null}
            {canAddThesis ? <SyncGoogleSheetButton /> : null}
          </div>
        </div>
      </div>
      {!canExport && !canImport && !canAddBook && !canAddThesis ? (
        <p className="mt-3 text-sm text-slate-500">
          Akun ini tidak memiliki akses untuk mengubah atau mengekspor katalog.
        </p>
      ) : null}
    </section>
  );
}

function SyncGoogleSheetButton() {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncThesisFromGoogleSheets();
      if (result.ok) {
        toast.success("Sinkronisasi Selesai", {
          description: result.message,
        });
      } else {
        toast.error("Sinkronisasi Gagal", {
          description: result.message,
        });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-xl border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950"
      onClick={handleSync}
      disabled={isPending}
    >
      <RefreshCw className={cn("mr-2 size-4", isPending && "animate-spin")} />
      {isPending ? "Menyinkronkan..." : "Ambil Data Skripsi"}
    </Button>
  );
}
