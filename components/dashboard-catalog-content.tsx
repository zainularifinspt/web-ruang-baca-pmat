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
    <>
      {canExport ? (
        <>
          <ExportButton type="book" label="Ekspor buku" />
          <ExportButton type="thesis" label="Ekspor skripsi" />
        </>
      ) : null}
      {canAddBook ? <AddBookDialog /> : null}
      {canAddThesis ? <AddThesisDialog /> : null}
      {canImport ? <CatalogImportDialog /> : null}
    </>
  );
}
