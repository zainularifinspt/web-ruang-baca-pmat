"use client";

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
import type { Book, Thesis } from "@/lib/types";

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
    <div className="grid w-full gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">Buku</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canExport ? <ExportButton type="book" label="Ekspor buku" /> : null}
          {canImport ? <CatalogImportDialog importType="book" triggerLabel="Import buku" /> : null}
          {canAddBook ? <AddBookDialog /> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-sky-100 bg-white/80 p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase text-sky-700">Skripsi</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canExport ? <ExportButton type="thesis" label="Ekspor skripsi" /> : null}
          {canImport ? <CatalogImportDialog importType="thesis" triggerLabel="Import skripsi" /> : null}
          {canAddThesis ? <AddThesisDialog /> : null}
        </div>
      </div>
    </div>
  );
}
